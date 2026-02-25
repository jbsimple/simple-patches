async function checkPics() {
	const table = document.getElementById('dtTable_wrapper');
    if (!table) {
        return false;
    }
    const items = table.querySelectorAll('a[href^="product/items/"]');

	for (const item of items) {
        let url = `${item.href}?v=${Date.now()}`;
        let itemId = item.href.split('/').pop();

        let parent = item.parentElement;

        let productModal = parent.querySelector('[data-url^="ajax/modals/productitems/"]');
        let productUrl = productModal.getAttribute('data-url');
        let productId = productUrl.split('/').pop();

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

            const imgcont = doc.querySelector('a[data-type="image"]');
            if (imgcont) {
                const img = imgcont.querySelector('img');
                if (img) {
                    parent.innerHTML = `<div style="display: flex; flex-direction: row; align-items: center;">
                        <a href="/products/${productId}" data-url="${productUrl}" class="ajax-modal">
                            <img src="${img.src}" style="width:42px; height:42px; display:inline-block; margin-right:1rem;">
                        </a>
                        <div style="display: flex; flex-direction: column;">${parent.innerHTML}</div>
                    </div>`;

                    const row = parent.parentElement;
                    const src = img.src.toLowerCase();
                    if (row && pictureWarnings.some(w => src.includes(w))) {
                        const conditionSelect = doc.querySelector('select[name="item[condition_id]"');
                        if (conditionSelect) {
                            const selectedValue = parseInt(conditionSelect.value, 10);
                            const flagConditions = [1,2,3,4,5,6,7,8,9,18,31,32,34,35,38,39,42,44,45,49,71,92,94,95,99];
                            if (flagConditions.includes(selectedValue)) {
                                row.classList.add('danger');
                            }
                        }
                    }
                    
                } else {
                    console.log('No image found in querySelect for URL:', url);
                }
            } else {
                console.log('No image found in response for URL:', url);
            }
		} catch (error) {
			console.error('Failed to fetch or parse URL:', url, error);
		}
	}
}

async function updateLocations(to, from = null) {
    const table = document.getElementById('dtTable_wrapper');
    if (!table) {
        return false;
    }

    let locations = [];
    const selectedCheck = table.querySelectorAll('tr.selected');
    if (selectedCheck && selectedCheck.length > 0) {
        locations = table.querySelectorAll('tr.selected > td > [href^="javascript:quickCreate(\'Update Sorting Location\',\'ajax/actions/updateSortingLocation/"]');
    } else {
        locations = table.querySelectorAll('[href^="javascript:quickCreate(\'Update Sorting Location\',\'ajax/actions/updateSortingLocation/"]');
    }

    const log = [];
    for (const location of locations) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        const href = location.getAttribute('href');
        const match = href.match(/updateSortingLocation\/(\d+)/);
        if (match && csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            const id = match[1];
            const currentLocation = location.textContent.trim();

            let value = '';
            if (from !== null && from !== '') {
                value = currentLocation.replace(new RegExp(from, 'gi'), to).trimEnd();
            } else {
                value = `${to} ${currentLocation}`.trimEnd();
            }

            let ajax = `/ajax/actions/updateSortingLocation/${id}`;
            const formData = new FormData();
            formData.append('name', value);

            try {
                const postRes = await fetchJsonWithTimeout(ajax,
                    {
                        method: 'POST',
                        headers: { 'x-csrf-token': csrfToken },
                        body: formData
                    }
                );

                const ok = postRes.ok && (postRes.data?.success === true);
                const newLog = {
                    id,
                    success: ok,
                    message: postRes.data?.message || (ok ? 'Successful' : (postRes.timedOut ? `POST timed out after ${TIMEOUT_MS} ms` : (postRes.error?.message || 'Fail')))
                };
                log.push(newLog);

            } catch (err) {
                const newLog = {
                    id,
                    success: false,
                    message: `POST failed: ${err.message}`
                };
                log.push(newLog);
            }
        }
    }
    console.debug('PATCHES - Log:', log);
    fireSwal('Update Done', `Successfully Updated ${log.length} to PUTAWAYS.`, 'success', true);
}

