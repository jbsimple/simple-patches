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

        // neondb integration to-do
        // lte and gte will reference neondb
        // cron job to update neondb with gte and lte items to-do
        // resolve button in panel will run type=id, which will update the neondb with fresh data 

        const requestPromise = (async () => {
            let items = [];
            switch (type) { // idea is that views will be added here
                case "hvi": // all stock 1000qty+
                    items = await itemSet([
                        {
                            field: "product_items.in_stock",
                            operator: "gte",
                            value: 1000
                        }
                    ]);
                    break;
                case "ovs": // all oversells
                    items = await itemSet([
                        {
                            field: "product_items.in_stock",
                            operator: "lte",
                            value: -1
                        }
                    ]);
                    break;
                case "id": // single for quick updates
                    const item_id = parseInt(req.query.id, 10);
                    if (!Number.isInteger(item_id) || item_id <= 0) { return res.status(400).json({ success: false, error: "Invalid item ID" }); }
                    items = await itemSet([
                        {
                            field: "product_items.id",
                            operator: "eq",
                            value: item_id
                        }
                    ]);
                    break;
                case "gte": // all in stock items, neondb reference to-do
                    items = await itemSet([
                        {
                            field: "product_items.in_stock",
                            operator: "gte",
                            value: 1
                        }
                    ]);
                    break;
                case "lte": // all out of stock, neondb reference to-do
                    items = await itemSet([
                        {
                            field: "product_items.in_stock",
                            operator: "lte",
                            value: 0
                        }
                    ]);
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

    async function itemSet(filters, limit = 1000) {
        let page = 1;
        let has_more = false;
        let data = [];
        do {
            const result = await itemPage(filters, page, limit);
            if (Array.isArray(result.data)) { data.push(...result.data); }
            has_more = result?.meta?.has_more === true;
            page++;
            if (has_more) { await sleep(1000); }
        } while (has_more);
        // to-do, update neondb with this data
        return data;
    }

    async function itemPage(filters, page, limit = 1000, retries = tokens.length * 3) {
        filters.push({
            field: "product_items.condition_id",
            operator: "in",
            value: [1,2,4,5,6,8,9,18,31,32,34,35,38,39,42,44,45,49,71,92,94,95,99]
        });

        const body = {
            type: "active_inventory",
            page: page,
            per_page: limit,
            filters,
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