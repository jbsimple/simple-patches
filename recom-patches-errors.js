/* only one time get this big report */
const itemDataFetch = await fetchItemDetails();
let itemData = null;
if (itemDataFetch.data) {
    itemData = Object.fromEntries(
        itemDataFetch.data.map(item => [item.SKU, item])
    );
}

const getWMFeed = false;
async function prettyLinkSkus() {
    const table = document.getElementById('dtTable');
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    const footerRow = table.querySelector('tfoot tr');

    if (!headerRow.querySelector('th.in-stock-col')) {
        const th = document.createElement('th');
        th.textContent = "In Stock";
        th.classList.add('in-stock-col', 'min-w-100px');
        headerRow.insertBefore(th, headerRow.children[4]);
    }

    if (footerRow && !footerRow.querySelector('th.in-stock-col')) {
        const th = document.createElement('th');
        th.classList.add('in-stock-col');
        footerRow.insertBefore(th, footerRow.children[4]);
    }

    const rows = table.querySelectorAll('tbody tr');

    const parser = new DOMParser();

    for (const row of rows) {
        if (row.querySelector('td.in-stock-col')) continue;

        const cells = row.querySelectorAll('td');
        const skuCell = cells[3];
        const text = skuCell.textContent.trim();

        let in_stock = "N/a";
        let image = "https://s3.amazonaws.com/elog-cdn/no-image.png";
        let sid = null;
        let item_id = null;
        if (text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-') || text.startsWith('CP_0_SC-')) {
            let cleanedSku = text.startsWith('RF_') ? text.replace(/^RF_/, '') : text;
            cleanedSku = text.startsWith('CP_0_') ? text.replace(/^CP_0_/, '') : text;
            const href = `/product/items/${cleanedSku}`;
            skuCell.innerHTML = `<a href="${href}" target="_blank">${text}</a>`;
            if (itemData[text]) {
                in_stock = itemData[text]['MAIN_Qty'];
                image = itemData[text]['Product_Image'];
                sid = itemData[text]['SID'];
                item_id = itemData[text]['Item_ID'];
            } else {
                console.warn(`PATCHES - No Item Data for ${text}`);
            }

            /* the old method which was slow
            try {
                const res = await fetch(href);
                if (res.ok) {
                    const html = await res.text();
                    const doc = parser.parseFromString(html, "text/html");

                    const invLink = doc.getElementById('getTotalInventoryBreakdown');
                    if (invLink) {
                        const parent = invLink.parentElement;
                        if (parent && parent.nextElementSibling) {
                            in_stock = parent.nextElementSibling.textContent.trim();
                        }
                    }

                    const itemLabelDiv = [...doc.querySelectorAll('div')].find(div => div.textContent.trim() === 'Item #');
                    if (itemLabelDiv) {
                        const parent = itemLabelDiv.parentElement;
                        if (parent) {
                            const idDiv = parent.querySelector('.fs-5.text-info.fw-bolder.lh-1');
                            if (idDiv) {
                                item_id = idDiv.textContent.trim();
                            }
                        }
                    }

                }
            } catch (err) {
                console.error("Error fetching", href, err);
            } */
        }

        // Create the new cell only once
        const inStockCell = document.createElement('td');
        inStockCell.classList.add('in-stock-col');
        inStockCell.textContent = in_stock ? in_stock : "N/a";
        row.insertBefore(inStockCell, cells[4]);

        if (getWMFeed) {
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
    }

    async function fetchItemDetails() {
        // time to build a report
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            var request = {
                report: {
                    type: "active_inventory",
                    columns: [
                        "products.sid",
                        "product_items.id",
                        "product_items.sku",
                        "first_image",
                        "product_items.in_stock"
                    ],
                    filters: [
                        {
                            column: "product_items.in_stock",
                            opr: "{0} >= {1}",
                            value: -1000
                        }
                    ]
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
}

// Run once on initial load
setTimeout(prettyLinkSkus, 500);

// Observe #dtTable_wrapper for changes
const wrapper = document.getElementById('dtTable_wrapper');
if (wrapper) {
    const observer = new MutationObserver(() => {
        clearTimeout(observer._debounce);
        observer._debounce = setTimeout(prettyLinkSkus, 500);
    });

    observer.observe(wrapper, { childList: true, subtree: true });
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

setTimeout(initExport, 50);