import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any;

  constructor(private http: HttpClient) { }

  get host() {
    return environment.production ? location.host : this.config.host;
  }

  get rsProtocol() {
    return this.config.rsProtocol;
  }

  get wsProtocol() {
    return this.config.wsProtocol;
  }

  get fsProtocol() {
    return this.config.fsProtocol;
  }

  get mimes() {
    return this.config.mimes;
  }

  get separators() {
    return this.config.separators;
  }

  load() {
    return firstValueFrom(this.http
      .get('/assets/config.json')
      .pipe(tap(config => this.config = config)));
  }
}
