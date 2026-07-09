async function getEmployeeProductivity(sku) {
    let userID = null;
    try {
        const response = await fetch('/user/me');
        const html = await response.text();

        const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatch) {
            for (const script of scriptMatch) {
                const match = script.match(/userID\s*=\s*(\d+);/);
                if (match) {
                    userID = parseInt(match[1], 10);
                    console.debug('PATCHES - Extracted userID:', userID);
                    break;
                }
            }
        }

        if (!userID) {
            console.error('PATCHES - userID not found');
            return null;
        }
    } catch (error) {
        console.error('PATCHES - Error fetching user ID:', error);
        return null;
    }

    const today = new Date();
    const today_mm = String(today.getMonth() + 1).padStart(2, '0');
    const today_dd = String(today.getDate()).padStart(2, '0');
    const today_yyyy = today.getFullYear();
    const todayFormatted = `${today_yyyy}-${today_mm}-${today_dd}`;

    const api = await fetchAPI("reports", {
        body: {
            type: "user_clock",
            page: 1,
            per_page: 1,
            filters: [
                {
                    "field": "user_clocks.clock_date",
                    "operator": "between",
                    "value": [todayFormatted, todayFormatted]
                },
                {
                    "field": "user_profile.user_id",
                    "operator": "eq",
                    "value": `${userID}`
                },
                {
                    "field": "user_clock_activity.activity_code",
                    "operator": "eq",
                    "value": `receiving_listing`
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
                "user_clock_activity.time_spent"
            ]
        }
    });

    if (api.success && api.data?.data?.[0]) {
        const entry = api.data.data[0];
        if (entry.hasOwnProperty("PO_Number") && entry.hasOwnProperty("Time_Spent_in_mintues") && entry.hasOwnProperty("Event_ID")) {
            return entry;
        }
    }

    return null;
}

