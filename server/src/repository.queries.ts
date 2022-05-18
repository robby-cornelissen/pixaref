export const queries={
    selectRef: `
        SELECT r.id, r.hash, r.mime, r.width, r.height, r.alpha, r.opaque, r.luminance, r.title, ty.name AS type, r.year, GROUP_CONCAT(t.name) AS tags
        FROM ref r
        LEFT JOIN type ty ON ty.id=r.type_id
        LEFT JOIN ref_tag rt ON rt.ref_id=r.id
        LEFT JOIN tag t ON t.id=rt.tag_id
        WHERE r.id=@id
        GROUP BY r.id, r.hash, r.mime, r.width, r.height, r.alpha, r.opaque, r.luminance, r.title, ty.name, r.year
    `,
    selectRefs: `
        SELECT r.id, r.hash, r.mime, r.width, r.height, r.alpha, r.opaque, r.luminance, r.title, ty.name AS type, r.year, GROUP_CONCAT(t.name) AS tags
        FROM ref r
        LEFT JOIN type ty ON ty.id=r.type_id
        LEFT JOIN ref_tag rt ON rt.ref_id=r.id
        LEFT JOIN tag t ON t.id=rt.tag_id
        GROUP BY r.id, r.hash, r.mime, r.width, r.height, r.alpha, r.opaque, r.luminance, r.title, ty.name, r.year
        ORDER BY r.created DESC
    `,
    selectRefHashes: `
        SELECT r.hash
        FROM ref r
    `,
    insertRef: `
        INSERT INTO ref (hash, mime, width, height, alpha, opaque, luminance, title, type_id, year)
        VALUES (
            @hash,
            @mime,
            @width,
            @height,
            @alpha,
            @opaque,
            @luminance,
            @title,
            (SELECT id FROM type WHERE type.name=@type),
            @year
        )
        RETURNING id
    `,
    updateRef: `
        UPDATE ref
        SET
            hash=@hash,
            mime=@mime,
            width=@width,
            height=@height,
            alpha=@alpha,
            opaque=@opaque,
            luminance=@luminance,
            title=@title,
            type_id=(SELECT id FROM type WHERE type.name=@type),
            year=@year
        WHERE id=@id
    `,
    deleteRef: `
        DELETE FROM ref WHERE id=@id
    `,
    selectTag: `
        SELECT id FROM tag WHERE name=@name
    `,
    selectTags: `
        SELECT name FROM tag
        ORDER BY name
    `,
    insertTag: `
        INSERT OR IGNORE INTO tag (name)
        VALUES (@name)
        RETURNING id
    `,
    deleteTagIfUnused: `
        DELETE FROM tag
        WHERE name=@name
        AND NOT EXISTS (
            SELECT 1 FROM ref_tag rt 
            WHERE rt.tag_id=tag.id
        )
        RETURNING id
    `,
    insertRefTag: `
        INSERT INTO ref_tag (ref_id, tag_id)
        VALUES (@refId, @tagId)
    `,
    deleteRefTag: `
        DELETE FROM ref_tag
        WHERE ref_id=@refId
        AND tag_id IN (
            SELECT t.id FROM tag t
            WHERE t.name=@name
        )
    `,
    selectType: `
        SELECT id, name, icon FROM type
        WHERE id=@id
    `,
    selectTypes: `
        SELECT id, name, icon FROM type
        ORDER by name
    `,
    insertType: `
        INSERT OR IGNORE INTO type (name, icon)
        VALUES (@name, @icon)
        RETURNING id
    `,
    updateType: `
        UPDATE type
        SET
            name=@name,
            icon=@icon
        WHERE id=@id
    `,
    deleteType: `
        DELETE FROM type WHERE id=@id
    `
} as const;