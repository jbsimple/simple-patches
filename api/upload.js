import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const filename = searchParams.get('filename') || 'upload.bin';

  const blob = await put(filename, req, {
    access: 'public',
  });

  res.status(200).json(blob);
}