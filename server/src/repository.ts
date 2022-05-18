import { constants } from 'fs';
import { access, mkdir, opendir, stat, unlink, writeFile } from 'fs/promises';
import { basename, extname, resolve } from 'path';
import { extension } from 'mime-types';
import { Database, Statement } from 'better-sqlite3';
import { ImageDescriptor, TransientRef, Ref, nullifyRef, flatten, binarize, Action, Tag, TransientType, Type, nullifyType } from '@pixaref/core';
import { queries } from './repository.queries';
import { Config } from './conf/config';
import { Subject } from 'rxjs';

export class PixarefRepository {
    private readonly statements: { [N in keyof typeof queries]: Statement };
    private readonly refActionSubject: Subject<Action<Ref>> = new Subject();
    private readonly tagActionSubject: Subject<Action<Tag>> = new Subject();
    private readonly typeActionSubject: Subject<Action<Type>> = new Subject();

    constructor(private readonly directory: string, private readonly database: Database, private config: Config) {
        this.statements = Object.entries(queries).reduce(
            (a, [name, query]) => ({ ...a, [name]: database.prepare(query) }),
            {} as any
        );
    }

    get refActions() {
        return this.refActionSubject;
    }

    get tagActions() {
        return this.tagActionSubject;
    }

    get typeActions() {
        return this.typeActionSubject;
    }

    async allRefs(): Promise<Ref[]> {
        const results = this.statements.selectRefs.all();
        const refs = results.map(this.mapRef);

        return refs;
    }

    async createRef(transientRef: TransientRef): Promise<Ref> {
        const refActions: Action<Ref>[] = [];
        const tagActions: Action<Tag>[] = [];

        const ref: Ref = this.database.transaction((transientRef: TransientRef) => {
            const { id: refId } = this.statements.insertRef.get(binarize(flatten(nullifyRef(transientRef))));
            const ref = { id: refId, ...transientRef };

            refActions.push({ type: 'ADD', entity: ref });

            for (const tag of transientRef.tags || []) {
                let tagId = this.statements.insertTag.get({ name: tag })?.id;

                if (tagId) {
                    tagActions.push({ type: 'ADD', entity: tag });
                } else {
                    tagId = this.statements.selectTag.get({ name: tag }).id;
                }

                this.statements.insertRefTag.run({ refId, tagId });
            }

            return ref;
        })(transientRef);

        refActions.forEach((refAction) => this.refActionSubject.next(refAction));
        tagActions.forEach((tagAction) => this.tagActionSubject.next(tagAction));

        return ref;
    }

    async updateRef(ref: Ref): Promise<Ref> {
        const refActions: Action<Ref>[] = [];
        const tagActions: Action<Tag>[] = [];

        const refId = ref.id;
        const currentResult = this.statements.selectRef.get({ id: refId });

        if (!currentResult) {
            throw new Error(`No ref found with ID [${refId}]`);
        }

        const currentRef = this.mapRef(currentResult);

        this.database.transaction((ref: Ref, currentRef: Ref) => {
            this.statements.updateRef.run(binarize(flatten(nullifyRef((ref)))));

            refActions.push({ type: 'UPDATE', entity: ref });

            const tagsToRemove = currentRef.tags?.filter(tag => !ref.tags?.includes(tag)) || [];
            const tagsToAdd = ref.tags?.filter(tag => !currentRef.tags?.includes(tag)) || [];

            for (const tag of tagsToAdd) {
                let tagId = this.statements.insertTag.get({ name: tag })?.id;

                if (tagId) {
                    tagActions.push({ type: 'ADD', entity: tag });
                } else {
                    tagId = this.statements.selectTag.get({ name: tag }).id;
                }

                this.statements.insertRefTag.run({ refId, tagId });
            }

            for (const tag of tagsToRemove) {
                this.statements.deleteRefTag.run({ refId, name: tag });

                const tagId = this.statements.deleteTagIfUnused.get({ name: tag })?.id;

                if (tagId) {
                    tagActions.push({ type: 'DELETE', entity: tag });
                }
            }
        })(ref, currentRef);

        refActions.forEach((refAction) => this.refActionSubject.next(refAction));
        tagActions.forEach((tagAction) => this.tagActionSubject.next(tagAction));

        if (ref.image.hash !== currentRef.image.hash) {
            await this.discardImage(currentRef.image);
        }

        return ref;
    }

    async deleteRef(id: number): Promise<Ref> {
        const refActions: Action<Ref>[] = [];
        const tagActions: Action<Tag>[] = [];

        const result = this.statements.selectRef.get({ id });

        if (!result) {
            throw new Error(`No ref found with ID [${id}]`);
        }

        const ref = this.mapRef(result);

        this.database.transaction((ref: Ref) => {
            this.statements.deleteRef.run({ id });

            refActions.push({ type: 'DELETE', entity: ref });

            for (const tag of ref.tags || []) {
                const tagId = this.statements.deleteTagIfUnused.get({ name: tag })?.id;

                if (tagId) {
                    tagActions.push({ type: 'DELETE', entity: tag });
                }
            }
        })(ref);

        refActions.forEach((refAction) => this.refActionSubject.next(refAction));
        tagActions.forEach((tagAction) => this.tagActionSubject.next(tagAction));

        await this.discardImage(ref.image);

        return ref;
    }

    async allTags(): Promise<Tag[]> {
        const results = this.statements.selectTags.all();
        const tags = results.map(({ name }) => name);

        return tags;
    }

    async allTypes() {
        const results = this.statements.selectTypes.all();
        const types = results.map(this.mapType);

        return types;
    }

