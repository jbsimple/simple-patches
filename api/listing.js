export const config = {
    maxDuration: 60
};

// magical cache
const CACHE_TTL = 60 * 1000;
const resultCache = new Map();
const inflightCache = new Map();

export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") { return res.status(200).end(); }

    if (req.method !== "GET") { return res.status(405).json({ success: false, error: "Invalid Method, GET required." }); }
    
    if (!req.query.key || req.query.key !== process.env.listing_dashboard_access) { return res.status(403).json({ success: false, error: "Invalid access key." }); }

    const type = req.query.type ?? null;
    if (!type || type === '') { return res.status(405).json({ success: false, error: "Please provide a type." }); }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    if (allowedOrigins.length === 0) { return res.status(500).json({ success: false, error: "Missing allowed origins list." }); }
    const apiURL = `${allowedOrigins[0]}/api/v1/reports`;

    const tokens = [
        process.env.PROD_API_KEY,
        process.env.LISTING_DASHBOARD_API1,
        process.env.LISTING_DASHBOARD_API2,
        process.env.LISTING_DASHBOARD_API3,
    ].filter(Boolean);
    if (tokens.length === 0) { return res.status(500).json({ success: false, error: "Missing API token(s)" }); }
    let tokenIndex = 0;
    function getCurrentToken() { return tokens[tokenIndex]; }
    function rotateToken() {
        tokenIndex = (tokenIndex + 1) % tokens.length;
        return getCurrentToken();
    }
    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    let api_errors = [];
    try {
        const cacheKey = type;
        const cached = resultCache.get(cacheKey);
        if (cached) {
            if ((Date.now() - cached.created) < CACHE_TTL) { return res.status(200).json({ ...cached.data, cache: true }); }
            resultCache.delete(cacheKey);
        }

        if (inflightCache.has(cacheKey)) {
            const sharedResult = await inflightCache.get(cacheKey);
            return res.status(200).json({ ...sharedResult, shared: true });
        }

        const requestPromise = (async () => {
            let items = [];
            switch (type) {
                case "gte":
                    items = await fetchSet("gte", 1);
                    break;
                case "lte":
                    items = await fetchSet("lte", 0);
                    break;
                default:
                    throw new Error("Invalid type.");
            }
            const result = { success: (api_errors.length === 0), errors: api_errors, items, count: items.length, rel: allowedOrigins[0] };
            resultCache.set(cacheKey, { created: Date.now(), data: result });
            return result;
        })();
        inflightCache.set(cacheKey, requestPromise);
        try {
            const result = await requestPromise;
            return res.status(200).json(result);
        } finally {
            inflightCache.delete(cacheKey);
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }

    async function fetchSet(operator, value, limit = 1000) {
        let page = 1;
        let has_more = false;
        let data = [];
        do {
            const result = await fetchPage(operator, value, page, limit);
            if (Array.isArray(result.data)) { data.push(...result.data); }
            has_more = result?.meta?.has_more === true;
            page++;
            if (has_more) { await sleep(1000); }
        } while (has_more);
        return data;
    }

    async function fetchPage(operator, value, page, limit = 1000, retries = tokens.length * 3) {
        const body = {
            type: "active_inventory",
            page: page,
            per_page: limit,
            filters: [
                {
                    field: "product_items.in_stock",
                    operator: operator,
                    value: value
                }
            ],
            columns: ["products.sid","products.name","product_items.id","product_items.sku","conditions.name","product_items.condition_id","product_items.title","products.description","first_image","product_items.available","product_items.in_stock","product_items.price","product_items.min_price","product_items.max_price","product_items.bulk_price","product_items.seller_price","products.msrp","product_items.location","brands.name","products.brand_id","categories.name","products.category_id","categories.type","products.weight","products.mpn","products.gtin","products.asin","products.dimensions","product_items.store_settings","products.specs","product_items.flags","product_items.is_scrap","product_items.has_fba","product_items.status","product_items.sold_at","product_items.priced_at","product_items.created_at","product_items.updated_at"]
        };

        let attempt = 0;
        while (attempt < retries) {
            const token = getCurrentToken();
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
                    api_errors.push({ page, operator, value, token_index: tokenIndex, status: response.status, error: "Invalid JSON response" });
                    return { data: [], meta: { has_more: false } };
                }

                if (response.status === 429) {
                    api_errors.push({ page, operator, value, token_index: tokenIndex, status: 429, error: "Rate limited, rotating token" });
                    rotateToken();
                    attempt++;
                    await sleep(1000);
                    continue;
                }

                if (!response.ok) {
                    api_errors.push({ page, operator, value, token_index: tokenIndex, status: response.status, response: json });
                    return { data: [], meta: { has_more: false } };
                }

                return json;
            } catch (err) {
                api_errors.push({ page, operator, value, token_index: tokenIndex, error: err.message });
                rotateToken();
                attempt++;
                await sleep(1000);
            }
        }

        api_errors.push({ page, operator, value, error: "Retry limit exceeded" });
        return { data: [], meta: { has_more: false } }; }
}