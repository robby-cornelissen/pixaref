import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ImageDescriptor } from "@pixaref/core";
import { Observable } from "rxjs";
import { ConfigService } from "./util/config.service";
import { PixarefService } from "./pixaref.service";

@Injectable({
    providedIn: 'root'
})
export class PixarefFsService {
    private static readonly BASE_PATH = '/FS';

    constructor(private config: ConfigService, private http: HttpClient) { }

    getOriginalImageUrl(imageDescriptor: ImageDescriptor): string {
        const { hash, mime } = imageDescriptor;

        return this.getUrl(PixarefService.IMAGE_PATH) + `/${hash}?mime=${encodeURIComponent(mime)}&type=original`;
    }

    getThumbnailImageUrl(imageDescriptor: ImageDescriptor): string {
        const { hash, mime } = imageDescriptor;

        return this.getUrl(PixarefService.IMAGE_PATH) + `/${hash}?mime=${encodeURIComponent(mime)}&type=thumbnail`;
    }

    addImage(image: File): Observable<ImageDescriptor> {
        const url = this.getUrl(PixarefService.IMAGE_PATH);

        const formData = new FormData();
        formData.append('image', image);

        return this.http.post<ImageDescriptor>(url, formData);
    }

    private getUrl(path: string) {
        const protocol = this.config.fsProtocol;
        const host = this.config.host;
        const base = PixarefFsService.BASE_PATH;

        return `${protocol}://${host}${base}${path}`;
    }
}
