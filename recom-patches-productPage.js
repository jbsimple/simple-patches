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

document.querySelectorAll('.json__key').forEach(function(keyDiv) {
    if (keyDiv.textContent.trim() === 'meta_id') {
        let nextDiv = keyDiv.nextElementSibling;
        if (nextDiv) {
            const meta_id = parseInt(nextDiv.textContent, 10);
            const meta_name = getMetaName(meta_id);
            nextDiv.textContent = `(${meta_id}) ${meta_name}`;
        } else {
            console.error('Invalid NextDiv for Meta Fix');
        }
    }
});