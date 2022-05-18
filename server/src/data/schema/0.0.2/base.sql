CREATE TABLE IF NOT EXISTS type (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS ref (
    id INTEGER PRIMARY KEY,
    hash TEXT UNIQUE NOT NULL,
    mime TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    alpha INTEGER NOT NULL,
    opaque INTEGER NOT NULL,
    luminance INTEGER NOT NULL,
    title TEXT,
    type_id INTEGER REFERENCES type(id) ON DELETE SET NULL,
    year INTEGER,
    created STRING NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created STRING NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ref_tag (
    ref_id INTEGER NOT NULL REFERENCES ref(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (ref_id, tag_id)
);
