async function getTimeSpentInMinutes(sku) {
    async function getUserID() {
        try {
            const response = await fetch('/user/me');
            const html = await response.text();
    
            const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
            if (scriptMatch) {
                for (const script of scriptMatch) {
                    const userIdMatch = script.match(/userID\s*=\s*(\d+);/);
                    if (userIdMatch) {
                        console.debug('PATCHES - Extracted userID:', userIdMatch[1]);
                        return parseInt(userIdMatch[1], 10);
                    }
                }
            }
            console.log('userID not found');
            return null;
        } catch (error) {
            console.error('Error fetching the page:', error);
            return null;
        }
    }

    const today = new Date();
    const today_mm = String(today.getMonth() + 1).padStart(2, '0');
    const today_dd = String(today.getDate()).padStart(2, '0');
    const today_yyyy = today.getFullYear();
    const todayFormatted = `${today_yyyy}-${today_mm}/${today_dd}`;

    const api = await fetchAPI("reports", {
        body: {
            type: "user_clock",
            page: 1,
            per_page: 10,
            filters: [
                {
                    "field": "user_clocks.clock_date",
                    "operator": "between",
                    "value": [todayFormatted, todayFormatted]
                },
                {
                    "field": "user_profile.user_id",
                    "operator": "eq",
                    "value": `${userId}`
                },
                {
                    "field": "product_items.sku",
                    "operator": "eq",
                    "value": `${sku}`
                }
            ],
            columns: [
                "purchase_orders.id",
                "user_clock_activity.activity_id",
                "user_clock_activity.activity_code",
                "user_clock_activity.time_spent"
            ]
        }
    });

    if (api.success && api.data && api.data.data) {
        const matchingEntries = api.data.data.filter(
            entry => entry.Event_Code === "Inventory Listing" 
            && entry.hasOwnProperty("PO_Number")
            && entry.hasOwnProperty("Time_Spent_in_mintues")
            && entry.hasOwnProperty("Event_ID")
        );

        if (matchingEntries.length > 0) {
            return matchingEntries;
        }
    }

    return null;
}

function inWrongTaskCheck() {
    // this modal is just for the full page wizard wizard
    if (window.location.href.includes('/receiving/queues/listing/')) {
        const afterListing = window.location.href.split('/receiving/queues/listing/')[1];
        if (afterListing && afterListing.trim() !== '' && currentTask !== 'Listing') {
            fireSwal('TASK CHECK?', ["You're about to list without being in the listing task.", "Are you sure you want to continue?", "* Gotacha to reload, Close to just proceed."], 'question', true);
        }
    } else if (currentTask !== 'Listing') {
        const thecontent = document.getElementById('kt_app_content_container');
        const codeToAdd = `
        <style>
            .lebox {
                background-color: color-mix(in srgb, var(--bs-danger) 15%, var(--bs-body-bg) 85%) !important;
                padding: 1.25rem 0 !important;
                margin: 0 !important;
                margin-bottom: 30px !important;
                border: var(--bs-border-width) solid var(--bs-border-color) !important;
                border-radius: 0.625rem !important;
            }
        </style>
        <div class="lebox app-toolbar pt-7 pt-lg-10">
            <div class="app-container container-fluid d-flex align-items-stretch">
                <div class="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
                    <div class="page-title d-flex flex-column justify-content-center gap-1 me-3">
                        <h1 class="page-heading d-flex flex-column justify-content-center fw-bold fs-3 m-0" style="color: var(--bs-danger-text);">Warning!</h1>
                        <h3 class="page-heading d-flex flex-column justify-content-center text-dark fw-bold fs-3 m-0">You are not clocked into Listing!</h3>
                    </div>
                    <div class="d-flex align-items-center gap-2 gap-lg-3"></div>
                </div>
            </div>
        </div>`;
        thecontent.insertAdjacentHTML('afterbegin', codeToAdd);
    }
}

