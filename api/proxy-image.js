export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter.' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    console.error('Invalid URL:', url);
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  const isValidHost =
    (parsed.hostname === 'elog-cdn.s3.amazonaws.com') ||
    (parsed.hostname === 's3.amazonaws.com' && parsed.pathname.startsWith('/elog-cdn/'));

  if (!isValidHost) {
    console.error('Blocked host:', parsed.hostname);
    return res.status(403).json({ error: 'This host is not allowed.' });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error('Upstream fetch failed:', response.status, url);
      return res.status(response.status).json({ error: 'Failed to fetch image.' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.error('Non-image content type:', contentType);
      return res.status(415).json({ error: 'Only image content is allowed.' });
    }

    res.setHeader('Content-Type', contentType);

    response.body.pipe(res);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
}