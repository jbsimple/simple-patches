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

function checkPicsInit() {
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

    const toolbar = picontainer.querySelector('.card-toolbar.flex-row-fluid.justify-content-end');
    if (toolbar && toolbar.classList.contains('justify-content-end')) {
        toolbar.classList.remove('flex-row-fluid', 'justify-content-end');
        toolbar.setAttribute('style', 'flex-direction: row; width: 100%;');

        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        toolbar.prepend(spacer);
        toolbar.prepend(checkImgButton);
    }

    let styleObserver = null;

    function updateButtonState() {
        const wrapper = document.getElementById('dtTable_wrapper');
        const processing = document.getElementById('dtTable_processing');
        const isReady = wrapper && (!processing || processing.style.display === 'none');
        checkImgButton.disabled = !isReady;
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
        updateButtonState();
        observeProcessing();
    });

    globalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}
checkPicsInit();

// a button should be added somewhere to trigger
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
                if (kt_app_content) {
                    const oldcard = kt_app_content.querySelector('#kt_app_content_container > .card.card-flush');
                    const kt_app_content_container = document.getElementById('kt_app_content_container');
                    if (kt_app_content_container && oldcard) {
                        oldcard.style.display = 'none';
                        const newcard = document.createElement('div');
                        newcard.classList.add('card');
                        newcard.innerHTML = `<div class="card-header ribbon ribbon-top" style="padding: 1.25rem 2.15rem; padding-bottom: 0;">
                            <div class="card-title">
                                <h2>Keyword Search Results:</h2>
                            </div>
                            <div class="card-toolbar" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem;">
                                <a href="/receiving/queues/inventory" class="btn btn-lg btn-primary">Back to Pending Inventory</a>
                            </div>
                        </div>`;
                        
                        const tableWrapper = document.createElement('div');
                        tableWrapper.classList.add('card-body');
                        tableWrapper.innerHTML = buildResultsTable(data.data);

                        newcard.appendChild(tableWrapper);
                        kt_app_content_container.appendChild(newcard);
                    }
                }

            } catch (err) {
                console.error('PATCHES - fetchReport failed:', err);
                fireSwal('Fetching Error', 'Error while fetching data.', 'error');
            }
        } else {
            fireSwal('Missing Params', 'Unable to fetch parameter values for keyword pending inventory search.', 'error');
        }
    }

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
    }

    function getValue(el) {
        if (el.tagName === "SELECT") return el.value;
        if (el.type === "checkbox" || el.type === "radio") return el.checked;
        return el.value;
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

    function buildResultsTable(rows) {
        if (!rows || rows.length === 0) {
            return `<p class="text-muted">No results found.</p>`;
        }

        const cols = ["Keyword", "SID", "Product_Name", "Condition", "Quantity", "PO_Number"];

        let html = `<table class="table table-striped table-bordered align-middle">
            <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>`;

        rows.forEach(row => {
            html += "<tr>";
            cols.forEach(col => {
                let value = row[col] ?? "";
                if (col === "SID" && value) {
                    value = `<a href="/products/${encodeURIComponent(value)}" target="_blank">${value}</a>`;
                }
                html += `<td>${value}</td>`;
            });
            html += "</tr>";
        });

        html += "</tbody></table>";
        return html;
    }
}