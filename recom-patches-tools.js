function initAddTools() {
    addButtonCard(
        'Parse Email List',
        [
            "For Mailchimp, takes a list of emails and then converts it into a csv for importing.",
            "Simple Patches Tool"
        ],
        "https://simple-patches.vercel.app/email-import.html"
    );

    addButtonCard(
        'CDN Uploader',
        [
            "For uploading things to the Simple Patches CDN.",
            "Password Required"
        ],
        "https://simple-patches.vercel.app/api"
    );


    addButtonCard(
        'Valid GTIN Generator',
        [
            "Generate random GTINS that are actually valid, or at least pass GTIN checks for validity.",
            "Simple Patches"
        ],
        "https://simple-patches.vercel.app/gtin%20generator.html"
    );

    addButtonCard(
        'Swappa Inventory Count Checker',
        [
            "Check for any discrepancies between the quantity on Swappa and the quantity on system.",
            "Extension tool"
        ],
        "/tools?tool=swappa"
    );
}

function addButtonCard(title, bullets, href) {
    const toolContainer = document.getElementById('kt_app_content_container');
    const tools = toolContainer.querySelectorAll('.card.card-flush');

    const newToolContainer = document.createElement('div');
    tools.forEach(tool => { newToolContainer.appendChild(tool); });
    toolContainer.innerHTML = newToolContainer.innerHTML;

    let bulletcode = '';
    if (Array.isArray(bullets) && bullets.length > 0) {
        bullets.forEach(bullet => {
            bulletcode += `<div class="d-flex align-items-center py-2">
                <span class="bullet bg-primary me-3"></span>
                <span>${bullet}</span>
            </div>`;
        })
    }

    // add new button
    const emailCard = `<div class="card card-flush h-md-100">
                <!--begin::Card header-->
                <div class="card-header">
                    <!--begin::Card title-->
                    <div class="card-title">
                        <h2>${title}</h2>
                    </div>
                    <!--end::Card title-->
                </div>
                <!--end::Card header-->
                <!--begin::Card body-->
                <div class="card-body pt-1">
                    <!--begin::Permissions-->
                    <div class="d-flex flex-column text-gray-600">${bulletcode}</div>
                    <!--end::Permissions-->
                </div>
                <!--end::Card body-->
                <!--begin::Card footer-->
                <div class="card-footer flex-wrap pt-0">
                    <a target="_blank" href="${href}" class="btn btn-light btn-active-light-primary my-1">Open</a>
                </div>
                <!--end::Card footer-->
            </div>`;
    toolContainer.innerHTML += emailCard;

    const style = document.createElement("style");
    style.textContent = `
    .tools-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
    .tool-card {
        width: 100%;
        height: auto !important;
    }
    @media (max-width: 900px) {
        .tools-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 550px) {
        .tools-grid {
            grid-template-columns: 1fr;
        }
    }
    `;
    document.head.appendChild(style);

    toolContainer.classList.add("tools-grid");

    const replacedTools = toolContainer.querySelectorAll('.card.card-flush');
    replacedTools.forEach(tool => {
        tool.classList.add("tool-card");
    });
}

