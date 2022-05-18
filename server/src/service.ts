import { ImageDescriptor, MID, Ref, Tag, toContrastingColor, toLinear, toRelativeLuminance, TransientRef, TransientType, Type } from '@pixaref/core';
import { createHash } from 'crypto';
import { lookup } from 'mime-types';
import sharp from 'sharp';
import { Config } from './conf/config';
import { PixarefRepository } from './repository';

export class PixarefService {
    constructor(private repository: PixarefRepository, private config: Config) {}

    get refActions() {
        return this.repository.refActions;
    }

    get tagActions() {
        return this.repository.tagActions;
    }

    get typeActions() {
        return this.repository.typeActions;
    }

    async allRefs(): Promise<Ref[]> {
        return await this.repository.allRefs();
    }

    async addRef(transientRef: TransientRef): Promise<Ref> {
        this.confirmImage(transientRef.image);

        const ref = await this.repository.createRef(transientRef);

        return ref;
    }

    async updateRef(ref: Ref): Promise<Ref> {
        this.confirmImage(ref.image);

        const updatedRef = await this.repository.updateRef(ref);

        return updatedRef;
    }

    async deleteRef(id: number): Promise<Ref> {
        const ref = await this.repository.deleteRef(id);

        return ref;
    }

    async allTags(): Promise<Tag[]> {
        return await this.repository.allTags();
    }

    async allTypes(): Promise<Type[]> {
        return await this.repository.allTypes();
    }

    async addType(transientType: TransientType): Promise<Type> {
        return await this.repository.createType(transientType);
    }

    async updateType(type: Type): Promise<Type> {
        return await this.repository.updateType(type);
    }

    async deleteType(id: number): Promise<Type> {
        return await this.repository.deleteType(id);
    }

    async storeImage(image: Buffer): Promise<ImageDescriptor> {
        const imageDescriptor = await this.createImageDescriptor(image);
        const thumbnailImage = await this.createThumbnailImage(image, imageDescriptor);

        return await this.repository.storeImage(image, thumbnailImage, imageDescriptor);
    }

    async discardImage(imageDescriptor: ImageDescriptor): Promise<ImageDescriptor> {
        return await this.repository.discardImage(imageDescriptor);
    }

    async discardImageZombies(threshold: number): Promise<number> {
        return await this.repository.discardImageZombies(threshold);
    }

    getOriginalImagePath(hash: string, mime: string) {
        return this.repository.getOriginalImagePath(hash, mime);
    }

    getThumbnailImagePath(hash: string, mime: string) {
        return this.repository.getThumbnailImagePath(hash, mime);
    }

    private async confirmImage(image: ImageDescriptor): Promise<void> {
        if (!await this.repository.hasImage(image)) {
            const { hash, mime } = image;

            throw new Error(`Image with hash [${hash}] and type [${mime}] not found`);
        }
    }

    private async createImageDescriptor(image: Buffer) {
        const sharpImage = sharp(image);
        const metadata = await sharpImage.metadata();
        const stats = await sharpImage.stats();
        const opaque = stats.isOpaque;

        // if the image has an alpha channel, need to composite over middle gray to calculate luminance
        const flats = !opaque
            ? await sharp(await sharpImage.flatten({ background: MID }).toBuffer()).stats()
            : stats;

        const [r, g, b] = flats.channels.map(({ mean }) => mean / 255.0).map(toLinear);
        const luminance = toRelativeLuminance({ r, g, b });

        return {
            hash: createHash('md5').update(image).digest('hex'),
            width: metadata.width || 0,
            height: metadata.height || 0,
            mime: metadata.format && lookup(metadata.format) || 'applications/octet-stream',
            alpha: metadata.hasAlpha || false,
            opaque,
            luminance
        };
    }

    private async createThumbnailImage(image: Buffer, imageDescriptor: ImageDescriptor) {
        const thumbnail = sharp(image);
        const background = toContrastingColor(imageDescriptor.luminance);

        if (!imageDescriptor.opaque) {
            thumbnail.flatten({ background });
        }

        thumbnail.resize({
            width: this.config.images.thumbnails.width,
            height: this.config.images.thumbnails.height,
            fit: 'inside',
            withoutEnlargement: true
        });

        return await thumbnail
            .toFormat(this.config.images.thumbnails.format as any)
            .toBuffer();
    }
}