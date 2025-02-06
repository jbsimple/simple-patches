const kt_app_content = document.getElementById('kt_app_content');
kt_app_content.style.display = "flex";
kt_app_content.style.width = "100%";
kt_app_content.style.height = "100%";

const container = document.querySelector('.d-flex.flex-column.flex-lg-row');
container.style.height = "100%";

const container_left = document.querySelector('.d-flex.flex-column.gap-7.gap-lg-10.w-100.w-lg-350px.mb-7.me-lg-10');
container_left.style.minWidth = "350px";

const container_right = document.querySelector('.d-flex.flex-column.flex-row-fluid.gap-7.gap-lg-10');
container_right.style.height = "100%";

const right = document.querySelector('.d-flex.flex-column.flex-row-fluid.gap-7.gap-lg-10');

function initTable() {
    const card = document.createElement('div');
    card.classList = "card";
    card.style.display = "none";  // normally flex
    card.id = 'patches-table';

    const card_body = document.createElement('div');
    card_body.setAttribute('style', 'padding: 0 !important; flex: 1; width: 100%; max-width: 100%; max-height: 60rem; overflow: scroll;');
    card_body.classList = "card-body";
    
    const content = document.createElement('div');
    card_body.appendChild(content);
    
    card.appendChild(card_body);
    right.appendChild(card);
    
    const downloadReport = document.getElementById('report_download');
    
    var callback = function(mutationsList, observer) {
        for (var mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                if (downloadReport.href.includes("renderfile/download?folder=reports&path=")) {
                    console.log(downloadReport.href);
                    fetch(downloadReport.href)
                        .then(response => {
                            return response.blob().then(blob => {
                                const contentLength = blob.size;

                                if (contentLength > 1048576) { 
                                    content.innerHTML = '<h4>Size of the report too large to render. Download to view.</h4>';
                                    content.setAttribute('style', 'margin-top: 1rem; isplay: flex; justify-content: center; align-items: center; flex-direction: column;');
                                    card.setAttribute('style', 'display: flex;');
                                    return Promise.reject('CSV is too large to process.');
                                }
                        
                                return blob;
                            });
                        })
                        .then(blob => {
                            return blob.text();
                        })
                        .then(data => {
                            const table = parseCSVToTable(data);
                            content.innerHTML = '';
                            content.appendChild(table);
                            content.removeAttribute('style');
                            card.setAttribute('style', 'display: flex;');
                        })
                        .catch(error => console.error('Error loading the CSV:', error));
                }
            }
        }
    };
    var observer = new MutationObserver(callback);
    var config = { attributes: true };
    
    observer.observe(downloadReport, config);
}

