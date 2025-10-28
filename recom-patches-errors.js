/* only one time get this big report */

let itemData = null;
let manualData = {};
const getWMFeed = false;

async function itemDetailsInit() {
    const itemDataFetch = await fetchItemDetails();
    if (itemDataFetch.data) {
        itemData = Object.fromEntries(
            itemDataFetch.data.map(item => [item.SKU, item])
        );
    }
    return itemDataFetch.data;
}

async function fetchItemDetails(sku = null) {
    // time to build a report
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');

        let filters = [
            {
                column: "product_items.in_stock",
                opr: "{0} >= {1}",
                value: -100
            }
        ];
        
        if (sku !== null) {
            filters.push({
                column: "product_items.sku",
                opr: "{0} LIKE '%{1}%'",
                value: sku
            });
        } else {
            const today = new Date();
            const past = new Date();
            past.setDate(today.getDate() - 89);

            const formatDate = (date) => {
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${mm}/${dd}/${yyyy}`;
            };

            const range = `${formatDate(past)} - ${formatDate(today)}`;

            filters.push({
                column: "product_items.updated_at",
                opr: "between",
                value: range 
            });
        }

        var request = {
            report: {
                type: "active_inventory",
                columns: [
                    "products.sid",
                    "product_items.id",
                    "product_items.sku",
                    "product_items.in_stock"
                ],
                filters: filters
            },
            csrf_recom: csrfToken
        };

        console.debug('PATCHES - Fetching Item Detials report:', request);

        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                dataType: "json",
                url: "/reports/create",
                data: request,
            }).done(function(data) {
                if (data.success && data.results.results && Array.isArray(data.results.results)) {
                    resolve({
                        data: data.results.results,
                        download: `/renderfile/download?folder=reports&path=${data.results.filename}`,
                        filename: data.results.filename
                    });
                } else {
                    resolve(null);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Request failed: " + textStatus + ", " + errorThrown);
                reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
            });
        });
    } else {
        return null;
    }
}

async function prettyLinkSkus() {
    toggleLoad('inherit');
    const table = document.getElementById('dtTable');
    if (!table) return;

    const headerRow = table.querySelector('thead>tr');
    const footerRow = table.querySelector('tfoot>tr');

    if (headerRow && !table.hasAttribute('patched')) {
        headerRow.insertBefore(addTableHeadings("SID", 'sid-col'), headerRow.children[4]);
        headerRow.insertBefore(addTableHeadings("In Stock", 'in-stock-col'), headerRow.children[4]);
    }

    if (footerRow && !table.hasAttribute('patched')) {
        footerRow.insertBefore(addTableHeadings("", 'sid-col'), footerRow.children[4]);
        footerRow.insertBefore(addTableHeadings("", 'in-stock-col'), footerRow.children[4]);
    }

    table.setAttribute('patched', 'true');

    const rows = table.querySelectorAll('tbody tr');

    for (const row of rows) {
        await processRow(row);
    }
    toggleLoad('none');

    async function processRow(row) {
        if (row.dataset.processing === "true" || row.querySelector('td.in-stock-col')) return;
        row.dataset.processing = "true";
    
        if (row.querySelector('td.in-stock-col')) return;

        const cells = row.querySelectorAll('td');
        const skuCell = cells[3];
        const text = skuCell.textContent.trim();

        if (!(text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-') || text.startsWith('CP_0_SC-'))) return;

        let cleanedSku = text.replace(/^RF_/, '').replace(/^CP_0_/, '');
        const href = `/product/items/${cleanedSku}`;
        skuCell.innerHTML = `<a href="${href}" target="_blank">${text}</a>`;

        let in_stock = null;
        let sid = null;
        let item_id = null;
        let data = itemData[cleanedSku] || manualData[cleanedSku];
        if (!data) {
            console.warn(`PATCHES - Manually fetching data for ${cleanedSku}`);
            try {
                const reportFetch = await fetchItemDetails(cleanedSku);
                console.debug(`PATCHES - Manually fetched data:`, reportFetch);
                const fetched = Array.isArray(reportFetch?.data)
                    ? reportFetch.data[0]
                    : reportFetch?.data;

                if (fetched && (fetched['SID'] || fetched['In_Stock'] || fetched['MAIN_Qty'])) {
                    data = fetched;
                    manualData[cleanedSku] = fetched;
                    console.debug(`PATCHES - Stored manualData for ${cleanedSku}`, fetched);
                } else {
                    console.warn(`PATCHES - No data returned for ${cleanedSku}:`, reportFetch);
                }
            } catch (err) {
                console.error(`PATCHES - Error fetching data for ${cleanedSku}:`, err);
            }
        }

        if (data) {
            in_stock = data['MAIN_Qty'] ?? data['In_Stock'] ?? null;
            sid = data['SID'] ?? null;
            item_id = data['Item_ID'] ?? null;
        }

        row.insertBefore(addCell(`<span>${in_stock}</span>`, 'in-stock-col', "Main Quantity of SKU"), cells[4]);
        if (sid !== null) {
            row.insertBefore(addCell(`<a href="/products/${sid}" target="_blank">${sid}</a>`, 'sid-col', "Link to SID"), cells[4]);
        } else {
            row.insertBefore(addCell(`<span></span>`, 'sid-col', "Link to SID"), cells[4]);
        }

        if (getWMFeed) {
            const parser = new DOMParser();
            const marketplaceCell = cells[1];
            const marketplace = marketplaceCell.textContent.trim();
            let wm_feedID = ""; 
            if (marketplace === 'Walmart US' && item_id) {
                try {
                    const feedRes = await fetch(`/integrations/stores/listing/item/${item_id}`);
                    if (feedRes.ok) {
                        const feedHtml = await feedRes.text();
                        const feedDoc = parser.parseFromString(feedHtml, "text/html");

                        const wmRow = [...feedDoc.querySelectorAll('tbody tr')].find(row => row.querySelector('td')?.textContent.trim() === 'Walmart US');

                        if (wmRow) {
                            const cols = wmRow.querySelectorAll('td');
                            wm_feedID = cols[2]?.textContent.trim() || "";
                        }
                    }
                } catch (err) {
                    console.error("Error fetching feed ID", err);
                }
            }

            if (wm_feedID) {
                cells[2].title = cells[2].textContent.trim();
                cells[2].textContent = wm_feedID;
            }
        }

        delete row.dataset.processing;

    }

    function addTableHeadings(textContent, className = 'patches_newHeader') {
        const th = document.createElement('th');
        th.textContent = textContent;
        th.classList.add(className, 'min-w-100px');
        return th;
    }

    function addCell(innerHTML, className = 'patches_newcell', title = 'Patches New Cell', label = 'New Patch Cell') {
        const newCell = document.createElement('td');
        newCell.classList.add(className);
        newCell.innerHTML = innerHTML;
        newCell.title = title;
        newCell.setAttribute('label', label);
        return newCell;
    }
}

function exportTable() {
    const table = document.getElementById('dtTable');
    if (!table) return;

    let rows = [];

    table.querySelectorAll("thead tr, tbody tr").forEach(tr => {
        let cells = [];
        tr.querySelectorAll("th, td").forEach(td => {
            let text = td.innerText.trim();

            const link = td.querySelector("a");
            if (link) { text = link.textContent.trim(); }

            const span = td.querySelector("span[title]");
            if (span && span.getAttribute("title")) { text = span.getAttribute("title").trim(); }

            if (text.includes(",") || text.includes("\"")) { text = `"${text.replace(/"/g, '""')}"`; }

            cells.push(text);
        });
        rows.push(cells.join(","));
    });

    const csvContent = rows.join("\n");

    const timestamp = Math.floor(Date.now() / 1000);

    let page = '0';
    const dtTable_wrapper = document.getElementById('dtTable_wrapper');
    if (dtTable_wrapper) {
        const pageEl = dtTable_wrapper.querySelector('.page-item.active');
        page = pageEl ? pageEl.textContent.trim() : "all";
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `integrationLog_${timestamp}_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// add button
function initExport() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    if (!kt_app_content_container) return;

    const toolbar = kt_app_content_container.querySelector('.card-toolbar.flex-row-fluid.justify-content-end.gap-5');
    if (!toolbar) return;

    const button = document.createElement('a');
    button.classList.add('btn', 'btn-info', 'btn-sm');
    button.textContent = "Export CSV";
    button.onclick = exportTable;

    toolbar.insertBefore(button, toolbar.firstChild);
}

function toggleLoad(display = null) {
        const dtTable_processing = document.getElementById('dtTable_processing');
        if (dtTable_processing) {
            if (display !== null) {
                dtTable_processing.style.display = display
            } else if (dtTable_processing.style.display === 'none') {
                dtTable_processing.style.display = 'inherit';
            } else {
                dtTable_processing.style.display = 'none';
            }
        }
    }

async function initErrorLogPatch() {
    toggleLoad('inherit');
    await itemDetailsInit();
    prettyLinkSkus();
    toggleLoad('none');
    const wrapper = document.getElementById('dtTable_wrapper');
    if (wrapper) {
        const observer = new MutationObserver(() => {
            clearTimeout(observer._debounce);
            observer._debounce = setTimeout(prettyLinkSkus, 500);
        });

        observer.observe(wrapper, { childList: true, subtree: true });
    }
    initExport();
    unsafeTableLength();
}

async function unsafeTableLength() {
    const select = document.querySelector('select[name="dtTable_length"]');
    if (select) {
        const addOptions = [200, 300, 500, 750, 1000, 1500, 2000]; // why am I able to just do this?
        addOptions.forEach(value => {
            const option = document.createElement('option');
            option.setAttribute('value', value);
            option.textContent = value;
            select.appendChild(option);
        })
    }
}

setTimeout(initErrorLogPatch, 150);