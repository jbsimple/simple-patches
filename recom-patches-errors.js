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