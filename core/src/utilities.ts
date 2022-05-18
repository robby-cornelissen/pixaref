import { Binary, Flat } from "./types";

/**
 * Takes an object with some boolean properties, and replaces the boolean
 * property values with 0 and 1 values.
 * 
 * @param t Object with some boolean properties
 * @returns Object with boolean properties replaced with 0 and 1 values
 */
export function binarize<T extends Record<string, any>>(t: T): Binary<T> {
    return Object.keys(t).reduce((a, v) => ({
        ...a,
        [v]: typeof t[v] === 'boolean'
            ? t[v] ? 1 : 0
            : t[v]
    }), {} as Binary<T>);
}

/**
 * Flattens an object with nested objects.
 * 
 * @param t Object with nested object
 * @returns Flattened object
 */
export function flatten<T extends Record<string, any>>(t: T): Flat<T> {
    return Object.keys(t).reduce((a, v) => ({
        ...a,
        ...isPlainObject(t[v]) ? t[v] : { [v]: t[v] }
    }), {} as Flat<T>);
}

/**
 * Checks whether a value is a JavaScript object.
 * 
 * @param x Any value
 * @returns True if the value is a JavaScript object, false otherwise
 */
export function isPlainObject(x: any): boolean {
    return x !== null && typeof x === 'object' && !Array.isArray(x);
}

/**
 * Creates a regular expression from a string literal.
 * 
 * @param literal The literal string to be matched
 * @param ignoreCase Whether character case should be ignored
 * @param partial Whether partial matches should be returned
 * @returns A regular expression object
 */
export function createRegEx(literal: string, ignoreCase = true, partial = true): RegExp {
    let pattern = literal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    pattern = partial ? pattern : `^${pattern}$`;

    return new RegExp(
        pattern,
        ignoreCase ? 'i' : ''
    );
}

/**
 * Binary search implementation that returns a positive result for values that are present
 * in the array, and a negative result (including -0) corresponding to the insertion point
 * for values that are not present in the array.
 * 
 * @param array Array to search; needs to be sorted
 * @param value Value to search for
 * @param compare Comparison function that returns 1, 0, or -1
 * @returns A positive index for existing values; a negative index for non-existing values 
 */
export function binarySearch<T>(
    array: T[],
    value: T,
    compare: (t1: T, t2: T) => number = (t1, t2) => t1 < t2 ? -1 : t1 > t2 ? 1 : 0
) {
    let start = 0, end = array.length - 1;

    while (start <= end) {
        let mid = Math.floor((start + end) / 2);
        let result = compare(value, array[mid]);

        switch (Math.sign(result)) {
            case 0:
                return mid;
            case -1:
                end = mid - 1;
                break;
            case 1:
                start = mid + 1;
                break;
        }
    }

    return -start;
}

/**
 * Tests whether a number is strictly positive (including +0)
 * 
 * @param n Number
 * @returns True if the number is strictly positive
 */
export function isPositive(n: number) {
    return 1 / n > 0;
}

/**
 * Tests whether a number is strictly negative (including -0)
 * 
 * @param n Number
 * @returns True if the number is strictly negative
 */
export function isNegative(n: number) {
    return 1 / n < 0;
}

/**
 * Converts an array of strings to lower-case.
 * 
 * @param strings Array of strings
 * @returns Lower-cased array of strings
 */
export function toLowerCase(strings: string[]): string[] {
    return strings.map((s) => s.toLowerCase());
}

/**
 * Converts an array of objects to an index/lookup object.
 * 
 * @param array Array of objects
 * @param keyProperty Key property
 * @param valueProperty Value property
 * @returns An index object with keys and values as defined by the parameters
 */
export function toIndex<
    T,
    K extends { [K in keyof T]-?: T[K] extends string ? K : never }[keyof T],
    V extends keyof T
>(array: T[], keyProperty: K, valueProperty: V): { [key in K ]: V } {
    return Object.fromEntries(array.map((v) => [v[keyProperty], v[valueProperty]]));
}

/**
 * Creates a predicate that accepts a string value and returns true if
 * the value matches the string used to create the predicate.
 * 
 * @param string String to check against
 * @param ignoreCase Whether character case should be ignored
 * @param partial Whether partial matchese should be included
 * @returns A predicate
 */
export function createMatchesStringPredicate(string: string, ignoreCase = true, partial = true): (value?: string) => boolean {
    if (!ignoreCase && !partial) {
        return (value?: string) => value === string;
    }

    const re = createRegEx(string, ignoreCase, partial);

    return (value?: string) => !!(value && re.test(value));

}

/**
 * Creates a predicate that accepts a string value and returns true if
 * the value is included in the strings array used to create the predicate.
 * 
 * @param strings Array of strings to check against
 * @param ignoreCase whether character case should be ignored
 * @returns A predicate
 */
export function createIncludesStringPredicate(strings: string[], ignoreCase = true): (value?: string) => boolean {
    strings = ignoreCase ? toLowerCase(strings) : strings;

    return (value?: string) => {
        value = ignoreCase ? value?.toLowerCase() : value;

        return !!(value && strings.includes(value));
    }
}

/**
 * Creates a predicate that accepts an array of string values and returns true if
 * every value in the array is included in the strings array used to create the predicate.
 * 
 * @param strings Array of strings to check against
 * @param ignoreCase Whether character case should be ignored
 * @returns A predicate
 */
export function createIncludesStringsPredicate(strings: string[], ignoreCase = true): (values?: string[]) => boolean {
    strings = ignoreCase ? toLowerCase(strings) : strings;

    return (values?: string[]) => {
        values = values ? (ignoreCase ? toLowerCase(values) : values) : [];

        return strings.every(string => values?.includes(string));
    }
}

/**
 * Creates a predicate that returns true for any value.
 * 
 * @param value Value
 * @returns true
 */
export const truePredicate = (value: any) => true;

/**
 * Creates a predicate that returns false for any value.
 * 
 * @param value Value
 * @returns false 
 */
export const falsePredicate = (value: any) => false;