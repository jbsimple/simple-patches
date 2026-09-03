const { get } = require('@vercel/edge-config');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-upload-password');

    if (req.method === 'OPTIONS') { return res.status(200).end(); }

    const key = Object.keys(req.query)[0];
    if (!key) { return res.status(400).json({error: 'Missing key'}); }

    // GET
    if (req.method === 'GET') {
        try {
            const value = await get(key);
            return res.status(200).json({key,value});
        } catch (err) {
            console.error('Edge Config error:', err);
            return res.status(500).json({error: 'Failed to fetch Edge Config'});
        }
    }

    // POST
    if (req.method === 'POST') {
        const password = req.headers['x-upload-password'];
        const correct = process.env.UPLOAD_SECRET;

        if (!password || password !== correct) { return res.status(401).json({error: 'Unauthorized'}); }
        try {
            const response = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG}/items`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({items: [{operation: 'upsert', key, value: req.body}]})
            });
            const result = await response.json();
            if (!response.ok) {
                console.error('Edge Config update error:', result);
                return res.status(response.status).json({error: 'Failed to update Edge Config', details: result});
            }
            return res.status(200).json({success: true, key, value: req.body});
        } catch (err) {
            console.error('Edge Config update error:', err);
            return res.status(500).json({error: 'Failed to update Edge Config'});
        }
    }

    return res.status(405).json({error: 'Method not allowed'});
};