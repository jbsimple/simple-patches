import { sql } from '../lib/db.js';

function unwrapValue(value) { return Array.isArray(value) && value.length === 1 ? value[0] : value; }

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-upload-password");

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    const origin = req.headers.origin;
    if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); }

    if (req.method === 'OPTIONS') { return res.status(204).end(); }

    if (!origin || !allowedOrigins.includes(origin)) { return res.status(403).json({ success: false, error: "Origin not allowed" }); }

    const password = req.headers['x-upload-password'];
    const correct = process.env.UPLOAD_SECRET;
    if (!password || password !== correct) { return res.status(401).json({ success: false, error: 'Unauthorized' }); }

    if (req.method === 'GET') {
        try {
            const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
            const item = searchParams.get('item');
            const person = searchParams.get('person');
            const date = searchParams.get('date');

            const limitParam = searchParams.get('limit');
            const rawLimit = Number(limitParam);
            const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 500) : 20;

            // building sql
            const conditions = [];
            const values = [];
            if (item) {
                values.push(item);
                conditions.push(`item = $${values.length}`);
            }
            if (person) {
                values.push(person);
                conditions.push(`person = $${values.length}`);
            }
            if (date) {
                values.push(date);
                conditions.push(`to_char(timestamp AT TIME ZONE 'America/New_York', 'YYYY-MM-DD') = $${values.length}`);
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const query = `
                SELECT item, count, notes, person, to_char(timestamp AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') AS timestamp
                FROM neon_auth.picture_tracking
                ${whereClause}
                ORDER BY id DESC
                LIMIT ${limit}
            `;
            
            const logs = await sql.query(query, values);
            const data = logs;
            return res.status(200).json({ success: true, data});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to fetch logs' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { item, count, notes, person } = req.body;
            if (!item) { return res.status(400).json({ success: false, error: 'A item is required.' }); }
            if (!count || count <= 0) { return res.status(400).json({ success: false, error: 'A count is required.' }); }
            if (!person) { return res.status(400).json({ success: false, error: 'A person is required.' }); }
            const result = await sql`INSERT INTO neon_auth.picture_tracking (item, count, notes, person) VALUES (${item}, ${count}, ${notes ?? ''}, ${person}) RETURNING id`;
            const response = result[0];
            return res.status(201).json({ success: true, response});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to create log' });
        }
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
}