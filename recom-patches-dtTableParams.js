/* autosearch magic */
function initAutoSearch() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('column') || !params.has('keyword')) return;

    const column = parseInt(params.get('column'));
    const keyword = params.get('keyword');

    const dtfoot = document.getElementById('dtfoot');
    if (!dtfoot) return;

    const th = dtfoot.querySelectorAll('th');
    if (th[column]) {
        const input = th[column].querySelector('input, select');
        if (input) {
            input.value = keyword;
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
    }

    const targetTh = th[th.length - 1];
    const observer = new MutationObserver((mutations, obs) => {
        const submit = targetTh.querySelector('.btn-primary');
        if (submit) {
            submit.click();
            obs.disconnect();
        }
    });

    observer.observe(targetTh, { childList: true, subtree: true });
}

initAutoSearch();

async function unsafeTableLength() {
    const select = document.querySelector('select[name="dtTable_length"]');
    if (!select) return;
    
    const addOptions = [200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]; // why am I able to just do this?
    addOptions.forEach(value => {
        const option = document.createElement('option');
        option.setAttribute('value', value);
        option.textContent = value;
        select.appendChild(option);
    });
}

unsafeTableLength();

function exportDtTable() {
    const table = document.getElementById('dtTable');
    if (!table) return;

    let rows = [];

    table.querySelectorAll("thead tr, tbody tr").forEach(tr => {
        let cells = [];
        tr.querySelectorAll("th, td").forEach(td => {
            let text = td.innerText.trim();

            const link = td.querySelector("a");
            if (link) { text = link.textContent.trim(); }

            const span = td.querySelector("span[title]");
            if (span && span.getAttribute("title")) { text = span.getAttribute("title").trim(); }

            if (text.includes(",") || text.includes("\"")) { text = `"${text.replace(/"/g, '""')}"`; }

            cells.push(text);
        });
        rows.push(cells.join(","));
    });

    const csvContent = rows.join("\n");

    const timestamp = Math.floor(Date.now() / 1000);

    let page = '0';
    const dtTable_wrapper = document.getElementById('dtTable_wrapper');
    if (dtTable_wrapper) {
        const pageEl = dtTable_wrapper.querySelector('.page-item.active');
        page = pageEl ? pageEl.textContent.trim() : "all";
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const uri = location.pathname.replace(/^\/+/, "");
    const datatableName = uri.replace(/[^a-zA-Z0-9_-]/g, "-");
    a.download = `${datatableName}_${timestamp}_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// add button
function initExportDtTable() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    if (!kt_app_content_container) return;

    const toolbar = kt_app_content_container.querySelector('.card-toolbar.flex-row-fluid.justify-content-end.gap-5');
    if (!toolbar) return;

    if (toolbar.querySelector('[data-patches="dtTableExport"]')) return;

    const button = document.createElement('a');
    button.classList.add('btn', 'btn-info', 'btn-sm');
    button.setAttribute('data-patches', 'dtTableExport');
    button.textContent = "Export CSV";
    button.onclick = exportDtTable;

    toolbar.insertBefore(button, toolbar.firstChild);
}

function observeExportDtTable() {
    const container = document.getElementById('kt_app_content_container');
    if (!container) return;

    const observer = new MutationObserver(() => {
        initExportDtTable();
    });

    observer.observe(container, {
        childList: true,
        subtree: true
    });

    initExportDtTable();
    dtBulkDeleteInit();
}
observeExportDtTable();

async function dtBulkDelete() {
    /* queries */
    const table = document.getElementById('dtTable');
    if (!table) {
        fireSwal('UHOH!', 'Unable to find table.', 'error');
        return null;
    };

    const deleteButtons = table.querySelectorAll('button[title="Delete"]');
    if (!deleteButtons || deleteButtons.length <= 0) {
        fireSwal('UHOH!', 'Unable to find delete queries.', 'error');
        return null;
    };

    /* csrf */
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    const csrfToken = csrfMeta?.getAttribute('content');
    if (!csrfToken) {
        fireSwal('UHOH!', 'Unable to find CSRF Token.', 'error');
        return null;
    }

    /* pin */
    let pin = null;
    try {
        const res = await fetch('/settings/general', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch settings page');

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const input = doc.querySelector('input[name="settings[admin_pin]"]');
        pin = input?.value?.trim() || null;
    } catch (err) {
        console.error('Error fetching admin PIN:', err);
    }

    if (!pin) {
        fireSwal('UHOH!', 'Unable to fetch the Admin Pin.', 'error');
        return null;
    }

    const confirm = await confirmSwal(
        'Confirm Bulk Delete',
        [`You are about to delete <strong>${deleteButtons.length}</strong> items.`, 'This action cannot be undone.'],
        'warning',
        'Delete Them',
        'Cancel'
    );

    if (!confirm) {
        console.info('PATCHES - Bulk delete cancelled by user.');
        return null;
    }

    let log = [];
    for (const button of deleteButtons) {
        const id = button.getAttribute('data-id');
        const request = `/receiving/delete/${id}?pin=${encodeURIComponent(pin)}`;
        const body = new URLSearchParams({ pin });

        try {
            const res = await fetch(request, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "x-csrf-token": csrfToken,
                    "x-requested-with": "XMLHttpRequest"
                },
                body: body.toString()
            });

            const json = await res.json();
            console.debug(`PATCHES - Deleted ${id}:`, json);
            log.push({ item: id, response: json });
        } catch (err) {
            console.error(`PATCHES - Failed Deleting ${id}:`, err);
            log.push({
                item: id,
                response: { success: false, message: "Failed to delete.", err: err.toString() }
            });
        }
    };

    const dtsearchbtns = document.getElementById('dtsearchbtns');
    if (dtsearchbtns) {
        const search = dtsearchbtns.querySelector('.btn.btn-primary');
        if (search) { search.click(); }
    }

    fireSwal('Done', [`Processed ${log.length}.`, "Check console for detailed log."], 'success');
    console.debug(`PATCHES - Log:`, log);
    return null;
}

function dtBulkDeleteInit() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    if (!kt_app_content_container) return;

    const toolbar = kt_app_content_container.querySelector('.card-toolbar.flex-row-fluid.justify-content-end.gap-5');
    if (!toolbar) return;

    if (toolbar.querySelector('[data-patches="dtTableBulkDelete"]')) return;

    const button = document.createElement('a');
    button.classList.add('btn', 'btn-danger', 'btn-sm');
    button.setAttribute('data-patches', 'dtTableBulkDelete');
    button.textContent = "Bulk Delete";
    button.onclick = dtBulkDelete;

    toolbar.insertBefore(button, toolbar.firstChild.nextSibling);
}
dtBulkDeleteInit();

function toggleLDtTableoad(display = null) {
    const dtTable_processing = document.getElementById('dtTable_processing');
    if (dtTable_processing) {
        if (display !== null) {
            dtTable_processing.style.display = display
        } else if (dtTable_processing.style.display === 'none') {
            dtTable_processing.style.display = 'inherit';
        } else {
            dtTable_processing.style.display = 'none';
        }
    }
}