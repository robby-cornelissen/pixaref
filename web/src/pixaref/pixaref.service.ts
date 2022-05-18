import { Injectable } from "@angular/core";
import { binarySearch, ConnectionStatus, createRefFilterPredicate, ImageDescriptor, isNegative, isPositive, Ref, RefFilter, Tag, TransientRef, TransientType, Type } from "@pixaref/core";
import { BehaviorSubject, combineLatest, map, Observable } from "rxjs";
import { PixarefRsService } from "./pixaref.service.rs";
import { PixarefWsService } from "./pixaref.service.ws";
import { PixarefFsService } from "./pixaref.service.fs";

@Injectable({
    providedIn: 'root'
})
export class PixarefService {
    static readonly REF_PATH = '/ref';
    static readonly TAG_PATH = '/tag';
    static readonly TYPE_PATH = '/type';
    static readonly IMAGE_PATH = '/image';

    private allRefsSubject = new BehaviorSubject<Ref[]>([]);
    private allTagsSubject = new BehaviorSubject<Tag[]>([]);
    private allTypesSubject = new BehaviorSubject<Type[]>([]);

    private refFilterSubject = new BehaviorSubject<RefFilter>({});

    constructor(
        private rs: PixarefRsService,
        private ws: PixarefWsService,
        private fs: PixarefFsService
    ) {
        this.ws.onConnectionStatus().subscribe(this.onConnectionStatus.bind(this));

        this.rs.onAllRefs().subscribe(this.onAllRefs.bind(this));
        this.ws.onAddRef().subscribe(this.onAddRef.bind(this));
        this.ws.onUpdateRef().subscribe(this.onUpdateRef.bind(this));
        this.ws.onDeleteRef().subscribe(this.onDeleteRef.bind(this));

        this.rs.onAllTags().subscribe(this.onAllTags.bind(this));
        this.ws.onAddTag().subscribe(this.onAddTag.bind(this));
        this.ws.onDeleteTag().subscribe(this.onDeleteTag.bind(this));

        this.rs.onAllTypes().subscribe(this.onAllTypes.bind(this));
        this.ws.onAddType().subscribe(this.onAddType.bind(this));
        this.ws.onUpdateType().subscribe(this.onUpdateType.bind(this));
        this.ws.onDeleteType().subscribe(this.onDeleteType.bind(this));

        this.connect();
    }

    connect(): void {
        this.ws.connect();
    }

    connectionStatus(): Observable<ConnectionStatus> {
        return this.ws.onConnectionStatus();
    }

    allRefs(): Observable<Ref[]> {
        return this.allRefsSubject;
    }

    filteredRefs(): Observable<Ref[]> {
        return combineLatest([
            this.allRefsSubject,
            this.refFilterSubject
        ]).pipe(
            map(([refs, refFilter]) => {
                const test = createRefFilterPredicate(refFilter);

                return refs.filter(test);
            })
        );
    }

    addRef(transientRef: TransientRef): Observable<Ref> {
        return this.rs.addRef(transientRef);
    }

    updateRef(ref: Ref): Observable<Ref> {
        return this.rs.updateRef(ref);
    }

    deleteRef(ref: Ref): Observable<Ref> {
        return this.rs.deleteRef(ref);
    }

    allTags(): Observable<Tag[]> {
        return this.allTagsSubject;
    }

    allTypes(): Observable<Type[]> {
        return this.allTypesSubject;
    }

    addType(transientType: TransientType): Observable<Type> {
        return this.rs.addType(transientType);
    }

    updateType(type: Type): Observable<Type> {
        return this.rs.updateType(type);
    }

    deleteType(type: Type): Observable<Type> {
        return this.rs.deleteType(type);
    }

    getThumbnailUrl(imageDescriptor: ImageDescriptor): string {
        return this.fs.getThumbnailImageUrl(imageDescriptor);
    }

    getImageUrl(imageDescriptor: ImageDescriptor): string {
        return this.fs.getOriginalImageUrl(imageDescriptor);
    }

    addImage(image: File): Observable<ImageDescriptor> {
        return this.fs.addImage(image);
    }

    refFilter(): Observable<RefFilter> {
        return this.refFilterSubject;
    }

    setRefFilterTitle(title?: string): void {
        const refFilter = this.refFilterSubject.value;

        if (refFilter.title !== title) {
            refFilter.title = title;

            this.refFilterSubject.next(refFilter);
        }
    }

    setRefFilterType(type?: string): void {
        const refFilter = this.refFilterSubject.value;

        if (refFilter.type !== type) {
            refFilter.type = type;

            this.refFilterSubject.next(refFilter);
        }
    }

