import Database from 'better-sqlite3';
import Fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import { mkdir, readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import pino, { Logger } from 'pino';
import { fileURLToPath } from 'url';
import {Config, config} from './conf/config';
import { PixarefController } from './controller';
import { PixarefRepository } from './repository';
import { PixarefScheduler } from './scheduler';
import { PixarefService } from './service';

const DIR: string = dirname(fileURLToPath(import.meta.url));
const DATABASE_SCHEMA_PATH: string = './data/schema/base.sql';

function resolvePath(path: string) {
    return resolve(DIR, path);
}

function getConfig() {
    return config();
}

function getLogger() {
    return pino({ level: 'trace' });
}

async function getDirectory(config: Config, logger: Logger) {
    const directory = process.env.IMAGE_DIRECTORY || config.images.directory;

    await mkdir(directory, { recursive: true });

    logger.info(`Using image directory [${directory}]`);

    return directory;
}

async function getDatabase(config: Config, logger: Logger) {
    const logQuery = (query: string) => {
        if (logger.isLevelEnabled('trace')) {
            const lines = query.split('\n').filter((l) => l.trim());
            const leader = lines[0]?.match(/^\s*/)?.[0] || '';
            const trimmed = lines
                .map((l) => l.startsWith(leader) ? l.slice(leader.length) : l)
                .join('\n');

            logger.trace('query:\n%s', trimmed);
        }
    };

    const path = process.env.DATABASE_PATH || config.database.path;

    await mkdir(dirname(path), { recursive: true });

    const database = new Database(path, {
        verbose: config.database.verbose ? logQuery : undefined
    });

    const { version } = database.prepare('SELECT sqlite_version() AS version').get();

    logger.info(`Using database [${path}] with SQLite version [${version}]`);

    const schema = await readFile(resolvePath(DATABASE_SCHEMA_PATH), { encoding: 'utf8' });

    database.exec(schema);

    return database;
}

async function getServer(config: Config) {
    const server = Fastify({
        logger: true,
        disableRequestLogging: !config.server.verbose
    });
    server.register(fastifyCors);

    return server;
}

async function init() {
    const config = getConfig();
    const logger = getLogger();
    const directory = await getDirectory(config, logger);
    const database = await getDatabase(config, logger);
    const server = await getServer(config);

    const repository = new PixarefRepository(directory, database, config);

    const service = new PixarefService(repository, config);

    const controller = new PixarefController(service, server, config);
    controller.initialize();

    const scheduler = new PixarefScheduler(service, logger, config);
    scheduler.initialize();

    await server.listen({ host: config.server.host, port: config.server.port });
}

init();