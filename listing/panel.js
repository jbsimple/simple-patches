(async function() {
    "use strict";

    // check for key
    const qs = new URLSearchParams(window.location.search);
    const key = qs.get('key') ?? null;
    if (key == null) {
        fireMessage({
            type: 'error',
            title: 'Hey!',
            body: ["You're missing the key in your request.","A key is needed to access this panel."]
        });
    }

    // autorun
    let rel = null;
    try {
        await panel();
    } catch (err) {
        fireMessage({
            type: 'error',
            title: 'Oh No!',
            body: err.message,
            obj: err
        });
    }

    // init + refresh
    async function panel() {
        showLoader()
        let list = [];

        // add hvi to list
        const hvi = await api("hvi");
        if (Array.isArray(hvi)) { list = [...list, ...hvi]; }

        // another round of parsing just for the html
        list = list.map(item => {
            item["Product_Image"] = (typeof item["Product_Image"] === "string" && item["Product_Image"].trim() !== "")
                ? item["Product_Image"]
                : `https://s3.amazonaws.com/elog-cdn/no-image.png`;
            return item;
        });

        let grid = document.getElementById('grid') ?? document.createElement('div');
        grid.innerHTML = '';
        grid.id = 'grid';

        list.forEach(item => {
            const gridItem = document.createElement('div');
            gridItem.classList.add('box');
            gridItem.innerHTML = `
            <div class="heading">
                <h3>${item["SKU"]}</h3>
            </div>
            <div class="body">
                <img src="${item["Product_Image"]}">
                <h4>${item["Product_Name"]}</h4>
                <div class="stats">
                    <div class="item">
                        <h5>In Stock</h5>
                        <p>${item["MAIN_Qty"]}</p>
                    </div>
                    <div class="item">
                        <h5>Price</h5>
                        <p>${item["Price"]}</p>
                    </div>
                    <div class="item">
                        <h5>Value</h5>
                        <p>$${item["Value"]}</p>
                    </div>
                </div>
            </div>
            <div class="footing">
                <a class="button" target="_blank" href="${rel}/product/items/${item["SKU"]}">View SKU</a>
                <a class="button" target="_blank" href="${rel}/products/${item["SID"]}">View SID</a>
            </div>`;
            grid.appendChild(gridItem);
        });
        
        document.getElementById('content').appendChild(grid);

        hideLoader();
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