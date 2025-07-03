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