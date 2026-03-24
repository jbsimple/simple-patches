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
        case 'active_inventory':  // does not respect limit
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
                        "first_image",
                        "product_items.available",
                        "product_items.in_stock",
                        "product_items.price",
                        "product_items.min_price",
                        "product_items.max_price",
                        "product_items.bulk_price",
                        "product_items.seller_price",
                        "products.msrp",
                        "product_items.location",
                        "brands.name",
                        "products.brand_id",
                        "categories.name",
                        "products.category_id",
                        "categories.type",
                        "products.weight",
                        "products.mpn",
                        "products.gtin",
                        "products.asin",
                        "products.dimensions",
                        "product_items.store_settings",
                        "products.specs",
                        "product_items.flags",
                        "product_items.is_scrap",
                        "product_items.has_fba",
                        "product_items.status",
                        "product_items.sold_at",
                        "product_items.priced_at",
                        "product_items.created_at",
                        "product_items.updated_at"
                    ]
                }
            });
            break;
        case 'catalog_report':  // 422: Object of class stdClass could not be converted to string
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
                        "products.weight",
                        "products.mpn",
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
        case 'orders_report':  // works, respects limit
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
        case 'extended_sold_items': // 422: All Required (*) filters are needed for this Report
            return fetchAPI("reports", {
                body: {
                    type: "extended_sold_items",
                    filters: [
                        {
                            "field": "order_shipped_at",
                            "operator": "between",
                            "value": ["2026-03-23", "2026-03-23"]
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
        case 'extended_returned_items':  // 422: All Required (*) filters are needed for this Report
            return fetchAPI("reports", {
                body: {
                    type: "extended_returned_items",
                    limit: 200,
                    filters: [
                        {
                            "field": "return_date",
                            "operator": "between",
                            "value": ["2026-03-23", "2026-03-23"]
                        }
                    ],
                    columns: [
                        "order_returns.return_status",
                        "order_returns.return_quantity",
                        "order_returns.return_amount",
                        "order_returns.return_reason",
                        "order_returns.created_at",
                        "order_lines.line_sku",
                        "orders.number",
                        "order_lines.line_quantity",
                        "order_lines.line_price",
                        "order_lines.line_discount",
                        "return_fee",
                        "refunded_fee",
                        "orders.status",
                        "orders.date_ordered",
                        "customers.first_name",
                        "customers.last_name",
                        "customers.user_name",
                        "customer_address.state",
                        "customer_address.country",
                        "stores.name",
                        "orders.store_id",
                        "orders.tags",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "po_vendors.name",
                        "purchase_orders.vendor_id",
                        "products.name",
                        "product_items.id",
                        "conditions.name",
                        "product_items.condition_id",
                        "products.category_id",
                        "product_items.in_stock",
                        "brands.name",
                        "products.brand_id",
                        "products.weight",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ]
                }
            });
            break;
        case 'user_clock': // works, respects limit
            return fetchAPI("reports", {
                body: {
                    type: "user_clock",
                    limit: 200,
                    filters: [
                        {
                            "field": "user_clocks.clock_date",
                            "operator": "between",
                            "value": ["2026-03-23", "2026-03-23"]
                        }
                    ],
                    columns: [
                        "user_full_name",
                        "user_profile.user_id",
                        "departments.name",
                        "user_profile.department_id",
                        "clock_tasks.name",
                        "user_clocks.task_id",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "purchase_orders.type",
                        "user_clock_activity.activity_id",
                        "user_clock_activity.activity_code",
                        "user_clock_activity.notes",
                        "user_clock_activity.units",
                        "user_clock_activity.created_at",
                        "user_clock_activity.time_spent",
                        "user_clocks.time_in",
                        "user_clocks.time_out",
                        "user_clocks.user_id",
                        "user_clocks.clock_date",
                        "products.sid",
                        "products.name",
                        "product_items.sku",
                        "conditions.name",
                        "product_items.condition_id",
                        "inventory_receiving.condition_id",
                        "inventory_receiving.imei",
                        "categories.name",
                        "products.category_id",
                        "categories.type",
                        "brands.name",
                        "products.brand_id",
                        "order_lines.line_sku",
                        "orders.number",
                        "order_lines.line_quantity",
                        "order_lines.line_price",
                        "product_items.bulk_price",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ]
                }
            });
            break;
        case 'fba_shipments': // works, respects limit
            return fetchAPI("reports", {
                body: {
                    type: "fba_shipments",
                    limit: 200,
                    filters: [
                        {
                            "field": "fba_shipments.status",
                            "operator": "eq",
                            "value": "completed"
                        }
                    ],
                    columns: [
                        "fba_shipments.fba_shipment_id",
                        "fba_shipments.name",
                        "fba_shipments.status",
                        "fba_shipment_items.seller_sku",
                        "fba_shipment_items.fnsku",
                        "fba_shipment_items.quantity",
                        "fba_shipment_items.prep_instruction",
                        "products.name",
                        "product_items.sku",
                        "fba_shipment_locations",
                        "products.asin",
                        "fba_shipments.created_at",
                        "fba_shipments.notes"
                    ]
                }
            });
            break;
        case 'wfs_shipments': // works, respects limit
            return fetchAPI("reports", {
                body: {
                    type: "wfs_shipments",
                    limit: 200,
                    filters: [
                        {
                            "field": "wfs_shipments.status",
                            "operator": "eq",
                            "value": "completed"
                        }
                    ],
                    columns: [
                        "wfs_shipments.wfs_shipment_id",
                        "wfs_shipments.name",
                        "wfs_shipments.status",
                        "wfs_shipment_items.seller_sku",
                        "wfs_shipment_items.fnsku",
                        "wfs_shipment_items.quantity",
                        "products.name",
                        "product_items.sku",
                        "wfs_shipment_locations",
                        "products.gtin",
                        "wfs_shipments.created_at",
                        "wfs_shipments.notes"
                    ]
                }
            });
        case 'product_images': // works, respects limit, just as cursed as the report
            return fetchAPI("reports", {
                body: {
                    type: "product_images",
                    limit: 200,
                    filters: [
                        {
                            "field": "products.status",
                            "operator": "eq",
                            "value": "1" // 1 is PUBLISHED, 0 is INACTIVE
                        }
                    ],
                    columns: [
                        "products.sid",
                        "products.name",
                        "product_images.url",
                        "brands.name",
                        "products.brand_id",
                        "categories.name",
                        "products.category_id",
                        "products.weight",
                        "products.mpn",
                        "products.gtin",
                        "products.asin",
                        "products.status",
                        "products.created_at"
                    ]
                }
            });
            break;
        case 'item_images': // works, respects limit, just as cursed as the report
            return fetchAPI("reports", {
                body: {
                    type: "item_images",
                    limit: 200,
                    filters: [
                        {
                            "field": "product_items.status",
                            "operator": "eq",
                            "value": "1" // 1 is PUBLISHED, 0 is INACTIVE
                        }
                    ],
                    columns: [
                        "product_items.sku",
                        "products.sid",
                        "products.name",
                        "item_images.url",
                        "brands.name",
                        "products.brand_id",
                        "categories.name",
                        "products.category_id",
                        "conditions.name",
                        "product_items.condition_id",
                        "product_items.in_stock",
                        "product_items.location",
                        "product_items.price",
                        "products.weight",
                        "products.mpn",
                        "products.gtin",
                        "products.asin",
                        "product_items.status",
                        "product_items.created_at"
                    ]
                }
            });
            break;
        case 'extended_items_demands': // 422: All Required (*) filters are needed for this Report
            return fetchAPI("reports", {
                body: {
                    type: "extended_items_demands",
                    limit: 200,
                    filters: [
                        {
                            "field": "order_date",
                            "operator": "between",
                            "value": ["2026-03-23", "2026-03-23"]
                        }
                    ],
                    columns: [
                        "orders.date_ordered",
                        "order_lines.line_sku",
                        "total_orders",
                        "total_units",
                        "total_price",
                        "purchase_orders.type",
                        "products.name",
                        "conditions.name",
                        "product_items.condition_id",
                        "product_items.in_stock",
                        "product_items.price",
                        "brands.name",
                        "products.brand_id",
                        "products.category_id",
                        "products.weight",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ]
                }
            });
            break;
        case 'po_category_cost_value': // 422: PO Status, Type and Date are required for this report!
            return fetchAPI("reports", {
                body: {
                    type: "po_category_cost_value",
                    limit: 200,
                    filters: [
                        {
                            "field": "purchase_orders.type",
                            "operator": "eq",
                            "value": "purchase" // purchase, d2c, shared, sort_settle
                        },
                        {
                            "field": "purchase_orders.status",
                            "operator": "eq",
                            "value": "IN PROGRESS" // IN TRANSIT, RECEIVED, IN PROGRESS, PENDING, CANCELLED, COMPLETED, PARTIALLY RECEIVED, CHECKED IN
                        },
                        {
                            "field": "purchase_orders.created_at",
                            "operator": "between",
                            "value": ["2026-02-01", "2026-02-28"] // pos are not created that often
                        }
                    ],
                    columns: [
                        "products.category_id",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "purchase_orders.type",
                        "purchase_orders.status",
                        "purchase_orders.created_at"
                    ]
                }
            });
            break;
        case 'warehouse_inventory': // works, respects limit
            return fetchAPI("reports", {
                body: {
                    type: "warehouse_inventory",
                    limit: 200,
                    filters: [
                        {
                            "field": "warehouses.type",
                            "operator": "eq",
                            "value": "main" // main, virtual, fba
                        }
                    ],
                    columns: [
                        "warehouses.type",
                        "warehouses.name",
                        "products.sid",
                        "products.name",
                        "product_items.sku",
                        "warehouse_locations.full_location",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "purchase_orders.type",
                        "conditions.name",
                        "product_items.condition_id",
                        "product_items.available",
                        "item_inventory.quantity",
                        "item_inventory.total_quantity",
                        "pending_fba",
                        "item_inventory.updated_at",
                        "item_inventory.created_at",
                        "product_items.price",
                        "product_items.bulk_price",
                        "products.category_id",
                        "brands.name",
                        "products.brand_id",
                        "products.mpn",
                        "products.gtin",
                        "products.asin",
                        "product_items.is_scrap",
                        "product_items.has_fba",
                        "product_items.sold_at",
                        "product_items.priced_at",
                        "product_items.created_at",
                        "product_items.updated_at"
                    ]
                }
            });
            break;
        case 'pending_inventory':
            return fetchAPI("reports", {
                body: {
                    type: "pending_inventory",
                    limit: 200,
                    filters: [
                        {
                            "field": "purchase_orders.id",
                            "operator": "eq",
                            "value": "2369" // example is ASUR-3502
                        }
                    ],
                    columns: [
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "inventory_receiving.id",
                        "inventory_receiving.keyword",
                        "inventory_receiving.quantity",
                        "queue_inventory.quantity_approved",
                        "inventory_receiving.location",
                        "inventory_receiving.created_at",
                        "user_full_name",
                        "user_profile.user_id",
                        "products.sid",
                        "products.name",
                        "conditions.name",
                        "inventory_receiving.condition_id",
                        "products.category_id",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ]
                }
            });
            break;
    }
}