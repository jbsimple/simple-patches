export const config = { maxDuration: 60 };
const CACHE_TTL = 2 * 1000; // Cache max age for use, lowered to 2s
const cache = new Map();

export default async function handler(req, res) {

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) { return res.status(403).json({ success: false, error: "Origin not allowed" }); }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") { return res.status(200).end(); }
    if (!["GET", "POST"].includes(req.method)) { return res.status(405).json({ success: false, error: "Method not allowed" }); }

    const referrerHeader = req.headers.referer || req.headers.origin;
    if (!referrerHeader) { return res.status(403).json({ success: false, error: "Missing referrer" });}

    const route = req.query.route;
    if (!route || !["meta", "reports"].includes(route)) { return res.status(400).json({ success: false, error: "Invalid route" }); }

    let hostname;
    try {
        hostname = new URL(referrerHeader).hostname;
    } catch {
        return res.status(400).json({ success: false, error: "Invalid referrer" });
    }

    // magical token rotation
    let tokens = hostname.startsWith("dev.") ? [process.env.DEV_API_KEY] : [process.env.PROD_API_KEY, process.env.LISTING_DASHBOARD_API1, process.env.LISTING_DASHBOARD_API2, process.env.LISTING_DASHBOARD_API3];
    tokens = tokens.filter(Boolean);
    if (!tokens.length) { return res.status(500).json({ success: false, error: "Missing API token" }); }

    // Magical Cache
    const cacheKey = JSON.stringify({hostname, route, method: req.method, body: req.body || null});
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
        res.setHeader('X-Fetch-Cache', 'HIT');
        return res.status(cached.status).json(cached.payload);
    }
    if (cached) { cache.delete(cacheKey); }

    // this handles request to api
    async function apiRequest(cacheKey, apiURL, tokens, method, body = null) {
        let response;

        // always use the first one, fall back to other tokens if rate limit hits (because I am evil)
        for (const token of tokens) {
            const request = {
                method,
                headers: { "Authorization": `Bearer ${token}` }
            };

            if (body) {
                request.headers["Content-Type"] = "application/json";
                request.body = JSON.stringify(body);
            }

            response = await fetch(apiURL, request);
            if (response.status !== 429) { break; }
        }

        // super safe parse
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        const result = {
            status: response.status,
            payload: { success: response.ok, data },
            cache: "MISS"
        };

        if (response.ok) {
            cache.set(cacheKey, {
                status: result.status,
                payload: result.payload,
                expires: Date.now() + CACHE_TTL
            });
        }

        return result;
    }

    // this handles the request from user
    try {
        if (route === "meta") {
            if (req.method !== "GET") { return res.status(405).json({ success: false, error: "Meta requires GET" }); }

            const { status, payload, cache: cacheStatus } = await apiRequest(cacheKey, `https://${hostname}/api/v1/reports/meta`, tokens, "GET");
            res.setHeader("X-Fetch-Cache", cacheStatus);
            return res.status(status).json(payload);
        }

        if (route === "reports") {
            if (req.method !== "POST") { return res.status(405).json({ success: false, error: "Reports require POST" }); }

            const body = req.body;
            if (!body || !body.type) { return res.status(400).json({ success: false, error: "Missing report type" }); }

            const { status, payload, cache: cacheStatus } = await apiRequest(cacheKey, `https://${hostname}/api/v1/reports`, tokens, "POST", body);
            res.setHeader("X-Fetch-Cache", cacheStatus);
            return res.status(status).json(payload);
        }

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}