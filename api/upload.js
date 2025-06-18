import { put } from '@vercel/blob';

export default async function handler(req, res) {
    const password = req.headers['x-upload-password'];
    const correct = process.env.UPLOAD_SECRET;

    if (!password || password !== correct) {
        return res.status(401).json(
            { 
                error: 'Unauthorized',
                temp: process.env.UPLOAD_SECRET
            });
    }

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const filename = searchParams.get('filename') || 'upload.bin';

    try {
        const blob = await put(filename, req, {
            access: 'public',
        });

        return res.status(200).json({ url: blob.url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Upload failed' });
    }
}
