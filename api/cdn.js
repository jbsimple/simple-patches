import { list, put } from '@vercel/blob';

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-upload-password");

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    const origin = req.headers.origin;
    if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); }

    if (req.method === 'OPTIONS') { return res.status(204).end(); }

    if (!origin || !allowedOrigins.includes(origin)) { return res.status(403).json({ success: false, error: "Origin not allowed" }); }

    if (req.method === 'GET') {
        try {
            let cursor;
            let allBlobs = [];

            do {
                const result = await list({cursor, limit: 1000});

                allBlobs = allBlobs.concat(result.blobs);
                cursor = result.hasMore ? result.cursor : undefined;
            } while (cursor);

            return res.status(200).json({ blobs: allBlobs, count: allBlobs.length });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Listing failed' });
        }
    }

    if (req.method === 'POST') {
        const password = req.headers['x-upload-password'];
        const correct = process.env.UPLOAD_SECRET;
        if (!password || password !== correct) { return res.status(401).json({ error: 'Unauthorized' }); }

        const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
        const filename = searchParams.get('filename') || 'upload.bin';

        try {
            const blob = await put(filename, req, {access: 'public',});
            return res.status(200).json({ url: blob.url });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Upload failed' });
        }
    }
}