function parseCSVToTable(csvData) {
    // this function right here, this split function, was PAIN
    const rows = csvData.split('\n').map(row => {
        let cells = [];
            let currentCell = '';
            let inNullBlock = false;
            let i = 0;
        
            while (i < row.length) {
                if (row[i] === '\x00') {
                    if (inNullBlock) {
                        inNullBlock = false;
                    } else {
                        inNullBlock = true;
                    }
                    i++;
                    continue;
                }
        
                if (!inNullBlock && row[i] === ',') {
                    cells.push(currentCell.trim());
                    currentCell = '';
                } else {
                    currentCell += row[i];
                }
                i++;
            }

            if (currentCell !== '') {
                cells.push(currentCell.trim());
            }
        
            return cells;
    });
    
    const table = document.createElement('table');
    table.id = 'recom-patch-reports-table';
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.overflow = 'auto';
    table.classList.add('table', 'table-striped');

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    var keys = [];
    rows[0].forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText.replace(/[\x00-\x1F\x7F-\x9F"']/g, '').trim();
        headerCell.style.minWidth = '200px';
        headerCell.style.padding = '2rem';
        headerCell.style.fontWeight = '700';
        headerRow.appendChild(headerCell);
        keys.push(headerText.replace(/[\x00-\x1F\x7F-\x9F"']/g, '').trim());
    });

    const tbody = table.createTBody();
    rows.slice(1).forEach(rowData => {
        const row = tbody.insertRow();
        var i = 0;
        rowData.forEach(cellData => {
            const cell = row.insertCell();
            const textContent = cellData.replace(/[\x00-\x1F\x7F-\x9F"']/g, '').trim();
            if (keys[i] && keys[i] === 'SKU' && textContent && textContent !== 'N/a') {
                cell.innerHTML = `<a title="View SKU ${textContent}" href="https://simplecell.recomapp.com/product/items/${textContent}" target="_blank">${textContent}</a>`
            } else if (keys[i] && keys[i] === 'SID' && textContent && textContent !== 'N/a') {
                cell.innerHTML = `<a title="View SID ${textContent}" href="https://simplecell.recomapp.com/products/${textContent}" target="_blank">${textContent}</a>`;
            } else {
                cell.textContent = textContent;
            }
            cell.style.minWidth = '200px';
            cell.style.padding = '0.75rem 2rem'; // top-bottom then left-right to make it look better
            i++;
        });
    });

    return table;
}

function parseFetchResults() {
    const data = reportResults;
    if (!data || data.length === 0 || data === null) {
        return '<p>No data in report</p>';
    }

    let table = '<table border="1"><thead><tr>';
    const keys = Object.keys(data[0]);

    keys.forEach(key => {
        table += `<th>${key}</th>`;
    });
    table += '</tr></thead><tbody>';

    data.forEach(item => {
        table += '<tr>';
        keys.forEach(key => {
            if (key === 'SKU') {
                table += `<td data-key="${key}"><a href="https://simplecell.recomapp.com/product/items/${item[key]}" target="_blank" rel="noreferrer">${item[key]}</a></td>`;
            } else if (key === 'SID') {
                table += `<td data-key="${key}"><a href="https://simplecell.recomapp.com/products/${item[key]}" target="_blank" rel="noreferrer">${item[key]}</a></td>`;
            } else {
                table += `<td data-key="${key}"><span>${item[key]}</span></td>`;
            }
        });
        table += '</tr>';
    });

    table += '</tbody></table>';
    return table;

}

function initPreset() {
    const card = document.createElement('div');
    card.classList = "card";
    card.style.display = "flex";  // normally flex
    card.id = 'patches-presents';
    
    const card_body = document.createElement('div');
    card_body.setAttribute('style', 'display: flex; flex-direction: column; padding: 2rem; gap: 2rem;');
    card_body.classList = "card-body";
    
    const content = document.createElement('div');
    content.setAttribute('style', 'display: flex; flex-direction: row; gap: 1rem;');
    
    const card_header = document.createElement('div');
    card_header.classList = 'card-header';
    
    const card_title = document.createElement('div');
    card_title.classList.add('card-title');
    card_title.innerHTML = '<h2>Report Presets</h2>';
    card_header.appendChild(card_title);
    card.appendChild(card_header);
    
    card.appendChild(card_body);
    right.appendChild(card);
    
    card_body.appendChild(report_preset('listing_productivity'));
    //card_body.appendChild(report_preset('marketing_productivity'));
    card_body.appendChild(report_preset('items_createdRecent'));
    card_body.appendChild(report_preset('picture_missingFull'));
    card_body.appendChild(report_preset('picture_missingSpecial'));
    card_body.appendChild(report_preset('product_highQty'));
    
    const nextStepButton = document.getElementById('rc_reports_new_wizard').querySelectorAll('button[data-kt-stepper-action="next"]');
    const patchesPresentsDiv = document.getElementById('patches-presents');

    for (let i = 0; i < nextStepButton.length; i++) {
        nextStepButton[i].addEventListener('click', function() {
            patchesPresentsDiv.style.display = 'none';
        });
    }
    
}

function goToLastStep() {
    const wizard = document.getElementById('rc_reports_new_wizard');
    const steppers = wizard.querySelectorAll('.stepper-item');
    for (let i = 0; i < steppers.length; i++) {
        var stepper = steppers[i];
        if (i !== steppers.length - 1) {
            stepper.classList.add('completed');
        } else {
            stepper.classList.add('current');
        }
    }
    
    const steps = wizard.querySelectorAll('div[data-kt-stepper-element="content"]');
    for (let i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (i !== steps.length - 1) {
            step.classList = '';
        } else {
            step.classList = 'current';
        }
    }
    
    const patchReset = document.getElementById('patches-presents');
    if (patchReset) {
        patchReset.style.display = 'none';
    }
    
    const button = wizard.querySelector('a[href="reports"]');
    button.classList.remove('d-none');
}

function report_initHTML(det) {
    if (det && det.id && det.func) {
        const content = document.createElement('div');
        content.setAttribute('style', 'display: flex; flex-direction: row; gap: 1rem;');
    
        const submit_button = document.createElement('button');
        submit_button.classList.add('btn');
        submit_button.classList.add('btn-large');
        submit_button.classList.add('btn-primary');
        submit_button.setAttribute('data-id', `${det.id}`);
        submit_button.setAttribute('data-name', `${det.name}`);
        submit_button.setAttribute('onclick', `${det.func}`);
        submit_button.innerHTML = `Create
            <span class="svg-icon svg-icon-4 ms-1 me-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
            <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
            </svg>
            </span>`;

        const userInput = document.createElement('input');
        if (det.input && det.input === 'date') {
            userInput.setAttribute('name', 'patches-userInput-dateListing');
            userInput.setAttribute('id', `${det.id}-input`);
            userInput.setAttribute('type', 'date');
            userInput.setAttribute('autocomplete', 'off');
            userInput.classList.add('form-control', 'rounded-1');
            userInput.style.width = 'unset';

            if (det.val && det.val === "today") {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                userInput.value = `${yyyy}-${mm}-${dd}`;
            }
        }

        const userInputSubtext = document.createElement('div');
        if (det.desc) {
            userInputSubtext.setAttribute('style', 'flex: 1; display: flex; align-items: center;');
            userInputSubtext.innerHTML = det.desc;
        }

        const userInputTitle = document.createElement('h4');
        if (det.title) {
            userInputTitle.classList.add('fw-bolder');
            userInputTitle.classList.add('d-flex');
            userInputTitle.classList.add('align-items-center');
            userInputTitle.classList.add('text-dark');
            userInputTitle.setAttribute('style', 'width: 200px;');
            userInputTitle.textContent = `${det.title}:`;
        }

        if (det.title) {
            content.appendChild(userInputTitle);
        }
        if (det.input) {
            content.appendChild(userInput);
        }
        if (det.desc) {
            content.appendChild(userInputSubtext);
        }
        if (typeof submit_button !== 'undefined') {
            content.appendChild(submit_button);
        }    
        return content;    
    }
    return null;
}

function report_preset(name) {

    if (name === 'listing_productivity') {
        var details = {};
        details.id = `patches-reports-listing_productivity`;
        details.name = `patches-userInput-dateListing`;
        details.func = `report_listingProducivity_submit();`;
        details.input = "date";
        details.val = "today";
        details.desc = "Generate a productivity report for Listing.<br>Click the calendar icon to select date or double click numbers and type date.";
        details.title = "Listing Productivity";
        return report_initHTML(details);
    } else if (name === 'marketing_productivity') {
        var details = {};
        details.id = `patches-reports-marketing_productivity`;
        details.name = `patches-userInput-dateMarketing`;
        details.func = `report_marketingProducivity_submit();`;
        details.input = "date";
        details.val = "today";
        details.desc = "Generate a productivity report for Marketing.<br>Click the calendar icon to select date or double click numbers and type date.";
        details.title = "Marketing Productivity";
        return report_initHTML(details);
    } else if (name === 'picture_missingSpecial') {
        var details = {};
        details.id = `patches-reports-picturesMissing1`;
        details.name = `patches-reports-picturesMissing1Name`;
        details.func = `report_pictureMissingSpecial_submit();`;
        details.desc = "Generates a list of all conditions that need specific pictures created in the last 30 days with no pictures.<br>In and out of stock included.";
        details.title = "Recent Picture Check";
        return report_initHTML(details);
    } else if (name === 'product_highQty') {
        var details = {};
        details.id = `patches-reports-highQty`;
        details.name = `patches-reports-highQtyName`;
        details.func = `report_productHighQty();`;
        details.desc = "Generate a report of high quantity items.<br>Includes in stock 50+ qty items. Columns for ASIN and dates included.";
        details.title = "High Qty Items";
        return report_initHTML(details);
    } else if (name === 'picture_missingFull') {
        var details = {};
        details.id = `patches-reports-picturesMissingFull`;
        details.name = `patches-reports-picturesMissingFullName`;
        details.func = `report_pictureMissingFull_init();`;
        details.desc = "Generate a complete missing picture items & products report. Like, the real deaal one.<br>Generates three different reports to get a list of all things that needs pictures.";
        details.title = "Missing Pictures";
        return report_initHTML(details);
    } else if (name === 'items_createdRecent') {
        var details = {};
        details.id = `patches-reports-createdRecent`;
        details.name = `patches-userInput-createdRecent`;
        details.func = `report_createdRecent_submit();`;
        details.input = "date";
        details.val = "today";
        details.desc = "Generate a report of all created items from a specific date.<br>Includes ASIN, MPN, Category, Shipping Template and Has FBA";
        details.title = "Created Recent Check";
        return report_initHTML(details);
    } else {
        return null;
    }
}

function formatDate(date) {
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function report_listingProducivity_submit() {
    const dateInput = document.getElementById('patches-reports-listing_productivity-input');
    var date = null;
    if (dateInput) {
        const rawValue = dateInput.value;
        if (rawValue) {
            const [yyyy, mm, dd] = rawValue.split('-');
            date = `${mm}/${dd}/${yyyy}`;
        } else {
            console.error('No Date Input (2)', rawValue);
            return false;
        }
    } else {
        console.error('No Date Input (1)', dateInput);
        return false;
    }

    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;
    
    var request = {
        report: {
            type: "user_clock",
            columns: [
                "user_profile.user_id",
                "user_profile.department_id",
                "user_clocks.task_id",
                "purchase_orders.id",
                "purchase_orders.type",
                "user_clock_activity.activity_id",
                "user_clock_activity.activity_code",
                "user_clock_activity.notes",
                "user_clock_activity.units",
                "user_clock_activity.created_at",
                "user_clock_activity.time_spent",
                "user_clocks.time_in",
                "user_clocks.time_out",
                "user_clocks.user_id",
                "user_clocks.clock_date",
                "products.sid",
                "products.name",
                "product_items.sku",
                "product_items.condition_id",
                "products.category_id"
            ],
            filters: [
                {
                    column: "user_profile.department_id",
                    opr: "{0} IN {1}",
                    value: ["23"]
                },
                {
                    column: "user_clocks.clock_date",
                    opr: "between",
                    value: `${date} - ${date}`
                }
            ]
        },
        csrf_recom: csrfToken
    };

    getReport(request);
}

function report_marketingProducivity_submit() {
    const dateInput = document.getElementById('patches-reports-marketing_productivity-input');
    var date = null;
    if (dateInput) {
        const rawValue = dateInput.value;
        if (rawValue) {
            const [yyyy, mm, dd] = rawValue.split('-');
            date = `${mm}/${dd}/${yyyy}`;
        } else {
            console.error('No Date Input (2)', rawValue);
            return false;
        }
    } else {
        console.error('No Date Input (1)', dateInput);
        return false;
    }
    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;
    
    var request = {
        report: {
            type: "user_clock",
            columns: [
                "user_profile.user_id",
                "user_profile.department_id",
                "user_clocks.task_id",
                "purchase_orders.id",
                "purchase_orders.type",
                "user_clock_activity.activity_id",
                "user_clock_activity.activity_code",
                "user_clock_activity.notes",
                "user_clock_activity.units",
                "user_clock_activity.created_at",
                "user_clock_activity.time_spent",
                "user_clocks.time_in",
                "user_clocks.time_out",
                "user_clocks.user_id",
                "user_clocks.clock_date",
                "products.sid",
                "products.name",
                "product_items.sku",
                "product_items.condition_id",
                "products.category_id"
            ],
            filters: [
                {
                    column: "user_profile.department_id",
                    opr: "{0} IN {1}",
                    value: ["26"]
                },
                {
                    column: "user_clocks.clock_date",
                    opr: "between",
                    value: `${date} - ${date}`
                }
            ]
        },
        csrf_recom: csrfToken
    };
    
    getReport(request);
}

function report_pictureMissingSpecial_submit() {
    // Get today's date
    let today = new Date();
    let todayFormatted = formatDate(today);

    // Get the date 30 days ago
    let pastDate = new Date();
    pastDate.setDate(today.getDate() - 30);
    let pastDateFormatted = formatDate(pastDate);

    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;

    var request = {
        report: {
            type: "item_images",
            columns: [
                "product_items.sku",
                "products.sid",
                "products.name",
                "products.brand_id",
                "products.category_id",
                "product_items.condition_id",
                "product_items.in_stock",
                "product_items.price",
                "product_items.created_at"
            ],
            filters: [
                {
                    column: "product_items.created_at",
                    opr: "between",
                    value: `${pastDateFormatted} - ${todayFormatted}`
                },
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: [6, 8, 18]
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                }
            ]
        },
        csrf_recom: csrfToken
    };

    getReport(request);
}

function report_productHighQty() {
    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;
    
    var request = {
        report: {
            type: "active_inventory",
            columns: [
                "products.sid",
                "products.name",
                "product_items.sku",
                "product_items.condition_id",
                "product_items.available",
                "product_items.in_stock",
                "product_items.price",
                "product_items.location",
                "products.brand_id",
                "products.category_id",
                "products.asin",
                "product_items.is_scrap",
                "product_items.has_fba",
                "product_items.sold_at",
                "product_items.priced_at",
                "product_items.created_at",
                "product_items.updated_at"
            ],
            filters: [
                {
                    column: "product_items.in_stock",
                    opr: "{0} >= {1}",
                    value: 50
                }
            ]
        },
        csrf_recom: csrfToken
    };
    
    getReport(request);
}

function getReport(request) {
    console.debug(request);
    $.ajax({
        type: "POST",
        dataType: "json",
        url: $("#rc_reports_new_form").attr("action"),
        data: request,
    }).done(function(data) {
        console.debug(data);
        
        if (data.results.filename) {
            $("#report_download")
                .removeClass("d-none")
            .attr(
                "href",
                "renderfile/download?folder=reports&path=" +
                data.results.filename
            );
        }
        
        if (data.results.message) {
        $("#report_results")
            .removeClass("d-none")
            .html(data.results.message);
        }
        
        goToLastStep();
            
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Request failed: " + textStatus + ", " + errorThrown);
    });
}

async function report_getSpecial(request) {
    console.debug(request);
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            dataType: "json",
            url: $("#rc_reports_new_form").attr("action"),
            data: request,
        }).done(function(data) {
            if (data && data.results && data.results.results && Array.isArray(data.results.results)) {
                resolve(data.results.results);
            } else if (data && data.results && data.results.filename) {
                const href = 'renderfile/download?folder=reports&path=' + data.results.filename;
                console.error('Report made, but no results array.', href);
                resolve(null);
            } else {
                console.error('No report.');
                resolve(null);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Request failed: " + textStatus + ", " + errorThrown);
            reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
        });
    });
}

function parseTableToCSV() {
    const table = document.getElementById('recompatches-customreportTable');
    const rows = Array.from(table.querySelectorAll('tr'));

    const firstRow = rows[0];
    const headerColumns = Array.from(firstRow.querySelectorAll('th,td'));
    const includeHrefInColumn = headerColumns.map(column => {
        const span = column.querySelector('span');
        return span && span.hasAttribute('data');
    });

    const csvContent = rows.map((row, rowIndex) => {
        const columns = Array.from(row.querySelectorAll('th,td'));
        return columns.flatMap((column, colIndex) => {
            let cellData = column.textContent;
            let hrefData = '';

            const link = column.querySelector('a');
            const span = column.querySelector('span');
            if (link && link.href && (includeHrefInColumn[colIndex] || rowIndex === 0)) {
                hrefData = link.href;
            } else if (span && span.hasAttribute('data') && (includeHrefInColumn[colIndex] || rowIndex === 0)) {
                hrefData = span.getAttribute('data');
            }

            if (cellData.includes(',') || cellData.includes('"')) {
                cellData = `"${cellData.replace(/"/g, '""')}"`;
            }
            if (hrefData && (hrefData.includes(',') || hrefData.includes('"'))) {
                hrefData = `"${hrefData.replace(/"/g, '""')}"`;
            }

            return includeHrefInColumn[colIndex] ? [cellData, hrefData] : [cellData];
        }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picture-missing-${Math.floor(Date.now() / 1000)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

async function report_createdRecent_submit() {
    const createButton = document.querySelector(`button[data-id="patches-reports-createdRecent"]`);
    if (createButton) {
        createButton.textContent = 'Loading...';
        createButton.setAttribute('style', 'background-color: gray !important;');
    }

    const dateInput = document.getElementById('patches-reports-createdRecent-input');
    var date = null;
    if (dateInput) {
        const rawValue = dateInput.value;
        if (rawValue) {
            const [yyyy, mm, dd] = rawValue.split('-');
            date = `${mm}/${dd}/${yyyy}`;
        } else {
            console.error('No Date Input (2)', rawValue);
            return false;
        }
    } else {
        console.error('No Date Input (1)', dateInput);
        return false;
    }

    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;
    const request = {
        report: {
            type: "active_inventory",
            columns: [
                "products.sid",
                "products.name",
                "product_items.sku",
                "product_items.condition_id",
                "products.price",
                "products.brand_id",
                "products.category_id",
                "products.mpn",
                "products.gtin",
                "products.asin",
                "products.asin",
                "product_items.store_settings",
                "product_items.has_fba",
                "product_items.created_at"
            ],
            filters: [
                {
                    column: "product_items.in_stock",
                    opr: "{0} >= {1}",
                    value: -100
                },
                {
                    column: "product_items.created_at",
                    opr: "between",
                    value: `${date} - ${date}`
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} NOT IN {1}",
                    value: [10, 11, 12, 13, 14, 15, 16, 104, 103, 102, 101, 72, 27] /* hide auto create and udeless conditions */
                }
            ]
        },
        csrf_recom: csrfToken
    };

    getReport(request);
}

async function report_pictureMissingFull_init() {
    const createButton = document.querySelector(`button[data-id="patches-reports-picturesMissingFull"]`);
    if (createButton) {
        createButton.textContent = 'Loading...';
        createButton.setAttribute('style', 'background-color: gray !important;');
    }

    const csrfToken = document.querySelector('input[name="csrf_recom"]').value;

    let items_images_qunique_report = null;
    var items_images_unique = {
        report: {
            type: "item_images",
            columns: [
                "product_items.sku",
                "products.sid",
                "products.name",
                "product_items.condition_id",
                "product_items.in_stock",
                "product_items.location",
                "product_items.price",
                "product_items.created_at"
            ],
            filters: [
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.in_stock",
                    opr: "{0} > {1}",
                    value: 0
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: ["6", "8", "18"]
                }
            ]
        },
        csrf_recom: csrfToken
    };

    try {
        items_images_qunique_report = await report_getSpecial(items_images_unique);
    } catch (error) {
        console.error("Error fetching report:", error);
    }

    let items_images_report = null;
    var items_images = {
        report: {
            type: "item_images",
            columns: [
                "product_items.sku",
                "products.sid",
                "products.name",
                "product_items.condition_id",
                "product_items.in_stock",
                "product_items.location",
                "product_items.price",
                "product_items.created_at"
            ],
            filters: [
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.in_stock",
                    opr: "{0} > {1}",
                    value: 0
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: ["1", "2", "4", "5", "9", "31", "32", "34", "35", "39", "42", "44", "45", "49", "71", "92", "94", "95", "99"]
                }
            ]
        },
        csrf_recom: csrfToken
    };

    try {
        items_images_report = await report_getSpecial(items_images);
    } catch (error) {
        console.error("Error fetching report:", error);
    }

    let product_images_report = null;
    var product_images = {
        report: {
            type: "product_images",
            columns: [
                "products.sid",
                "products.name",
                "products.category_id",
                "products.created_at"
            ],
            filters: [
                {
                    column: "product_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "products.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                }
            ]
        },
        csrf_recom: csrfToken
    };

    try {
        product_images_report = await report_getSpecial(product_images);
    } catch (error) {
        console.error("Error fetching report:", error);
    }

    if (items_images_report === null) {
        items_images_report = [];
    }

    if (product_images_report === null) {
        product_images_report = [];
    }

    if (items_images_qunique_report === null) {
        items_images_qunique_report = []
    }

    if (
        items_images_report && Array.isArray(items_images_report) &&
        product_images_report && Array.isArray(product_images_report) &&
        items_images_qunique_report && Array.isArray(items_images_qunique_report)
    ) {
          
        console.log("uniques:", items_images_qunique_report);
        console.log("items:", items_images_report);
        console.log("products:", product_images_report);

        var list = [];
        for (let i = 0; i < items_images_qunique_report.length; i++) {
            var item = items_images_qunique_report[i];
            item.Value = parseInt(item.In_Stock) * parseFloat(item.Price);
            list.push(item);
        }

        for (let i = 0; i < items_images_report.length; i++) {
            for (let j = 0; j < product_images_report.length; j++) { 
                if (items_images_report[i].SID === product_images_report[j].SID) {
                    var item = items_images_report[i];
                    item.Value = parseInt(item.In_Stock) & parseFloat(item.Price);
                    if (product_images_report[j].items) {
                        product_images_report[j].items.push(item);
                    } else {
                        product_images_report[j].items = [item];
                    }
                    break;
                }
            }
        }

        var filtered__product_images_report = product_images_report.filter(obj => obj.hasOwnProperty('items'));
        console.log('filtered products:', filtered__product_images_report);

        for (let i = 0; i < filtered__product_images_report.length; i++) {
            const married_product = filtered__product_images_report[i];
            var value = 0;
            for (let j = 0; j < married_product.items.length; j++) {
                value += parseInt(married_product.items[j].In_Stock) * parseFloat(married_product.items[j].Price);
            }
            married_product.Value = value;
            list.push(married_product);
        }

        console.log('final list:', list);

        goToLastStep();

        const button = document.getElementById('report_download');
        button.removeAttribute('href');  
        button.classList.remove('d-none');
        button.setAttribute('onclick', 'event.preventDefault(); parseTableToCSV();');

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.maxWidth = '100%';
        table.style.overflow = 'auto';
        table.id = 'recompatches-customreportTable';
        table.classList.add('table', 'table-striped');

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');

        const thID = document.createElement('th');
        thID.innerHTML = `<span data="ID Link">ID</span>`;
        thID.style.minWidth = '200px';
        thID.style.padding = '2rem';
        thID.style.fontWeight = '700';
        headerRow.appendChild(thID);

        const thProductName = document.createElement('th');
        thProductName.textContent = `Product Name`;
        thProductName.style.minWidth = '200px';
        thProductName.style.padding = '2rem';
        thProductName.style.fontWeight = '700';
        headerRow.appendChild(thProductName);

        const thCreatedAt = document.createElement('th');
        thCreatedAt.innerHTML = `<span data="SKU Created At">ID Created At</span>`;
        thCreatedAt.style.minWidth = '200px';
        thCreatedAt.style.padding = '2rem';
        thCreatedAt.style.fontWeight = '700';
        headerRow.appendChild(thCreatedAt);

        const thValue = document.createElement('th');
        thValue.textContent = `Value ($)`;
        thValue.style.minWidth = '200px';
        thValue.style.padding = '2rem';
        thValue.style.fontWeight = '700';
        headerRow.appendChild(thValue);

        const thLocation = document.createElement('th');
        thLocation.innerHTML = `<span data="SKU Link">(SKU) Location</span>`;
        thLocation.style.minWidth = '200px';
        thLocation.style.padding = '2rem';
        thLocation.style.fontWeight = '700';
        headerRow.appendChild(thLocation);

        thead.appendChild(headerRow);
        
        list.forEach(item => {
            let skus = null;
            if (item.items && Array.isArray(item.items) && item.items.length > 0) {
                skus = item.items.sort((a, b) => {
                    const conditionA = parseInt(a.Condition.split('-')[0], 10);
                    const conditionB = parseInt(b.Condition.split('-')[0], 10);
                
                    return conditionA - conditionB;
                });
            }
            
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            if (item.SKU) {
                const skuLink = document.createElement('a');
                skuLink.title = `View SKU ${item.SKU}`;
                skuLink.href = `/product/items/${item.SKU}`;
                skuLink.textContent = item.SKU;
                skuLink.target = "_blank";
                idCell.appendChild(skuLink);
            } else if (item.SID) {
                const sidLink = document.createElement('a');
                sidLink.title = `View SID ${item.SID}`;
                sidLink.href = `/products/${item.SID}`;
                sidLink.textContent = item.SID;
                sidLink.target = "_blank";
                idCell.appendChild(sidLink);
            } else {
                idCell.textContent = item.SKU || item.SID;
            }
            idCell.style.minWidth = '200px';
            idCell.style.padding = '0.75rem 2rem'; // top-bottom then left-right to make it look better
            row.appendChild(idCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = item.Product_Name;
            nameCell.style.minWidth = '200px';
            nameCell.style.padding = '0.75rem 2rem';
            row.appendChild(nameCell);

            const dateCell = document.createElement('td');
            if (skus !== null) {
                dateCell.innerHTML = `<span data="${skus[0].Created_Date}">${item.Created_Date}</span>`
            } else {
                dateCell.textContent = item.Created_Date;
            }
            dateCell.style.minWidth = '200px';
            dateCell.style.padding = '0.75rem 2rem';
            row.appendChild(dateCell);

            const valueCell = document.createElement('td');
            valueCell.textContent = `$${parseFloat(item.Value).toFixed(2)}`;
            valueCell.style.minWidth = '200px';
            valueCell.style.padding = '0.75rem 2rem';
            row.appendChild(valueCell);

            const locationCell = document.createElement('td');
            if (skus !== null) {
                locationCell.innerHTML = `(<a title="View SKU ${skus[0].SKU}" href="/product/items/${skus[0].SKU}" target="_blank">${skus[0].SKU}</a>) ${skus[0].Full_Location}`;
            } else if (item.SKU) {
                locationCell.textContent = `${item.Full_Location}`;
            } else {
                locationCell.textContent = `N/a`;
            }
            locationCell.style.minWidth = '200px';
            locationCell.style.padding = '0.75rem 2rem';
            row.appendChild(locationCell);

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        const card = document.createElement('div');
        card.classList = "card";
        card.style.display = "none";  // normally flex
        card.id = 'patches-table';

        const card_body = document.createElement('div');
        card_body.setAttribute('style', 'padding: 0 !important; flex: 1; width: 100%; max-width: 100%; max-height: 60rem; overflow: scroll;');
        card_body.classList = "card-body";
        
        const content = document.createElement('div');
        card_body.appendChild(content);
        
        card.appendChild(card_body);
        right.appendChild(card);

        content.innerHTML = '';
        content.appendChild(table);
        content.removeAttribute('style');
        card.setAttribute('style', 'display: flex;');

    }
}


initPreset();
initTable();