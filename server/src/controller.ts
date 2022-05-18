import { Action, Message, Ref, TransientRef, TransientType, Type } from '@pixaref/core';
import { FastifyInstance as Server } from 'fastify';
import fastifyMultipart from 'fastify-multipart';
import fastifyStatic from 'fastify-static';
import fastifyWebsocket from 'fastify-websocket';
import { WebSocket } from 'ws';
import { relative, resolve } from 'path';
import { v4 as uuid } from 'uuid';
import { PixarefService } from './service';
import { Config } from './conf/config';

export class PixarefController {
    private rsController;
    private wsController;
    private fsController;
    private ngController;

    constructor(service: PixarefService, server: Server, config: Config) {
        this.rsController = new PixarefRsController(service, server, config);
        this.wsController = new PixarefWsController(service, server, config);
        this.fsController = new PixarefFsController(service, server, config);
        this.ngController = new PixarefNgController(service, server, config);
    }

    initialize() {
        this.rsController.initialize();
        this.wsController.initialize();
        this.fsController.initialize();
        this.ngController.initialize();
    }
}

class PixarefRsController {
    private static readonly BASE_PATH = '/RS';
    private static readonly REF_PATH = '/ref';
    private static readonly TAG_PATH = '/tag';
    private static readonly TYPE_PATH = '/type';

    constructor(private service: PixarefService, private server: Server, private config: Config) { }

    initialize() {
        this.server.get(
            this.getPath(PixarefRsController.REF_PATH),
            {},
            async () => {
                return await this.service.allRefs()
            }
        );

        this.server.post<{ Body: TransientRef }>(
            this.getPath(PixarefRsController.REF_PATH),
            {},
            async (request) => {
                const transientRef = request.body;

                return await this.service.addRef(transientRef);
            }
        );

        this.server.patch<{ Body: Ref }>(
            this.getPath(PixarefRsController.REF_PATH),
            {},
            async (request) => {
                const ref = request.body;

                return await this.service.updateRef(ref);
            }
        );

        this.server.delete<{ Params: { id: number } }>(
            this.getPath(PixarefRsController.REF_PATH + '/:id'),
            {},
            async (request) => {
                const id = request.params.id;

                return await this.service.deleteRef(id);
            }
        );

        this.server.get(
            this.getPath(PixarefRsController.TAG_PATH),
            {},
            async () => {
                return await this.service.allTags();
            }
        );

        this.server.get(
            this.getPath(PixarefRsController.TYPE_PATH),
            {},
            async () => {
                return await this.service.allTypes();
            }
        );

        this.server.post<{ Body: TransientType }>(
            this.getPath(PixarefRsController.TYPE_PATH),
            {},
            async (request) => {
                const transientType = request.body;

                return await this.service.addType(transientType);
            }
        );

        this.server.patch<{ Body: Type }>(
            this.getPath(PixarefRsController.TYPE_PATH),
            {},
            async (request) => {
                const type = request.body;

                return await this.service.updateType(type);
            }
        );

        this.server.delete<{ Params: { id: number } }>(
            this.getPath(PixarefRsController.TYPE_PATH + '/:id'),
            {},
            async (request) => {
                const id = request.params.id;

                return await this.service.deleteType(id);
            }
        );
    }

    private getPath(path: string) {
        const base = PixarefRsController.BASE_PATH;

        return `${base}${path}`;
    }
}

class PixarefWsController {
    private static readonly BASE_PATH = '/WS';
    private static readonly REF_PATH = '/ref';
    private static readonly TAG_PATH = '/tag';
    private static readonly TYPE_PATH = '/type';

    private clients: Map<WebSocket, Set<string>> = new Map();

    constructor(private service: PixarefService, private server: Server, private config: Config) { }

