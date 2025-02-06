function prettyLinkSkus() {
    const table = document.getElementById('dtTable');
    if (table) {
        const tds = table.querySelectorAll('td');
        if (tds) {
            tds.forEach(td => {
                if (td.innerHTML.startsWith('SC-')) {
                    const sku = td.innerHTML;
                    td.innerHTML = `<a href="/product/items/${sku}" target="_blank">${sku}</a>`;
                }
            });
        }
    }
}

setTimeout(function () { prettyLinkSkus(); }, 500);