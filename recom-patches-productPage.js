function getMetaName(meta_id) {
    const meta = [
        { meta_id: 7, meta_name: "asin_check" },
        { meta_id: 1, meta_name: "renewed_asin" },
        { meta_id: 10, meta_name: "backmarket_check" },
        { meta_id: 2, meta_name: "backmarket_id" },
        { meta_id: 13, meta_name: "cycle_count" },
        { meta_id: 12, meta_name: "marketplace_check" },
        { meta_id: 11, meta_name: "oversold" },
        { meta_id: 17, meta_name: "reebelo_id" },
        { meta_id: 18, meta_name: "reebelo_id_-_canada" },
        { meta_id: 16, meta_name: "renewed_premium_asin" },
        { meta_id: 3, meta_name: "secondary_asins" },
        { meta_id: 20, meta_name: "secondary_backmarket_ids" },
        { meta_id: 5, meta_name: "secondary_gtin" },
        { meta_id: 14, meta_name: "send_to_fba_-_yesno" },
        { meta_id: 8, meta_name: "short_title" },
        { meta_id: 9, meta_name: "walmart_check" },
        { meta_id: 4, meta_name: "walmart_upc" },
        { meta_id: 15, meta_name: "activity_log" }
    ];
    const metaItem = meta.find(item => item.meta_id === meta_id);
    return metaItem ? metaItem.meta_name : null;
}

setTimeout(function() {
    document.querySelectorAll('.json__key').forEach(function(keyDiv) {
        if (keyDiv.textContent.trim() === 'meta_id') {
            let nextDiv = keyDiv.nextElementSibling;
            if (nextDiv && nextDiv.classList.contains('json__value') && nextDiv.classList.contains('json__value--update')) {
                const meta_id = parseInt(nextDiv.textContent, 10);
                const meta_name = getMetaName(meta_id);
                nextDiv.textContent = `(${meta_id}) ${meta_name}`;
            }
        }
    });
}, 500);

// Getting rid of bad gallery viewer
var media_tab = document.getElementById('rc_product_media_tab');
var media_tree = document.getElementById('product-images-container');
var media_tree_parent = null;

if (media_tree) {
	media_tree_parent = media_tree.parentNode;
}

var imageElements = media_tree.querySelectorAll('[data-type="image"]');

if (imageElements && imageElements.length > 0) {
    $(imageElements).off(); //jQuery ftw

    imageElements.forEach(imgLink => {
        imgLink.onclick = null;
        imgLink.setAttribute('target', '_blank');
    });
}

// Handle new uploads
// Before, clicking a picture freshly uploaded by accident just opens the <a> default.
// AT LEAST it should be in a new tab.
if (media_tree) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement && node.matches('[data-type="image"]')) {
                    $(node).off(); //jQuery ftw
                    node.onclick = null;
                    node.setAttribute('target', '_blank');
                }

                const newImages = node.querySelectorAll?.('[data-type="image"]');
                if (newImages) {
                    newImages.forEach(imgLink => {
                        $(imgLink).off(); //jQuery ftw
                        imgLink.onclick = null;
                        imgLink.setAttribute('target', '_blank');
                    });
                }
            });
        });
    });

    observer.observe(media_tree, { childList: true, subtree: true });
}
