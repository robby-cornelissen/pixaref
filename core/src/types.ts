// makes a type's id field optional
export type Transient<T extends {id: any}> = Omit<T, 'id'> & Partial<T>;

// makes a type's optional keys mandatory with null values allowed
export type Nullable<T> = {
    [P in keyof T]-?: undefined extends T[P] ? T[P] | null : T[P];
}

// turns a type's boolean values into binary values (0 or 1)
export type Binary<T> = {
    [P in keyof T]: boolean extends T[P] ? 0 | 1 : T[P];
}

// flattens a complex object type by merging in nested object type keys
export type Flat<T> =
    & {
        [P in SimpleKeys<T>]: T[P]
    }
    & {
        [P in keyof ComplexValues<T>]: ComplexValues<T>[P]
    };

// extracts non-object keys from a type
type SimpleKeys<T> = {
    [K in keyof T]-?: T[K] extends Record<string, any> ? never : K
}[keyof T];

// extracts object keys from a type
type ComplexKeys<T> = {
    [K in keyof T]-?: T[K] extends Record<string, any> ? K : never
}[keyof T];

// extracts nested object types from a type
type ComplexValues<T> = UnionToIntersection<T[ComplexKeys<T>]>;

// dark magic from https://stackoverflow.com/a/50375286
// converts a union to an intersection
type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// dark magic from https://stackoverflow.com/a/58436959
// gets all dot-delimited paths up to a specified depth from a complex object type
export type Paths<T, D extends number = Depth> = [D] extends [never] ? never : T extends object ?
    { [K in keyof T]-?: K extends string | number ?
        `${K}` | Join<K, Paths<T[K], Previous[D]>>
        : never
    }[keyof T] : '';

// gets all dot-delimited leaf paths up to a specified depth from a complex object type
export type LeafPaths<T, D extends number = Depth> = [D] extends [never] ? never : T extends object ?
    { [K in keyof T]-?: Join<K, LeafPaths<T[K], Previous[D]>> }[keyof T] : '';

// builds a dot-delimited path
type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}${"" extends P ? "" : "."}${P}`
    : never : never;

// facilitates recursion up to a certain depth
type Previous = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];

// default recursion depth
type Depth = 3;
