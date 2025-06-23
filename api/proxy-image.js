export default async function handler(req, res) {
	const { url } = req.query;

	if (!url) {
		return res.status(400).json({
			error: 'Missing URL parameter.'
		});
	}

	try {
		const parsed = new URL(url);

		const isValidHost =
			(parsed.hostname === 'elog-cdn.s3.amazonaws.com') ||
			(parsed.hostname === 's3.amazonaws.com' && parsed.pathname.startsWith('/elog-cdn/'));

		if (!isValidHost) {
			return res.status(403).json({
				error: 'This host is not allowed.'
			});
		}

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0',
			},
		});

		if (!response.ok) {
			return res.status(response.status).json({
				error: 'Failed to fetch image.'
			});
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';

		if (!contentType.startsWith('image/')) {
			return res.status(415).json({ error: 'Only image content is allowed.' });
		}

		res.setHeader('Content-Type', contentType);
		response.body.pipe(res);
	} catch (err) {
		console.error('Proxy Error:', err);
		res.status(500).json({
			error: 'Internal server error.'
		});
	}
}