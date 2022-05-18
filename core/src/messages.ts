interface CoreMessage {
    type: string;
    id: string;
}

export interface PingMessage extends CoreMessage {
    type: 'ping';
}

export interface HelloMessage extends CoreMessage {
    type: 'hello';
}

export interface SubMessage extends CoreMessage {
    type: 'sub';
    path: string;
}

export interface UnsubMessage extends CoreMessage {
    type: 'unsub';
    path: string;
}

export interface PubMessage<T> extends CoreMessage {
    type: 'pub';
    path: string;
    body: T;
}

export type Message =
    | PingMessage
    | HelloMessage
    | SubMessage
    | UnsubMessage
    | PubMessage<any>;

export type ConnectionStatus =
| { status: 'CONNECTED', progress?: 100 }
| { status: 'DISCONNECTED', progress?: 0 }
| { status: 'WAITING', progress: number };