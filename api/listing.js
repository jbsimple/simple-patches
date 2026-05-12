export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") { return res.status(200).end(); }
    if (req.method !== "GET") { return res.status(405).json({ success: false, error: "Invalid Method, GET required." }); }

    if (!req.query.key || req.query.key !== process.env.listing_dashboard_key) { return res.status(403).json({ success: false, error: "Invalid access key." }); }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    if (allowedOrigins.length === 0) { return res.status(500).json({ success: false, error: "No allowed origins configured" }); }
    let apiURL = `${allowedOrigins[0]}/api/v1/reports`;

    const token = process.env.PROD_API_KEY ?? null;
    if (!token) { return res.status(500).json({ success: false, error: "Missing API token" }); }

    let api_errors = [];

    try {

        const [in_stock, no_stock] = await Promise.all([
            fetchSet("gte", 1),
            fetchSet("lte", 0)
        ]);

        const items = [...in_stock, ...no_stock];

        return res.status(200).json({
            success: (api_errors.length === 0),
            errors: api_errors,
            items,
            count: items.length,
            rel: allowedOrigins[0],
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }

    async function fetchSet(operator, value, limit = 1000) {
        let page = 1;
        let has_more = false;
        let data = [];
        do {
            const result = await fetchPage(operator, 1, page);
            if (Array.isArray(result.data)) { data.push(...result.data); }
            has_more = result?.meta?.has_more === true;
            page++;
        } while (has_more);

        return data;
    }

    async function fetchPage(operator, value, page, limit = 1000) {
        const body = {
            type: "active_inventory",
            page: page,
            per_page: limit,
            filters: [
                {
                    "field": "product_items.in_stock",
                    "operator": operator,
                    "value": value
                }
            ],
            columns: ["products.sid","products.name","product_items.id","product_items.sku","conditions.name","product_items.condition_id","product_items.title","products.description","first_image","product_items.available","product_items.in_stock","product_items.price","product_items.min_price","product_items.max_price","product_items.bulk_price","product_items.seller_price","products.msrp","product_items.location","brands.name","products.brand_id","categories.name","products.category_id","categories.type","products.weight","products.mpn","products.gtin","products.asin","products.dimensions","product_items.store_settings","products.specs","product_items.flags","product_items.is_scrap","product_items.has_fba","product_items.status","product_items.sold_at","product_items.priced_at","product_items.created_at","product_items.updated_at"]
        };

        try {
            const response = await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            let json = null;

            try {
                json = await response.json();
            } catch (err) {
                api_errors.push({ page, operator, value, status: response.status,error: "Invalid JSON response" });
                return { data: [], meta: { has_more: false } };
            }

            if (!response.ok) {
                api_errors.push({ page, operator, value, status: response.status, response: json });
                return { data: [], meta: { has_more: false } }; }
            return json;

        } catch (err) {
            api_errors.push({ page, operator, value, error: err.message });
            return { data: [], meta: { has_more: false } };
        }
        
    }
}