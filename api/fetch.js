export const config = {
    maxDuration: 60
};
const CACHE_TTL = 15 * 1000; // Cache max age for use
const cache = new Map();

// token rotate
let tokenIndex = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(o => o.trim())
        .filter(Boolean);

    const origin = req.headers.origin;

    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({ success: false, error: "Origin not allowed" });
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const referrerHeader = req.headers.referer || req.headers.origin;

    if (!referrerHeader) {
        return res.status(403).json({ success: false, error: "Missing referrer" });
    }

    let hostname;

    try {
        hostname = new URL(referrerHeader).hostname;
    } catch {
        return res.status(400).json({ success: false, error: "Invalid referrer" });
    }

    let tokens = [];
    if (hostname.startsWith("dev.")) {
        tokens = [
            process.env.DEV_API_KEY
        ].filter(Boolean);
    } else {
        tokens = [
            process.env.PROD_API_KEY,
            process.env.LISTING_DASHBOARD_API1,
            process.env.LISTING_DASHBOARD_API2,
            process.env.LISTING_DASHBOARD_API3,
        ].filter(Boolean);
    }
    if (tokens.length === 0) {
        return res.status(500).json({ success: false, error: "Missing API token" });
    }
    function getCurrentToken() {
        return tokens[tokenIndex];
    }
    function rotateToken() {
        tokenIndex = (tokenIndex + 1) % tokens.length;
        return getCurrentToken();
    }
    async function fetchWithRotation(url, options = {}) {
        const maxAttempts = tokens.length;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {

            const token = getCurrentToken();

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${token}`
                }
            });

            let data;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            const errorMessage =
                data?.message ||
                data?.error ||
                data?.errors?.[0]?.message ||
                "";

            const rateLimited =
                response.status === 429 ||
                errorMessage.includes("Too many requests");

            if (rateLimited) {
                rotateToken();

                if (attempt < maxAttempts - 1) {
                    await sleep(250);
                    continue;
                }
            }

            return { response, data };
        }

        throw new Error("All API tokens exhausted");
    }

    const route = req.query.route;

    if (!route || !["meta", "reports"].includes(route)) {
        return res.status(400).json({ success: false, error: "Invalid route" });
    }

    // Magical Cache
    const cacheKey = JSON.stringify({
        hostname,
        route,
        method: req.method,
        body: req.body || null
    });

    const cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
        res.setHeader('X-Fetch-Cache', 'HIT');
        return res.status(cached.status).json(cached.payload);
    }

    if (cached) {
        cache.delete(cacheKey);
    }

    let apiURL;

    try {
        if (route === "meta") {

            if (req.method !== "GET") {
                return res.status(405).json({ success: false, error: "Meta requires GET" });
            }

            //apiURL = `https://${hostname}/v1/reports/meta`;
            apiURL = `https://${hostname}/api/v1/reports/meta`;

            const { response, data } = await fetchWithRotation(apiURL, {
                method: "GET"
            });

            const payload = {
                success: response.ok,
                data
            };

            cache.set(cacheKey, {
                status: response.status,
                payload,
                expires: Date.now() + CACHE_TTL
            });

            res.setHeader('X-Fetch-Cache', 'MISS');
            return res.status(response.status).json(payload);

        }

        if (route === "reports") {

            if (req.method !== "POST") {
                return res.status(405).json({ success: false, error: "Reports require POST" });
            }

            apiURL = `https://${hostname}/api/v1/reports`;

            const body = req.body;

            if (!body || !body.type) {
                return res.status(400).json({ success: false, error: "Missing report type" });
            }

            const { response, data } = await fetchWithRotation(apiURL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                }
            );

            const payload = {
                success: response.ok,
                data
            };

            cache.set(cacheKey, {
                status: response.status,
                payload,
                expires: Date.now() + CACHE_TTL
            });

            res.setHeader('X-Fetch-Cache', 'MISS');
            return res.status(response.status).json(payload);
        }

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}