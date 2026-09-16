import { list, put, copy, del, head } from '@vercel/blob';
export const config = {
    api: {bodyParser: false}
};


async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) { chunks.push(chunk); }
    const raw = Buffer.concat(chunks).toString('utf-8');
    return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-upload-password, x-filename");

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    const origin = req.headers.origin;
    if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); }

    if (req.method === 'OPTIONS') { return res.status(204).end(); }

    if (!origin || !allowedOrigins.includes(origin)) { return res.status(403).json({ success: false, error: "Origin not allowed", origin }); }

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

        const fname_def = 'upload.bin';

        const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
        const action = searchParams.get('action');

        if (action === 'upload') {
            let filename = req.headers['x-filename'] || fname_def;
            if (filename !== fname_def) {
                filename = filename.split(/[\\/]/).pop();
                filename = filename.replace(/^\.+/, '');
                filename = filename.replace(/[^a-zA-Z0-9._\- ]/g, '_');
                filename = filename.replace(/\.{2,}/g, '.');
                if (filename.length > 200) {
                    const dot = filename.lastIndexOf('.');
                    const ext = dot > -1 ? filename.slice(dot) : '';
                    filename = filename.slice(0, 200 - ext.length) + ext;
                }
                filename = filename || fname_def;
            }

            try {
                const blob = await put(filename, req, {access: 'public',});
                return res.status(200).json({ url: blob.url });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Upload failed' });
            }
        }

        if (action === 'delete') {
            try {
                const { url } = await readJsonBody(req);
                if (!url) { return res.status(400).json({ error: 'Missing url in body' }); }
                await del(url);
                return res.status(200).json({ success: true, deleted: url });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Delete failed' });
            }
        }

        if (action === 'rename') {
            try {
                let { fromUrl, newFilename } = await readJsonBody(req);
                if (!fromUrl || !newFilename) { return res.status(400).json({ error: 'Missing fromUrl or newFilename in body' }); }
                newFilename = newFilename.split(/[\\/]/).pop();
                newFilename = newFilename.replace(/^\.+/, '');
                newFilename = newFilename.replace(/[^a-zA-Z0-9._\- ]/g, '_');
                newFilename = newFilename.replace(/\.{2,}/g, '.');
                if (newFilename.length > 200) {
                    const dot = newFilename.lastIndexOf('.');
                    const ext = dot > -1 ? newFilename.slice(dot) : '';
                    newFilename = newFilename.slice(0, 200 - ext.length) + ext;
                }
                newFilename = newFilename || fname_def;

                const original = await head(fromUrl);
                const dir = original.pathname.includes('/') ? original.pathname.slice(0, original.pathname.lastIndexOf('/') + 1) : '';
                const newPathname = dir + newFilename;

                const newBlob = await copy(fromUrl, newPathname, { access: original.access });
                await del(fromUrl);
                return res.status(200).json({ url: newBlob.url });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Rename failed' });
            }
        }

        return res.status(400).json({ error: 'Unknown action' });
    }
}