    addRefFilterTag(tag: Tag): void {
        const refFilter = this.refFilterSubject.value;

        if (!refFilter.tags?.includes(tag)) {
            refFilter.tags = refFilter.tags || [];
            refFilter.tags.push(tag);

            this.refFilterSubject.next(refFilter);
        }
    }

    removeRefFilterTag(tag: Tag): void {
        const refFilter = this.refFilterSubject.value;

        if (refFilter.tags?.includes(tag)) {
            refFilter.tags.splice(refFilter.tags.indexOf(tag), 1);

            this.refFilterSubject.next(refFilter);
        }
    }

    clearRefFilter(): void {
        this.refFilterSubject.next({});
    }

    private onConnectionStatus(status: ConnectionStatus): void {
        if (status.status === 'CONNECTED') {
            this.rs.allRefs();
            this.rs.allTags();
            this.rs.allTypes();
        } else if (status.status === 'DISCONNECTED') {
            this.allRefsSubject.next([]);
            this.allTagsSubject.next([]);
        }
    }

    private onAllRefs(refs: Ref[]): void {
        this.allRefsSubject.next(refs);
    }

    private onAddRef(ref: Ref): void {
        const refs = this.allRefsSubject.value;
        const index = refs.findIndex(({ id }) => id === ref.id);

        if (index < 0) {
            refs.splice(0, 0, ref);

            // next'ing so that the filter is applied to the updated array
            // could consider progressive filtering here
            this.allRefsSubject.next(refs);
        }
    }

    private onUpdateRef(ref: Ref): void {
        const refs = this.allRefsSubject.value;
        const index = refs.findIndex(({ id }) => id === ref.id);

        if (index >= 0) {
            refs.splice(index, 1, ref);

            // next'ing so that the filter is applied to the updated array
            // could consider progressive filtering here
            this.allRefsSubject.next(refs);
        }
    }

    private onDeleteRef(ref: Ref): void {
        const refs = this.allRefsSubject.value;
        const index = refs.findIndex(({ id }) => id === ref.id);

        if (index >= 0) {
            refs.splice(index, 1);

            // next'ing so that the filter is applied to the updated array
            // could consider progressive filtering here
            this.allRefsSubject.next(refs);
        }
    }

    private onAllTags(tags: Tag[]): void {
        this.allTagsSubject.next(tags);
    }

    private onAddTag(tag: Tag): void {
        const tags = this.allTagsSubject.value;
        const index = binarySearch(tags, tag);

        if (isNegative(index)) {
            tags.splice(-index, 0, tag);

            this.allTagsSubject.next(tags);
        }
    }

    private onDeleteTag(tag: Tag): void {
        const tags = this.allTagsSubject.value;
        const index = binarySearch(tags, tag);

        if (isPositive(index)) {
            tags.splice(index, 1);

            this.allTagsSubject.next(tags);
        }
    }

    private onAllTypes(types: Type[]): void {
        this.allTypesSubject.next(types);
    }

    private onAddType(type: Type): void {
        const types = this.allTypesSubject.value;
        const index = binarySearch(types, type, (t1, t2) => t1.name.localeCompare(t2.name));

        if (isNegative(index)) {
            types.splice(-index, 0, type);

            this.allTypesSubject.next(types);
        }
    }

    private onUpdateType(type: Type): void {
        const types = this.allTypesSubject.value;
        const index = types.findIndex(({ id }) => id === type.id);

        if (index >= 0) {
            const [currentType] = types.splice(index, 1, type);

            this.allTypesSubject.next(types);

            if (type.name !== currentType.name) {
                const refs = this.allRefsSubject.value;

                refs.filter((ref) => ref.type === currentType.name)
                    .forEach((ref) => ref.type = type.name);

                const refFilter = this.refFilterSubject.value;

                if (refFilter.type === currentType.name) {
                    refFilter.type = type.name;
                }

                // next'ing so that the filter is applied to the updated array
                // could consider progressive filtering here
                this.allRefsSubject.next(refs);
            }
        }
    }

    private onDeleteType(type: Type): void {
        const types = this.allTypesSubject.value;
        const index = types.findIndex(({ id }) => id === type.id);

        if (index >= 0) {
            const [currentType] = types.splice(index, 1);

            this.allTypesSubject.next(types);

            const refs = this.allRefsSubject.value;

            refs.filter((ref) => ref.type === currentType.name)
                .forEach((ref) => delete ref.type);

            const refFilter = this.refFilterSubject.value;

            if (refFilter.type === currentType.name) {
                delete refFilter.type;
            }

            // next'ing so that the filter is applied to the updated array
            // could consider progressive filtering here
            this.allRefsSubject.next(refs);
        }
    }
}

