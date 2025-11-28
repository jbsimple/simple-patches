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
    a.download = `integrationLog_${timestamp}_${page}.csv`;
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

    const button = document.createElement('a');
    button.classList.add('btn', 'btn-info', 'btn-sm');
    button.textContent = "Export CSV";
    button.onclick = exportDtTable;

    toolbar.insertBefore(button, toolbar.firstChild);
}

initExportDtTable();

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