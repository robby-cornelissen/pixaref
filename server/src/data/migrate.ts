import Database from 'better-sqlite3';
import { readdir, readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const DIR: string = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(DIR, './schema');

const [databasePath, from, to] = process.argv.slice(2);

console.log(`Migrating [${databasePath}] from [${from}] to [${to}]`);

const database = new Database(resolve(process.cwd(), databasePath), {
    fileMustExist: true
});
const versions = (await readdir(SCHEMA_PATH, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

const fromIndex = versions.indexOf(from);
const toIndex = versions.indexOf(to);

if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    console.log('Invalid versions specified');
    process.exit(1);
}

const migrationDirection = fromIndex < toIndex ? 'up' : 'down';
const migrationSteps = fromIndex < toIndex
    ? versions.slice(fromIndex, toIndex)
    : versions.slice(toIndex, fromIndex).reverse();

migrationSteps.forEach(async (migrationStep) => {
    const file = resolve(SCHEMA_PATH, migrationStep, `${migrationDirection}.sql`);

    console.log(`Processing ${file}`);
    
    const sql = await readFile(file, { encoding: 'utf8' });

    database.exec(sql);
});

console.log('Migration complete');
