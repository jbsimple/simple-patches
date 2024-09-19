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
    
                fetch(downloadReport.href)
                    .then(response => {
                        const contentLength = response.headers.get('content-length');

                        if (contentLength && contentLength > 1048576) {
                            content.innerHTML = '';
                            content.appendChild('Very Large Report, Download to View.');
                            card.style.display = "flex";
                            throw new Error('CSV file is too large to process.');
                        }
                
                        return response.text();
                    })
                    .then(data => {
                        const table = parseCSVToTable(data);
                        content.innerHTML = '';
                        content.appendChild(table);
                        card.style.display = "flex";
                    })
                    .catch(error => console.error('Error loading the CSV:', error));
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
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.overflow = 'auto';
    table.classList.add('table', 'table-striped');

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    rows[0].forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerCell.textContent = headerText.replace(/[\x00-\x1F\x7F-\x9F"']/g, '').trim();
        headerCell.style.minWidth = '200px';
        headerCell.style.padding = '2rem';
        headerCell.style.fontWeight = '700';
        headerRow.appendChild(headerCell);
    });

    const tbody = table.createTBody();
    rows.slice(1).forEach(rowData => {
        const row = tbody.insertRow();
        rowData.forEach(cellData => {
            const cell = row.insertCell();
            cell.textContent = cellData.replace(/[\x00-\x1F\x7F-\x9F"']/g, '').trim();
            cell.style.minWidth = '200px';
            cell.style.padding = '0.75rem 2rem'; // top-bottom then left-right to make it look better
        });
    });

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
    card_body.appendChild(report_preset('marketing_productivity'));
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

function report_preset(name) {
    const content = document.createElement('div');
    content.setAttribute('style', 'display: flex; flex-direction: row; gap: 1rem;');

    if (name === 'listing_productivity') {
        const submit_button = document.createElement('button');
        submit_button.classList.add('btn');
        submit_button.classList.add('btn-large');
        submit_button.classList.add('btn-primary');
        submit_button.setAttribute('onclick', `report_listingProducivity_submit();`);
        submit_button.innerHTML = `Create
            <span class="svg-icon svg-icon-4 ms-1 me-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
            <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
            </svg>
            </span>`;
        
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        const userInput = document.createElement('input');
        userInput.setAttribute('name', 'patches-userInput-dateListing');
        userInput.setAttribute('id', 'patches-reports-listing_productivity-input');
        userInput.setAttribute('type', 'text');
        userInput.setAttribute('autocomplete', 'false');
        userInput.setAttribute('value', `${mm}/${dd}/${yyyy}`);
        userInput.classList.add('form-control');
        userInput.classList.add('rounded-1');
        userInput.setAttribute('style', 'width: unset;');
        
        const userInputSubtext = document.createElement('div');
        userInputSubtext.setAttribute('style', 'flex: 1; display: flex; align-items: center;');
        userInputSubtext.innerHTML = "Generate a productivity report for Listing.<br>Date Entry Format: mm/dd/yyyy (leading 0s).";
        
        const userInputTitle = document.createElement('h4');
        userInputTitle.classList.add('fw-bolder');
        userInputTitle.classList.add('d-flex');
        userInputTitle.classList.add('align-items-center');
        userInputTitle.classList.add('text-dark');
        userInputTitle.setAttribute('style', 'width: 200px;');
        userInputTitle.textContent = 'Listing Productivity:';

        
        content.appendChild(userInputTitle);
        
        content.appendChild(userInput);
        content.appendChild(userInputSubtext);
        
        content.appendChild(submit_button);

    } else if (name === 'marketing_productivity') {
        const submit_button = document.createElement('button');
        submit_button.classList.add('btn');
        submit_button.classList.add('btn-large');
        submit_button.classList.add('btn-primary');
        submit_button.setAttribute('onclick', `report_marketingProducivity_submit();`);
        submit_button.innerHTML = `Create
            <span class="svg-icon svg-icon-4 ms-1 me-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
            <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
            </svg>
            </span>`;
        
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        const userInput = document.createElement('input');
        userInput.setAttribute('name', 'patches-userInput-dateListing');
        userInput.setAttribute('id', 'patches-reports-marketing_productivity-input');
        userInput.setAttribute('type', 'text');
        userInput.setAttribute('autocomplete', 'false');
        userInput.setAttribute('value', `${mm}/${dd}/${yyyy}`);
        userInput.classList.add('form-control');
        userInput.classList.add('rounded-1');
        userInput.setAttribute('style', 'width: unset;');
        
        const userInputSubtext = document.createElement('div');
        userInputSubtext.setAttribute('style', 'flex: 1; display: flex; align-items: center;');
        userInputSubtext.innerHTML = "Generate a productivity report for Marketing.<br>Date Entry Format: mm/dd/yyyy (leading 0s).";
        
        const userInputTitle = document.createElement('h4');
        userInputTitle.classList.add('fw-bolder');
        userInputTitle.classList.add('d-flex');
        userInputTitle.classList.add('align-items-center');
        userInputTitle.classList.add('text-dark');
        userInputTitle.setAttribute('style', 'width: 200px;');
        userInputTitle.textContent = 'Marketing Productivity:';

        
        content.appendChild(userInputTitle);
        
        content.appendChild(userInput);
        content.appendChild(userInputSubtext);
        
        content.appendChild(submit_button);
        
    } else if (name === 'picture_missingSpecial') {
        const submit_button = document.createElement('button');
        submit_button.classList.add('btn');
        submit_button.classList.add('btn-large');
        submit_button.classList.add('btn-primary');
        submit_button.setAttribute('onclick', `report_pictureMissingSpecial_submit();`);
        submit_button.innerHTML = `Create
            <span class="svg-icon svg-icon-4 ms-1 me-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
            <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
            </svg>
            </span>`;
        
        const userInputSubtext = document.createElement('div');
        userInputSubtext.setAttribute('style', 'flex: 1; display: flex; align-items: center;');
        userInputSubtext.innerHTML = "Generate a report for missing pictures,<br>Specifically Defective, Incomplete and Image Issue items.";
        
        const userInputTitle = document.createElement('h4');
        userInputTitle.classList.add('fw-bolder');
        userInputTitle.classList.add('d-flex');
        userInputTitle.classList.add('align-items-center');
        userInputTitle.classList.add('text-dark');
        userInputTitle.setAttribute('style', 'width: 200px;');
        userInputTitle.textContent = 'Missing Pictures (1):';

        
        content.appendChild(userInputTitle);
        
        content.appendChild(userInputSubtext);
        
        content.appendChild(submit_button);
    } else if (name === 'product_highQty') {
        const submit_button = document.createElement('button');
        submit_button.classList.add('btn');
        submit_button.classList.add('btn-large');
        submit_button.classList.add('btn-primary');
        submit_button.setAttribute('onclick', `report_productHighQty();`);
        submit_button.innerHTML = `Create
            <span class="svg-icon svg-icon-4 ms-1 me-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
            <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
            </svg>
            </span>`;
        
        const userInputSubtext = document.createElement('div');
        userInputSubtext.setAttribute('style', 'flex: 1; display: flex; align-items: center;');
        userInputSubtext.innerHTML = "Generate a report of high quantity items.<br>Includes in stock 50+ qty items. Columns for ASIN and dates included.";
        
        const userInputTitle = document.createElement('h4');
        userInputTitle.classList.add('fw-bolder');
        userInputTitle.classList.add('d-flex');
        userInputTitle.classList.add('align-items-center');
        userInputTitle.classList.add('text-dark');
        userInputTitle.setAttribute('style', 'width: 200px;');
        userInputTitle.textContent = 'High Qty Items:';

        
        content.appendChild(userInputTitle);
        
        content.appendChild(userInputSubtext);
        
        content.appendChild(submit_button);
    }

    return content;
}

function report_listingProducivity_submit() {
    var date = document.getElementById('patches-reports-listing_productivity-input').value;
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
    var date = document.getElementById('patches-reports-marketing_productivity-input').value;
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

function formatDate(date) {
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
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
    console.log(request);
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


initPreset();
initTable();