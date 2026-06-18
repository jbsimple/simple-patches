function init() {
	const addFeesButton = document.querySelector('a[data-url^="order/fees/"]');
	if (!addFeesButton) return;
	
	if (document.getElementById('download-order-lines-btn')) return;
	
	const downloadButton = document.createElement('a');
  downloadButton.id = 'download-order-lines-btn';
  downloadButton.onclick = downloadOrderLines;
  downloadButton.className = 'btn btn-light-success btn-sm me-2';
  downloadButton.href = 'javascript:void(0);';
  downloadButton.textContent = 'Download Lines';
  
  addFeesButton.parentNode.insertBefore(downloadButton, addFeesButton);
	
}

setTimeout(init, 500);

function downloadOrderLines() {
    const orderElem = document.getElementById('rc_order_summary');
    if (!orderElem) return;

    const orderTable = orderElem.querySelector('table');
    if (!orderTable) return;

    const tbody = orderTable.querySelector('tbody');
    if (!tbody) return;

    const rows = [];

    // CSV headers
    rows.push([
        'Product Name',
        'PO Number',
        'Pick Location',
        'SKU',
        'Quantity',
        'Unit Price',
        'Discount',
        'Total'
    ]);

    tbody.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 7) return;

        const productName =
            cells[1].querySelector('.fw-bolder')?.textContent.trim() || '';

        const poNumber =
            cells[1].querySelector('.fs-7 a')?.textContent.trim() || '';

        const pickLocation =
            cells[1].querySelector('.text-info')?.textContent.trim() || '';

        const sku =
            cells[2].textContent.trim();

        const quantity =
            cells[3].textContent.trim();

        const amount1 =
            cells[4].textContent.trim();

        const amount2 =
            cells[5].textContent.trim();

        const amount3 =
            cells[6].textContent.trim();

        rows.push([
            productName,
            poNumber,
            pickLocation,
            sku,
            quantity,
            amount1,
            amount2,
            amount3
        ]);
    });

    // Escape CSV values
    const csv = rows
        .map(row =>
            row
                .map(value =>
                    `"${String(value).replace(/"/g, '""')}"`
                )
                .join(',')
        )
        .join('\n');

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const pageTitle = document.title.replace(/[\\/:*?"<>|]/g, '').replace('Sales Order # ', '').replace(' - Recom', '');
    a.download = `${pageTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}