/* helper function */
function fetchFieldValues(field) {
    const inputs = field.querySelectorAll('input, select, textarea');
    if (!inputs.length) return null;

    const values = {};
    inputs.forEach(el => {
        let key = el.getAttribute("placeholder")?.trim();
        if (!key) key = el.getAttribute("name")?.trim();
        if (!key) key = "value";

        values[key] = getValue(el);
    });
    return values;

    function getValue(el) {
        if (el.tagName === "SELECT") return el.value;
        if (el.type === "checkbox" || el.type === "radio") return el.checked;
        return el.value;
    }
}

async function keywordSearch() {
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
    toggleLoad('inherit');
    const dtfoot = document.getElementById('dtfoot');
    const dtTable = document.getElementById('dtTable');
    const params = {};
    if (dtfoot && dtTable) {
        const indexes = dtTable.querySelector('thead')?.querySelectorAll('th');
        const fields = dtfoot.querySelectorAll('th');
        fields.forEach((field, index) => {
            const key = indexes[index].textContent.trim() ?? index;
            const values = fetchFieldValues(field);
            if (values && Object.keys(values).length > 0) {
                params[key] = values;
            }
        });

        console.debug('PATCHES - dtfoot params:', params);

        const poVal = params['PO #']?.value || params['PO #']?.['PO #'] || "";
        if (!poVal || poVal.trim() === "") {
            console.error("PATCHES - PO # is required.");
            fireSwal('Missing PO #', 'In order to do a keyword search, you need to provide a PO #.', 'error');
            return;
        }

        if (Object.keys(params).length > 0) {
            try {
                const piData = await fetchPIReport(params);
                console.debug('PATCHES - PI Report data:', piData);

                const epData = await fetchEPReport(params);
                console.debug('PATCHES - EP Report data:', epData);
                const parsedEpData = Object.fromEntries(
                    epData.data.map(item => [`${item.Event_ID}`, item])
                );

                let parsedPiData = piData.data;
                parsedPiData.forEach(line => {
                    const key = `${line['ID']}`;
                    const epLine = parsedEpData[key];

                    if (epLine) {
                        Object.assign(line, epLine);
                    } else {
                        console.warn(`No EP data found for key: ${key}`);
                    }
                });

                console.debug('PATCHES - parsedPiData:', parsedPiData);

                const kt_app_content = document.getElementById('kt_app_content');
                if (kt_app_content) { keywordSearchReplaceTable(parsedPiData) }
            } catch (err) {
                console.error('PATCHES - fetchReport failed:', err);
                fireSwal('Fetching Error', 'Error while fetching data.', 'error');
                toggleLoad('none');
            }
        } else {
            fireSwal('Missing Params', 'Unable to fetch parameter values for keyword pending inventory search.', 'error');
        }
    }

    async function fetchEPReport(params) {
        // time to build a report
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');

            const today = new Date();
            const past = new Date();
            past.setFullYear(today.getFullYear() - 1);
            const formatDate = (date) => {
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${mm}/${dd}/${yyyy}`;
            };
            const range = `${formatDate(past)} - ${formatDate(today)}`;

            var request = {
                report: {
                    type: "user_clock",
                    columns: [
                        "user_clock_activity.activity_id",
                        "products.sid",
                        "product_items.sku",
                        "product_items.condition_id",
                        "inventory_receiving.condition_id"
                    ],
                    filters: [
                        {
                            column: "user_clocks.clock_date",
                            opr: "between",
                            value: range
                        },
                        {
                            column: "user_clock_activity.activity_code",
                            opr: "{0} = '{1}'",
                            value: "receiving_add"
                        },
                        {
                            column: "purchase_orders.id",
                            opr: "{0} IN {1}",
                            value: [params['PO #']?.value || null]
                        }
                    ]
                },
                csrf_recom: csrfToken
            };

            console.debug('PATCHES - Fetching EP report:', request);

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

    async function fetchPIReport(params) {
        // time to build a report
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');

            let filters = [
                {
                    column: "purchase_orders.id",
                    opr: "{0} IN {1}",
                    value: [params['PO #']?.value || null]
                }
            ];

            let keyword = null;
            if (params['Product']?.['Product Name or SKU']) {
                keyword = params['Product']['Product Name or SKU'];
            } else if (params['Keyword / Product']?.['Keywords']) {
                keyword = params['Keyword / Product']['Keywords'];
            } else if (params['Keyword']?.['Keywords']) {
                keyword = params['Keyword']['Keywords'];
            }
            filters.push({
                column: "inventory_receiving.keyword",
                opr: "{0} LIKE '%{1}%'",
                value: keyword
            });


            if (params['QuantityEntered']?.['From']) {
                filters.push({
                    column: "inventory_receiving.quantity",
                    opr: "{0} >= {1}",
                    value: params['QuantityEntered']['From']
                });
            } else if (params['QuantityEntered']?.['To']) {
                filters.push({
                    column: "inventory_receiving.quantity",
                    opr: "{0} <= {1}",
                    value: params['QuantityEntered']['To']
                });
            }

            if (params['QuantityApproved']?.['From']) {
                filters.push({
                    column: "queue_inventory.quantity_approved",
                    opr: "{0} >= {1}",
                    value: params['QuantityApproved']['From']
                });
            } else if (params['QuantityApproved']?.['To']) {
                filters.push({
                    column: "queue_inventory.quantity_approved",
                    opr: "{0} <= {1}",
                    value: params['QuantityApproved']['To']
                });
            }
            
            var request = {
                report: {
                    type: "pending_inventory",
                    columns: [
                        "purchase_orders.id",
                        "inventory_receiving.id",
                        "inventory_receiving.keyword",
                        "inventory_receiving.quantity",
                        "queue_inventory.quantity_approved",
                        "inventory_receiving.location",
                        "inventory_receiving.created_at",
                        "user_profile.user_id",
                        "products.sid",
                        "products.name",
                        "inventory_receiving.condition_id",
                        "products.category_id",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ],
                    filters: filters
                },
                csrf_recom: csrfToken
            };

            console.debug('PATCHES - Fetching report:', request);

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

    function keywordSearchReplaceTable(rows) {
        // replace default enter press
        $("body").off("keypress");
        $("body").on("keypress", function (e) {
            if (e.which === 13) {
                e.preventDefault();
                keywordSearch();
            }
        });
        
        const dtTable = document.getElementById('dtTable');
        const tbody = dtTable.querySelector('tbody');
        if (tbody) {
            if (!dtTable.hasAttribute('Patched')) {

                let parent = dtTable;
                do {
                    parent = parent.parentElement;
                } while (parent && !parent.matches('.card.card-flush'));

                if (parent) {
                    parent.querySelector('.card-header')?.style.setProperty('display', 'none');
                    parent.querySelector('.dataTables_wrapper > .row')?.style.setProperty('display', 'none');
                }

                const thead = dtTable.querySelector('thead>tr');
                const tfoot = dtTable.querySelector('tfoot>tr');
                if (thead) {
                    thead.innerHTML = `
                        <th>Keyword / Product</th>
                        <th>PO #</th>
                        <th>Quantity<br>Entered</th>
                        <th>Quantity<br>Approved</th>
                        <th>Sorting<br>Location</th>
                        <th>Added<br>By</th>
                        <th>Date<br>Entered</th>
                        <th>Actions</th>
                    `;
                }
                if (tfoot) {
                    const tfootth = tfoot.querySelectorAll('th');
                    if (tfootth[0]) { tfootth[0].remove(); }
                    if (tfootth[1]) { tfootth[1].querySelector('input')?.setAttribute('placeholder', 'Keywords'); }
                    if (tfootth[5]) { tfootth[5].innerHTML = ''; }
                    if (tfootth[6]) { tfootth[6].innerHTML = ''; }
                    if (tfootth[7]) { tfootth[7].innerHTML = ''; }
                    if (tfootth[8]) {
                        tfootth[8].querySelector('button.btn-primary')?.remove();
                        tfootth[8].querySelector('button.btn-secondary')?.remove();
                        tfootth[8].querySelectorAll('br').forEach(br => br.remove());

                        const newreset = document.createElement('a');
                        newreset.href = '/receiving/queues/inventory';
                        newreset.className = 'btn btn-secondary btn-sm';
                        newreset.innerHTML = '<span><i class="la la-close"></i><span>Go Back</span></span>';
                        tfootth[8].appendChild(newreset);
                        console.debug('PATCHES - Please add the goback button? Where:', tfootth[8]);
                    }
                }
                dtTable.setAttribute('Patched' , 'true');
            }

            tbody.innerHTML = '';
            let i = 1;
            rows.forEach(row => {
                const newrow = document.createElement('tr');
                if (i % 2 === 1) {
                    newrow.classList = 'odd';
                } else {
                    newrow.classList = 'even';
                }
                
                newrow.innerHTML = `<!-- NEW THEAD -->
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <strong>${row['Keyword']}</strong>
                        ${(row['SKU']) ? `<a href="/product/items/${row['SKU']}" target="_blank">${row['SKU']}</a>` : ''}
                        <a href="/products/${row['SID']}" target="_blank" class="text-muted fw-bold text-muted d-block fs-7">${row['Product_Name']}</a>
                    </div>
                </td>
                <td>${row['PO_Number']}</td>
                <td>${row['Quantity'] ?? '-1'}</td>
                <td>${row['Approved_Quantity'] ?? '0'}</td>
                <td><a href="javascript:quickCreate('Update Sorting Location','ajax/actions/updateSortingLocation/${row['Event_ID']}', true);">${row['Sort_Location']}</a></td>
                <td>${row['User'] ?? 'N/a'}</td>
                <td>${row['Created_Date'] ?? 'N/a'}</td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                        <a class="btn btn-icon btn-info btn-sm my-sm-1 ms-1" data-bs-toggle="tooltip" aria-label="View in FBA Check" data-bs-original-title="View in FBA Check" data-kt-initialized="1" href="/receiving/queues/fba-check?column=0&amp;keyword=${row['SKU']}" target="_blank"><i class="fas fa-shipping-fast"></i></a>
                        <a class="btn btn-icon btn-success btn-sm my-sm-1 ms-1" data-bs-toggle="tooltip" aria-label="View in Pending Inventory" data-bs-original-title="View in Pending Inventory" data-kt-initialized="1" href="/receiving/queues/inventory?column=1&amp;keyword=${row['SKU']}" target="_blank"><i class="fas fa-boxes"></i></a>
                    </div>
                </td>`;
                tbody.appendChild(newrow);
                i++;
            });
        }
        toggleLoad('none');
    }
}

function bulkUpdatePicToPutLoc() {
    const dtfoot = document.getElementById('dtfoot');
    const dtTable = document.getElementById('dtTable');
    const params = {};
    if (autoLocationUpdate && dtfoot && dtTable) {
        const indexes = dtTable.querySelector('thead')?.querySelectorAll('th');
        const fields = dtfoot.querySelectorAll('th');
        fields.forEach((field, index) => {
            const key = indexes[index].textContent.trim() ?? index;
            const values = fetchFieldValues(field);
            if (values && Object.keys(values).length > 0) {
                params[key] = values;
            }
        });
    }
}

function initToolbarButtons() {
    const picontainer = document.getElementById('kt_app_content_container');
    if (!picontainer) return;

    const checkImgButton = document.createElement('button');
    checkImgButton.classList.add('btn', 'btn-info', 'btn-sm');
    checkImgButton.id = 'patch_openAllImages';
    checkImgButton.textContent = 'Check Images';
    checkImgButton.disabled = true;
    checkImgButton.title = "Loads image icons in queue.";
    checkImgButton.style.cssText = `
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 5px;
    `;
    checkImgButton.onclick = checkPics;

    const addPictureLocationButton = document.createElement('button');
    addPictureLocationButton.classList.add('btn', 'btn-secondary', 'btn-sm');
    addPictureLocationButton.id = 'patch_adjustPictureLocation';
    addPictureLocationButton.textContent = 'Add Picture Locations';
    addPictureLocationButton.disabled = true;
    addPictureLocationButton.title = "Add Results or Selected Entries with Picture Location.";
    addPictureLocationButton.style.cssText = `
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 5px;
    `;
    addPictureLocationButton.onclick = () => updateLocations('PICTURES');

    const updatePictureLocationButton = document.createElement('button');
    updatePictureLocationButton.classList.add('btn', 'btn-secondary', 'btn-sm');
    updatePictureLocationButton.id = 'patch_adjustPictureLocation';
    updatePictureLocationButton.textContent = 'Update Picture Locations';
    updatePictureLocationButton.disabled = true;
    updatePictureLocationButton.title = "Update Results or Selected Entries with Picture Location.";
    updatePictureLocationButton.style.cssText = `
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 5px;
    `;
    updatePictureLocationButton.onclick = () => updateLocations('PUTAWAYS', 'PICTURES');

    const toolbar = picontainer.querySelector('.card-toolbar.flex-row-fluid.justify-content-end');
    if (toolbar && toolbar.classList.contains('justify-content-end')) {
        toolbar.classList.remove('flex-row-fluid', 'justify-content-end');
        toolbar.setAttribute('style', 'flex-direction: row; width: 100%;');

        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        toolbar.prepend(spacer);
        toolbar.prepend(updatePictureLocationButton);
        toolbar.prepend(checkImgButton);
    }
    
    let styleObserver = null;

    function initKeywordSearch(isReady) {
        const btnContainer = document.getElementById('dtsearchbtns');
        if (!btnContainer) return;

        if (!isReady) return;

        if (!document.getElementById('patch_searchKeywordEntries')) {
            const keywordSearchButton = document.createElement('button');
            keywordSearchButton.classList.add('btn', 'btn-success', 'btn-sm');
            keywordSearchButton.id = 'patch_searchKeywordEntries';
            keywordSearchButton.innerHTML = '<span><i class="la la-search" style="margin-right: 0.25rem;"></i><span>Keywords</span></span>';
            keywordSearchButton.disabled = true;
            keywordSearchButton.title = "Searches by listing keywords.";
            keywordSearchButton.style.cssText = `
                color: white;
                margin-top: 0.5rem;
            `;
            keywordSearchButton.onclick = keywordSearch;

            btnContainer.setAttribute('style', 'display: table-cell !important;');
            btnContainer.appendChild(document.createElement('br'));
            btnContainer.appendChild(keywordSearchButton);
        }
    }

    function updateButtonState() {
        const wrapper = document.getElementById('dtTable_wrapper');
        const processing = document.getElementById('dtTable_processing');
        const isReady = wrapper && (!processing || processing.style.display === 'none');

        checkImgButton.disabled = !isReady;
        updatePictureLocationButton.disabled = !isReady;

        const keywordBtn = document.getElementById('patch_searchKeywordEntries');
        if (keywordBtn) keywordBtn.disabled = !isReady;

        return isReady;
    }

    function observeProcessing() {
        const processing = document.getElementById('dtTable_processing');
        if (processing) {
            if (styleObserver) styleObserver.disconnect();
            styleObserver = new MutationObserver(updateButtonState);
            styleObserver.observe(processing, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }

    const globalObserver = new MutationObserver(() => {
        initKeywordSearch(updateButtonState()); // this looks cursed
        observeProcessing();
    });

    globalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}
initToolbarButtons();