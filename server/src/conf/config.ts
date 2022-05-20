import { LeafPaths } from '@pixaref/core';
import json from './config.json' assert {type: "json"};

const ENVIRONMENT_VARIABLES: { [P in LeafPaths<Config>]?: string } = {
    'database.path': 'DATABASE_PATH',
    'images.directory': 'IMAGES_DIRECTORY'
} as const;

export type Config = typeof json;

export function config(): Config {
    const config: Config = JSON.parse(JSON.stringify(json));

    let path: keyof typeof ENVIRONMENT_VARIABLES;
    for (path in ENVIRONMENT_VARIABLES) {
        const variable = ENVIRONMENT_VARIABLES[path];

        if (variable) {
            const value = process.env[variable];

            if (typeof value !== 'undefined') {
                applyConfigValue(config, path, value);
            }
        }
    }

    return config;
}

function applyConfigValue(config: Config, path: LeafPaths<Config>, value: string) {
    const getValue = (x: any, [first, ...rest]: string[]): any => 
        rest.length ? getValue(x[first], rest) : x[first];
    const setValue = (x: any, [first, ...rest]: string[], value: any): void => 
        rest.length ? setValue(x[first], rest, value) : x[first] = value;

    const segments = path.split('.');

    switch (typeof getValue(config, segments)) {
        case 'string':
            return setValue(config, segments, value);
        case 'number':
            return setValue(config, segments, Number(value));
        case 'boolean':
            return setValue(config, segments, !!(value === 'true'));
        default:
            throw new Error(`Configuration error for path [${path}]`);
    }
}
