// api fetch
async function fetchAPI(route, { params = {}, body = null } = {}, options = {}) {

    if (!["meta", "reports"].includes(route)) {
        throw new Error("Invalid route");
    }

    let url = `https://simple-patches.vercel.app/api/fetch?route=${route}`;

    // only attach query params for GET/meta
    if (route === "meta" && params && Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        url += `&${query}`;
    }

    const fetchOptions = {
        method: route === "meta" ? "GET" : "POST",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    // attach body ONLY for reports
    if (route === "reports") {
        if (!body || !body.type) {
            throw new Error("Missing report body or type");
        }

        fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", res.status, text);
        throw new Error(`API Error ${res.status}`);
    }

    const data = await res.json();

    console.log("API Response:", data);

    return data;
}

async function meta() { return await fetchAPI("meta"); }

async function soldItemsWithFBA(range) {
    return fetchAPI("reports", {
        body: {
            type: "extended_sold_items",
            filters: {
                "order_shipped_at": range
            },
            columns: [
                "orders.number",
                "order_lines.line_sku",
                "products.name",
                "products.mpn",
                "order_lines.line_quantity",
                "order_lines.line_price",
                "shipment_fee",
                "fba_fee",
                "store_fee",
                "order_lines.line_discount",
                "other_fee",
                "refunded_fee",
                "purchase_orders.number",
                "purchase_orders.id",
                "stores.name",
                "orders.store_id",
                "order_shipment.created_at",
                "orders.shipping_total",
                "customer_address.name",
                "customer_address.state",
                "customer_address.country",
                "order_lines.line_refund_quantity",
                "orders.tags",
                "orders.date_ordered",
                "orders.updated_at",
                "purchase_orders.type",
                "po_vendors.name",
                "purchase_orders.vendor_id",
                "product_items.id",
                "conditions.name",
                "product_items.condition_id",
                "products.category_id",
                "categories.type",
                "product_items.in_stock",
                "product_items.price",
                "purchase_orders.unit_cost",
                "po_items_cost.cost",
                "po_category_cost.cost",
                "brands.name",
                "products.brand_id",
                "products.weight",
                "products.gtin",
                "products.asin"
            ]
        }
    });
}