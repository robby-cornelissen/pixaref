BEGIN TRANSACTION;

CREATE TABLE type (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
);

INSERT INTO type (name)
    SELECT DISTINCT type AS name FROM ref WHERE type IS NOT NULL; 

ALTER TABLE ref
    ADD COLUMN type_id INTEGER REFERENCES type(id) ON DELETE SET NULL;

UPDATE ref
    SET type_id = (SELECT id FROM type WHERE type.name = ref.type)
    WHERE type IS NOT NULL;

ALTER TABLE ref
    DROP COLUMN type;

COMMIT;