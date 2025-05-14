// verify gtin code for listing
var gtin_input = document.querySelectorAll('.product_gtin')[0]; //inital
gtin_input = document.querySelector('input[name="product[gtin]"]'); //if specific loaded

var listingSubmit = document.querySelector('button[data-kt-stepper-action="submit"]');
var listingResults = document.getElementById('listing-results');

var initGTIN = null;
var curGTIN = null;

var generateButton = document.querySelector('a[href="javascript:generateGtin();"]');

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

    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');

        const today = new Date();
        const today_mm = String(today.getMonth() + 1).padStart(2, '0');
        const today_dd = String(today.getDate()).padStart(2, '0');
        const today_yyyy = today.getFullYear();
        const todayFormatted = `${today_mm}/${today_dd}/${today_yyyy}`;

        let date = todayFormatted;
        const userId = await getUserID();

        let request = {
            report: {
                type: "user_clock",
                columns: [
                    "user_clock_activity.activity_code",
                    "user_clock_activity.time_spent"
                ],
                filters: [{
                        column: "user_profile.user_id",
                        opr: "{0} = '{1}'",
                        value: `${userId}`
                    },
                    {
                        column: "user_clocks.clock_date",
                        opr: "between",
                        value: `${date} - ${date}`
                    },
                    {
                        column: "product_items.sku",
                        opr: "{0} LIKE '%{1}%'",
                        value: `${sku}`
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
                if (data.success && Array.isArray(data.results?.results)) {
                    const matchingEntries = data.results.results.filter(
                        entry => entry.Event_Code === "Inventory Listing" && entry.hasOwnProperty("Time_Spent_in_mintues")
                    );

                    if (matchingEntries.length > 0) {
                        const lastMatch = matchingEntries[matchingEntries.length - 1];
                        const timeSpent = parseFloat(lastMatch.Time_Spent_in_mintues);
                        resolve(timeSpent);
                        return;
                    }
                }

                console.error("Request Data Not Expected or No Matching Entry: ", data);
                resolve(null);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Request failed: " + textStatus + ", " + errorThrown);
                reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
            });
        });
    } else {
        console.error('Unable to get CSRF');
        return null;
    }
}

