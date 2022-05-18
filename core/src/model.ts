import { createIncludesStringsPredicate, createMatchesStringPredicate, truePredicate } from ".";
import { Nullable, Transient } from "./types";

export interface ImageDescriptor {
    hash: string,
    mime: string,
    width: number,
    height: number,
    alpha: boolean,
    opaque: boolean,
    luminance: number
}

export interface Ref {
    id: number;
    image: ImageDescriptor;
    title?: string,
    type?: string,
    year?: number,
    tags?: Tag[]
}

export type Tag = string;

export interface Type {
    id: number;
    name: string;
    icon?: string;
}

export interface RefFilter {
    title?: string;
    type?: string;
    tags?: Tag[];
}

export interface Action<T> {
    type: 'ADD' | 'UPDATE' | 'DELETE';
    entity: T;
}

export type TransientRef = Transient<Ref>;

export type TransientType = Transient<Type>;

export function isRef(ref: Partial<Ref>): ref is Ref {
    return typeof ref.id === 'number'
        && isTransientRef(ref);
}

export function isTransientRef(ref: Partial<Ref>): ref is TransientRef {
    return typeof ref.image?.hash === 'string'
        && typeof ref.image?.mime === 'string'
        && typeof ref.image?.width === 'number'
        && typeof ref.image?.height === 'number'
}

export function nullifyRef<R extends Ref | TransientRef>(r: R): Nullable<R> {
    return Object.assign({}, {
        id: null,
        title: null,
        type: null,
        year: null,
        tags: null
    }, r);
}

export function isType(type: Partial<Type>): type is Type {
    return typeof type.id === 'number'
        && isTransientType(type);
}

export function isTransientType(type: Partial<Type>): type is TransientType {
    return typeof type.name === 'string';
}

export function nullifyType<T extends Type | TransientType>(t: T): Nullable<T> {
    return Object.assign({}, {
        icon: null
    }, t);
}

export function createRefFilterPredicate({ title, type, tags }: RefFilter): (ref: Ref) => boolean {
    const titlePredicate = title ? createMatchesStringPredicate(title) : truePredicate;
    const typePredicate = type ? createMatchesStringPredicate(type, false, false) : truePredicate;
    const tagsPredicate = tags ? createIncludesStringsPredicate(tags, false) : truePredicate;

    return (ref: Ref) =>
        titlePredicate(ref.title) &&
        typePredicate(ref.type) &&
        tagsPredicate(ref.tags)
}