// https://stackoverflow.com/questions/13605340/how-to-validate-a-ean-gtin-barcode-in-javascript
// There are more checks in place for valid gtins I guess.
function isValidBarcode(value) {
    // We only allow correct length barcodes
    if (!value.match(/^(\d{8}|\d{12,14})$/)) {
      return false;
    }
  
    const paddedValue = value.padStart(14, '0');
  
    let result = 0;
    for (let i = 0; i < paddedValue.length - 1; i += 1) {
      result += parseInt(paddedValue.charAt(i), 10) * ((i % 2 === 0) ? 3 : 1);
    }
  
    return ((10 - (result % 10)) % 10) === parseInt(paddedValue.charAt(13), 10);
}

function productGTIN(listingResults) {
    const gtin_input = document.getElementById('patches-oldgtin');
    const secondary_input = document.getElementById('patches-newgtin');
    var listingResults = document.getElementById('listing-results');

    if (gtin_input && secondary_input && listingResults) {
        const gtin = gtin_input.value;
        const secondary = secondary_input.value;

        console.debug('Patches - gtin', gtin);
        console.debug('Patches - secondary', secondary);

        const atags = listingResults.querySelectorAll('a');
        if (atags) {
            atags.forEach(atag => {
                const href = atag.getAttribute('href');
                if (href && href.includes('products/')) {
                    const productid = href.replace('products/', '');
                    console.debug('Patches - product id', productid);
                    const update = `/products/update/${productid}`;
                    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]')
                    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
                        const csrfToken = csrfMeta.getAttribute('content');
                        let meta_id = 5;
                        if (document.location.href.includes('dev.')) {
                            meta_id = 14;
                        } else if (document.location.href.includes('cell.')) {
                            meta_id = 5;
                        }
                        const request = {
                            product: {
                                gtin: gtin,
                            },
                            meta: [{
                                    meta_id: meta_id,
                                    value: secondary,
                                }
                            ],
                            csrf_recom: csrfToken,
                        };

                        $.ajax({
                            type: "POST",
                            dataType: "json",
                            url: update,
                            data: request,
                        }).done(function(data) {
                            const responseBlock = document.getElementById('productsGTIN-response');
                            if (responseBlock && data.success) {
                                responseBlock.innerHTML = '<span style="color: var(--bs-primary);">Updated!</span>';
                            }
                        
                            console.debug('Patches - Response:', data);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            console.error("Request failed: " + textStatus + ", " + errorThrown);
                            
                            const responseBlock = document.getElementById('productsGTIN-response');
                            let errors = 'Loading...';
                            if (jqXHR.responseText) {
                                try {
                                    const errorResponse = JSON.parse(jqXHR.responseText);
                                    errors = '[';
                                    if (errorResponse.errors) {
                                        Object.entries(errorResponse.errors).forEach(([key, value]) => {
                                            errors += `${key} => ${value}, `;
                                        });
                                        errors = errors.slice(0, -2) + ']';
                                    } else {
                                        errors = '[Unknown Error]';
                                    }
                                } catch (e) {
                                    errors = `[${jqXHR.responseText}]`;
                                }
                            } else {
                                errors = '[Unknown Error, See Console]';
                            }
                        
                            if (responseBlock) {
                                responseBlock.innerHTML = `<span style="color: var(--bs-danger);">Could not Update: ${errors}</span>`;
                            }
                        });
                        
                    }
                }
            })
        }
    }
}

function fixSimilarProduct() {
    const titleInput = document.querySelector('[name="product[name]"]');
    
    const newTitleInput = titleInput.cloneNode(true);
    titleInput.parentNode.replaceChild(newTitleInput, titleInput);

    const divRow = document.createElement('div');
    divRow.setAttribute('style', 'display: inline-flex; flex-direction: row; align-items: center;');

    const styles = 'margin-left: 0.5rem; padding: 0.5rem 1rem; border-radius: 0 0 0.5rem 0.5rem; font-weight: 700; color: white;';
    const charCountSpan = document.createElement("span");
    charCountSpan.textContent = "0 / 80";
    charCountSpan.setAttribute('style', `background-color: var(--bs-info-active) !important; ${styles}`);
    divRow.appendChild(charCountSpan);

    const spacer = document.createElement('div');
    spacer.setAttribute('style', 'flex: 1;');
    divRow.appendChild(spacer);

    newTitleInput.parentNode.insertBefore(divRow, newTitleInput.nextSibling);

    newTitleInput.addEventListener("input", () => {
        if (newTitleInput.value.length === 80) {
            charCountSpan.setAttribute('style', `background-color: var(--bs-danger) !important; ${styles}`);
        } else {
            charCountSpan.setAttribute('style', `background-color: var(--bs-info-active) !important; ${styles}`);
        }
        charCountSpan.textContent = `${newTitleInput.value.length} / 80`;
    });
}

