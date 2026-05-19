import { sql } from './db.js';

export async function writeJS(table, items, conflictKey) {

    if (!Array.isArray(items) || items.length === 0) { return []; }

    /*  
    *   This will work for any database that has a unique key setup for a column.
    *   Will try to add new lines unless unique key exists, then it will update.
    */

    const columnResult = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${table}
    `;

    const dbColumns = columnResult.map(row => row.column_name);
    const results = [];
    for (const item of items) {
        const columns = Object.keys(item) .filter(key => dbColumns.includes(key));
        if (columns.length === 0) { continue; }
        const values = columns.map(col => item[col]);
        const columnSQL = columns.map(col => `"${col}"`).join(', ');
        const valueSQL = values.map((_, i) => `$${i + 1}`).join(', ');
        const updateSQL = columns.filter(col => col !== conflictKey).map(col => `"${col}" = EXCLUDED."${col}"`).join(', ');

        const query = `
            INSERT INTO "${table}" (${columnSQL})
            VALUES (${valueSQL})
            ON CONFLICT ("${conflictKey}")
            DO UPDATE SET
                ${updateSQL}
            RETURNING *
        `;

        const result = await sql.query(query, values);

        results.push(result.rows[0]);
    }

    return results;
}