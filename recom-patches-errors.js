async function prettyLinkSkus() {
    const table = document.getElementById('dtTable');
    if (!table) return;

    const tds = table.querySelectorAll('td');
    for (const td of tds) {
        const text = td.textContent.trim();
        if (
            (text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-')) &&
            !td.querySelector('a')
        ) {
            const cleanedSku = text.startsWith('RF_') ? text.replace(/^RF_/, '') : text;
            const href = `/product/items/${cleanedSku}`;

            let in_stock = "";

            try {
                const res = await fetch(href);
                if (res.ok) {
                    const html = await res.text();

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");

                    const invLink = doc.getElementById('getTotalInventoryBreakdown');
                    if (invLink) {
                        const parent = invLink.parentElement;
                        if (parent && parent.nextElementSibling) {
                            in_stock = parent.nextElementSibling.textContent.trim();
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching", href, err);
            }

            td.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <a href="${href}" target="_blank">${text}</a>
                    <span>${in_stock}</span>
                </div>
            `;
        }
    }
}

// Run once on initial load
setTimeout(prettyLinkSkus, 500);

// Observe #dtTable_wrapper for changes
const wrapper = document.getElementById('dtTable_wrapper');
if (wrapper) {
    const observer = new MutationObserver(() => {
        clearTimeout(observer._debounce);
        observer._debounce = setTimeout(prettyLinkSkus, 500);
    });

    observer.observe(wrapper, { childList: true, subtree: true });
}

function exportTable() {
    const table = document.getElementById('dtTable');
    if (!table) return;

    let rows = [];

    table.querySelectorAll("thead tr, tbody tr").forEach(tr => {
        let cells = [];
        tr.querySelectorAll("th, td").forEach(td => {
            let text = td.innerText.trim();

            const link = td.querySelector("a");
            if (link) text = link.textContent.trim();

            if (text.includes(",") || text.includes("\"")) {
                text = `"${text.replace(/"/g, '""')}"`;
            }
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
    a.download = `integrationLog_${timestamp}_${page}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// add button
function initExport() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    if (!kt_app_content_container) return;

    const toolbar = kt_app_content_container.querySelector('.card-toolbar.flex-row-fluid.justify-content-end.gap-5');
    if (!toolbar) return;

    const button = document.createElement('a');
    button.classList.add('btn', 'btn-info', 'btn-sm');
    button.textContent = "Export CSV";
    button.onclick = exportTable;

    toolbar.insertBefore(button, toolbar.firstChild);
}

setTimeout(initExport, 50);