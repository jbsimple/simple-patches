setTimeout(async function() {
    const tableWrapper = document.getElementById('dtTable_wrapper');
    const card = tableWrapper.parentElement.parentElement;
    const card_toolbar = card.querySelector('.card-header > .card-toolbar');

    const spacer = document.createElement('span');
    spacer.setAttribute('style', 'display:flex;flex:1;');
    card_toolbar.prepend(spacer);

    const normalizeSku = (value) => {
        value = String(value || '').trim();

        const scIndex = value.indexOf('SC-');
        return scIndex >= 0 ? value.substring(scIndex) : value;
    };

    const jumpToReport = document.createElement('button');
    jumpToReport.type = 'button';
    jumpToReport.classList.add('btn', 'btn-primary', 'btn-sm');
    jumpToReport.title = 'Tool to take exported reports, upload them and do the combining.';
    jumpToReport.textContent = 'Pretty Tool';
    jumpToReport.addEventListener('click', async () => {
        window.open('/reports?template=errorlogsalltime', '_blank');
    });
    card_toolbar.prepend(jumpToReport);

    // list delete
    const bulkIADButton = document.createElement('button');
    bulkIADButton.type = 'button';
    bulkIADButton.classList.add('btn', 'btn-danger', 'btn-sm');
    bulkIADButton.title = 'Tool to take a list of line ids to ignore and delete.';
    bulkIADButton.textContent = 'List Delete';
    bulkIADButton.addEventListener('click', async () => {
        const body = `
		        <h3 class="page-heading d-flex flex-column justify-content-center text-dark fw-bold fs-3" style="margin-bottom: 1.5rem; text-align: center;">Bulk Ignore and Delete.</h3>
		        
		        <div class="d-flex flex-column mb-8">
		            <p class="fs-6 fw-bold">How to use:</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>1</b>: From a page export, the first column "ID" (not ENTRY ID), get a list of those.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>2</b>: Paste that list either comma separated or new line separated below.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>3</b>: Submit and wait. This takes a while depending on how many you add.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><i>* For the best results, keep it in batches of 1000 or less.</i></p>
		        </div>
		        
				    <div class="mb-5">
				    		<label class="form-label fw-bold">List of IDs:</label>
				    		<textarea id="patches_bulkIAD_ids" class="form-control" rows="10" placeholder="12345, 12346, 12347&#10;or&#10;12345&#10;12346&#10;12347"></textarea>
				    </div>
				`;

        const footer = `
		        <div class="text-center">
		            <button type="button" class="btn btn-light me-3" data-modal-close>Cancel</button>
		            <button type="button" id="patches_bulkIAD_submit" class="btn btn-primary">
		                <span class="indicator-label">Submit</span>
		                <span class="indicator-progress" style="display: none;">Please wait...
		                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
		                </span>
		            </button>
		        </div>
		    `;

        const modal = openPatchesModal({
            id: 'patches_bulkIAD_fullModal',
            title: 'Bulk Ignore and Delete',
            body,
            footer,
            width: '800px',
            focus: null,
            escapeBlockedWhen: (ae) => ae
        });

        if (!modal) return;

        const submit = modal.find('#patches_bulkIAD_submit');
        if (!submit) return;

        submit.onclick = async function() {
            const textarea = modal.find('#patches_bulkIAD_ids');
            if (!textarea) return;

            const ids = textarea.value
                .split(/[\n,]+/) // split on commas OR newlines
                .map(v => v.trim())
                .filter(Boolean) // remove blanks
                .filter(v => /^\d+$/.test(v)); // keep only numeric IDs

            if (ids.length === 0) {
                fireSwal('UHOH', 'No valid IDs were found.', 'error');
                return;
            }

            const url = `/ajax/actions/BulkActions/store_logs`;
            const CHUNK_SIZE = 200;

            const csrf_token = document.querySelector('meta[name="X-CSRF-TOKEN"]')?.getAttribute('content')?.trim();

            try {
                for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
                    const chunk = ids.slice(i, i + CHUNK_SIZE);

                    const formData = new FormData();
                    for (const id of chunk) {
                        formData.append('ids[]', id);
                    }
                    formData.append('action', 'delete-log');

                    const request = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'X-Csrf-Token': csrf_token,
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: formData
                    });

                    const response = await request.json();

                    if (!request.ok || !response.success) {
                        throw new Error(response.message || `HTTP ${request.status}`);
                    }

                    console.debug(`Processed chunk ${Math.floor(i / CHUNK_SIZE) + 1}`, response);

                }

                fireSwal('Done', 'IDs have been ignored and deleted.', 'success', true);
                return {
                    success: true
                };
            } catch (err) {
                console.error('Error with bulk Ignore and Delete:', err);
                fireSwal('UHOH', ['Error with bulk Ignore and Delete:', err.message], 'error');
                return {
                    success: false,
                    message: err.message
                }
            }
        }
    });
    card_toolbar.prepend(bulkIADButton);

    // pretty print the links
    function prettyLinkSkus() {
        const skuEvents = ["Item Feed", "Remove Item", "Adjust Inventory", "Adjust Price", "Delete Item", "Remove Item", "Adjust Inventory", "Update Item", "Create Item"];

        const dtTable = document.getElementById('dtTable');
        if (!dtTable) return;

        const dtBody = dtTable.querySelector('tbody');
        if (!dtBody) return;

        const dtRows = dtBody.querySelectorAll('tr');

        dtRows.forEach(tr => {
            const td = tr.querySelectorAll('td');
            if (td.length < 5) return;
            if (td[3].querySelector('a')) return;

            if (skuEvents.includes(td[4].textContent.trim())) {
                td[3].innerHTML =
                    `<a target="_blank" href="/product/items/${normalizeSku(td[3].textContent)}">${td[3].textContent}</a>`;
            } else {
                const orderNumber = td[3].textContent.trim();

                const orderClick = document.createElement('a');
                orderClick.textContent = orderNumber;
                orderClick.href = 'javascript:void(0);';

                orderClick.addEventListener('click', async function() {
                    try {
                        const response = await fetch(`/ajax/actions/advancedSearch?keyword=${encodeURIComponent(orderNumber)}`);
                        const data = await response.json();
                        if (data.results?.[0]?.result_id) {
                            window.open(`/orders/${data.results[0].result_id}`, '_blank');
                        } else {
                            fireSwal('UHOH', `Order "${orderNumber}" was not found.`, 'error');
                        }
                    } catch (err) {
                        console.error(err);
                        fireSwal('UHOH', `Order "${orderNumber}" failed to load.`, 'error');
                    }
                });
                td[3].innerHTML = '';
                td[3].appendChild(orderClick);
            }
        });
    }
    setTimeout(prettyLinkSkus, 300);
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#dtsearchbtns')) return;

        clearTimeout(window._prettyLinkTimer);
        window._prettyLinkTimer = setTimeout(prettyLinkSkus, 500);
    });
}, 300);