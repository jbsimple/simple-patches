import { sql } from '../lib/db.js';

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
            const name = searchParams.get('name');
            if (!name) { return res.status(400).json({ success: false, error: 'A "name" query parameter is required' }); }
            
            const logs = await sql`SELECT value, to_char(timestamp AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') AS timestamp FROM neon_auth.logs WHERE name = ${name} ORDER BY id DESC`;
            return res.status(200).json({ success: true, data: logs});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to fetch logs' });
        }
    }
    if (req.method === 'POST') {
        try {
            const { name, value } = req.body;
            if (!name) { return res.status(400).json({ success: false, error: 'A logging name is required' }); }
            const result = await sql`INSERT INTO neon_auth.logs (name, value) VALUES (${name}, ${JSON.stringify(value ?? [])}) RETURNING id, name, value, to_char(timestamp AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') AS timestamp`;
            return res.status(201).json({ success: true, response: result[0]});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to create log' });
        }
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
}