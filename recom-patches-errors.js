/* only one time get this big report */

let itemData = null;
let manualData = {};
const fetchPromises = {};
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
                    "product_items.in_stock",
                    "products.category_id"
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
    toggleLDtTableoad('inherit');
    const table = document.getElementById('dtTable');
    if (!table) return;

    const headerRow = table.querySelector('thead>tr');
    const footerRow = table.querySelector('tfoot>tr');

    if (headerRow && !table.hasAttribute('patched')) {
        headerRow.insertBefore(addTableHeadings("ENTRY CATEGORY", 'cat-col'), headerRow.children[4]);
        headerRow.insertBefore(addTableHeadings("ENTRY SID", 'sid-col'), headerRow.children[4]);
        headerRow.insertBefore(addTableHeadings("ENTRY IN STOCK", 'in-stock-col'), headerRow.children[4]);
    }

    if (footerRow && !table.hasAttribute('patched')) {
        footerRow.insertBefore(addTableHeadings("", 'cat-col'), footerRow.children[4]);
        footerRow.insertBefore(addTableHeadings("", 'sid-col'), footerRow.children[4]);
        footerRow.insertBefore(addTableHeadings("", 'in-stock-col'), footerRow.children[4]);
    }

    table.setAttribute('patched', 'true');

    const rows = table.querySelectorAll('tbody tr');

    for (const row of rows) {
        await processRow(row);
    }
    toggleLDtTableoad('none');

    async function processRow(row) {
        if (row.dataset.processing === "true" || row.querySelector('td.in-stock-col')) return;
        row.dataset.processing = "true";
    
        if (row.querySelector('td.in-stock-col')) return;

        const cells = row.querySelectorAll('td');
        const skuCell = cells[3];
        if (skuCell.textContent === null) return;

        const text = skuCell.textContent?.trim();

        const isItemSKU = text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-') || text.startsWith('CP_0_SC-') || text.startsWith('CP_1_SC-');
        if (!isItemSKU) {
            row.insertBefore(addCell('&nbsp;', 'in-stock-col', 'Not an item SKU'), cells[4]);
            row.insertBefore(addCell('&nbsp;', 'sid-col', 'Not an item SKU'), cells[4]);
            row.insertBefore(addCell('&nbsp;', 'cat-col', 'Not an item SKU'), cells[4]);
            delete row.dataset.processing;
            return;
        }

        // if (!(text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-') || text.startsWith('CP_0_SC-') || text.startsWith('CP_1_SC-'))) return;

        let cleanedSku = text.replace(/^RF_/, '').replace(/^CP_0_/, '').replace(/^CP_1_/, '')
        const href = `/product/items/${cleanedSku}`;
        skuCell.innerHTML = `<a href="${href}" target="_blank">${text}</a>`;

        let in_stock = null;
        let sid = null;
        let item_id = null;
        let category = null;
        let data = itemData[cleanedSku] || manualData[cleanedSku];

        if (!data) {
            console.warn(`PATCHES - Manually fetching data for ${cleanedSku}`);
            if (!fetchPromises[cleanedSku]) {
                fetchPromises[cleanedSku] = (async () => {
                    try {
                        const reportFetch = await fetchItemDetails(cleanedSku);
                        console.debug(`PATCHES - Manually fetched data:`, reportFetch);
                        const fetched = Array.isArray(reportFetch?.data)
                            ? reportFetch.data[0]
                            : reportFetch?.data;

                        if (fetched && (fetched['SID'] || fetched['In_Stock'] || fetched['MAIN_Qty'])) {
                            manualData[cleanedSku] = fetched;
                            console.debug(`PATCHES - Stored manualData for ${cleanedSku}`, fetched);
                            return fetched;
                        } else {
                            console.warn(`PATCHES - No data returned for ${cleanedSku}:`, reportFetch);
                            return null;
                        }
                    } catch (err) {
                        console.error(`PATCHES - Error fetching data for ${cleanedSku}:`, err);
                        return null;
                    } finally {
                        delete fetchPromises[cleanedSku];
                    }
                })();
            }
            data = await fetchPromises[cleanedSku];
        }

        if (data) {
            in_stock = data['MAIN_Qty'] ?? data['In_Stock'] ?? null;
            sid = data['SID'] ?? null;
            item_id = data['Item_ID'] ?? null;
            category = data['Category'] ?? null;
        }

        row.insertBefore(addCell(`<span>${in_stock}</span>`, 'in-stock-col', "Main Quantity of SKU"), cells[4]);
        row.insertBefore(addCell(`<a href="/products/${sid}" target="_blank">${sid}</a>`, 'sid-col', "Link to SID"), cells[4]);
        row.insertBefore(addCell(`<span>${category}</span>`, 'cat-col', "Category"), cells[4]);

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

async function initExportAllRecords() {
    const tableWrapper = document.getElementById('dtTable_wrapper');
    const card = tableWrapper.parentElement.parentElement;
    const card_toolbar = card.querySelector('.card-header > .card-toolbar');

    const spacer = document.createElement('span');
    spacer.setAttribute('style', 'display:flex;flex:1;');
    card_toolbar.prepend(spacer);
    
    const exportAll = document.createElement('button');
    exportAll.type = 'button';
    exportAll.classList.add('btn', 'btn-warning', 'btn-sm');
    exportAll.title = 'This downloads all records, not just the page.';
    exportAll.textContent = 'Export All';
    exportAll.addEventListener('click', async () => {
        exportAll.disabled = true;
        try {
            await downloadAllRecords();
        } catch (err) {
            console.error(err);
        }
        exportAll.disabled = false;
    });
    card_toolbar.prepend(exportAll);

    async function downloadAllRecords() {
        const CHUNK_SIZE = 3000;
        const allData = [];
        const buildParams = (start, length) => {

            const params = new URLSearchParams();

            params.append('draw', 1);
            params.append('start', start);
            params.append('length', length);

            params.append('search[value]', '');
            params.append('search[regex]', false);

            const footerCells = document.querySelectorAll('#dtfoot th');

            for (let i = 0; i < footerCells.length; i++) {

                const input = footerCells[i].querySelector('input, select');
                const value = input ? input.value.trim() : '';

                params.append(`columns[${i}][data]`, i);
                params.append(`columns[${i}][name]`, '');
                params.append(`columns[${i}][searchable]`, true);
                params.append(`columns[${i}][orderable]`, true);
                params.append(`columns[${i}][search][value]`, value);
                params.append(`columns[${i}][search][regex]`, false);
            }

            params.append('v', Date.now());

            return params;
        };

        try {
            const firstUrl = `/datatables/storelogs?${buildParams(0, 1).toString()}`;
            const firstResponse = await fetch(firstUrl);

            if (!firstResponse.ok) { throw new Error(`Initial fetch failed: ${firstResponse.status}`); }

            const firstData = await firstResponse.json();
            const totalRecords = firstData.recordsFiltered || firstData.recordsTotal;

            console.debug('PATCHES Total records:', totalRecords);

            let start = 0;
            while (start < totalRecords) {
                console.debug(`Fetching ${start} → ${start + CHUNK_SIZE}`);

                const url = `/datatables/storelogs?${buildParams(start, CHUNK_SIZE).toString()}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Chunk fetch failed at ${start}: ${response.status}`);
                }

                const data = await response.json();
                if (Array.isArray(data.data)) { allData.push(...data.data); }

                start += CHUNK_SIZE;
            }

            console.debug('PATCHES - Finished fetching all records.', allData);
            exportStoreLogsToCSV(allData);
            return allData;

        } catch (error) {
            console.error('PATCHES - Download failed:', error);
        }

        function exportStoreLogsToCSV(allData) {

            const rows = [];

            rows.push(["Store","Store ID","Reference","Type","Details JSON","Timestamp"]);

            for (const row of allData) {

                const parser = new DOMParser();

                const col1 = row[1];
                const col2 = row[2];
                const col3 = row[3];
                const col4 = row[4];

                let jsonString = '';
                if (row[5]) {
                    const doc = parser.parseFromString(row[5], 'text/html');
                    const items = doc.querySelectorAll('.json__item');

                    const obj = {};

                    items.forEach(item => {
                        const key = item.querySelector('.json__key')?.textContent?.trim();
                        const value = item.querySelector('.json__value')?.textContent?.trim();
                        if (key) obj[key] = value;
                    });

                    jsonString = JSON.stringify(obj);
                }

                let timestamp = '';
                if (row[6]) {
                    const doc = parser.parseFromString(row[6], 'text/html');
                    const span = doc.querySelector('span');
                    timestamp = span?.getAttribute('title') || '';
                }

                rows.push([
                    col1,
                    col2,
                    col3,
                    col4,
                    jsonString,
                    timestamp
                ]);
            }

            const csvContent = rows
                .map(r =>
                    r.map(field => {
                        if (field === null || field === undefined) return '';
                        const escaped = String(field).replace(/"/g, '""');
                        return `"${escaped}"`;
                    }).join(',')
                )
                .join('\n');

            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `storelogs_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            console.log('PATCHES - CSV export complete.');
        }
    }
}

async function initErrorLogPatch() {
    toggleLDtTableoad('inherit');
    await itemDetailsInit();
    prettyLinkSkus();
    toggleLDtTableoad('none');
    const wrapper = document.getElementById('dtTable_wrapper');
    if (wrapper) {
        const observer = new MutationObserver(() => {
            clearTimeout(observer._debounce);
            observer._debounce = setTimeout(prettyLinkSkus, 500);
        });

        observer.observe(wrapper, { childList: true, subtree: true });
    }
    initExportAllRecords();
}

setTimeout(initErrorLogPatch, 150);