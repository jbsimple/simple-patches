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

    let token = hostname.startsWith("dev.")
        ? process.env.DEV_API_KEY
        : process.env.PROD_API_KEY;

    if (!token) {
        return res.status(500).json({ success: false, error: "Missing API token" });
    }

    const route = req.query.route;

    if (!route || !["meta", "reports"].includes(route)) {
        return res.status(400).json({ success: false, error: "Invalid route" });
    }

    let apiURL;

    try {
        if (route === "meta") {

            if (req.method !== "GET") {
                return res.status(405).json({ success: false, error: "Meta requires GET" });
            }

            //apiURL = `https://${hostname}/v1/reports/meta`;
            apiURL = `https://${hostname}/api/v1/reports/meta`;

            const response = await fetch(apiURL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            return res.status(response.status).json({
                success: response.ok,
                data
            });
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

            const response = await fetch(apiURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            return res.status(response.status).json({
                success: response.ok,
                data
            });
        }

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}