    async createType(transientType: TransientType): Promise<Type> {
        const typeActions: Action<Type>[] = [];

        const type: Type = this.database.transaction((transientType: TransientType) => {
            const { id: typeId } = this.statements.insertType.get(nullifyType(transientType));
            const type = { id: typeId, ...transientType };
                    
            typeActions.push({ type: 'ADD', entity: type });

            return type;
        })(transientType);

        typeActions.forEach((typeAction) => this.typeActionSubject.next(typeAction));

        return type;
    }

    async updateType(type: Type): Promise<Type> {
        const typeActions: Action<Type>[] = [];

        const typeId = type.id;
        const currentResult = this.statements.selectType.get({ id: typeId });

        if (!currentResult) {
            throw new Error(`No type found with ID [${typeId}]`);
        }

        this.database.transaction((type: Type) => {
            this.statements.updateType.run(nullifyType(type));

            typeActions.push({ type: 'UPDATE', entity: type });
        })(type);

        typeActions.forEach((typeAction) => this.typeActionSubject.next(typeAction));

        return type;
    }

    async deleteType(id: number): Promise<Type> {
        const typeActions: Action<Type>[] = [];

        const result = this.statements.selectType.get({ id });

        if (!result) {
            throw new Error(`No type found with ID [${id}]`);
        }

        const type = this.mapType(result);

        this.database.transaction((type: Type) => {
            this.statements.deleteType.run({ id });

            typeActions.push({ type: 'DELETE', entity: type });
        })(type);

        typeActions.forEach((typeAction) => this.typeActionSubject.next(typeAction));

        return type;
    }

    async storeImage(originalImage: Buffer, thumbnailImage: Buffer, imageDescriptor: ImageDescriptor): Promise<ImageDescriptor> {
        const { hash, mime } = imageDescriptor;

        const imageDirectory = this.getImageDirectory(hash);
        const originalImageFile = this.getOriginalImageFile(hash, mime);
        const thumbnailImageFile = this.getThumbnailImageFile(hash, mime);

        await mkdir(imageDirectory, { recursive: true });
        await writeFile(resolve(imageDirectory, originalImageFile), originalImage);
        await writeFile(resolve(imageDirectory, thumbnailImageFile), thumbnailImage);

        return imageDescriptor;
    }

    async discardImage(imageDescriptor: ImageDescriptor): Promise<ImageDescriptor> {
        const { hash, mime } = imageDescriptor;

        const originalImagePath = this.getOriginalImagePath(hash, mime);
        const thumbnailImagePath = this.getThumbnailImagePath(hash, mime);

        await unlink(originalImagePath);
        await unlink(thumbnailImagePath);

        return imageDescriptor;
    }

    async discardImageZombies(threshold: number): Promise<number> {
        async function* walk(directory: string): AsyncGenerator<string> {
            for await (const f of await opendir(directory)) {
                const entry = resolve(directory, f.name);

                if (f.isDirectory()) yield* walk(entry);
                else if (f.isFile()) yield entry;
            }
        }

        let count = 0;
        const now = Date.now();
        const hashes = new Set(this.statements.selectRefHashes.all().map(({ hash }) => hash));

        for await (const path of walk(this.directory)) {
            const hash = basename(path, extname(path));

            if (!hashes.has(hash)) {
                const mtime = (await stat(path)).mtimeMs;
                const age = (now - mtime) / 1000;

                if (age > threshold) {
                    await unlink(path);

                    count++;
                }
            }
        }

        return count;
    }

    async hasImage(imageDescriptor: ImageDescriptor): Promise<boolean> {
        const { hash, mime } = imageDescriptor;

        const hasOriginalImage = await access(this.getOriginalImagePath(hash, mime), constants.F_OK)
            .then(() => true)
            .catch(() => false);
        const hasThumbnailImage = await access(this.getThumbnailImagePath(hash, mime), constants.F_OK)
            .then(() => true)
            .catch(() => false);

        return hasOriginalImage && hasThumbnailImage;
    }

    getOriginalImagePath(hash: string, mime: string) {
        const imageDirectory = this.getImageDirectory(hash);
        const originalImageFile = this.getOriginalImageFile(hash, mime);

        return resolve(imageDirectory, originalImageFile);
    }

    getThumbnailImagePath(hash: string, mime: string) {
        const imageDirectory = this.getImageDirectory(hash);
        const thumbnailImageFile = this.getThumbnailImageFile(hash, mime);

        return resolve(imageDirectory, thumbnailImageFile);
    }

    private getImageDirectory(hash: string) {
        const subDirectories = this.getSubDirectories(hash, this.config.images.levels);
        const imageDirectory = resolve(this.directory, ...subDirectories);

        return imageDirectory;
    }

    private getOriginalImageFile(hash: string, mime: string) {
        const imageFile = `${hash}.${extension(mime)}`;

        return imageFile;
    }

    private getThumbnailImageFile(hash: string, mime: string) {
        const thumbnailFile = `${hash}.${this.config.images.thumbnails.extension}`;

        return thumbnailFile;
    }

    private getSubDirectories(hash: string, levels: number) {
        const splitHash = hash.match(/.{2}/g) || [];
        const subDirectories = splitHash.slice(0, levels);

        return subDirectories;
    }

    private mapRef(result: any): Ref {
        const { id, hash, mime, width, height, alpha, opaque, luminance, title, type, year, tags } = result;

        return {
            id,
            image: {
                hash,
                mime,
                width,
                height,
                alpha: !!alpha,
                opaque: !!opaque,
                luminance
            },
            title,
            type,
            year,
            tags: tags?.split(',') || []
        };
    }

    private mapType(result: any): Type {
        const { id, name, icon } = result;

        return { id, name, icon };
    }
}