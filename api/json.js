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
            const edgeConfigId = process.env.EDGE_CONFIG.match(/ecfg_[^?]+/)?.[0];
            const edgeConfigToken = new URL(process.env.EDGE_CONFIG).searchParams.get('token');
            
            const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${edgeConfigToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{
                        operation: 'upsert',
                        key: key,
                        value: req.body
                    }]
                })
            });

            const result = await response.json();
            if (!response.ok) {
                const error = {
                    error: 'Failed to update Edge Config',
                    request: {
                        'config_id': edgeConfigId,
                        'update_key': key,
                        'update_opr': 'update',
                        'value': req.body,
                        'value_type': typeof req.body,
                    },
                    details: result
                }

                console.error('Edge Config update error:', error);
                return res.status(response.status).json(error);
            }
            return res.status(200).json({success: true, key, value: req.body});
        } catch (err) {
            console.error('Edge Config update error:', err);
            return res.status(500).json({error: 'Failed to update Edge Config'});
        }
    }

    return res.status(405).json({error: 'Method not allowed'});
};