(async function() {
    "use strict";

    // this is the init, really
    let key = null;
    let rel = null;
    try {
        const qs = new URLSearchParams(window.location.search);
        key = qs.get('key') ?? null;
        if (key == null) {
            fireMessage({
                type: 'error',
                title: 'Hey!',
                body: ["You're missing the key in your request.","A key is needed to access this panel."]
            });
        }

        const hvi = await api("hvi");
        document.getElementById('content').appendChild(activeInventoryPrint("hvi", hvi));
        
        hideLoader();
    } catch (err) {
        fireMessage({
            type: 'error',
            title: 'Oh No!',
            body: err.message,
            obj: err
        });
    }

    async function api(type) {
        const url = `/api/listing?type=${encodeURIComponent(type)}&key=${encodeURIComponent(key)}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            let data = null;
            try {
                data = await response.json();
            } catch {
                throw new Error('Invalid JSON response');
            }
            
            if (!response.ok || !data.success) { throw new Error(data?.error || `HTTP ${response.status}`); }
            console.debug('[Listing Dashboard] API Response:', data);

            if (data && data.rel && rel === null) {
                rel = data.rel;
            } else if (data && data.rel && rel !== data.rel) {
                fireMessage({
                    type: 'error',
                    title: 'Error in API Fetch',
                    body: "Relative URL Mismatch. This should not happen.",
                });
            } else if (data && !data.rel) {
                fireMessage({
                    type: 'error',
                    title: 'Error in API Fetch',
                    body: "Relative URL was not included in response. Links will not work.",
                });
            }

            if (data && data.items) {
                return data.items.map(item => parseItem(item));
            } else {
                return [];
            }
        } catch (err) {
            fireMessage({
                type: 'error',
                title: 'Error in API Fetch',
                body: err.message,
                obj: err
            });
        }
    }

    function parseItem(item) {
        item["SID_html"] = (typeof item["SID"] === "string" && item["SID"].trim() !== "")
            ? `<a target="_blank" href="${rel}/products/${item["SID"]}"`
            : item["SID"];
        item["Product_Image_html"] = (typeof item["Product_Image"] === "string" && item["Product_Image"].trim() !== "")
            ? `<img loading="lazy" src="${item["Product_Image"]}" width="72" height="72">`
            : `<img src="https://s3.amazonaws.com/elog-cdn/no-image.png" width="72" height="72">`;

        item["Total_SKU_Supply"] = parseFloat(item["Total_SKU_Supply"] || 0); // Available

        item["MAIN_Qty"] = parseFloat(item["MAIN_Qty"] || 0); // In Stock
        item["Price"] = parseFloat(item["Price"] || 0);
        item["Value"] = Math.round((item["MAIN_Qty"] * item["Price"]) * 100) / 100;

        item["Min_Price"] = parseFloat(item["Min_Price"] || 0);
        item["Max_Price"] = parseFloat(item["Max_Price"] || 0);
        item["Bulk_Price"] = parseFloat(item["Bulk_Price"] || 0);
        item["Seller_Cost"] = parseFloat(item["Seller_Cost"] || 0);

        item["Full_Location"] = (typeof item["Full_Location"] === "string" && item["Full_Location"].trim() !== "")
            ? item["Full_Location"].split("|")
            : [];

        item["Product_MSRP"] = parseFloat(item["Product_MSRP"] || 0);
        item["Weight"] = parseFloat(item["Weight"] || 0);

        item["Product_dimensions"] = (typeof item["Product_dimensions"] === "string" && item["Product_dimensions"].trim() !== "")
            ? item["Product_dimensions"].split(" x ")
            : [];
        
        item["Length"] = item["Product_dimensions"][0] ?? null;
        item["Width"] = item["Product_dimensions"][1] ?? null;
        item["Height"] = item["Product_dimensions"][2] ?? null;

        const Listing_Template_Legend = { 8:"Returnable-UpTo-1Lb", 14:"Returnable-1-to-4Lb", 15:"Returnable-Over-4lbs", 16:"DEFECTIVE-NoReturns-Under 1 Pound", 17:"Heavy Large Dims", 23:"Local Pickup ONLY", 26:"DEFECTIVE-NoReturns-Over 1 Pound", 36:"$150+ Products - Non Bulky", 37:"Otterbox_Lifeproof_FREE2DAY", 38:"Otterbox_Lifeproof_Under1LB", 39:"Otterbox_Lifeproof_Over1LB", 40:"NoEBAYcatalogINFO", 43:"Ebay Deals", 44:"Free 2 day - Phones", 45:"Gaming Accessories" }
        item["Listing_Template"] = Listing_Template_Legend[parseFloat(item["Listing_Template"] || 8)] ?? Listing_Template_Legend[8];

        item["Product_Attributes"] = (typeof item["Product_Attributes"] === "string" && item["Product_Attributes"].trim() !== "")
            ? Object.fromEntries(
                item["Product_Attributes"].split("|").map(attr => {
                    const [key, ...value] = attr.split(":");
                    return [
                        (key || "").trim(),
                        value.join(":").trim()
                    ];
                }).filter(([key]) => key !== "")
            )
            : {};

        item["Item_Flags"] = (typeof item["Item_Flags"] === "string" && item["Item_Flags"].trim() !== "")
            ? item["Item_Flags"].split("|").map(flag => flag.trim()).filter(Boolean)
            : [];

        item["Scrap_Flag"] = (item["Scrap_Flag"] === "1" || item["Scrap_Flag"] === 1 || item["Scrap_Flag"] === true);
        item["Has_FBA"] = (item["Has_FBA"] === "Yes" || item["Has_FBA"] === true);

        // sort the keys
        const item_legend = ['SID', 'Product_Name', 'Item_ID', 'SKU', 'Condition', 'Item_Title', 'Product_Description', 'Product_Image', 'Total_SKU_Supply', 'MAIN_Qty', 'Value', 'Min_Price', 'Max_Price', 'Bulk_Price', 'Seller_Cost', 'Product_MSRP', 'Full_Location', 'Brand', 'Category', 'Category_Type', 'Weight', 'MPN', 'GTIN_UPC', 'ASIN', 'Product_dimensions', 'Length', 'Width', 'Height', 'Listing_Template', 'Product_Attributes', 'Item_Flags', 'Scrap_Flag', 'Has_FBA', 'Item_Status', 'Last_Sale_Date', 'Last_Price_Date', 'Created_Date', 'Updated_Date'];
        const sortedItem = {};
        item_legend.forEach(key => {
            if (key in item) {
                sortedItem[key] = item[key];
            }
        });
        Object.keys(item).forEach(key => {
            if (!(key in sortedItem)) {
                sortedItem[key] = item[key];
            }
        });
        return sortedItem;
    }

    function activeInventoryPrint(id, items) {

        // another round of parsing just for the html
        items = items.map(item => {
            item["SID"] = (typeof item["SID"] === "string" && item["SID"].trim() !== "")
                ? `<a target="_blank" href="${rel}/products/${item["SID"]}"`
                : item["SID"];

            item["SKU"] = (typeof item["SKU"] === "string" && item["SKU"].trim() !== "")
                ? `<a target="_blank" href="${rel}/product/items/${item["SKU"]}"`
                : item["SKU"];

            item["Product_Image"] = (typeof item["Product_Image"] === "string" && item["Product_Image"].trim() !== "")
                ? `<img src="${item["Product_Image"]}" width="72" height="72">`
                : `<img src="https://s3.amazonaws.com/elog-cdn/no-image.png" width="72" height="72">`;

            item["Value"] = `$${item["Value"]}`;

            return item;
        });
        
        return printTable(id, items, [
            {"Product_Image": ""},
            {"Product_Name": "Name"},
            "SID",
            "SKU",
            "Condition",
            {"MAIN_Qty": "In Stock"},
            "Price",
            "Value"
        ]);
    }

    function printTable(id, list, columns = null) {
        if (!Array.isArray(list)) { console.error('printTable: list must be an array', list); return; }

        if (!Array.isArray(columns) || columns.length === 0) {
            const keys = new Set();
            list.forEach(item => { if (item && typeof item === 'object') { Object.keys(item).forEach(key => keys.add(key)); } });
            columns = Array.from(keys);
        }

        columns = columns.map(column => {
            if (typeof column === 'string') { return { key: column, label: column }; }

            if (typeof column === 'object' && column !== null) {
                const key = Object.keys(column)[0];
                return { key, label: column[key] };
            }

            return { key: '', label: '' };
        });

        let table = document.getElementById(id);

        if (!table) {
            table = document.createElement('table');
            table.id = id;

            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            table.appendChild(thead);
            table.appendChild(tbody);

            document.body.appendChild(table);
        }

        let thead = table.querySelector('thead');

        if (!thead) {
            thead = document.createElement('thead');
            table.prepend(thead);
        }

        thead.innerHTML = '';

        const headerRow = document.createElement('tr');

        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        let tbody = table.querySelector('tbody');

        if (!tbody) {
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        }

        tbody.innerHTML = '';

        list.forEach(item => {
            const row = document.createElement('tr');

            columns.forEach(column => {
                const td = document.createElement('td');

                let value = item?.[column.key];

                if (Array.isArray(value)) {
                    value = value.join(', ');
                } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }

                td.innerHTML = value ?? '';
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        return table;
    }

    function showLoader() {document.getElementById('pageLoader').classList.remove('hidden');  }
    function hideLoader() { document.getElementById('pageLoader').classList.add('hidden'); }

    function fireMessage({ type = 'info', title = '', body = '', obj = null, refresh = false } = {}) {
        const allowed_types = ["success", "error", "warning", "info", "question"];
        if (!allowed_types.includes(type)) {
            console.warn(`[Listing Dashboard] Invalid fireMessage type "${type}", falling back to "info"`);
            type = 'info';
        }

        let html = '';
        if (Array.isArray(body)) {
            html = body.map(line => `<div>${line}</div>`).join('');
        } else if (typeof body === 'string') {
            const containsHTML = /<\/?[a-z][\s\S]*>/i.test(body);
            html = containsHTML ? body : `<div>${body}</div>`;
        }
        const plainText = html.replace(/<[^>]*>/g, '');

        switch (type) {
            case 'error':
                console.error(`[Listing Dashboard] ${title}\n----\n${plainText}`);
                break;
            case 'warning':
                console.warn(`[Listing Dashboard] ${title}\n----\n${plainText}`);
                break;
            default:
                console.log(`[Listing Dashboard] ${title}\n----\n${plainText}`);
                break;
        }

        if (obj !== null) {
            if (obj instanceof Error) {
                console.error('[Listing Dashboard] Error Object:', { name: obj.name, message: obj.message, stack: obj.stack });
            } else {
                console.debug('[Listing Dashboard] Obj:', obj);
            }
        }

        Swal.fire({
            icon: type,
            title,
            html,
            confirmButtonText: 'OK'
        }).then((result) => {
            if (refresh && result.isConfirmed) { window.location.reload(); }
        });
    }

})();