function customModal(title, message, table = null, width = '650px') {
    let modal_message = 'na';
    if (Array.isArray(message)) {
        modal_message = '';
        message.forEach((line, index) => {
            if (index === 0) {
                modal_message += `<label class="fs-6 fw-bold mb-2">${line}</label>`;
            } else {
                modal_message += `<label class="fs-6 fw-semibold form-label">${line}</label>`;
            }
        });
    } else {
        modal_message = `<label class="fs-6 fw-bold mb-2">${message}</label>`;
    }

    let table_html = '';
    if (table && Array.isArray(table) && table.length > 0) {
        const keys = Object.keys(table[0]);

        table_html = '<table id="patch_listingModal_table" class="table table-striped" style="width: 100%; max-width: 100%; overflow: auto;">';

        table_html += '<thead><tr>';
        keys.forEach(key => {
            table_html += `<th style="min-width: 200px; padding: 2rem; font-weight: 700;">${key}</th>`;
        });
        table_html += '</tr></thead>';

        table_html += '<tbody>';
        table.forEach(row => {
            table_html += '<tr>';
            keys.forEach(key => {
                const value = row[key];
                if (key === 'SID') {
                    table_html += `<td style="min-width: 200px; padding: 0.75rem 2rem;">
                        <a title="View SID ${value}" href="/products/${value}" target="_blank">${value}</a>
                    </td>`;
                } else if (key === 'SKU') {
                    table_html += `<td style="min-width: 200px; padding: 0.75rem 2rem;">
                        <a title="View SID ${value}" href="/product/items/${value}" target="_blank">${value}</a>
                    </td>`;
                } else if (key === 'ASIN') { 
                    table_html += `<td style="min-width: 200px; padding: 0.75rem 2rem;">
                        <a title="View ASIN ${value}" href="https://www.amazon.com/dp/${value}" target="_blank">${value}</a>
                    </td>`;
                } else {
                    table_html += `<td style="min-width: 200px; padding: 0.75rem 2rem;">${value}</td>`;
                }
            });
            table_html += '</tr><tr></tr>';
        });
        table_html += '</tbody></table>';
    }

    const modal = `<style>
        #patch_listingModal_fullModal .modal-content {
            transform: translateY(-15vh) !important;
            opacity: 0.25 !important;
            transition: all 0.1s ease !important;
        }

        #patch_listingModal_fullModal.show .modal-content {
            transform: unset !important;
            opacity: 1.0 !important;
        }
    </style>

    <div class="modal fade" id="patch_listingModal_fullModal" data-bs-backdrop="static" tabindex="-1" aria-hidden="true" role="dialog" style="display: none; background: rgba(0, 0, 0, .4) !important;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: ${width}; min-width: 650px;">
            <div class="modal-content rounded">
                <div class="modal-header">
                    <h2 class="fw-bolder">${title}</h2>
                    <div class="btn btn-icon btn-sm btn-active-icon-primary" id="patch_listingModal_close">
                        <span class="svg-icon svg-icon-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="currentColor"></rect>
                                <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="currentColor"></rect>
                            </svg>
                        </span>
                    </div>
                </div>
                <div class="modal-body scroll-y px-10 px-lg-15 pt-0 pb-15" style="padding-top: 1.5rem !important;">
                    <div class="d-flex flex-column mb-8">${modal_message}${table_html}</div>
                    <div class="separator my-10"></div>
                    <div class="text-center">
                        <button type="reset" id="patch_listingModal_dismiss" data-bs-dismiss="modal" class="btn btn-warning btn-light me-3">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    const rcAjaxModal = document.getElementById("rc_ajax_modal");

    if (rcAjaxModal) {
        const modalContainer = document.createElement("div");
        modalContainer.innerHTML = modal;
        rcAjaxModal.parentNode.insertBefore(modalContainer, rcAjaxModal);

        const closeButton = document.getElementById('patch_listingModal_close');
        if (closeButton) {
            closeButton.onclick = closeModal;
        }

        const cancelButton = document.getElementById('patch_listingModal_dismiss');
        if (cancelButton) {
            cancelButton.onclick = closeModal;
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

        function closeModal() {
            const fullModal = document.getElementById('patch_listingModal_fullModal');
            if (fullModal) {
                newModal.classList.remove('show');
                setTimeout(() => {
                    fullModal.remove();
                }, 200);
            }
        }

        const newModal = document.getElementById('patch_listingModal_fullModal');
        if (newModal) {
            newModal.style.display = 'block';
            newModal.removeAttribute('aria-hidden');
            newModal.setAttribute('aria-modal', 'true');

            setTimeout(() => {
                newModal.classList.add('show');
            }, 200);
        }

    }
}

function inWrongTaskCheck() {
    const link = document.querySelector('a[href="javascript:clockInOut(\'out\');"]');
    const currentTask = link?.textContent.trim().toLowerCase() ?? 'na';
    console.debug('PATCHES - Task Check:', currentTask);

    

    // this modal is just for the full page wizard wizard
    if (window.location.href.includes('/receiving/queues/listing/')) {
        const afterListing = window.location.href.split('/receiving/queues/listing/')[1];
        if (afterListing && afterListing.trim() !== '' && currentTask !== 'clock out - listing') {
            customModal('TASK CHECK?', ["You're about to list without being in the listing task.", "Are you sure you want to continue?", "* Dismiss the message to proceed."]);
        }
    } else if (currentTask !== 'clock out - listing') {
        const thecontent = document.getElementById('kt_app_content_container');
        const codeToAdd = `
        <style>
            .lebox {
                    background-color: var(--bs-body-bg) !important;
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

function productGTIN() {
    const gtin_input = document.getElementById('patches-oldgtin');
    const secondary_input = document.getElementById('patches-newgtin');

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

async function duplicateAsin() {
    const listing_form = document.getElementById('rc_create_listing_form');
    if (!listing_form) return false;

    const asin_field = listing_form.querySelector('input[name="product[asin]"]');
    if (!asin_field) return false;

    let timeout = null;
    asin_field.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const value = asin_field.value.trim();
            if (value.length === 10) {
                try {
                    const products = await fetchExistingAsins(value);
                    console.debug(`PATCHES - Asin Check, Value: ${value}, Results:`, products);
                    if (products !== null) {
                        //to-do asin_field
                        customModal('ASIN CHECK?', ["Duplicate ASIN Alert!", "This ASIN appears on the products below:"], products, '60vw');
                    }
                } catch (err) {
                    console.error("Error fetching ASIN data:", err);
                }
            }
        }, 1500);
    });
}

async function fetchExistingAsins(asin) {
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');
        let request = {
            report: {
                type: "catalog_report",
                columns: [
                    "products.sid",
                    "products.name",
                    "products.asin",
                    "products.created_at"
                ],
                filters: [
                    {
                        column: "products.asin",
                        opr: "{0} LIKE '%{1}%'",
                        value: `${asin}`
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
                data: request
            })
            .done(function(data) {
                if (data.success === true && Array.isArray(data.results?.results)) {
                    resolve(data.results.results);
                } else {
                    console.warn("Unexpected response format or no results", data);
                    resolve(null);
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX request failed:", textStatus, errorThrown);
                reject(new Error("AJAX request failed: " + textStatus + ", " + errorThrown));
            });
        });
    } else {
        console.error('Unable to get CSRF');
        return null;
    }
}

async function initListingPatch() {
    console.debug('PATCHES - initListingPatch for wizard');
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
    
        if (listingSubmit && listingResults) {
            listingSubmit.addEventListener('click', function() {
                setTimeout(async function() {
                    if (listingResults) {
                        const getCreatedSKU = listingResults.querySelectorAll('h2');
                        if (getCreatedSKU && getCreatedSKU[0]) {
                            const timespent = await getTimeSpentInMinutes(getCreatedSKU[0].textContent); // await here
                            listingResults.innerHTML += `<br><br><p style="color: var(--bs-info);"><b>Time Spent in Minutes:</b>&nbsp;${timespent} minutes.</p>`;
                        }
                    }                    
    
                    if (listingResults && initGTIN !== curGTIN) {
                        var code = `<br><br>
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
                        listingResults.innerHTML += code;
                    }
                }, 500); // yikes
            });
        }

        // i guess this goes here akkoShrug
        (async () => { duplicateAsin(); })();
    }
}

(async () => {
    if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) { initListingPatch(); }
    inWrongTaskCheck();
})();
  