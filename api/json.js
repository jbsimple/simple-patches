const { get } = require('@vercel/edge-config');

module.exports = async (req, res) => {
    const key = Object.keys(req.query)[0];

    if (!key) {
        res.status(400).json({ error: 'Missing key' });
        return;
    }

    try {
        const value = await get(key);
        res.status(200).json({ key, value });
    } catch (err) {
        console.error('Edge Config error:', err);
        res.status(500).json({ error: 'Failed to fetch Edge Config' });
    }
};