async function newUpdateLocation(sku, eventID = null, po = null) {
    try {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (!(csrfMeta && csrfMeta.getAttribute('content').length > 0)) {
            return { success: false, message: "Missing CSRF token" };
        }
        const csrfToken = csrfMeta.getAttribute('content');

        // get eventID if not present
        if (eventID === null || po === null) {
            const justCreated = await getTimeSpentInMinutes(sku);
            if (justCreated && justCreated.event_id && justCreated.po) {
                eventID = justCreated.event_id;
                po = justCreated.po;
            }
        }

        // verify event id
        eventID = parseInt(eventID, 10);
        if (!Number.isInteger(eventID)) { return { success: false, message: "Invalid Event ID" }; }

        // parse po into a po_id
        po = parseInt(po, 10);
        if (!Number.isInteger(po)) {
            const url = `/ajax/datalist/PurchaseOrders?term=SCPO&_type=query&q=${encodeURIComponent(po)}`;
            const response = await fetch(url);
            const data = await response.json();
            po = Array.isArray(data.results) && data.results.length > 0 ? parseInt(data.results[0].id, 10) : null;
        }
        if (!Number.isInteger(po)) { return { success: false, message: "Invalid PO ID" }; }

        const api = await fetchAPI("reports", {
            body: {
                type: "pending_inventory",
                page: 1,
                per_page: 1,
                filters: [
                    {
                        "field": "purchase_orders.id",
                        "operator": "eq",
                        "value": `${po}`
                    },
                    {
                        "field": "inventory_receiving.id",
                        "operator": "eq",
                        "value": `${eventID}`
                    }
                ],
                columns: ["inventory_receiving.location"]
            }
        });
        let sortLocation = null;
        if (api.success && api.data && api.data.data) { sortLocation = api.data.data[0].Sort_Location; }
        if (!sortLocation) { return { success: false, message: "Sort location not found" }; }

        // update
        const cleanLocation = sortLocation.replace(/^PICTURES\s+/i, '').trim();
        const newSortingLocation = ('PICTURES ' + (cleanLocation .trim() || '')).trimEnd();
        const formData = new FormData();
        formData.append('name', newSortingLocation);
        const response = await fetch(`/ajax/actions/updateSortingLocation/${eventID}`,{
            method: 'POST',
            headers: {
                'X-Csrf-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });
        const data = await response.json();
        if (response.ok && data?.success) {
            return { success: true, message: "Location Updated", name: data.name };
        }
        return { success: false, message: data?.message || `HTTP ${response.status}` };

    } catch (error) {
        console.error('Full error:', error);
        console.debug('Error Keys:', Object.keys(error || {}));
        return { success: false, message: JSON.stringify(error, null, 2) };
    }
}

async function handleLocationButton(e) {
    const sku = e.getAttribute('data-sku');
    const eventID = parseInt(e.getAttribute('data-eventID'), 10);
    const po = e.getAttribute('data-po');

    const messageSpan = e.nextElementSibling;
    if (!Number.isInteger(eventID)) {
        messageSpan.textContent = "Invalid Event ID";
        messageSpan.style.color = "var(--bs-danger)";
        return;
    }

    e.disabled = true;
    const oldButtonText = e.textContent;
    e.textContent = 'Loading...';
    e.style.setProperty('background-color', 'gray', 'important');

    const response = await newUpdateLocation(sku, eventID, po);

    messageSpan.textContent = response.message;
    messageSpan.style.color = response.success ? 'var(--bs-primary)' : 'var(--bs-danger)';

    e.classList.remove('disabled');
    e.style.removeProperty('background-color');
    e.textContent = oldButtonText;
}

async function hijackCreateItemButton() {
    const table = document.getElementById('dtTable_wrapper');
    if (!table) return;
    table.addEventListener('click', function(event) {
        const target = event.target.closest('button');
        if (target && target.matches('.btn.ajax-modal') && target.textContent.trim() === 'Create Item') {
            hijackPrefillWindow();
        }
    });
}

async function hijackFindProductButton() {
    const findProductButton = document.getElementById('find_product');
    if (!findProductButton) return;
    findProductButton.addEventListener('click', function(event) {
        hijackPrefillWindow();
    });
}

async function initListingPatch() {
    console.debug('PATCHES - initListingPatch for wizard');
    var gtin_input = document.querySelectorAll('.product_gtin')[0]; //inital
    gtin_input = document.querySelector('input[name="product[gtin]"]'); //if specific loaded

    var listingSubmit = document.querySelector('button[data-kt-stepper-action="submit"]');
    var listingResults = document.getElementById('listing-results');

    var initGTIN = null;
    var curGTIN = null;

    var generateButton = document.querySelector('a[href="javascript:generateGtin();"]');

    const observer = new MutationObserver(() => {
        const elements = document.querySelectorAll('.fv-plugins-message-container.invalid-feedback');
      
        let previousText = null;
        elements.forEach((element, index) => {
            const currentText = element.textContent.trim();
      
            if (currentText === previousText) {
                element.remove();
            } else {
                previousText = currentText;
                const block = element.querySelector('div');
                if (block) {
                    const field = block.getAttribute('data-field');
                    const validation = block.getAttribute('data-validator');
                    if (field) {
                        const input = document.querySelector(`input[name="${field}"]`);
                        if (input) {
                            input.addEventListener('input', function handleError() {
                                if (validation === "notEmpty" && input.value.length > 0) {
                                    element.style.display = 'none';
                                } else {
                                    element.style.display = 'inherit';
                                }
                            });
                        }
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    if (gtin_input) {
        initGTIN = gtin_input.value;
        curGTIN = gtin_input.value;
    
        if (gtin_input.value || gtin_input.getAttribute('value')) {
            verifyGTIN();
        }
        
        gtin_input.addEventListener('input', function() {
            verifyGTIN();
        });
        
        if (generateButton) {
            generateButton.addEventListener('click', function() {
                setTimeout(function() { verifyGTIN(); }, 500); // yikes
            });
        }
        
        function verifyGTIN() {
            // update flag
            curGTIN = gtin_input.value;
    
            var valueLength = gtin_input.value.length;
            console.log(valueLength);
            
            if (valueLength > 12 || !isValidBarcode(curGTIN)) {
                gtin_input.style.outline = "2px solid var(--bs-danger)";
                gtin_input.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
                addInvalidFeedback();
            } else {
                gtin_input.style.outline = "";
                gtin_input.style.backgroundColor = "";
                removeInvalidFeedback();
            }
        }
        
        function addInvalidFeedback() {
            if (!document.getElementById('gtin-feedback')) {
                var feedbackDiv = document.createElement('div');
                feedbackDiv.id = 'gtin-feedback';
                feedbackDiv.className = 'fv-plugins-message-container invalid-feedback';
                feedbackDiv.textContent = 'The GTIN is invalid';
    
                gtin_input.parentNode.appendChild(feedbackDiv);
            }
        }
        
        function removeInvalidFeedback() {
            var feedbackDiv = document.getElementById('gtin-feedback');
            if (feedbackDiv) {
                feedbackDiv.parentNode.removeChild(feedbackDiv);
            }
        }
    
        if (listingSubmit) {
            listingSubmit.addEventListener('click', function() {
                setTimeout(async function() {
                    if (listingResults) {
                        let code = '';
                        const getCreatedSKU = listingResults.querySelectorAll('h2');
                        if (getCreatedSKU && getCreatedSKU[0]) {
                            const sku = getCreatedSKU[0].textContent;
                            const justCreated = await getTimeSpentInMinutes(sku); // await here
                            if (justCreated !== null && justCreated.time_spent && justCreated.event_id) {
                                const po = justCreated.po ?? null;
                                const timespent = justCreated.time_spent;
                                const eventID = justCreated.event_id;

                                code += `<br><br><p style="color: var(--bs-info);"><b>Time Spent in Minutes:</b>&nbsp;${timespent} minutes.</p>`;
                                code += `<div class="patches-row patches-gap">
                                    <div class="patches-row" style="gap: 0.5rem; align-items: center; justify-content: center;">
                                        <a class="btn btn-info btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/fba-check?column=0&keyword=${sku}" target="_blank">
                                            <i class="fas fa-shipping-fast"></i>
                                            <span>View In FBA Check</span>
                                        </a>
                                        <a class="btn btn-success btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/inventory?column=1&keyword=${sku}" target="_blank">
                                            <i class="fas fa-boxes"></i>
                                            <span>View In Pending Inventory</span>
                                        </a>
                                    </div>
                                    <span class="spacer"></span></div>
                                    <div class="patches-row" style="gap: 0.5rem; align-items: center; justify-content: center;">
                                        <a class="btn btn-info btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="Add PICTURES to Location" aria-label="Add PICTURES to Location" data-sku="${sku}" data-eventID="${eventID}" data-po="${po}" onclick="handleLocationButton(this);">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span>Update Location</span>
                                        </a>
                                        <span></span>
                                    </div>
                                    <span class="spacer"></span></div>`;
                            } else {
                                console.error(justCreated);
                                fireSwal('UHOH!', 'Unable to find what you just created??? LOL???', 'error', false);
                            }
                        }

                        if (initGTIN !== curGTIN) {
                            code += `<br><br>
                            <strong class="patches-warning">
                                <i class="fa fa-triangle-exclamation fs-2"></i>
                                <span>GTIN Change Detected!</span>
                                <i class="fa fa-triangle-exclamation fs-2"></i>
                            </strong>
                            <br>
                            <div class="patches-column">
                                <div class="patches-row">
                                    <strong>Original Queue GTIN:</strong>
                                    <input type="text" class="form-control form-control-solid form-control-lg" disabled value="${initGTIN}"></input>
                                </div>
                                <div class="patches-row">
                                    <strong>Created Listing GTIN:</strong>
                                    <input type="text" class="form-control form-control-solid form-control-lg" disabled value="${curGTIN}"></input>
                                </div>
                            </div>
                            <div class="patches-column">
                                <span>With the GTIN change detected, you can change it back here. The fields below will update the product.</span>
                            </div>
                            <div class="patches-column">
                                <label for="patches-oldgtin">Product GTIN:</label>
                                <input type="text" id="patches-oldgtin" class="form-control form-control-solid form-control-lg" value="${initGTIN}"></input>
                            </div>
                            <div class="patches-column">
                                <label for="patches-newgtin">Product Secondary GTIN:</label>
                                <input type="text" id="patches-newgtin" class="form-control form-control-solid form-control-lg" value="${curGTIN}"></input>
                            </div>
                            <div class="patches-column">
                                <span style="flex: 1;">You can set the GTIN back to the original and the generated GTIN as the secondary by pressing the button below.<br><br>
                                    * Old GTIN becomes the product's real GTIN.<br>
                                    * Current GTIN becomes the product's secondary GTIN.
                                    * If it doesn't save here, the GTIN is REALLY invalid and there's nothing that can be done.
                                </span>
                                <strong>In order for the switch to happen, you must hit the 'Update GTINS' button! It is NOT Automatic!</strong>
                            </div>
                            <div class="patches-row">
                                <a class="btn btn-lg btn-light-warning me-3" onclick="productGTIN()">Update GTINS</a>
                                <div style="flex: 1;" id="productsGTIN-response"></div>
                            </div>`;
                        }

                        // finally add the code
                        console.debug('PATCHES - Listing Submit Code Check', code);
                        listingResults.innerHTML += code;
                    }                    
                }, 500); // yikes
            });
        }

        // i guess this goes here akkoShrug
        setTimeout(async function() {
            const listing_form =  document.getElementById('rc_create_listing_form');
            if (listing_form) {
                duplicateMPN(listing_form.querySelector('input[name="product[mpn]"]'));
                duplicateAsin(listing_form.querySelector('input[name="product[asin]"]'));
            }
        }, 500);

        function unloadWarning(e) {
            e.preventDefault();
            e.returnValue = '';
        }
    }
}

(async () => {
    if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) { 
        initListingPatch();
        hijackFindProductButton();
    } else {
        hijackCreateItemButton();
    }
    inWrongTaskCheck();
})();
  