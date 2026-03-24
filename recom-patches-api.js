// api fetch
async function fetchAPI(route, { params = {}, body = null } = {}, options = {}) {

    if (!["meta", "reports"].includes(route)) {
        throw new Error("Invalid route");
    }

    let url = `https://simple-patches.vercel.app/api/fetch?route=${route}`;

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

    if (route === "reports") {
        if (!body || !body.type) {
            throw new Error("Missing report body or type");
        }

        body.filters = Array.isArray(body.filters) ? body.filters : [];

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

async function api_test(type = null) {
    switch (type) {
        case 'active_inventory':
            return fetchAPI("reports", {
                body: {
                    type: "active_inventory",
                    limit: 200,
                    filters: [
                        {
                            "field": "product_items.in_stock",
                            "operator": "gte",
                            "value": "1000"
                        }
                    ],
                    columns: [
                        "products.sid",
                        "products.name",
                        "product_items.id",
                        "product_items.sku",
                        "conditions.name",
                        "product_items.condition_id",
                        "product_items.title",
                        "products.description",
                        "product_items.available",
                        "product_items.in_stock",
                        "product_items.price",
                        "product_items.location",
                        "brands.name",
                        "products.brand_id",
                        "categories.name",
                        "products.category_id",
                        "categories.type",
                        "product_items.created_at",
                        "product_items.updated_at"
                    ]
                }
            });
            break;
        case 'catalog_report':
            return fetchAPI("reports", {
                body: {
                    type: "catalog_report",
                    limit: 200,
                    filters: [],
                    columns: [
                        "products.sid",
                        "products.name",
                        "products.description",
                        "first_image",
                        "brands.name",
                        "products.brand_id",
                        "categories.name",
                        "products.category_id",
                        "categories.type",
                        "products.gtin",
                        "products.asin",
                        "products.msrp",
                        "products.dimensions",
                        "products.specs",
                        "products.status",
                        "products.created_at"
                    ]
                }
            });
            break;
        case 'extended_sold_items':
            return fetchAPI("reports", {
                body: {
                    type: "extended_sold_items",
                    filters: [
                        {
                            "field": "order_shipped_at",
                            "operator": "between",
                            "value": [to, from]
                        }
                    ],
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
            break;
        case 'orders_report':
            return fetchAPI("reports", {
                body: {
                    type: "orders_report",
                    limit: 200,
                    filters: [
                        {
                            "field": "orders.date_ordered",
                            "operator": "between",
                            "value": ["2026-03-23", "2026-03-23"]
                        }
                    ],
                    columns: [
                        "orders.number",
                        "orders.total",
                        "orders.shipping_total",
                        "orders.tax_total",
                        "orders.status",
                        "customer_full_name",
                        "customers.email",
                        "customer_address.phone_number",
                        "customer_address.name",
                        "customer_address.state",
                        "stores.name",
                        "orders.store_id",
                        "orders.date_ordered",
                        "orders.updated_at"
                    ]
                }
            });
            break;
        case 'active_inventory':

    }
}