function prettyLinkSkus() {
    const table = document.getElementById('dtTable');
    if (table) {
        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
            const text = td.textContent;
            if (
                (text.startsWith('SC-') || text.startsWith('RF_SC-') || text.startsWith('DF-')) &&
                !td.querySelector('a')
            ) {
                const cleanedSku = text.startsWith('RF_') ? text.replace(/^RF_/, '') : text;
                td.innerHTML = `<a href="/product/items/${cleanedSku}" target="_blank">${text}</a>`;
            }
        });
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "table_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}