function customTools(tool) {
    const toolContainer = document.getElementById('kt_app_content_container');
    if (!toolContainer) return;
    toolContainer.innerHTML = '';
    switch (tool) {
        case 'swappa':
            console.log('swappa tool');
            toolContainer.innerHTML = `<div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <h2>Swappa Inventory Tool</h2>
                    </div>
                </div>
                <div class="card-body" style="display:flex;flex-direction:row;gap:1rem;">
                    <div style="display:flex;flex-direction:column;gap:0.75rem;">
                        <strong>System Inventory</strong>
                        <p>Upload a <a href="/reports" target="_blank">Product Items report</a> with at least columns SKU and Main_QTY present.</p>
                        <input id="patches-tools-swappa-systemInventoryFile" type="file" accept=".csv,text/csv">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:0.75rem;">
                        <strong>Swappa Export</strong>
                        <p>Upload the Swappa Export CSV file here.</p>
                        <input id="patches-tools-swappa-swappaExportFile" type="file" accept=".csv,text/csv">
                    </div>
                </div>
                <div class="card-footer" style="display:flex;flex-direction:row;">
                    <div style="flex:1;"></div>
                    <button id="patches-tools-swappa-submit" class="btn btn-lg btn-primary">
                        <strong>Submit</strong>
                        <span class="svg-icon svg-icon-4 ms-1 me-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
                                <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
            <div id="patches-tools-swappa-resultsCard" class="card" style="display:none;">
                <div class="card-header">
                    <div class="card-title">
                        <h2>Results</h2>
                    </div>
                    <div class="card-toolbar">
                        <button id="patches-tools-swappa-download" class="btn btn-icon btn-sm btn-light my-sm-1 ms-1"><i class="fas fa-download fs-2"></i></button>
                    </div>
                </div>
                <div class="card-body" style="max-height:60rem;overflow:scroll;">
                    <table class="table table-striped" style="width:100%;max-width:100%;overflow:auto;">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Swappa Quantity</th>
                                <th>System Quantity</th>
                                <th>Difference</th>
                            </tr>
                        </thead>
                        <tbody id="patches-tools-swappa-resultsTbody"></tbody>
                    </table>
                </div>
            </div>`;

            document.getElementById('patches-tools-swappa-submit').addEventListener('click', async function() {
                document.querySelectorAll('.patches-tools-swappa-error').forEach(e => e.remove());

                const systemFile = document.getElementById('patches-tools-swappa-systemInventoryFile');
                if (!systemFile.files.length) { return showError(systemFile, 'File is required.'); }

                const swappaFile = document.getElementById('patches-tools-swappa-swappaExportFile');
                if (!swappaFile.files.length) { return showError(swappaFile, 'File is required.'); }

                const resultsTbody = document.getElementById('patches-tools-swappa-resultsTbody');
                if (!resultsTbody) return;
                resultsTbody.innerHTML = '';

                const resultsCard = document.getElementById('patches-tools-swappa-resultsCard');
                if (!resultsCard) return;
                resultsCard.setAttribute('style', 'display:none;');

                const systemCsv = parseCSV(await systemFile.files[0].text());
                if (!systemCsv.length || typeof systemCsv[0] !== 'object' || !Object.hasOwn(systemCsv[0], 'SKU') || !Object.hasOwn(systemCsv[0], 'MAIN_Qty')) { return showError(systemFile, 'Invalid System Inventory CSV. Required columns: SKU, MAIN_Qty.'); }
                const systemInventory = Object.fromEntries(
                    systemCsv.map(row => [
                        row.SKU.trim(),
                        Number(row.MAIN_Qty) || 0
                    ])
                );

                const swappaCsv = parseCSV(await swappaFile.files[0].text());
                if (!swappaCsv.length || typeof swappaCsv[0] !== 'object' || !Object.hasOwn(swappaCsv[0], 'seller_ref') || !Object.hasOwn(swappaCsv[0], 'quantity')) { return showError(swappaFile, 'Invalid Swappa Export CSV. Required columns: seller_ref, quantity.'); }

                // actual checking
                let list = [];
                swappaCsv.forEach(line => {
                    const swappaQTY = Number(line.quantity) || 0;
                    const sysQTY = systemInventory[line.seller_ref.trim()] ?? 0;
                    if (swappaQTY !== sysQTY) {
                        list.push({
                            'SKU': line['seller_ref'],
                            'swappa': swappaQTY,
                            'system': sysQTY,
                            'difference': (swappaQTY - sysQTY)
                        });
                    }
                });
                console.debug('PATCHES - Final List:', list);

                list.forEach(line => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${line['SKU']}</td><td>${line['swappa']}</td><td>${line['system']}</td><td>${line['difference']}</td>`;
                    resultsTbody.appendChild(tr);
                });
                resultsCard.removeAttribute('style');

                function showError(input, message) {
                    const span = document.createElement('span');
                    span.className = 'patches-tools-swappa-error';
                    span.style.color = 'var(--bs-danger)';
                    span.textContent = message;
                    input.insertAdjacentElement('afterend', span);
                    return null;
                }

                function parseCSV(text) {
                    // Clean
                    text = text.replace(/^\uFEFF/, '').replace(/\0/g, '').replace(/\r/g, '');

                    const rows = [];
                    let row = [];
                    let cell = '';
                    let inQuotes = false;

                    for (let i = 0; i < text.length; i++) {
                        const c = text[i];

                        if (inQuotes) {
                            if (c === '"') {
                                if (text[i + 1] === '"') {
                                    cell += '"';
                                    i++;
                                } else {
                                    inQuotes = false;
                                }
                            } else {
                                cell += c;
                            }
                        } else {
                            switch (c) {
                                case '"':
                                    inQuotes = true;
                                    break;
                                case ',':
                                    row.push(cell.trim());
                                    cell = '';
                                    break;
                                case '\n':
                                    row.push(cell.trim());
                                    rows.push(row);
                                    row = [];
                                    cell = '';
                                    break;
                                default:
                                    cell += c;
                            }
                        }
                    }

                    row.push(cell.trim());
                    if (!(row.length === 1 && row[0] === '')) { rows.push(row); }

                    if (rows.length === 0) return [];

                    const headers = rows.shift();
                    return rows
                        .filter(r => r.some(v => v !== '')) // Skip completely blank rows
                        .map(r => {
                            const obj = {};
                            headers.forEach((header, i) => { obj[header] = r[i] ?? ''; });
                            return obj;
                        });
                }
            });
            break;
        default:
            console.error('Invalid Tool Name');
    }
}

(async () => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get('tool');
    if (!tool) {
        console.debug('PATCHES - No tool parameter detected, initializing Add Tools...');
        initAddTools();
    } else {
        console.debug(`PATCHES - Skipping initAddTools(), found tool=${tool}`);
        customTools(tool);
    }
})();

