export default async function handler(req, res) {

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(o => o.trim())
        .filter(Boolean);

    const origin = req.headers.origin;

    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({ success:false, error:"Origin not allowed" });
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ success:false, error:"Method not allowed" });
    }

    const referrerHeader = req.headers.referer || req.headers.origin;

    if (!referrerHeader) {
        return res.status(403).json({ success:false, error:"Missing referrer" });
    }

    let hostname;

    try {
        hostname = new URL(referrerHeader).hostname;
    } catch {
        return res.status(400).json({ success:false, error:"Invalid referrer" });
    }

    let token;

    if (hostname.startsWith("dev.")) {
        token = process.env.DEV_API_KEY;
    } else {
        token = process.env.PROD_API_KEY;
    }

    if (!token) {
        return res.status(500).json({ success:false, error:"Missing API token" });
    }

    const endpoint = req.query.endpoint;

    if (!endpoint) {
        return res.status(400).json({ success:false, error:"Missing endpoint" });
    }

    const allowedEndpoints = ["orders", "returns", "refunds"];

    if (!allowedEndpoints.includes(endpoint)) {
        return res.status(403).json({ success:false, error:"Endpoint not allowed" });
    }

    const params = { ...req.query };
    delete params.endpoint;

    const query = new URLSearchParams(params).toString();

    const apiURL = `https://${hostname}/api/v1/reports/${endpoint}${query ? "?" + query : ""}`;

    try {

        const response = await fetch(apiURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        return res.status(response.status).json({
            success: response.ok,
            data
        });

    } catch (err) {

        return res.status(500).json({
            success:false,
            error:err.message
        });

    }
}