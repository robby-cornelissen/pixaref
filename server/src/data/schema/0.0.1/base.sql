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
    type TEXT,
    year INTEGER,
    created STRING NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created STRING NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ref_tag (
    ref_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (ref_id, tag_id),
    FOREIGN KEY (ref_id) REFERENCES ref(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);