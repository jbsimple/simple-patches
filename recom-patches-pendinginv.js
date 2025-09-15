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
    if (dtfoot && dtTable) {
        const indexes = dtTable.querySelector('thead')?.querySelectorAll('th');
        const fields = dtfoot.querySelectorAll('th');
        const params = {};
        fields.forEach((field, index) => {
            const key = indexes[index].textContent.trim() ?? index;
            const values = fetchFieldValues(field);
            if (values && Object.keys(values).length > 0) {
                params[key] = values;
            }
        });
        console.debug('PATCHES - dtfoot params:', params);
    }

    if (Object.keys(params).length > 0) {
        try {
            const data = await fetchReport(params);
            console.debug('PATCHES - report data:', data);
        } catch (err) {
            console.error('PATCHES - fetchReport failed:', err);
        }
    } else {
        console.debug('PATCHES - no params provided, skipping fetchReport.');
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
        const csrfToken = document.querySelector('input[name="csrf_recom"]').value;
        
        var request = {
            report: {
                type: "pending_inventory",
                columns: [
                    "purchase_orders.id",
                    "inventory_receiving.keyword",
                    "inventory_receiving.quantity",
                    "queue_inventory.quantity_approved",
                    "inventory_receiving.created_at",
                    "products.sid",
                    "products.name",
                    "product_items.location",
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
                        value: params['PO #']?.value || null
                    },
                    {
                        column: "inventory_receiving.keyword",
                        opr: "({0} IS NULL OR {0} = '')",
                        value: params['Product']?.['Product Name or SKU'] || null
                    },
                    {
                        column: "inventory_receiving.quantity",
                        opr: "BETWEEN {0} AND {1}",
                        value: [
                            params['Quantity']?.['From'] || 0,
                            params['Quantity']?.['To'] || 999999
                        ]
                    }
                ]
            },
            csrf_recom: csrfToken
        };

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
    }
}