function inWrongTaskCheck() {
    // this modal is just for the full page wizard wizard
    if (window.location.href.includes('/receiving/queues/listing/')) {
        const afterListing = window.location.href.split('/receiving/queues/listing/')[1];
        if (afterListing && afterListing.trim() !== '' && currentTask !== 'Listing') {
            fireSwal('TASK CHECK?', ["You're about to list without being in the listing task.", "This will not record your time properly.", "Are you sure you want to continue?", "* Green to refresh if clocked in elsewhere, gray to cancel and accept the risk."], 'question', true);
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
            const justCreated = await getEmployeeProductivity(sku);
            eventID = justCreated['Event_ID'] ?? null;
            po = justCreated['PO_Number'] ?? null;

            if (!eventID || !po) {
                console.error('PATCHES - Location Update - Unable to get eventID and PO.', justCreated);
            }
        }

        // verify event id
        eventID = parseInt(eventID, 10);
        if (!Number.isInteger(eventID)) { return { success: false, message: "Invalid Event ID" }; }

        // parse po into a po_id
        if (!Number.isInteger(po)) {
            const url = `/ajax/datalist/PurchaseOrders?term=${encodeURIComponent(po)}`;
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

async function initListingWizard() {
    // Get rid of the same error message printing like 5 million times
    const observer = new MutationObserver(() => {
        let previousText = '';
        document.querySelectorAll('.fv-plugins-message-container.invalid-feedback').forEach(element => {
            const text = element.textContent.trim();
            if (text === previousText) { element.remove(); return; }
            previousText = text;

            const block = element.querySelector('div[data-field]');
            if (!block) return;

            const input = document.querySelector(`input[name="${block.dataset.field}"]`);
            if (!input || input.dataset.errorListenerAttached) return;

            input.dataset.errorListenerAttached = '1';
            input.addEventListener('input', () => {
                element.style.display = block.dataset.validator === 'notEmpty' && input.value.length > 0 ? 'none' : '';
            });
        });
    });
    observer.observe(document.body, {childList: true, subtree: true});

    const listing_form = document.getElementById('rc_create_listing_form');
    if (!listing_form) { console.error('PATCHES - Listing Wizard Init - Unable to find Listing Form'); return; }

    // fix for csrf reissue due to internet loss
    const listingNext = document.querySelector('button[data-kt-stepper-action="next"]');
    if (listingNext) {
        listingNext.addEventListener('click', async function(e) {
            setTimeout(async function () { await checkRenewCSRF(); }, 500);
        });
    } else {
        setInterval(checkRenewCSRF, 60000);
    }
    async function checkRenewCSRF() {
        try {
            const response = await fetch(window.location.href, {
                cache: 'no-store',
                credentials: 'same-origin'
            });

            if (!response.ok) return;

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const newToken = doc.querySelector('#rc_create_listing_form input[name="csrf_recom"]');
            const currentToken = listing_form.querySelector('input[name="csrf_recom"]');

            if (!newToken || !currentToken) return;

            if (newToken.value !== currentToken.value) {
                currentToken.value = newToken.value;
                console.log('Updated CSRF token.');
            }
        } catch (err) {
            console.error('Failed to refresh CSRF token:', err);
        }
    }

    // gtin field accepts everything now so this is a REAL gtin validation
    const gtin_input = document.querySelector('input[name="product[gtin]"]');
    if (gtin_input) {
        gtin_input.setAttribute('type', 'text');
        gtin_input.setAttribute('inputmode', 'numeric');
        gtin_input.setAttribute('pattern', '[0-9]*');
        
        checkGTIN();
        gtin_input.addEventListener('input', checkGTIN);
        document.querySelector('a[href="javascript:generateGtin();"]')?.addEventListener('click', checkGTIN);

        function checkGTIN() {
            setTimeout(function() {
                let valid = '';
                gtin_input.value = gtin_input.value.replace(/\D/g, '');
                const value = gtin_input.value;
                if (value.length === 0) {
                    valid = '';
                } else if ([12, 13, 14].includes(value.length)) {
                    let sum = 0;
                    let odd = true;
                    for (let i = value.length - 2; i >= 0; i--) {
                        const digit = Number(value[i]);
                        sum += odd ? digit * 3 : digit;
                        odd = !odd;
                    }
                    const expectedCheckDigit = (10 - (sum % 10)) % 10;
                    valid = expectedCheckDigit === Number(value[value.length - 1]) ? '' : 'Checksum';
                } else {
                    valid = 'Length';
                }

                let gtinWarning = listing_form.querySelector('[patches-gtinwarning]');
                gtinWarning?.remove();
                if (valid === '') return;
                gtinWarning = document.createElement('p');
                gtinWarning.setAttribute('patches-gtinwarning', '');
                gtinWarning.setAttribute('class', 'text-muted fs-7 mt-3 mx-2');
                gtinWarning.setAttribute('style', 'color: var(--bs-danger) !important;');
                gtinWarning.textContent = `GTIN is weird: ${valid}`;
                gtinWarning.title = `The GTIN is weird because of its ${valid}. It will still save.`;
                gtin_input.insertAdjacentElement('afterend', gtinWarning);
            }, 200);
        }
    }

    // groq generate description button
    const description_input = document.querySelector('input[name="product[description]"]');
    if (description_input) {
        const groqDesc = document.createElement('button');
        groqDesc.classList.add('btn', 'btn-icon', 'btn-sm', 'btn-primary');
        groqDesc.style.marginLeft = '0.5rem';
        groqDesc.title = `Better description autofill using GROQ and Llama`;
        groqDesc.type = "button";
        groqDesc.id = "patches_autofillDesc";
        groqDesc.innerHTML = `<i class="fa-solid fa-brain"></i>`;
        groqDesc.setAttribute('onClick', 'groq_desc_btn();');
        description_input.insertAdjacentElement('afterend', groqDesc);
    }

    // duplicate warnings
    duplicateMPN(listing_form.querySelector('input[name="product[mpn]"]'));
    duplicateAsin(listing_form.querySelector('input[name="product[asin]"]'));

    // new post listing wizard submit
    const listingSubmit = document.querySelector('button[data-kt-stepper-action="submit"]');
    if (!listingSubmit) { console.error('PATCHES - Listing Wizard Init - Unable to find Listing Submit'); return; }
    listingSubmit.addEventListener('click', async function() {
        setTimeout(async function() {
            const listing_results = document.getElementById('listing-results');
            if (!listing_results) { console.error('PATCHES - Listing Wizard Submit - Unable to find Listing Results'); return; }
            listing_results.appendChild(document.createElement('br'));

            // find the SKU
            const skuElement = listing_results.querySelector('h2');
            if (!skuElement) {
                console.error('PATCHES - Listing Wizard Submit - Unable to find SKU h2');
                return;
            }

            const SKU = skuElement.textContent.trim();
            if (!SKU) {
                console.error('PATCHES - Listing Wizard Submit - SKU is empty');
                return;
            }

            // queue quick links
            const queueLinks = document.createElement('div');
            queueLinks.setAttribute('style', 'display:flex; flex-wrap:wrap; gap:0.7rem;');
            queueLinks.innerHTML = `<a class="btn btn-info btn-sm my-sm-1 ms-1" style="display:flex; flex-direction:row; gap:0.25rem; align-items:center; justify-content:center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/fba-check?column=0&keyword=${sku}" target="_blank">
                <i class="fas fa-shipping-fast"></i>
                <span>View In FBA Check</span>
            </a>
            <a class="btn btn-success btn-sm my-sm-1 ms-1" style="display:flex; flex-direction:row; gap:0.25rem; align-items:center; justify-content:center;" title="View in Pending Inventory" aria-label="View in Pending Inventory" href="/receiving/queues/inventory?column=1&keyword=${sku}" target="_blank">
                <i class="fas fa-boxes"></i>
                <span>View In Pending Inventory</span>
            </a>`;
            listing_results.appendChild(queueLinks);

            // time spent and location update
            const justCreated = await getEmployeeProductivity(SKU);
            if (!justCreated) {
                console.error('PATCHES - Listing Wizard Submit - Bad response from justCreated.', justCreated);
                return;
            }

            const timeSpent = justCreated['Time_Spent_in_mintues'] ?? null;
            if (timeSpent) {
                const timeSpentLine = document.createElement('p');
                timeSpentLine.innerHTML = `<strong>Time Spent in Minutes: ${timeSpent}`;
                listing_results.appendChild(timeSpentLine);
            } else {
                console.error('PATCHES - Listing Wizard Submit - No time spent in minutes.', timeSpent, justCreated);
            }
            
            const eventID = justCreated['Event_ID'] ?? null;
            const po = justCreated['PO_Number'] ?? null;
            if (eventID && po) {
                const locationUpdateRow = document.createElement('div');
                locationUpdateRow.setAttribute('style', 'display:flex; flex-wrap:wrap; gap:0.7rem;');
                locationUpdateRow.innerHTML = `<a class="btn btn-info btn-sm my-sm-1 ms-1" style="display:flex; flex-direction:row; gap:0.25rem; align-items:center; justify-content:center;" title="Add PICTURES to Location" aria-label="Add PICTURES to Location" data-sku="${SKU}" data-eventID="${eventID}" data-po="${po}" onclick="handleLocationButton(this);">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Update Location</span>
                </a>`;
                listing_results.appendChild(locationUpdateRow);
            } else {
                console.error('PATCHES - Listing Wizard Submit - No eventID or PO.', eventID, po, justCreated);
            }

        }, 500); // so it can be created first
    });

}

(async () => {
    if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) {
        setTimeout(function() {
            initListingWizard();
            hijackFindProductButton();
        }, 500); // yikes
    } else {
        hijackCreateItemButton();
    }
    inWrongTaskCheck();
})();
  