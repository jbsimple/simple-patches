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

    // pretty tool
    const prettyToolButton = document.createElement('button');
    prettyToolButton.type = 'button';
    prettyToolButton.classList.add('btn', 'btn-primary', 'btn-sm');
    prettyToolButton.title = 'Tool to take exported reports, upload them and do the combining.';
    prettyToolButton.textContent = 'Pretty Tool';
    prettyToolButton.addEventListener('click', async () => {
        const body = `
		        <h3 class="page-heading d-flex flex-column justify-content-center text-dark fw-bold fs-3" style="margin-bottom: 1.5rem; text-align: center;">The New (and less improved) Pretty Print for Errors.</h3>
		        
		        <div class="d-flex flex-column mb-8">
		            <p class="fs-6 fw-bold">How to use:</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>1</b>: Generate a product items report with at least the SKU column present. Add any other columns you want to appear in the final report.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>2</b>: Get the error logs report by getting a list and then exporting the page. The main report doesn't work properly, so use Export Page. This means filters and the like for specific errors can be done before making the final combined list.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><b>3</b>: Click or drag & drop to upload then hit submit. This tool will combine the two reports and then generate a new file combined.</p>
		            <p class="fs-6 fw-semibold form-label mb-2"><i>* For the best results, generate a product items report of everything in the system, in stock greater than or equal to 1,000. It takes a while to generate, but it is enqueued now so it won't harm system performance. It just takes 10 minutes to generate.</i></p>
		        </div>
		        
				    <div class="mb-5" style="display:flex;flex-direction:row;gap:1.25rem">
				    		<div style="display:flex;flex-direction:column;gap:0.25rem;flex:1;">
						        <label class="form-label fw-bold">Product Items Report</label>
						        <input type="file" id="patches_prettyTool_productItems" class="form-control" accept=".csv,text/csv">
						    </div>
						    <div style="display:flex;flex-direction:column;gap:0.25rem;flex:1;">
						        <label class="form-label fw-bold">Error Logs</label>
						        <input type="file" id="patches_prettyTool_errorLogs" class="form-control" accept=".csv,text/csv">
						    </div>
						    
				    </div>
				`;

        const footer = `
		        <div class="text-center">
		            <button type="button" class="btn btn-light me-3" data-modal-close>Cancel</button>
		            <button type="button" id="patches_prettyTool_submit" class="btn btn-primary">
		                <span class="indicator-label">Submit</span>
		                <span class="indicator-progress" style="display: none;">Please wait...
		                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
		                </span>
		            </button>
		        </div>
		    `;

        const modal = openPatchesModal({
            id: 'patch_prettyTool_fullModal',
            title: 'Pretty Tool',
            body,
            footer,
            width: '800px',
            focus: null,
            escapeBlockedWhen: (ae) => ae
        });

        if (!modal) return;

        const submit = modal.find('#patches_prettyTool_submit');
        if (!submit) return;

        submit.onclick = async function() {
            const baseUrl = window.location.origin;
            const productItemsFile = modal.find('#patches_prettyTool_productItems')?.files?.[0];
            const errorLogsFile = modal.find('#patches_prettyTool_errorLogs')?.files?.[0];

            if (!productItemsFile || !errorLogsFile) {
                alert('Please select both CSV files.');
                return;
            }

            try {
                const [productItemsText, errorLogsText] = await Promise.all([
                    readCsvFile(productItemsFile),
                    readCsvFile(errorLogsFile)
                ]);

                const productKeys = Object.keys(productItemsText[0] || {});

                const productLookup = new Map(
                    productItemsText.map(product => [
                        normalizeSku(product.SKU),
                        product
                    ])
                );

                const combined = errorLogsText.map(errorRow => {
                    const sku = normalizeSku(
                        errorRow.Ref ??
                        errorRow['ENTRY REF']
                    );

                    const productRow = productLookup.get(sku);

                    if (productRow) {
                        const enhancedProductRow = {
                            ...productRow
                        };

                        return {
                            "SKU": enhancedProductRow.SKU ?? '',
                            "SKU URL": enhancedProductRow.SKU ?
                                `${baseUrl}/product/items/${encodeURIComponent(enhancedProductRow.SKU)}` :
                                '',

                            "SID": enhancedProductRow.SID ?? '',
                            "SID URL": enhancedProductRow.SID ?
                                `${baseUrl}/products/${encodeURIComponent(enhancedProductRow.SID)}` :
                                '',

                            ...Object.fromEntries(
                                Object.entries(enhancedProductRow)
                                .filter(([key]) => key !== 'SKU' && key !== 'SID')
                            ),
                            ...errorRow
                        };
                    }

                    const blankProductRow = Object.fromEntries(
                        productKeys.map(key => [key, ''])
                    );

                    blankProductRow.SKU = sku;

                    return {
                        "SKU": sku,
                        "SKU URL": sku ?
                            `${baseUrl}/product/items/${encodeURIComponent(sku)}` :
                            '',

                        "SID": '',
                        "SID URL": '',

                        ...Object.fromEntries(
                            Object.entries(blankProductRow)
                            .filter(([key]) => key !== 'SKU' && key !== 'SID')
                        ),

                        ...errorRow
                    };
                });

                console.log(combined);

                const csv = arrayToCsv(combined);

                const blob = new Blob([csv], {
                    type: 'text/csv;charset=utf-8;'
                });

                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `error-logs-pretty-${Date.now()}.csv`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);

            } catch (err) {
                console.error('Failed to read files:', err);
                alert('Failed to read one or more files.');
            }
        }

        async function readCsvFile(file) {
            let text = await file.text();

            text = text.replace(/^\uFEFF/, '');
            text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            const lines = text
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            if (lines.length < 2) {
                return [];
            }

            const headers = parseCsvLine(lines[0]);

            return lines.slice(1).map(line => {
                const values = parseCsvLine(line);

                const row = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] ?? '';
                });

                return row;
            });
        }

        function parseCsvLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            result.push(current.trim());
            return result;
        }

        function arrayToCsv(rows) {
            if (!rows || !rows.length) {
                return '';
            }

            const headers = [...new Set(
                rows.flatMap(row => Object.keys(row))
            )];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) {
                    return '';
                }

                value = String(value);

                if (
                    value.includes(',') ||
                    value.includes('"') ||
                    value.includes('\n') ||
                    value.includes('\r')
                ) {
                    return `"${value.replace(/"/g, '""')}"`;
                }

                return value;
            };

            const csvRows = [
                headers.map(escapeCsv).join(',')
            ];

            rows.forEach(row => {
                csvRows.push(
                    headers
                    .map(header => escapeCsv(row[header]))
                    .join(',')
                );
            });

            return csvRows.join('\r\n');
        }

    });
    card_toolbar.prepend(prettyToolButton);

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
}, 300);