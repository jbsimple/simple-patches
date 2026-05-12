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

    let apiURL;

    try {
        switch (req.query.route) {
            case "meta":
                if (req.method !== "GET") { return res.status(405).json({ success: false, error: "Meta requires GET" }); }
                //apiURL = `https://${hostname}/v1/reports/meta`;
                apiURL = `https://${hostname}/api/v1/reports/meta`;
                const response = await fetch(apiURL, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                return res.status(response.status).json({ success: response.ok, data });
                break;
            case "reports":
                if (req.method !== "POST") { return res.status(405).json({ success: false, error: "Reports require POST" }); }
                apiURL = `https://${hostname}/api/v1/reports`;
                const body = req.body;
                if (!body || !body.type) { return res.status(400).json({ success: false, error: "Missing report type" }); }
                const response = await fetch(apiURL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                return res.status(response.status).json({ success: response.ok, data });
                break;
            case "items":
                if (req.method !== "POST") { return res.status(405).json({ success: false, error: "Reports require POST" }); }
                apiURL = `https://${hostname}/api/v1/reports`;
                let data = [];
                let page = 1;
                let has_more = false;
                do {
                    const result = await products_page(page);
                    if (Array.isArray(result.data)) { data.push(...result.data); }
                    has_more = result?.meta?.has_more === true;
                    page++;
                } while (has_more);
                return res.status(200).json({ success: true, total: data.length, data});
                async function products_page(page, per_page = 1000) {
                    const body = {
                        type: "active_inventory",
                        page: page,
                        per_page: per_page,
                        filters: [
                            {
                                "field": "product_items.in_stock",
                                "operator": "gte",
                                "value": "-10000"
                            }
                        ],
                        columns: ["products.sid","products.name","product_items.id","product_items.sku","conditions.name","product_items.condition_id","product_items.title","products.description","first_image","product_items.available","product_items.in_stock","product_items.price","product_items.min_price","product_items.max_price","product_items.bulk_price","product_items.seller_price","products.msrp","product_items.location","brands.name","products.brand_id","categories.name","products.category_id","categories.type","products.weight","products.mpn","products.gtin","products.asin","products.dimensions","product_items.store_settings","products.specs","product_items.flags","product_items.is_scrap","product_items.has_fba","product_items.status","product_items.sold_at","product_items.priced_at","product_items.created_at","product_items.updated_at"]
                    };

                    const response = await fetch(apiURL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(body)
                    });
                    return await response.json();
                }
                break;
            default:
                return res.status(400).json({ success: false, error: "Invalid route" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}