import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Ref, Tag, TransientRef, TransientType, Type } from "@pixaref/core";
import { Observable, Subject } from "rxjs";
import { ConfigService } from "./util/config.service";
import { PixarefService } from "./pixaref.service";

@Injectable({
    providedIn: 'root'
})
export class PixarefRsService {
    private static readonly BASE_PATH = '/RS';

    private allRefsSubject = new Subject<Ref[]>();
    private allTagsSubject = new Subject<Tag[]>();
    private allTypesSubject = new Subject<Type[]>();

    constructor(private config: ConfigService, private http: HttpClient) { }

    onAllRefs(): Subject<Ref[]> {
        return this.allRefsSubject;
    }

    onAllTags(): Subject<Tag[]> {
        return this.allTagsSubject;
    }

    onAllTypes(): Subject<Type[]> {
        return this.allTypesSubject;
    }

    allRefs(): void {
        const url = this.getUrl(PixarefService.REF_PATH);

        this.http.get<Ref[]>(url).subscribe((refs) => this.allRefsSubject.next(refs));
    }

    addRef(transientRef: TransientRef): Observable<Ref> {
        const url = this.getUrl(PixarefService.REF_PATH);

        return this.http.post<Ref>(url, transientRef);
    }

    updateRef(ref: Ref): Observable<Ref> {
        const url = this.getUrl(PixarefService.REF_PATH);

        return this.http.patch<Ref>(url, ref);
    }

    deleteRef(ref: Ref): Observable<Ref> {
        const url = this.getUrl(PixarefService.REF_PATH) + `/${ref.id}`;

        return this.http.delete<Ref>(url);
    }

    allTags(): void {
        const url = this.getUrl(PixarefService.TAG_PATH);

        this.http.get<Tag[]>(url).subscribe((tags) => this.allTagsSubject.next(tags));
    }

    allTypes(): void {
        const url = this.getUrl(PixarefService.TYPE_PATH);

        this.http.get<Type[]>(url).subscribe((types) => this.allTypesSubject.next(types));
    }

    addType(transientType: TransientType): Observable<Type> {
        const url = this.getUrl(PixarefService.TYPE_PATH);

        return this.http.post<Type>(url, transientType);
    }

    updateType(type: Type): Observable<Type> {
        const url = this.getUrl(PixarefService.TYPE_PATH);
        
        return this.http.patch<Type>(url, type);
    }

    deleteType(type: Type): Observable<Type> {
        const url = this.getUrl(PixarefService.TYPE_PATH) + `/${type.id}`;

        return this.http.delete<Type>(url);
    }

    private getUrl(path: string) {
        const protocol = this.config.rsProtocol;
        const host = this.config.host;
        const base = PixarefRsService.BASE_PATH;

        return `${protocol}://${host}${base}${path}`;
    }
}