    initialize() {
        this.server.register(fastifyWebsocket);

        this.server.get(
            PixarefWsController.BASE_PATH,
            { websocket: true },
            ({ socket }) => {
                this.add(socket);

                socket.on('message', (data) => {
                    const message: Message = JSON.parse(data.toString());

                    switch (message.type) {
                        case 'ping':
                            return socket.send(JSON.stringify({ type: 'ping', id: message.id }));
                        case 'hello':
                            return socket.send(JSON.stringify({ type: 'hello', id: message.id }));
                        case 'sub':
                            this.subscribe(message.path, socket);

                            return socket.send(JSON.stringify({ type: 'sub', id: message.id, path: message.path }));
                        case 'unsub':
                            this.unsubscribe(message.path, socket);

                            return socket.send(JSON.stringify({ type: 'unsub', id: message.id, path: message.path }));
                    }
                });
                socket.on('close', () => this.remove(socket));
                socket.on('error', () => this.remove(socket));
            }
        );

        this.service.refActions.subscribe((action) => this.publish(PixarefWsController.REF_PATH, action));
        this.service.tagActions.subscribe((action) => this.publish(PixarefWsController.TAG_PATH, action));
        this.service.typeActions.subscribe((action) => this.publish(PixarefWsController.TYPE_PATH, action));
    }

    private subscribe(path: string, socket: WebSocket): void {
        this.clients.get(socket)?.add(path);
    }

    private unsubscribe(path: string, socket: WebSocket): void {
        this.clients.get(socket)?.delete(path);
    }

    private publish(path: string, body: any): void {
        const id = uuid();

        this.clients.forEach((paths, socket) => {
            if (socket.readyState === socket.OPEN && paths.has(path)) {
                socket.send(JSON.stringify({ type: 'pub', id, path, body }));
            }
        })
    }

    private add(socket: WebSocket): void {
        this.clients.set(socket, new Set());
    }

    private remove(socket: WebSocket): void {
        this.clients.delete(socket);
    }
}

class PixarefFsController {
    private static readonly BASE_PATH = '/FS';
    private static readonly IMAGE_PATH = '/image';

    constructor(private service: PixarefService, private server: Server, private config: Config) { }

    initialize() {
        this.server.register(fastifyStatic, {
            root: resolve(this.config.images.directory),
            prefix: PixarefFsController.BASE_PATH
        });

        this.server.register(fastifyMultipart, {
            limits: {
                fileSize: this.config.server.maxUploadBytes
            }
        });

        this.server.get<{ Params: { hash: string }, Querystring: { mime: string, type: string } }>(
            this.getPath(PixarefFsController.IMAGE_PATH + '/:hash'),
            {},
            async (request, reply) => {
                const hash = request.params.hash;
                const mime = request.query.mime;
                const type = request.query.type;

                switch (type) {
                    case 'original':
                        return reply.sendFile(
                            this.getRelativeImagePath(this.service.getOriginalImagePath(hash, mime))
                        );
                    case 'thumbnail':
                        return reply.type(this.config.images.thumbnails.mime).sendFile(
                            this.getRelativeImagePath(this.service.getThumbnailImagePath(hash, mime))
                        );
                    default:
                        reply.callNotFound();
                }
            }
        );

        this.server.post(
            this.getPath(PixarefFsController.IMAGE_PATH),
            {},
            async (request) => {
                const data = await request.file();
                const image = await data.toBuffer();

                return await this.service.storeImage(image);
            }
        );
    }

    private getPath(path: string) {
        const base = PixarefFsController.BASE_PATH;

        return `${base}${path}`;
    }

    private getRelativeImagePath(path: string) {
        return relative(this.config.images.directory, path);
    }
}

class PixarefNgController {
    private static readonly BASE_PATH = '/';

    constructor(private service: PixarefService, private server: Server, private config: Config) { }

    initialize() {
        this.server.register(fastifyStatic, {
            root: resolve(this.config.web.public),
            prefix: PixarefNgController.BASE_PATH,
            decorateReply: false
        });
    }
}
