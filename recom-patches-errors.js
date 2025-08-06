function prettyLinkSkus() {
    const table = document.getElementById('dtTable');
    if (table) {
        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
            if (
                (td.textContent.startsWith('SC-') || td.textContent.startsWith('RF_SC-')) &&
                !td.querySelector('a')
            ) {
                const sku = td.textContent;
                td.innerHTML = `<a href="/product/items/${sku}" target="_blank">${sku}</a>`;
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