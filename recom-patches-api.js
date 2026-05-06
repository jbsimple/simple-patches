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

async function api_test(type = null, page = 1, per_page = 200) {
    function datestamp(type, count = 1) {
        function formatDate(date) { return date.toISOString().split('T')[0]; }
        const today = new Date();
        const past = new Date();
        switch (type) {
            case 'day':
                past.setDate(past.getDate() - count);
                break;
            case 'week':
                past.setDate(past.getDate() - (count * 7));
                break;
            case 'month':
                const d = past.getDate();
                past.setMonth(past.getMonth() - count);
                if (past.getDate() < d) { past.setDate(0); }
                break;
            case 'year':
                past.setFullYear(today.getFullYear() - count);
                break;
        }
        return [formatDate(past), formatDate(today)];
    }

    switch (type) {
        case 'active_inventory':
            return fetchAPI("reports", {
                body: {
                    type: "active_inventory",
                    page: page,
                    per_page: per_page,
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
        case 'catalog_report':
            return fetchAPI("reports", {
                body: {
                    type: "catalog_report",
                    page: page,
                    per_page: per_page,
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
        case 'orders_report':
            return fetchAPI("reports", {
                body: {
                    type: "orders_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "orders.date_ordered",
                            "operator": "between",
                            "value": datestamp('day', 0)
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
        case 'extended_sold_items':
            return fetchAPI("reports", {
                body: {
                    type: "extended_sold_items",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "orders.date_ordered",
                            "operator": "between",
                            "value": datestamp('day', 0)
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
        case 'extended_returned_items':
            return fetchAPI("reports", {
                body: {
                    type: "extended_returned_items",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "return_date",
                            "operator": "between",
                            "value": datestamp('day', 0)
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
        case 'user_clock':
            return fetchAPI("reports", {
                body: {
                    type: "user_clock",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "user_clocks.clock_date",
                            "operator": "between",
                            "value": datestamp('day', 0)
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
        case 'fba_shipments':
            return fetchAPI("reports", {
                body: {
                    type: "fba_shipments",
                    page: page,
                    per_page: per_page,
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
        case 'wfs_shipments':
            return fetchAPI("reports", {
                body: {
                    type: "wfs_shipments",
                    page: page,
                    per_page: per_page,
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
        case 'product_images':
            return fetchAPI("reports", {
                body: {
                    type: "product_images",
                    page: page,
                    per_page: per_page,
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
        case 'item_images':
            return fetchAPI("reports", {
                body: {
                    type: "item_images",
                    page: page,
                    per_page: per_page,
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
        case 'extended_items_demands':
            return fetchAPI("reports", {
                body: {
                    type: "extended_items_demands",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "order_date",
                            "operator": "between",
                            "value": datestamp('day', 0)
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
        case 'po_category_cost_value':
            return fetchAPI("reports", {
                body: {
                    type: "po_category_cost_value",
                    page: page,
                    per_page: per_page,
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
                            "value": datestamp('month', 6)
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
        case 'warehouse_inventory':
            return fetchAPI("reports", {
                body: {
                    type: "warehouse_inventory",
                    page: page,
                    per_page: per_page,
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
                    page: page,
                    per_page: per_page,
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
        case 'store_weekly_sales':
            return fetchAPI("reports", {
                body: {
                    type: "store_weekly_sales",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "orders.store_id",
                            "operator": "eq",
                            "value": "24" // example is Amazon
                        }
                    ],
                    columns: [
                        "stores.name",
                        "orders.store_id",
                        "total_orders_amount",
                        "total_orders_count",
                        "date_ordered",
                        "YEAR(orders.date_ordered)",
                        "MONTH(orders.date_ordered)",
                        "week"
                    ]
                }
            });
            break;
        case 'po_overview_report': // this is still a 504? does it matter if it is?
            return fetchAPI("reports", {
                body: {
                    type: "po_overview_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "created_at",
                            "operator": "between",
                            "value": datestamp('month', 6)
                        }
                    ],
                    columns: [
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "purchase_orders.type",
                        "purchase_orders.r2_status",
                        "purchase_orders.status",
                        "purchase_orders.created_at"
                    ]
                }
            });
            break;
        case 'sales_report':
            return fetchAPI("reports", {
                body: {
                    type: "sales_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "order_date",
                            "operator": "between",
                            "value": datestamp('day', 7)
                        }
                    ],
                    columns: [
                        "orders.number",
                        "customer_address.state",
                        "order_lines.line_sku",
                        "order_lines.line_quantity",
                        "order_lines.line_price",
                        "order_lines.line_discount",
                        "stores.name",
                        "orders.store_id",
                        "orders.date_ordered",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "po_vendors.name",
                        "purchase_orders.vendor_id",
                        "products.name",
                        "products.category_id",
                        "product_items.price",
                        "purchase_orders.unit_cost",
                        "po_items_cost.cost",
                        "po_category_cost.cost"
                    ]
                }
            });
            break;
        case 'refunds_report':
            return fetchAPI("reports", {
                body: {
                    type: "refunds_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "order_date",
                            "operator": "between",
                            "value": datestamp('month', 1)
                        }
                    ],
                    columns: [
                        "orders.number",
                        "customer_address.state",
                        "order_lines.line_sku",
                        "order_lines.line_quantity",
                        "order_lines.line_refund_quantity",
                        "order_lines.line_price",
                        "order_lines.line_discount",
                        "stores.name",
                        "orders.store_id",
                        "orders.date_ordered",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "po_vendors.name",
                        "purchase_orders.vendor_id",
                        "products.name",
                        "products.category_id",
                        "product_items.price",
                        "purchase_orders.unit_cost",
                        "po_items_cost.cost",
                        "po_category_cost.cost"
                    ]
                }
            });
            break;
        case 'returns_report':
            return fetchAPI("reports", {
                body: {
                    type: "returns_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "return_date",
                            "operator": "between",
                            "value": datestamp('day', 0)
                        }
                    ],
                    columns: [
                        "order_returns.return_status",
                        "order_returns.return_quantity",
                        "order_returns.return_reason",
                        "order_returns.created_at",
                        "order_lines.line_sku",
                        "orders.number",
                        "order_lines.line_quantity",
                        "order_lines.line_price",
                        "order_lines.line_discount",
                        "orders.date_ordered",
                        "stores.name",
                        "orders.store_id",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "po_vendors.name",
                        "purchase_orders.vendor_id",
                        "products.name",
                        "products.category_id",
                        "product_items.price",
                        "purchase_orders.unit_cost",
                        "po_items_cost.cost",
                        "po_category_cost.cost"
                    ]
                }
            });
            break;
        case 'listings_report': // does not respect pagination
            return fetchAPI("reports", {
                body: {
                    type: "listings_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "store_live_listing.status",
                            "operator": "eq",
                            "value": "online"
                        },
                        {
                            "field": "store_live_listing.store_id",
                            "operator": "eq",
                            "value": "24" // amazon
                        }
                    ],
                    columns: [
                        "store_live_listing.status",
                        "stores.name",
                        "orders.store_id"
                    ]
                }
            });
            break;
        case 'esn_sales_report':
            return fetchAPI("reports", {
                body: {
                    type: "esn_sales_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "orders.date_ordered",
                            "operator": "between",
                            "value": datestamp('day', 0)
                        }
                    ],
                    columns: [
                        "product_items.id",
                        "products.name",
                        "order_lines.line_sku",
                        "order_line_codes.code",
                        "order_line_codes.type",
                        "orders.number",
                        "stores.name",
                        "orders.store_id",
                        "order_lines.line_price",
                        "order_lines.line_discount",
                        "store_fee",
                        "shipment_fee",
                        "other_fee",
                        "refunded_fee",
                        "orders.shipping_total",
                        "orders.date_ordered",
                        "orders.status",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "products.category_id"
                    ]
                }
            });
            break;
        case 'user_daily_activity_report':
            return fetchAPI("reports", {
                body: {
                    type: "user_daily_activity_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "user_daily_activity.date",
                            "operator": "between",
                            "value": datestamp('day', 0)
                        }
                    ],
                    columns: [
                        "user_full_name",
                        "user_profile.user_id",
                        "user_daily_activity.date",
                        "user_daily_activity.total_minutes",
                        "user_daily_activity.updated_at"
                    ]
                }
            });
            break;
        case 'imei_report':
            return fetchAPI("reports", {
                body: {
                    type: "imei_report",
                    page: page,
                    per_page: per_page,
                    filters: [],
                    columns: [
                        "po_imei.imei",
                        "products.name",
                        "product_items.sku",
                        "conditions.name",
                        "product_items.condition_id",
                        "product_items.price",
                        "product_items.available",
                        "product_items.in_stock",
                        "product_items.location",
                        "products.category_id",
                        "purchase_orders.type",
                        "purchase_orders.number",
                        "purchase_orders.id",
                        "po_imei.cost",
                        "po_imei.location",
                        "po_imei.notes"
                    ]
                }
            });
            break;
        case 'error_log_report':
            return fetchAPI("reports", {
                body: {
                    type: "error_log_report",
                    page: page,
                    per_page: per_page,
                    filters: [
                        {
                            "field": "store_logs.created_at",
                            "operator": "between",
                            "value": datestamp('year', 1)
                        }
                    ],
                    columns: [
                        "store_logs.entry_id",
                        "store_logs.entry_ref",
                        "store_logs.entry_model",
                        "store_logs.entry_action",
                        "store_logs.log_data",
                        "store_logs.store_id",
                        "store_logs.created_at"
                    ]
                }
            });
            break;
    }
}

async function allSkusEver() {
    const columns = [
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
    ];

    const instockData = await fetchAllPages("INSTOCK", {
        type: "active_inventory",
        filters: [
            {
                field: "product_items.in_stock",
                operator: "gte",
                value: 1
            }
        ],
        columns
    });

    console.debug("PATCHES - Cooling down before OUTOFSTOCK...");
    await sleep(5000);

    const outofstockData = await fetchAllPages("OUTOFSTOCK", {
        type: "active_inventory",
        filters: [
            {
                field: "product_items.in_stock",
                operator: "lte",
                value: 0
            }
        ],
        columns
    });

    return [...instockData, ...outofstockData];

    async function fetchAllPages(label, baseBody) {
        let page = 1;
        let results = [];

        while (true) {
            console.debug(`PATCHES - [${label}] Fetching page ${page}...`);

            const res = await fetchWithRetry(() =>
                fetchAPI("reports", {
                    body: {
                        ...baseBody,
                        page,
                        per_page: 5000
                    }
                }),
                3,
                label,
                page
            );
            const data = res?.data?.data || [];
            const meta = res?.data?.meta || {};
            results.push(...data);
            console.debug(`PATCHES - [${label}] Page ${page} done | +${data.length} items | total=${results.length} | has_more=${meta.has_more}`);
            if (!meta.has_more) break;
            page++;
            await sleep(1000);
        }

        console.debug(`PATCHES - [${label}] COMPLETE | total=${results.length}`);
        return results;
    }

    async function fetchWithRetry(fn, maxRetries = 3, label = "", page = 0) {
        let attempt = 1;

        while (true) {
            try {
                return await fn();
            } catch (err) {
                const retryable = err?.message?.includes("429") || err?.message?.includes("500") ||err?.message?.includes("fetch");
                console.debug(`PATCHES - [${label}] Page ${page} failed (attempt ${attempt}/${maxRetries})`, err?.message);
                if (!retryable || attempt >= maxRetries) {
                    console.debug(`PATCHES - [${label}] Page ${page} FAILED permanently`);
                    throw err;
                }
                attempt++;
                await sleep(5000 * attempt);
            }
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function groq(prompt, model = 'llama-3.3-70b-versatile') {
    const res = await fetch(`https://simple-patches.vercel.app/api/groq?model=${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    console.log("GROQ Response:", data);

    return data;
}

async function betterAutofill(title, description = null) {
    let prompt = [
        "Give me a quick 3 sentence paragraph and 4-6 bullet points describing a product.",
        "In your response, please keep these things in mind:",
        "1. Please make sure any information you're providing is valid and accurate for the product, search online and use reputable sources when gathering information.",
        "2. If the title contains the word \"lightning\" with respect to Apple's Lightning charging standard, do not include any mentions to it. Instead call it a MFI (Made For Apple) 8-pin cable. Don't eroniously add it where it does not apply, either. This only applies to products that have a lightning charger.",
        "3. Do not mention any information about a warranty or coverage from the manufacturer; we are a third-party seller.",
        "4. Do not mention anything regarding anti-bacteria or anti-microbial. These terms are not allowed on most marketplaces.",
        "The format for your response should be:",
        "First, a version of just the title in a complete sentence. For example: \"The Apple (44mm) Sport Band Clasp for Apple Watch 42/44/45mm Cases. Pink Sand Version.\" where it restates the product name and extra information in a separate, incomplete sentence. Followed by a blank line. Then the 3 sentence paragraph followed by another blank line. Finally, the bullet points with the word \"Features:\" before printing each bullet point into it's own line, using characters \"-\" for each bullet.",
        "When done, the format look like:",
        "{Title restated as sentence}\\n\\n{3 Sentence Paragraph}\\n\\nFeatures:\\n\\n- Bullet 1\\n\\n- Bullet 2\\n\\n... and so on.",
    ];

    if (title !== null && title !== '') {
        prompt.push(`The product title is: "${title}".`);
    }

    if (description !== null && description !== '') {
        prompt.push(`Additional product information: "${description}"`)
    }

    const response = await groq(prompt.join("\n"));
    console.log(response.response);

}