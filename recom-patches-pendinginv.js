async function checkPics() {
	const table = document.getElementById('dtTable_wrapper');
    if (!table) {
        return false;
    }

	const products = table.querySelectorAll('[data-url^="ajax/modals/productitems/"]');

	for (const product of products) {
		const url = product.getAttribute('data-url');
        const id = url.split('/').pop();

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			const img = doc.querySelector('img');
			if (img) {
				let parent = product.parentElement;
				parent.innerHTML = `<a href="/products/${id}" data-url="${url}" class="ajax-modal">
                    <img src="${img.src}" style="width:42px; height:42px; display:inline-block; margin-right:1rem;">
                </a>
                <div style="display: flex; flex-direction: column;">${parent.innerHTML}</div>`;
				parent.setAttribute('style', 'display: inline-flex; flex-direction: row; align-items: center');
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
                const data = await fetchReport(params);
                console.debug('PATCHES - report data:', data);

                const kt_app_content = document.getElementById('kt_app_content');
                if (kt_app_content) { keywordSearchReplaceTable(data.data) }
            } catch (err) {
                console.error('PATCHES - fetchReport failed:', err);
                fireSwal('Fetching Error', 'Error while fetching data.', 'error');
            }
        } else {
            fireSwal('Missing Params', 'Unable to fetch parameter values for keyword pending inventory search.', 'error');
        }
    }

    async function fetchReport(params) {
        // time to build a report
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            
            var request = {
                report: {
                    type: "pending_inventory",
                    columns: [
                        "purchase_orders.id",
                        "inventory_receiving.keyword",
                        "inventory_receiving.quantity",
                        "queue_inventory.quantity_approved",
                        "inventory_receiving.location",
                        "inventory_receiving.created_at",
                        "products.sid",
                        "products.name",
                        "inventory_receiving.condition_id",
                        "products.category_id",
                        "products.mpn",
                        "products.gtin",
                        "products.asin"
                    ],
                    filters: [
                        {
                            column: "purchase_orders.id",
                            opr: "{0} IN {1}",
                            value: [params['PO #']?.value || null]
                        },
                        {
                            column: "inventory_receiving.keyword",
                            opr: "{0} LIKE '%{1}%'",
                            value: params['Product']?.['Product Name or SKU'] || null
                        }
                    ]
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
        const dtTable = document.getElementById('dtTable');
        const thead = dtTable.querySelector('thead>tr');
        const tfoot = dtTable.querySelector('tfoot>tr');
        const tbody = dtTable.querySelector('tbody');
        if (card && thead && tfoot && tbody) {
            thead.innerHTML = `
            <th style="width: 100%;">Keyword / Product</th>
            <th>PO #</th>
            <th>Quantity<br>Entered</th>
            <th>Quantity<br>Approved</th>
            <th>Sorting<br>Location</th>
            <th>Added<br>By</th>
            <th>Date<br>Entered</th>
            <thActions></th>
            `;

            const tfootth = tfoot.querySelectorAll('th');
            if (tfootth[0]) { tfootth[0].innerHTML = ''; }
            if (tfootth[3]) { tfootth[3].innerHTML = ''; }
            if (tfootth[4]) { tfootth[4].innerHTML = ''; }
            if (tfootth[5]) { tfootth[5].innerHTML = ''; }
            if (tfootth[6]) { tfootth[6].innerHTML = ''; }
            if (tfootth[7]) { tfootth[7].innerHTML = ''; }
            if (tfootth[8]) {
                tfootth[8].querySelector('button.btn-primary')?.remove;
                tfootth[8].querySelector('button.btn-secondary')?.remove;
                const newreset = document.createElement('a');
                newreset.id = 'PATCHES_PIGOBACK';
                newreset.href = '/receiving/queues/inventory';
                newreset.classList = ["btn", "btn-secondary", "btn-sm"];
                newreset.innerHTML = '<span><i class="la la-close"></i><span>Go Back</span></span>';
                if (!document.getElementById('PATCHES_PIGOBACK')) {
                    tfootth[8].appendChild(newreset);
                }
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
                    <div style="display: flex; flex-direction: row; gap: 0.25rem;">
                        <strong>${row['Keyword']}</strong>
                        <a href="/products/${row['SID']}" target="_blank" class="text-muted fw-bold text-muted d-block fs-7">${row['Product_Name']}</a>
                    </div>
                </td>
                <td>${row['PO_Number']}</td>
                <td>${row['Quantity']}</td>
                <td>${row['Approved_Quantity']}</td>
                <td title="API needs to be fixed for this to work.">${row['Sort_Location']}</td>
                <td title="API needs to be fixed for this to work.">N/a</td>
                <td title="API needs to be fixed for this to work.">N/a</td>
                <td></td>`;
                tbody.appendChild(newrow);
                i++;
            });
        }
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
    checkImgButton.classList.add('btn', 'btn-info');
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
    addPictureLocationButton.classList.add('btn', 'btn-secondary');
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
    updatePictureLocationButton.classList.add('btn', 'btn-secondary');
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
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                border-radius: 5px;
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