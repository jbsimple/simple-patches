export default async function handler(req, res) {

    const origin = req.headers.origin;
    if (!origin) { return res.status(403).json({ success: false, error: "Missing origin" }); }
    let originHost;
    try {
        originHost = new URL(origin).host;
    } catch {
        return res.status(400).json({ success: false, error: "Invalid origin" });
    }

    const host = req.headers.host;
    if (originHost !== host) { return res.status(403).json({ success: false, error: "Cross-origin blocked" }); }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") { return res.status(200).end(); }

    if (!req.query.key || req.query.key !== process.env.listing_dashboard_key) { return res.status(403).json({ success: false, error: "Invalid access key." }); }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    if (allowedOrigins.length === 0) { return res.status(500).json({ success: false, error: "No allowed origins configured" }); }
    let apiURL = `${allowedOrigins[0]}/api/v1/reports`;

    const token = process.env.PROD_API_KEY ?? null;
    if (!token) { return res.status(500).json({ success: false, error: "Missing API token" }); }

    if (req.method !== "GET") { return res.status(405).json({ success: false, error: "Invalid Method, GET required." }); }

    try {

        let data = [];
        let page = 1;
        let has_more = false;

        do {
            const result = await fetchPage(page);
            if (Array.isArray(result.data)) { data.push(...result.data); }
            has_more = result?.meta?.has_more === true;
            page++;
        } while (has_more);

        return res.status(200).json({
            success: true,
            total: data.length,
            rel: allowedOrigins[0],
            data
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }

    async function fetchPage(page, limit = 1000) {
        const body = {
            type: "active_inventory",
            page: page,
            per_page: limit,
            filters: [
                {
                    "field": "product_items.in_stock",
                    "operator": "gte",
                    "value": "-1000"
                }
            ],
            columns: ["products.sid","products.name","product_items.id","product_items.sku","conditions.name","product_items.condition_id","product_items.title","products.description","first_image","product_items.available","product_items.in_stock","product_items.price","product_items.min_price","product_items.max_price","product_items.bulk_price","product_items.seller_price","products.msrp","product_items.location","brands.name","products.brand_id","categories.name","products.category_id","categories.type","products.weight","products.mpn","products.gtin","products.asin","products.dimensions","product_items.store_settings","products.specs","product_items.flags","product_items.is_scrap","product_items.has_fba","product_items.status","product_items.sold_at","product_items.priced_at","product_items.created_at","product_items.updated_at"]
        };

        const response = await fetch(apiURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) { throw new Error(`API request failed: ${response.status}`); }
        return await response.json();
    }
}