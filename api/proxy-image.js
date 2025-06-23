export default async function handler(req, res) {
	const { url, filename } = req.query;

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
			headers: { 'User-Agent': 'Mozilla/5.0', },
		});

		if (!response.ok) {
			console.error('Upstream fetch failed:', response.status, url);
			return res.status(response.status).json({
				error: 'Failed to fetch image.'
			});
		}

		const contentType = response.headers.get('content-type') || '';
		if (!contentType.startsWith('image/')) {
			console.error('Non-image content type:', contentType);
			return res.status(415).json({ error: 'Only image content is allowed.' });
		}

		const buffer = Buffer.from(await response.arrayBuffer());

        // goodbye cors!
        // might need to eliminate other domains from scraping this?
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Length', buffer.length);

		let finalFilename = filename ?? '';
        if (!finalFilename || finalFilename === '') {
            const pathPart = parsed.pathname.split('/').pop();
            const hasExtension = pathPart && pathPart.includes('.');
            const ext = (pathPart?.split('.').pop().split('?')[0] || '').toLowerCase();
            const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';

            if (hasExtension) {
                finalFilename = pathPart;
            } else {
                finalFilename = `${Date.now()}.${safeExt}`;
            }
        }
        res.setHeader('Content-Disposition', `inline; filename="${finalFilename}"`);

		res.status(200).send(buffer);
	} catch (err) {
		console.error('Proxy error:', err);
		res.status(500).json({
			error: 'Internal server error.',
			details: err.message
		});
	}
}