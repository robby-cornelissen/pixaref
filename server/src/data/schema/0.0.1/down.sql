BEGIN TRANSACTION;

ALTER TABLE ref
    ADD COLUMN type TEXT;

UPDATE ref
    SET type = (SELECT name AS type FROM type)
    WHERE ref.type_id IS NOT NULL;

ALTER TABLE ref
    DROP COLUMN type_id;

DROP TABLE type;

COMMIT;