function openPatchesModal(opts = {}) {
    const {
        id = `patch_modal_${Date.now()}`,
        title = '',
        body = '',
        footer = '',
        width = '650px',
        anchor = '#rc_ajax_modal',
        backdropStatic = true,
        focus = null,
        styles = '',
        onClose = null,
        canClose = () => true,
        escapeBlockedWhen = null
    } = opts;

    const anchorEl = typeof anchor === 'string' ? document.querySelector(anchor) : anchor;
    if (!anchorEl) { console.error("Anchor not found:", anchor); return null; }

    const styleBlock = styles || `
        <style>
            #${id} .modal-content {
                transform: translateY(-15vh) !important;
                opacity: 0.25 !important;
                transition: transform .18s ease, opacity .18s ease !important;
            }
            #${id}.show .modal-content {
                transform: unset !important;
                opacity: 1 !important;
            }
        </style>
    `;

    const closeIcon = `
        <span class="svg-icon svg-icon-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="currentColor"></rect>
                <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="currentColor"></rect>
            </svg>
        </span>
    `;

    const html = `
        ${styleBlock}
        <div class="modal fade" id="${id}" ${backdropStatic ? 'data-bs-backdrop="static"' : ''} tabindex="-1" aria-hidden="true" role="dialog" style="display: none; background: rgba(0, 0, 0, .4) !important;">
            <div class="modal-dialog modal-dialog-centered" style="max-width: ${width} !important;">
                <div class="modal-content rounded">
                    <div class="modal-header">
                        <h2 class="fw-bolder">${title}</h2>
                        <div class="btn btn-icon btn-sm btn-active-icon-primary" data-modal-close>${closeIcon}</div>
                    </div>
                    <div class="modal-body scroll-y px-10 px-lg-15 pt-0 pb-15" style="padding-top: 1.5rem !important;">
                        ${body}
                        ${footer}
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    anchorEl.parentNode.insertBefore(container, anchorEl);

    const modalEl = container.querySelector('#' + id);
    const contentEl = container.querySelector('.modal-content');

    const tryClose = () => {
        if (!canClose()) return;

        const onEnd = (e) => {
            if (e && e.target !== contentEl) return;
            modalEl.removeEventListener('transitionend', onEnd);
            document.removeEventListener('keydown', onKeydown);
            container.remove();
            if (typeof onClose === 'function') onClose();
        };

        modalEl.classList.remove('show'); 
        modalEl.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, 400);
    };

    container.addEventListener('click', (e) => {
        const closer = e.target.closest('[data-modal-close]');
        if (closer) tryClose();
    });

    const onKeydown = (e) => {
        if (e.key === 'Escape') {
            const ae = document.activeElement;
            if (typeof escapeBlockedWhen === 'function' && escapeBlockedWhen(ae)) return;
            tryClose();
        }
    };
    document.addEventListener('keydown', onKeydown);

    modalEl.style.display = 'block';
    modalEl.removeAttribute('aria-hidden');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.classList.remove('show');

    if (contentEl) void contentEl.offsetWidth;

    requestAnimationFrame(() => {
        modalEl.classList.add('show');
        if (focus) {
            const f = container.querySelector(focus);
            if (f) f.focus({ preventScroll: true });
        }
    });

    return {
        el: modalEl,
        root: container,
        close: tryClose,
        find: (sel) => container.querySelector(sel)
    };
}

function modifiedClock(task) {
    let datalisthtml = '';
    if (settings && settings.activitylist && Array.isArray(settings.activitylist) && settings.activitylist.length > 0) {
        settings.activitylist.forEach(option => {
            datalisthtml += `<option value="${option}"></option>`;
        })
        datalisthtml = `<datalist id="patch-clockout-text-task-list">${datalisthtml}</datalist>`;
    }

    const body = `
        <div class="d-flex flex-column mb-8">
            <p class="fs-6 fw-bold">You are about to clock out! Quickly record time below.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><b>Actvitiy/Event</b>: Use if needing to tack multiple things in same task.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><b>Notes</b>: Provide extra notes if needed.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><i>* Please Note: Actvity defaults to task name, notes default to placeholder value when left blank.</i></p>
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch-clockout-text-task">Activity/Event:</label>
            <input type="text" class="form-control form-control-solid" name="task" id="patch-clockout-text-task" ${datalisthtml !== '' ? 'list="patch-clockout-text-task-list" autocomplete="off"' : ''} placeholder="Enter Activity/Event" value="${task ?? ''}" spellcheck="false">
            ${datalisthtml}
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch-clockout-textarea-notes">Notes:</label>
            <textarea style="max-height: 50vh;" class="form-control form-control-solid" rows="3" name="notes" id="patch-clockout-textarea-notes" placeholder="Provide some notes if any" spellcheck="false"></textarea>
        </div>
        <div class="separator my-10"></div>
    `;

    const footer = `
        <div class="text-center">
            <button type="button" class="btn btn-light me-3" data-modal-close>Cancel</button>
            <button type="button" id="patches_clockout_submit" class="btn btn-primary">
                <span class="indicator-label">Submit</span>
                <span class="indicator-progress" style="display: none;">Please wait...
                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                </span>
            </button>
        </div>
    `;

    const api = openPatchesModal({
        id: 'patch_clockout_fullModal',
        title: 'Record Clock Out',
        body,
        footer,
        focus: '#patch-clockout-text-task',
        escapeBlockedWhen: (ae) => ae && ae.id === 'patch-clockout-textarea-notes'
    });
    if (!api) return;

    const submit = api.find('#patches_clockout_submit');
    if (submit) {
        submit.onclick = function () {
            const noteTextBox = api.find('#patch-clockout-textarea-notes');
            let notes = (noteTextBox && noteTextBox.value.length > 0) ? noteTextBox.value : '';

            submit.querySelector('.indicator-label').style.display = 'none';
            submit.querySelector('.indicator-progress').style.display = 'inherit';

            const actionInput = api.find('#patch-clockout-text-task');
            let action = "OFF_SYSTEM";

            if (actionInput && actionInput.value.trim() !== '') {
                action = actionInput.value.trim();
            } else if (typeof task !== 'undefined' && String(task).trim() !== '') {
                action = String(task).trim();
            }

            $.ajax({
                type: "POST",
                dataType: "json",
                url: "/productivity/record",
                data: {
                    csrf_recom: $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                    "clock_activity[activity_code]": action,
                    "clock_activity[units]": "0",
                    "clock_activity[notes]": notes || "Off System Clock Out",
                    "clock_activity[clock_out]": "1"
                },
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                },
            })
            .done(function (data) { apiResponseAlert(data); })
            .fail(function (error) { console.error("FAIL", error); ajaxFailAlert(error); })
            .always(function () {
                submit.querySelector('.indicator-label').style.display = '';
                submit.querySelector('.indicator-progress').style.display = 'none';
            });
        };
    }
}

async function updatePictureLocations() {
    let isRunning = false;

    const body = `
        <div class="d-flex flex-column mb-8">
            <p class="fs-6 fw-bold">Bulk update picture locations from a nice list.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><b>1</b>: Paste in a list, either comma separated, comma-space separated or break-line separated.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><b>2</b>: Hit submit and wait a little bit for the locations to update.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><b>3</b>: See the results, spot any issues and be happy I guess.</p>
            <p class="fs-6 fw-semibold form-label mb-2"><i>* Please Note: This does a blanket search in FBA Check and Pending Inventory for your list with locations that contains PICTURES. It will update EVERYTHING it sees.</i></p>
            <p class="fs-6 fw-semibold form-label mb-2"><i>* Also Note: This is a very slow process, especially for long lists. So once you start it, just leave it, don't close the tab.</i></p>
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_picloc-text-location">New Location:</label>
            <p class="fs-6 fw-semibold form-label mb-2">This will replace PICTURES with whatever is in the box, still keeps old location.</p>
            <input type="text" class="form-control form-control-solid" name="task" id="patch_picloc-text-location" placeholder="Enter Activity/Event" value="PUTAWAYS" spellcheck="false">
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_picloc-textarea-list">List:</label>
            <textarea style="max-height: 50vh;" class="form-control form-control-solid" rows="3" name="notes" id="patch_picloc-textarea-list" placeholder="Paste the list here." spellcheck="false"></textarea>
        </div>
        <div class="separator my-10"></div>
        <div class="patches-column" style="gap: 0;">
            <div class="patches-progress" id="patch_picloc_progress" style="display: none;"></div>
        </div>
        <div class="patches-row" id="patch_picloc_stats" style="display: none;">
            <span class="patches-spacer"></span>
            <div class="patches-column" style="gap: 0.25rem;">
                <strong>Success:</strong>
                <span id="patch_picloc_success">0</span>
            </div>
            <span class="patches-vr"></span>
            <div class="patches-column" style="gap: 0.25rem;">
                <strong>Fail:</strong>
                <span id="patch_picloc_fail">0</span>
            </div>
            <span class="patches-vr"></span>
            <div class="patches-column" style="gap: 0.25rem;">
                <strong>Total:</strong>
                <span id="patch_picloc_total">0</span>
            </div>
            <span class="patches-spacer"></span>
        </div>
        <div class="patches-column" id="patch_picloc_result" style="display: none;"></div>
    `;

    const footer = `
        <div class="text-center">
            <button type="button" class="btn btn-light me-3" data-modal-close id="patch_picloc_cancel">Cancel</button>
            <button type="button" id="patch_picloc_submit" class="btn btn-primary">
                <span class="indicator-label">Submit</span>
                <span class="indicator-progress" style="display: none;">Please wait...
                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                </span>
            </button>
        </div>
    `;

    const api = openPatchesModal({
        id: 'patch_picloc_fullModal',
        title: 'Update Picture Locations',
        body,
        footer,
        focus: '#patch_picloc-text-location',
        canClose: () => !isRunning,
        escapeBlockedWhen: (ae) => ae && ae.id === 'patch_picloc-textarea-list'
    });
    if (!api) return;

    const submit = api.find('#patch_picloc_submit');
    if (!submit) return;

    submit.onclick = async function() {
        /* handler for timeouts and fails */
        submit.textContent = 'Loading...';
        submit.setAttribute('style', 'background-color: gray !important;');
        submit.disabled = true;

        window.addEventListener('beforeunload', unloadWarning);
        isRunning = true;

        async function fetchQueues() {
            let fba = `/datatables/FbaInventoryQueue?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=PICTURES&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=150&search%5Bvalue%5D=&search%5Bregex%5D=false&_==${Date.now()}`;
            let pi = `/datatables/inventoryqueue?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=PICTURES&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=8&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=150&search%5Bvalue%5D=&search%5Bregex%5D=false&_=${Date.now()}`;

            const [fbaRes, piRes] = await Promise.allSettled([
                fetchJsonWithTimeout(fba),
                fetchJsonWithTimeout(pi)
            ]);
            console.debug('Results from FBA Queue:', fbaRes);
            console.debug('Results from Pending Inventory Queue:', piRes);

            const fbaOk = fbaRes.status === 'fulfilled' && fbaRes.value.ok && Array.isArray(fbaRes.value.data?.data);
            const piOk  = piRes.status === 'fulfilled' && piRes.value.ok && Array.isArray(piRes.value.data?.data);

            const parsedAll = [];

            const parser = new DOMParser();

            const fbaQueue = fbaRes.value.data.data ?? [];
            const fbaParsed = await parseQueue(fbaQueue, 0, 2);

            const piQueue = piRes.value.data.data ?? [];
            const piParsed  = await parseQueue(piQueue, 1, 5);

            return [...fbaParsed, ...piParsed];

            async function parseQueue(queue, detailIndex, locationIndex) {
                const parsed = [];

                for (const line of queue) {
                    let entry = {};

                    const details = parser.parseFromString(line[detailIndex], "text/html");
                    const detailLinks = details.querySelectorAll("a");
                    for (const a of detailLinks) {
                        const href = a.getAttribute("href") || "";
                        if (href.includes("product/items/")) {
                            entry.sku = a.textContent.trim();
                        }
                        if (a.hasAttribute("data-url") && a.getAttribute("data-url").includes("ajax/modals/productitems/")) {
                            entry.title = a.textContent.trim();
                            entry.sid = await fetchSID(a.getAttribute("data-url")); // ✅ works now
                        }
                    }

                    entry.locations = [];
                    const locations = parser.parseFromString(line[locationIndex], "text/html");
                    for (const a of locations.querySelectorAll("a")) {
                        const text = a.textContent.trim();
                        const href = a.getAttribute("href") || "";
                        if (text.includes("PICTURES")) {
                            let locationentry = { location: text };
                            const match = href.match(/updateSortingLocation\/(\d+)/);
                            if (match) {
                                locationentry.ajax = match[1];
                            }
                            entry.locations.push(locationentry);
                        }
                    }

                    parsed.push(entry);
                }

                return parsed;
            }

            async function fetchSID(ajax) {
                try {
                    const response = await fetch(ajax, { credentials: "include" });
                    const html = await response.text();
                    const doc = parser.parseFromString(html, "text/html");
                    const targetDiv = doc.querySelector("div.d-flex.flex-wrap.fw-bold.mb-4.fs-5.text-gray-400");
                    return targetDiv ? targetDiv.textContent.trim() : null;
                } catch (err) {
                    console.error("PATCHES - fetchSID error:", err);
                    return null;
                }
            }
        }

        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');

            const newLocation = document.getElementById('patch_picloc-text-location');
            let changeLocation = 'PUTAWAYS';
            if (newLocation && newLocation.value && newLocation.value.length > 0) {
                changeLocation = newLocation.value;
            }

            const list = document.getElementById('patch_picloc-textarea-list');
            let values = [];
            if (list && list.value) {
                values = list.value
                    .split(/[\n,]+/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
            }
            console.debug('Patches - Parsed List:', values);

            const queueData = await fetchQueues();
            console.debug('Patches - Parsed Queue:', queueData);

            const log = [];
            for (let index = 0; index < values.length; index++) {
                const item = values[index];
                const search = searchForItem(values[index], queueData);
                if (search !== null && Array.isArray(search)) {
                    search.forEach(async (location) => {
                        let value = location.location.trim().replace(/PICTURES/gi, changeLocation).trimEnd();
                        let ajax = `/ajax/actions/updateSortingLocation/${location.ajax}`;
                        const eventID = location.ajax; // for log I guess
                        const formData = new FormData();
                        formData.append('name', value);
                        try {
                            const postRes = await fetchJsonWithTimeout(ajax,
                                {
                                    method: 'POST',
                                    headers: { 'x-csrf-token': csrfToken },
                                    body: formData
                                }
                            );

                            const ok = postRes.ok && (postRes.data?.success === true);
                            const newLog = {
                                eventID,
                                item,
                                success: ok,
                                message: postRes.data?.message || (ok ? 'Successful' : (postRes.timedOut ? `POST timed out after ${TIMEOUT_MS} ms` : (postRes.error?.message || 'Fail')))
                            };
                            log.push(newLog);
                            printLog(newLog, index, values.length);

                        } catch (err) {
                            const newLog = {
                                eventID,
                                item,
                                success: false,
                                message: `POST failed: ${err.message}`
                            };
                            log.push(newLog);
                            printLog(newLog, index, values.length);
                        }
                    });
                } else {
                    let eventID = null;
                    const newLog = {
                        eventID,
                        item,
                        success: false,
                        message: `Item not found in either queue.`
                    };
                    log.push(newLog);
                    printLog(newLog, index, values.length);
                }
                
            }

            console.debug('PATCHES - Location LOG Update:', log);
            resetSubmitButton();
        }

        function searchForItem(item, queueData) {
            const needle = String(item).trim().toLowerCase();

            for (const entry of queueData) {
                const sid = entry.sid ? String(entry.sid).trim().toLowerCase() : "";
                const sku = entry.sku ? String(entry.sku).trim().toLowerCase() : "";

                const sidMatch = sid.includes(needle);
                const skuMatch = sku.includes(needle);

                if (sidMatch || skuMatch) {
                    console.debug(`PATCHES - Searching for "${item}", FOUND:`, entry.locations);
                    return entry.locations;
                }
            }

            console.debug(`PATCHES - Searching for "${item}", NOT FOUND! queueData:`, queueData);
            return null;
        }

        function printLog(entry, index, length) {
            updateProgress((index + 1), length, entry.success); // plus one
            const resultPrintout = document.getElementById('patch_picloc_result');
            if (resultPrintout) {
                resultPrintout.style.display = 'flex';
                const status = entry.success ? '<span style="color: var(--bs-primary);">GOOD</span>' : '<span style="color: var(--bs-danger);">ERROR</span>';
                const event = entry.eventID ? `<span>[(Event ID: ${entry.eventID})]</span>` : '';
                resultPrintout.innerHTML += `<p style="display: inline-flex; flex-direction: row; gap: 0.25rem; margin: 0;">
                    <strong>${status}</strong>
                    <span>=><span>
                    <a href="/receiving/queues/inventory?column=1&keyword=${encodeURIComponent(entry.item)}" target="_blank">${entry.item}</a>
                    ${event}
                    <span>:</span>
                    <span>${entry.message}</span>
                </p>`;
                setTimeout(() => { resultPrintout.scrollTop = resultPrintout.scrollHeight; }, 0);
            }
        }

        function updateProgress(num, den, good) {
            const bar = document.getElementById('patch_picloc_progress');
            if (bar && den !== 0) {
                const percentage = (num / den) * 100;
                bar.style.display = 'block';
                bar.style.width = `${percentage}%`;
            } else if (bar) {
                bar.style.display = 'none';
                bar.style.width = '0%';
            }

            const stats = document.getElementById('patch_picloc_stats');
            const success = document.getElementById('patch_picloc_success');
            const fail = document.getElementById('patch_picloc_fail');
            const total = document.getElementById('patch_picloc_total');
            if (stats && success && fail && total) {
                stats.style.display = 'flex';

                let successCount = parseInt(success.textContent) || 0;
                let failCount = parseInt(fail.textContent) || 0;
                if (good) successCount++; else failCount++;

                success.textContent = successCount;
                fail.textContent = failCount;
                total.textContent = successCount + failCount;
            }
        }

        function resetSubmitButton() {
            submit.disabled = false;
            submit.innerHTML = `<span class="indicator-label">Submit</span>
                                <span class="indicator-progress" style="display: none;">Please wait...
                                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                                </span>`;
            submit.style.backgroundColor = '';

            const resultPrintout = document.getElementById('patch_picloc_result');
            if (resultPrintout) {
                resultPrintout.style.display = 'flex';
                resultPrintout.innerHTML += `<p style="text-align: center; font-weight: 700;">List Finished.</p>`;
                setTimeout(() => { resultPrintout.scrollTop = resultPrintout.scrollHeight; }, 0);
            }

            window.removeEventListener('beforeunload', unloadWarning);
            isRunning = false;
        }

        function unloadWarning(e) {
            e.preventDefault();
            e.returnValue = '';
        }
    };

}

function patchesSettingsModal() {
    const body = `
        <style>
            .patches-twowrap,
            .patches-threewrap {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                justify-content: space-between;
            }
            .patches-twowrap .mb-8,
            .patches-threewrap .mb-8 {
                margin-bottom: 0px !important;
            }
            .patches-twowrap > div {
                width: calc(50% - 1rem);
            }
            .patches-threewrap > div {
                width: calc(33% - 1rem);
            }

        </style>
        <p class="fs-6 fw-semibold form-label mb-8" style="text-align: center;">Change various settings to customize your patching experience.<br></p>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_setting_activitylist">Activity Clock-Out List:</label>
            <p class="fs-6 fw-semibold form-label mb-2">If you want to have a list of commonly used activities for uniformity.</p>
            <textarea style="max-height: 20vh;" class="form-control form-control-solid" rows="2" name="activitylist" id="patch_setting_activitylist" placeholder="Enter comma-separated list here." spellcheck="false"></textarea>
        </div>
        <div class="d-flex mb-8 patches-twowrap">
            <div class="d-flex flex-column mb-8">
                <label class="fs-6 fw-bold mb-2" for="patch_setting_mockupProductivity">Enable Mockup Productivity:</label>
                <p class="fs-6 fw-semibold form-label mb-2">This is the mockup I am using for the KMP.</p>
                <input type="checkbox" class="form-check-input" name="mockupProductivity" id="patch_setting_mockupProductivity">
            </div>
            <div class="d-flex flex-column mb-8">
                <label class="fs-6 fw-bold mb-2" for="patch_setting_mockupProductivityDepartment">Mockup Productivity Department:</label>
                <p class="fs-6 fw-semibold form-label mb-2">Fetch Productivity for a specific department.</p>
                <input type="text" class="form-control form-control-solid" name="mockupProductivityDepartment" id="patch_setting_mockupProductivityDepartment" placeholder="Enter Department Name" value="" spellcheck="false">
            </div>
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_setting_pfpurl">User Icon URL:</label>
            <p class="fs-6 fw-semibold form-label mb-2">If you want to add a custom profile picture for the top bar.</p>
            <input type="text" class="form-control form-control-solid" name="pfpurl" id="patch_setting_pfpurl" placeholder="Enter URL" value="" spellcheck="false">
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_setting_bgurl">Background Image URL:</label>
            <p class="fs-6 fw-semibold form-label mb-2">If you want to add a custom background to each page.</p>
            <input type="text" class="form-control form-control-solid" name="bgurl" id="patch_setting_bgurl" placeholder="Enter URL" value="" spellcheck="false">
        </div>
        <div class="d-flex mb-8 patches-threewrap">
            <div class="d-flex flex-column mb-8">
                <label class="fs-6 fw-bold mb-2" for="patch_setting_bgpos">Background Image Object Position:</label>
                <p class="fs-6 fw-semibold form-label mb-2">Optional: Anchor options for the background image.</p>
                <select class="form-select form-select-solid" name="bgpos" id="patch_setting_bgpos">
                    <option value="">None / Default</option>
                    <option value="center center">center center</option>
                    <option value="top left">top left</option>
                    <option value="top center">top center</option>
                    <option value="top right">top right</option>
                    <option value="center left">center left</option>
                    <option value="center right">center right</option>
                    <option value="bottom left">bottom left</option>
                    <option value="bottom center">bottom center</option>
                    <option value="bottom right">bottom right</option>
                </select>
            </div>
            <div class="d-flex flex-column mb-8">
                <label class="fs-6 fw-bold mb-2" for="patch_setting_bgobf">Background Image Object Fit:</label>
                <p class="fs-6 fw-semibold form-label mb-2">Optional: Containment options for the background image.</p>
                <select class="form-select form-select-solid" name="bgobf" id="patch_setting_bgobf">
                    <option value="">None / Default</option>
                    <option value="fill">fill (stretch to fill the container)</option>
                    <option value="contain">contain (fit within container, keep aspect ratio)</option>
                    <option value="cover">cover (fill container, cropping as needed)</option>
                    <option value="none">none (use image's original size)</option>
                    <option value="scale-down">scale-down (smaller of none or contain)</option>
                </select>
            </div>
            <div class="d-flex flex-column mb-8">
                <label class="fs-6 fw-bold mb-2" for="patch_setting_bgopa">Background Image Opacity:</label>
                <p class="fs-6 fw-semibold form-label mb-2">Optional: Adjust opacity of the background image.</p>
                <input type="number" class="form-control form-control-solid" name="bgopa" id="patch_setting_bgopa" placeholder="Enter a value between 0 and 1" value="" min="0" max="1" step="0.01">
            </div>
        </div>
        <div class="d-flex flex-column mb-8">
            <label class="fs-6 fw-bold mb-2" for="patch_setting_customcss">Global CSS Rules:</label>
            <p class="fs-6 fw-semibold form-label mb-2">If you want to add custom css rules that applies to all pages.</p>
            <textarea style="max-height: 30vh;" class="form-control form-control-solid" rows="3" name="customcss" id="patch_setting_customcss" placeholder="Enter CSS Code Here" spellcheck="false"></textarea>
        </div>
        <div class="separator my-10"></div>
    `;

    const footer = `
        <div class="text-center">
            <button type="button" class="btn btn-light me-3" data-modal-close>Cancel</button>
            <button type="button" id="patches_settings_submit" class="btn btn-primary">
                <span class="indicator-label">Submit</span>
                <span class="indicator-progress" style="display: none;">Please wait...
                    <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                </span>
            </button>
        </div>
    `;

    const api = openPatchesModal({
        id: 'patch_settings_fullModal',
        title: 'Patches Settings',
        body,
        footer,
        width: '1000px',
        focus: null,
        escapeBlockedWhen: (ae) => ae
    });

    if (!api) return;

    // Prefill inputs from global settings
    if (settings && typeof settings === 'object') {
        const modal = document.getElementById('patch_settings_fullModal');
        if (modal) {
            const inputs = modal.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                const val = settings[input.name];
                if (val === undefined) return;

                if (input.type === 'checkbox') {
                    input.checked = Boolean(val);
                } else {
                    input.value = val;
                }

                console.debug(`PATCHES - Prefilled ${input.name} =`, val);
            });
        }
    }

    // Save new settings, replace old
    const submit = api.find('#patches_settings_submit');
    if (!submit) return;

    submit.onclick = async function() {
        const modal = document.getElementById('patch_settings_fullModal');
        if (!modal) return;

        const inputs = modal.querySelectorAll('input, select, textarea');
        const newSettings = {};

        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                newSettings[input.name] = input.checked;
            } else {
                newSettings[input.name] = input.value;
            }
        });

        localStorage.setItem('patch_settings', JSON.stringify(newSettings));

        fireSwal('Settings Saved', 'Your new settings have been saved. Reload to take effect.', 'success', true);
        console.debug('PATCHES - Saved settings:', newSettings);

    }
}