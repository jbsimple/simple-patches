(async function() {
    "use strict";

    // check for key
    const qs = new URLSearchParams(window.location.search);
    const access_key = qs.get('key') ?? null;
    if (access_key == null) {
        fireMessage({
            type: 'error',
            title: 'Hey!',
            body: ["You're missing the key in your request.","A key is needed to access this panel."]
        });
    }

    // global glossary and counter
    let Enhance_Flag_Glossary = {
        template_defective: { label: "Defective on wrong template", keys: ['Listing_Template'], count: 0 },
        template_otterbox: { label: "Otterbox on wrong template", keys: ['Listing_Template'], count: 0 },
        template_weights: { label: "1lb+ items on wrong template", keys: ['Listing_Template'], count: 0 },
        attributes_color: { label: "Wrong color selection", count: 0 },
        asin_missing: { label: "ASIN missing", keys: ['ASIN'], count: 0 },
        itemTitle_missing: { label: "Custom title missing", keys: ['Item_Title'], count: 0 },
        attributes_missing: { label: "Product attributes missing", keys: ['Product_Attributes'], count: 0 },
        dimensions_missing: { label: "Missing dimensions", keys: ['Length','Width','Height'], count: 0 },
        mpn_missing: { label: "MPN missing", keys: ['MPN'], count: 0 },
        description_short: { label: "Product description too short", keys: ['Product_Description'], count: 0 },
        description_missing: { label: "Product description missing", keys: ['Product_Description'], count: 0 },
        priceBulk_missing: { label: "Bulk price missing", keys: ['Bulk_Price'], count: 0 },
        msrp_missing: { label: "Product MSRP missing", keys: ['MSRP'], count: 0 }
    };
    const Enhance_Flag_Filter = qs.get('list') ?? 'clear';

    const modal = document.getElementById('modal');
    const modalblock = document.getElementById('modalblock');
    function openModal() {
        modal.classList.add('active');
        modalblock.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('active');
        modalblock.classList.remove('active');
        document.body.style.overflow = '';
    }
    modal.querySelector('[modal-action="close"]').addEventListener('click', closeModal);
    modalblock.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // autorun
    let rel = null;
    try {
        await panel('hvi');
    } catch (err) {
        fireMessage({
            type: 'error',
            title: 'Oh No!',
            body: err.message,
            obj: err
        });
    }

    // init + refresh
    async function panel(type) {
        showLoader()
        let list = [];

        const hvi = await api("hvi");
        if (Array.isArray(hvi)) { list = [...list, ...hvi]; }
        // basic list for now

        list.sort((a, b) => (b.Value || 0) - (a.Value || 0));

        // build nav
        const nav = document.getElementById('enhancement_nav');
        nav.innerHTML = '';
        const allBtn = document.createElement('a');
        allBtn.classList.add('button');
        allBtn.textContent = `View All ${Object.values(Enhance_Flag_Glossary).reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0)}`;
        allBtn.href = `/listing?list=all&key=${access_key}`;
        nav.appendChild(allBtn);
        
        Object.entries(Enhance_Flag_Glossary).forEach(([key, value]) => {
            if (value.count <= 0) { return; }
            const filterBtn = document.createElement('a');
            filterBtn.classList.add('button');
            filterBtn.textContent = `${value.label} (${value.count})`;
            filterBtn.href = `/listing?list=${key}&key=${access_key}`;
            nav.appendChild(filterBtn);
        });

        const clrBtn = document.createElement('a');
        clrBtn.classList.add('button');
        clrBtn.textContent = `View All`;
        clrBtn.href = `/listing?list=clear&key=${access_key}`;
        nav.appendChild(clrBtn);

        // more parsing for html
        list = list.map(item => {
            item["Product_Image"] = (typeof item["Product_Image"] === "string" && item["Product_Image"].trim() !== "")
                ? item["Product_Image"]
                : `https://s3.amazonaws.com/elog-cdn/no-image.png`;

            if (Enhance_Flag_Filter !== 'clear') {
                item["Enhance_Flags_HTML"] = `<a class="button yellow row center gapT" table-action="modal"><i aria-hidden="true" class="fa-solid fa-triangle-exclamation"></i><span>More Info</span></a>`;
            } else if (item["Enhance_Flags"].length > 0) {
                item["Enhance_Flags_HTML"] = `<a class="button yellow row center gapT" table-action="modal"><i aria-hidden="true" class="fa-solid fa-triangle-exclamation"></i><span>${item["Enhance_Flags"].length} ${item["Enhance_Flags"].length === 1 ? 'Issue' : 'Issues'}</span></a>`
            } else {
                item["Enhance_Flags_HTML"] = `<a class="button green row center gapT" table-action="modal"><i aria-hidden="true" class="fa-solid fa-circle-check"></i><span>All Good!</span></a>`
            }

            return item;
        });

        // filter with enhance flags
        if (Enhance_Flag_Filter !== 'clear') {
            list = list.filter(item => {
                const flags = Array.isArray(item["Enhance_Flags"]) ? item["Enhance_Flags"] : [];
                if (Enhance_Flag_Filter === 'all') { return flags.length > 0; }
                return flags.includes(Enhance_Flag_Filter);
            });
        }

        document.getElementById('table')?.remove();
        let table = document.createElement('table');
        table.id = 'table';
        table.innerHTML = '';

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
            <th></th>
            <th>Product Name / SKU</th>
            <th>Enhancement</th>
            <th>In Stock</th>
            <th>Price</th>
            <th>Value</th>
            <th></th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        list.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img loading="lazy" src="${item["Product_Image"]}">
                </td>
                <td>
                    <div class="column gapT">
                        <a style="font-weight:700;" href="${rel}/products/${item['SID']}" target="_blank">${item["Product_Name"]}</a>
                        <a style="font-weight:300;" href="${rel}/product/items/${item['SKU']}" target="_blank">${item["SKU"]}&nbsp;|&nbsp;${item["Condition"]}</p>
                    </div>
                </td>
                <td>${item["Enhance_Flags_HTML"]}</td>
                <td>${item["MAIN_Qty"]}</td>
                <td>$${item["Price"]}</td>
                <td>$${item["Value"]}</td>
                <td><a class="button green row gapS center" table-action="resolve" target="_blank"><p>Resolve</p><i aria-hidden="true" class="fa-solid fa-rotate-right"></i></a></td>
            `;
            row.querySelectorAll('[table-action]').forEach(btn => {
                btn.addEventListener('click', async() => {
                    switch (btn.getAttribute('table-action')) {
                        case 'modal':
                            await refreshModal();
                            openModal();
                            break;
                        case 'resolve':
                            // get initials of person
                            fireMessage({
                                type: 'info',
                                title: 'To-Do',
                                body: ["Not here yet.", "Plan is the resolve button will refresh item from system and update neon db."]
                            });
                    }
                })
            });
            tbody.appendChild(row);
            function refreshModal() {
                // heading links
                modal.querySelectorAll('a.button[modal-link]').forEach(elem => {
                    switch (elem.getAttribute('modal-link')) {
                        case 'SID':
                            elem.href = `${rel}/products/${item['SID']}`;
                            break;
                        case 'SKU':
                            elem.href = `${rel}/product/items/${item['SKU']}`;
                            break;
                        case 'resolve':
                            elem.addEventListener('click', async() => {
                                fireMessage({
                                    type: 'info',
                                    title: 'To-Do',
                                    body: ["Not here yet.", "Plan is the resolve button will refresh item from system and update neon db."]
                                });
                            })
                            break;
                    }
                });

                // fill in data, show issues
                const enhance_itemkeys = item["Enhance_Flags"].flatMap(enh => Enhance_Flag_Glossary[enh]?.keys || []);
                Object.entries(item).forEach(([key, value]) => {
                    modal.querySelectorAll(`[modal-item="${key}"]`).forEach(elem => {
                        if (key === "Product_Image") {
                            elem.src = value;
                        } else if (key === "Product_Attributes") {
                            let attrib_html = '';
                            Object.entries(value).forEach(([attrib_name, attrib_val]) => {
                                attrib_html += `<div class="row gapS"><strong>${attrib_name}</strong><span>:</span><p style="flex:1;text-align:left;">${attrib_val}</p></div>`;
                            });
                            elem.innerHTML = attrib_html;
                        } else if (key === "Item_Flags") {
                            let flag_html = '';
                            value.forEach(flag => {
                                flag_html += `<div class="pill">${flag}</div>`;
                            });
                            elem.innerHTML = flag_html;
                        } else {
                            elem.innerHTML = value;
                        }

                        if (enhance_itemkeys.includes(key)) {
                            const detail = elem.closest('.detail');
                            if (detail) {
                                detail.style.borderColor = 'var(--yellow)';
                            }
                        }
                    });
                });

                // enhancement status box
                const enhanceBox = modal.querySelector('div.detail.enhancements');
                if (item["Enhance_Flags"].length > 0) {
                    enhanceBox.style.borderColor = 'var(--yellow)';
                    let enhanceBoxHTML = `<div class="column gapT"><h4>Issues</h4><p>These are issues that need to be resolved for the best item performance.</p></div><div class="column gapT">`;
                    let enhance_names = [];
                    item["Enhance_Flags"].forEach(enh => { enhance_names.push(Enhance_Flag_Glossary[enh]['label']); });
                    enhance_names.forEach(label => {
                        enhanceBoxHTML += `<p>${label}</p>`;
                    });
                    enhanceBoxHTML += '</div>';
                    enhanceBox.innerHTML = enhanceBoxHTML;
                } else {
                    enhanceBox.style.borderColor = 'var(--green)';
                    enhanceBox.innerHTML = `<div class="column gapT"><h4>Good News!</h4><p>TNo isses have been detected, ensure the details are correct.</p></div>`;
                }
            }
        });
        table.appendChild(tbody);

        document.getElementById('content').appendChild(table);

        hideLoader();
    }

    async function api(type) {
        const url = `/api/listing?type=${encodeURIComponent(type)}&key=${encodeURIComponent(access_key)}`;
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
        item["Condition_ID"] = parseInt(item ["Condition"].split("-")[0], 10);
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

        item["Listing_Template_ID"] = parseFloat(item["Listing_Template"] || 8);
        const Listing_Template_Legend = { 8:"Returnable-UpTo-1Lb", 14:"Returnable-1-to-4Lb", 15:"Returnable-Over-4lbs", 16:"DEFECTIVE-NoReturns-Under 1 Pound", 17:"Heavy Large Dims", 23:"Local Pickup ONLY", 26:"DEFECTIVE-NoReturns-Over 1 Pound", 36:"$150+ Products - Non Bulky", 37:"Otterbox_Lifeproof_FREE2DAY", 38:"Otterbox_Lifeproof_Under1LB", 39:"Otterbox_Lifeproof_Over1LB", 40:"NoEBAYcatalogINFO", 43:"Ebay Deals", 44:"Free 2 day - Phones", 45:"Gaming Accessories" }
        item["Listing_Template"] = Listing_Template_Legend[parseFloat(item["Listing_Template"] || 8)] ?? Listing_Template_Legend[8];

        // splitting at pipe is not enough, to-fix
        // |Features:Shockproof|Lightweight| -> Features:["Shockproof","Lightweight"]
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

        item["Enhance_Flags"] = [];
        // defective items on wrong template
        if (item["Condition"] && item["Condition_ID"] === 6 && ![16, 26].includes(item["Listing_Template_ID"])) { item["Enhance_Flags"].push("template_defective"); }
        // otterbox/lifeproof wrong template
        if (typeof item["Brand"] === "string" && /(otterbox|lifeproof)/i.test(item["Brand"]) && ![37, 38, 39].includes(item["Listing_Template_ID"])) { item["Enhance_Flags"].push("template_otterbox"); }
        // heavy items on lightweight template
        if (item["Weight"] > 1 && item["Listing_Template_ID"] === 8) { item["Enhance_Flags"].push("template_weights"); }
        // missing ASIN
        if ( !item["ASIN"] || item["ASIN"].toString().trim() === "") { item["Enhance_Flags"].push("asin_missing"); }
        // missing custom title on conditions
        if ((item["Condition_ID"] && [6,8,18,31,32,34,35,39,42,44,45,49,71,92,94,95,99].includes(item["Condition_ID"]) ) && (!item["Item_Title"] || item["Item_Title"].trim() === "")) { item["Enhance_Flags"].push("itemTitle_missing"); }
        // missing attributes
        if (!item["Product_Attributes"] || Object.keys(item["Product_Attributes"]).length === 0) { item["Enhance_Flags"].push("attributes_missing"); }
        // missing dimensions
        if (!item["Length"] || !item["Width"] || !item["Height"]) { item["Enhance_Flags"].push("dimensions_missing"); }
        // missing MPN
        if (!item["MPN"] || item["MPN"].trim() === "") { item["Enhance_Flags"].push("mpn_missing"); }
        // missing description
        if (!item["Product_Description"] || item["Product_Description"].trim() === "") { item["Enhance_Flags"].push("description_missing"); }
        // short description
        if ( item["Product_Description"] && item["Product_Description"].replace(/<[^>]*>/g, "").trim().length < 150 ) { item["Enhance_Flags"].push("description_short"); }
        // missing bulk price
        if ( item["Bulk_Price"] <= 0 ) { item["Enhance_Flags"].push("priceBulk_missing"); }
        // missing MSRP
        if ( item["Product_MSRP"] <= 0 ) { item["Enhance_Flags"].push("msrp_missing"); }
        // color will be a to-do, requires mapping rules I don't have
        // clean removal of duplicates
        item["Enhance_Flags"] = [...new Set(item["Enhance_Flags"])];
        item["Enhance_Flags"].forEach(flag => { if (Enhance_Flag_Glossary[flag]) { Enhance_Flag_Glossary[flag].count++; } })

        // sort the keys
        const item_legend = ['SID', 'Product_Name', 'Item_ID', 'SKU', 'Condition', 'Condition_ID', 'Item_Title', 'Product_Description', 'Product_Image', 'Total_SKU_Supply', 'MAIN_Qty', 'Value', 'Min_Price', 'Max_Price', 'Bulk_Price', 'Seller_Cost', 'Product_MSRP', 'Full_Location', 'Brand', 'Category', 'Category_Type', 'Weight', 'MPN', 'GTIN_UPC', 'ASIN', 'Product_dimensions', 'Length', 'Width', 'Height', 'Listing_Template_ID', 'Listing_Template', 'Product_Attributes', 'Item_Flags', 'Scrap_Flag', 'Has_FBA', 'Item_Status', 'Last_Sale_Date', 'Last_Price_Date', 'Created_Date', 'Updated_Date'];
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