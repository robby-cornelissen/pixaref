import { Injectable } from "@angular/core";
import { Action, ConnectionStatus, Message, Ref, Tag, Type } from "@pixaref/core";
import { BehaviorSubject, last, map, mergeMap, Observable, Observer, retryWhen, Subject, Subscription, takeUntil, tap, throwError, timer } from "rxjs";
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { v4 as uuid } from "uuid";
import { PixarefService } from "./pixaref.service";
import { ConfigService } from "./util/config.service";

@Injectable({
    providedIn: 'root'
})
export class PixarefWsService {
    private static readonly BASE_PATH = '/WS';

    private connectionSubject = new Subject<void>();
    private connectionStatusSubject = new Subject<ConnectionStatus>();

    private addRefSubject = new Subject<Ref>();
    private updateRefSubject = new Subject<Ref>();
    private deleteRefSubject = new Subject<Ref>();

    private addTagSubject = new Subject<Tag>();
    private deleteTagSubject = new Subject<Tag>();

    private addTypeSubject = new Subject<Type>();
    private updateTypeSubject = new Subject<Type>();
    private deleteTypeSubject = new Subject<Type>();

    constructor(private config: ConfigService) { }

    connect(): void {
        this.connectionSubject.next();

        this.createWebSocket();
    }

    onConnectionStatus(): Observable<ConnectionStatus> {
        return this.connectionStatusSubject;
    }

    onAddRef(): Observable<Ref> {
        return this.addRefSubject;
    }

    onUpdateRef(): Observable<Ref> {
        return this.updateRefSubject;
    }

    onDeleteRef(): Observable<Ref> {
        return this.deleteRefSubject;
    }

    onAddTag(): Observable<Tag> {
        return this.addTagSubject;
    }

    onDeleteTag(): Observable<Tag> {
        return this.deleteTagSubject;
    }

    onAddType(): Observable<Type> {
        return this.addTypeSubject;
    }

    onUpdateType(): Observable<Type> {
        return this.updateTypeSubject;
    }

    onDeleteType(): Observable<Type> {
        return this.deleteTypeSubject;
    }

    private createWebSocket(): void {
        let refActionSubscription: Subscription;
        let tagActionSubscription: Subscription;
        let typeActionSubscription: Subscription;

        const ws: WebSocketSubject<Message> = webSocket<Message>({
            url: this.getUrl(),
            openObserver: {
                next: () => {
                    ws.next({ type: 'hello', id: uuid() });
                }
            },
            closeObserver: {
                next: () => {
                    refActionSubscription?.unsubscribe();
                    tagActionSubscription?.unsubscribe();
                    typeActionSubscription?.unsubscribe();

                    this.connectionStatusSubject.next({
                        status: 'DISCONNECTED'
                    });
                }
            }
        });
        ws.pipe(
            retryWhen(this.createRetryer(
                this.connectionSubject,
                this.connectionStatusSubject
            ))
        ).subscribe((message: any) => {
            if (message.type === 'ping') {
                ws.next({ type: 'ping', id: uuid() });
            }

            if (message.type === 'hello') {
                refActionSubscription = this.subscribeToRefActions(ws);
                tagActionSubscription = this.subscribeToTagActions(ws);
                typeActionSubscription = this.subscribeToTypeActions(ws);

                this.connectionStatusSubject.next({
                    status: 'CONNECTED'
                });
            }
        });
    }

    private subscribeToRefActions(ws: WebSocketSubject<Message>): Subscription {
        return ws.multiplex(
            () => ({ type: 'sub', id: uuid(), path: PixarefService.REF_PATH }),
            () => ({ type: 'unsub', id: uuid(), path: PixarefService.REF_PATH }),
            (message: Message) => message.type === 'pub' && message.path === PixarefService.REF_PATH
        ).pipe(
            map((message: any) => message.body)
        ).subscribe((action: Action<Ref>) => {
            switch (action.type) {
                case 'ADD':
                    return this.addRefSubject.next(action.entity);
                case 'UPDATE':
                    return this.updateRefSubject.next(action.entity);
                case 'DELETE':
                    return this.deleteRefSubject.next(action.entity);
            }
        });
    }

    private subscribeToTagActions(ws: WebSocketSubject<Message>): Subscription {
        return ws.multiplex(
            () => ({ type: 'sub', id: uuid(), path: PixarefService.TAG_PATH }),
            () => ({ type: 'unsub', id: uuid(), path: PixarefService.TAG_PATH }),
            (message: Message) => message.type === 'pub' && message.path === PixarefService.TAG_PATH
        ).pipe(
            map((message: any) => message.body)
        ).subscribe((action: Action<Tag>) => {
            switch (action.type) {
                case 'ADD':
                    return this.addTagSubject.next(action.entity);
                case 'DELETE':
                    return this.deleteTagSubject.next(action.entity);
            }
        });
    }

    private subscribeToTypeActions(ws: WebSocketSubject<Message>): Subscription {
        return ws.multiplex(
            () => ({ type: 'sub', id: uuid(), path: PixarefService.TYPE_PATH }),
            () => ({ type: 'unsub', id: uuid(), path: PixarefService.TYPE_PATH }),
            (message: Message) => message.type === 'pub' && message.path === PixarefService.TYPE_PATH
        ).pipe(
            map((message: any) => message.body)
        ).subscribe((action: Action<Type>) => {
            switch (action.type) {
                case 'ADD':
                    return this.addTypeSubject.next(action.entity);
                case 'UPDATE':
                    return this.updateTypeSubject.next(action.entity);
                case 'DELETE':
                    return this.deleteTypeSubject.next(action.entity);
            }
        });
    }

    private createRetryer(
        interruptObservable: Observable<void>,
        statusObserver: Observer<ConnectionStatus>,
        statusInterval = 500,
        retryWait = 1000,
        maxAttempts = 1000
    ) {
        return (errors: Observable<any>) => errors.pipe(
            mergeMap((_: Error, i: number) => {
                const attempt = i + 1;
                const wait = attempt * retryWait;

                if (attempt > maxAttempts) {
                    return throwError(() => new Error('Maximum retry attempts exceeded'));
                }

                return timer(0, statusInterval).pipe(
                    tap((j: number) => statusObserver.next({
                        status: 'WAITING',
                        progress: ((j * statusInterval) / wait) * 100
                    })),
                    takeUntil(timer(wait + statusInterval)),
                    last()
                );
            }),
            takeUntil(interruptObservable)
        );
    }

    private getUrl(path: string = '') {
        const protocol = this.config.wsProtocol;
        const host = this.config.host;
        const base = PixarefWsService.BASE_PATH;

        return `${protocol}://${host}${base}${path}`;
    }
}
