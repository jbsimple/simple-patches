const autoLocationUpdate = true;

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
                    "user_clock_activity.activity_id",
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
                    console.debug("PATCHES - Listing Results received:", data.results.results);
                    const matchingEntries = data.results.results.filter(
                        entry => entry.Event_Code === "Inventory Listing" 
                        && entry.hasOwnProperty("Time_Spent_in_mintues")
                        && entry.hasOwnProperty("Event_ID")
                    );

                    if (matchingEntries.length > 0) {
                        const lastMatch = matchingEntries[matchingEntries.length - 1];
                        resolve({
                            time_spent: parseFloat(lastMatch.Time_Spent_in_mintues),
                            event_id: parseInt(lastMatch.Event_ID)
                        });
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

function inWrongTaskCheck() {
    const link = document.querySelector('a[href="javascript:clockInOut(\'out\');"]');
    const currentTask = link?.textContent.trim().toLowerCase() ?? 'na';
    console.debug('PATCHES - Task Check:', currentTask);

    // this modal is just for the full page wizard wizard
    if (window.location.href.includes('/receiving/queues/listing/')) {
        const afterListing = window.location.href.split('/receiving/queues/listing/')[1];
        if (afterListing && afterListing.trim() !== '' && currentTask !== 'clock out - listing') {
            fireSwal('TASK CHECK?', ["You're about to list without being in the listing task.", "Are you sure you want to continue?", "* Dismiss the message to proceed."]);
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

async function duplicateAsin() {
    const listing_form = document.getElementById('rc_create_listing_form');
    if (!listing_form) return false;

    const asin_field = listing_form.querySelector('input[name="product[asin]"]');
    if (!asin_field) return false;

    let timeout = null;
    asin_field.addEventListener('input', () => {
        asin_field.style.outline = "";
        asin_field.style.backgroundColor = "";

        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const value = asin_field.value.trim();
            if (value.length === 10) {
                try {
                    const main_asin = await fetchExistingAsins(value);
                    const renewed_asin = await fetchExistingRenewedAsins(value);

                    let products = [];
                    if (Array.isArray(main_asin)) {
                        products = products.concat(main_asin);
                    }
                    if (Array.isArray(renewed_asin)) {
                        products = products.concat(renewed_asin);
                    }
                    console.debug(`PATCHES - Asin Check, Value: ${value}, Results:`, products);
                    if (products.length > 0) {
                        asin_field.style.outline = "2px solid var(--bs-danger)";
                        asin_field.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
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

async function fetchExistingRenewedAsins(asin) {
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
                        column: "metafield|products.id|1",
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
                    const modifiedResults = data.results.results.map(row => {
                        return {
                            ...row,
                            "ASIN_Renewed": asin
                        };
                    });
                    resolve(modifiedResults);
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

async function updateLocation(sku, eventID) {
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');


        eventID = parseInt(eventID, 10);
        if (!Number.isInteger(eventID)) { return { success: false, message: "Invalid Event ID" }; }

        const fba = `/datatables/FbaInventoryQueue?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=${sku}&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=20&search%5Bvalue%5D=&search%5Bregex%5D=false&reset_table=true&_=${Date.now()}`
        const pi = `/datatables/inventoryqueue?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=${sku}&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=20&search%5Bvalue%5D=&search%5Bregex%5D=false&_=${Date.now()}`;

        try {
            // Fetch both endpoints in parallel
            const [fbaRes, piRes] = await Promise.all([
                fetch(fba),
                fetch(pi)
            ]);

            const [fbaData, piData] = await Promise.all([
                fbaRes.json(),
                piRes.json()
            ]);

            const allData = [
                ...(Array.isArray(fbaData.data) ? fbaData.data : []),
                ...(Array.isArray(piData.data) ? piData.data : [])
            ];

            if (allData.length === 0) {
                return { success: false, message: "No data available from either source", 'allData': allData};
            }

            const parser = new DOMParser();

            for (const row of allData) {
                for (const cell of row) {
                    const doc = parser.parseFromString(cell, 'text/html');
                    const anchors = doc.querySelectorAll('a');

                    for (const a of anchors) {
                        const href = a.getAttribute('href') || '';
                        if (href.includes("quickCreate(") && href.includes("'Update Sorting Location'") && href.includes(`/updateSortingLocation/${eventID}`)) {
                            const locationName = ('PICTURES ' + (a.textContent.trim() || '')).trimEnd();

                            const formData = new FormData();
                            formData.append('name', locationName);

                            try {
                                const postRes = await fetch(`/ajax/actions/updateSortingLocation/${eventID}`, {
                                    method: 'POST',
                                    headers: {
                                        'x-csrf-token': csrfToken
                                    },
                                    body: formData
                                });

                                const result = await postRes.json();

                                if (result?.success) {
                                    return { success: true, message: "Location Updated" };
                                } else {
                                    return { success: false, message: result?.message || "Update failed" };
                                }

                            } catch (err) {
                                return { success: false, message: "POST failed: " + err.message };
                            }
                        }
                    }
                }
            }

            return { success: false, message: "Matching link not found for event ID" };

        } catch (err) {
            return { success: false, message: "Fetch failed: " + err.message };
        }
    }
}

async function handleLocationButton(e) {
    // get le info
    const sku = e.getAttribute('data-sku');
    const eventID = parseInt(e.getAttribute('data-eventID'), 10);

    // init le message
    const messageSpan = e.nextElementSibling;
    if (!Number.isInteger(eventID)) {
        messageSpan.textContent = "Invalid Event ID";
        messageSpan.style.color = "var(--bs-danger)";
        return;
    }

    // show le button press
    e.disabled = true;
    const oldButtonText = e.textContent;
    e.textContent = 'Loading...';
    e.style.setProperty('background-color', 'gray', 'important');

    // do le update
    const response = await updateLocation(sku, eventID);

    // show le response
    messageSpan.textContent = response.message;
    messageSpan.style.color = response.success ? 'var(--bs-primary)' : 'var(--bs-danger)';

    // reset le button
    e.classList.remove('disabled');
    e.style.removeProperty('background-color');
    e.textContent = oldButtonText;
}

async function hijackAjaxPrefill() {
    const table = document.getElementById('dtTable_wrapper');
    if (table) {
        table.addEventListener('click', function(event) {
            const target = event.target.closest('button');
            if (target && target.matches('.btn.ajax-modal') && target.textContent.trim() === 'Create Item') {
                console.log('PATCHES - Create Item button clicked:', target);
                const modal = document.getElementById('rc_ajax_modal');
                const observer = new MutationObserver((mutationsList, observer) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0 || mutation.type === 'attributes' || mutation.type === 'subtree' ) {
                            observer.disconnect();
                            (async () => {
                                await new Promise(resolve => setTimeout(resolve, 50));
                                console.log('PATCHES - Modal has updated.');

                                handlePrefillPictureWarning();

                                if (autoLocationUpdate) {
                                    await handlePrefillLocationUpdate();
                                }
                            })();
                            break;
                        }
                    }
                });
                observer.observe(modal, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
        });
    }
}

function handlePrefillWarning(message) { 
    const messageHTML = `<div class="alert alert-danger my-5">${message}<br></div>`; 
    const form = document.getElementById('rc_ajax_modal_form');
    if (form) {
        const walker = document.createTreeWalker(form, NodeFilter.SHOW_COMMENT, {
            acceptNode: (node) => {
                return node.nodeValue.trim() === 'end::Heading' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        });

        const commentNode = walker.nextNode();
        if (commentNode) {
            const container = document.createElement('div');
            container.innerHTML = messageHTML;
            commentNode.parentNode.insertBefore(container.firstElementChild, commentNode.nextSibling);
        }
    }
}

function handlePrefillPictureWarning() {
    const form = document.getElementById('rc_ajax_modal_form');
    if (form) {
        const img = form.querySelector('.img-thumbnail');
        if (img) {
            const imgsrc = img.getAttribute('src').toLowerCase();
            console.debug('PATCHES - Prefill IMG src:', imgsrc);

            if (imgsrc.includes('no-image.png')) {
                handlePrefillWarning('There is no image on the SID, Please send over for pictures.');
            }

            if (imgsrc.includes('stock')) {
                handlePrefillWarning('This SID has Stock Photos, Please send over for pictures.');
            }

            img.onload = function() {
                if (!imgsrc.includes('no-image.png') && (img.naturalWidth !== 1200 || img.naturalHeight !== 1200)) {
                    handlePrefillWarning(`Image is not 1200x1200 (actual: ${img.naturalWidth}x${img.naturalHeight}), Please send over for pictures.`);
                }
            };
            
            if (img.complete) {
                img.onload();
            }
        } else {
            console.error('Unable to find image?', img);
        }
    } else {
        console.error('Unable to find form?', form);
    }
}

async function handlePrefillLocationUpdate() {
    const ajax_button = document.getElementById('rc_ajax_modal_submit');
     if (ajax_button) {
        ajax_button.addEventListener('click', async (e) => {
            try {
                await prefillSubmit();
            } catch (err) {
                console.error('PATCHES - Error during prefillSubmit:', err);
                alert('Unexpected error. Check console for details.');
            }
        }, { once: true });
    }

    async function prefillSubmit() {
        window.addEventListener('beforeunload', unloadWarning);
        console.debug('PATCHES - PrefillSubmit Called');
        const ajax_modalForm = document.getElementById('rc_ajax_modal_form');
        if (!ajax_modalForm) return;

        const skuInput = ajax_modalForm.querySelector('input[name="item[sku]"]');
        if (!skuInput) return;

        const sku = skuInput.value.trim();
        if (!sku) {
            alert('SKU is missing.');
            return;
        }

        try {
            const justCreated = await getTimeSpentInMinutes(sku);
            const eventID = justCreated?.event_id;

            if (!eventID) {
                throw new Error('Event ID not found from getTimeSpentInMinutes');
            }

            // this here
            const updateLocationResponse = await updateLocation(sku, eventID);
            window.removeEventListener('beforeunload', unloadWarning);
            if (updateLocationResponse.success) {
                console.log('PATCHES - Location Updated');
            } else {
                console.error('PATCHES - Unable to Update Location:', updateLocationResponse);
                alert(`Issue Updating Location: ${updateLocationResponse.message ?? 'Check Console'}`);
            }
        } catch (err) {
            console.error('PATCHES - Error during location update:', err);
            alert('Failed to prefill location. Check console.');
        }
    }

    function unloadWarning(e) {
        e.preventDefault();
        e.returnValue = '';
    }
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
    
        if (listingSubmit && listingResults) {
            listingSubmit.addEventListener('click', function() {
                setTimeout(async function() {
                    let code = '';
                    if (listingResults) {
                        const getCreatedSKU = listingResults.querySelectorAll('h2');
                        if (getCreatedSKU && getCreatedSKU[0]) {
                            const sku = getCreatedSKU[0].textContent;
                            const justCreated = await getTimeSpentInMinutes(sku); // await here
                            const timespent = justCreated.time_spent;
                            const eventID = justCreated.event_id;
                            code += `<br><br><p style="color: var(--bs-info);"><b>Time Spent in Minutes:</b>&nbsp;${timespent} minutes.</p>`;
                            code += `<div class="patches-row patches-gap">
                                <div class="patches-row" style="gap: 0.5rem; align-items: center; justify-content: center;">
                                    <a class="btn btn-info btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/fba-check?column=0&keyword=${sku}" target="_blank">
                                        <i class="fas fa-shipping-fast"></i>
                                        <span>View In FBA Check</span>
                                    </a>
                                    <a class="btn btn-success btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/inventory?column=0&keyword=${sku}" target="_blank">
                                        <i class="fas fa-boxes"></i>
                                        <span>View In Pending Inventory</span>
                                    </a>
                                </div>`;
                            if (!autoLocationUpdate) {
                                code += `<div class="patches-row" style="gap: 0.5rem; align-items: center; justify-content: center;">
                                    <a class="btn btn-info btn-sm my-sm-1 ms-1" style="display: flex; flex-direction: row; gap: 0.25rem; align-items: center; justify-content: center;" title="Add PICTURES to Location" aria-label="Add PICTURES to Location" data-sku="${sku}" data-eventID="${eventID}" onclick="handleLocationButton(this);">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>Update Location</span>
                                    </a>
                                    <span></span>
                                </div>`;
                            } else {
                                window.addEventListener('beforeunload', unloadWarning);
                                const updateLocationResponse = await updateLocation(sku, eventID);
                                window.removeEventListener('beforeunload', unloadWarning);
                                if (updateLocationResponse.success) {
                                    console.log('PATCHES - Location Updated');
                                } else {
                                    console.error('PATCHES - Unable to Update Location:', updateLocationResponse);
                                    alert(`Issue Updating Location: ${updateLocationResponse.message ?? 'Check Console'}`);
                                }
                            }
                            code += `<span class="spacer"></span></div>`;
                        }
                    }                    
    
                    if (listingResults && initGTIN !== curGTIN) {
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
                    listingResults.innerHTML += code;

                }, 500); // yikes
            });
        }

        // i guess this goes here akkoShrug
        (async () => { duplicateAsin(); })();

        function unloadWarning(e) {
            e.preventDefault();
            e.returnValue = '';
        }
    }
}

(async () => {
    if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) { 
        initListingPatch();
    } else {
        hijackAjaxPrefill();
    }
    inWrongTaskCheck();
})();
  