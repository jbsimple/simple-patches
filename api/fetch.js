export default async function handler(req, res) {

    if (req.method !== 'GET') {
        return res.status(405).json({success: false, error: 'Method not allowed' });
    }

    try {;
        const referrerHeader = req.headers.referer || req.headers.origin;
        if (!referrerHeader) {
            return res.status(403).json({success: false, error: 'Missing referrer'});
        }

        let referrer;
        try {
            referrer = new URL(referrerHeader).hostname;
        } catch {
            return res.status(400).json({success: false, error: 'Invalid referrer' });
        }

        if (!referrer.endsWith(process.env.ALLOWED_DOMAIN)) {
            return res.status(403).json({success: false, error: 'Unauthorized domain'});
        }

        let token = '';
        if (referrer.includes('dev')) {
            token = process.env.DEV_API_KEY;
        } else {
            token = process.env.PROD_API_KEY;
        }

        if (!token) {
            return res.status(500).json({success: false, error: 'Missing API token' });
        }

        const endpoint = req.query.endpoint;
        if (!endpoint) {
            return res.status(400).json({ success:false, error:'Missing endpoint' });
        }

        const params = { ...req.query };
        delete params.endpoint;

        const query = new URLSearchParams(params).toString();

        const apiURL = `https://${hostname}/api/v1/reports/${endpoint}${query ? '?' + query : ''}`;
        

        const response = await fetch(apiURL, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    error: "API request failed"
                });
            }

        const data = await response.json();

        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            error: err.message
        });

    }

}