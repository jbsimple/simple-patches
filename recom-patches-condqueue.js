var parentInject = document.getElementById('bulk_assign').parentNode;

var exportButton = document.createElement('a');
exportButton.classList.add('btn');
exportButton.classList.add('btn-info');
exportButton.classList.add('btn-sm');
exportButton.style.marginLeft = "0.5rem";
exportButton.innerHTML = "Export Table";
exportButton.onclick = exportTable;
parentInject.appendChild(exportButton);

function exportTable() {
    const table = document.getElementById('dtTable');
    const thead = table.getElementsByTagName('thead')[0];
    const tbody = table.getElementsByTagName('tbody')[0];
    
    var filename = "" + Date.now() + "_" + document.title.split(' - ')[0];
    filename = filename.replace(/ /g, '-');
    let csvContent = "";
    
    // Extract headers
let headers = [];
for (const headerCell of thead.rows[0].cells) {
    headers.push(`"${headerCell.textContent.trim()}"`);
}

headers[0] = '"SKU"';
headers[1] = '"Product Title"';
headers[7] = '"Date Entered"';
headers[8] = '"Date Updated"';

// Add headers to CSV content
csvContent += headers.join(',') + '\r\n';
    
    for (const row of tbody.rows) {
        let rowData = [];
        for (let i = 0; i < row.cells.length; i++) {
            if (i !== 0 && i !== row.cells.length - 1) {
                let cell = row.cells[i];
                if (i === row.cells.length - 2) {
                    let tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cell.innerHTML;
                    let parts = tempDiv.innerHTML.split('<br>');
                    if (parts.length > 1) {
                        let firstPart = document.createElement('div');
                        firstPart.innerHTML = parts[0];
                        let secondPart = document.createElement('div');
                        secondPart.innerHTML = parts[1];
                        rowData.push(`"${firstPart.textContent.trim()}"`, `"${secondPart.textContent.trim()}"`);
                    } else {
                        rowData.push(`"${tempDiv.textContent.trim()}"`, "");
                    }
                } else if (cell.querySelector('span.fw-bolder') && cell.querySelector('a.text-muted')) {
                    let spanContent = cell.querySelector('span.fw-bolder').textContent.trim();
                    let aContent = cell.querySelector('a.text-muted').textContent.trim();
                    rowData.push(`"${spanContent}"`, `"${aContent}"`);
                } else {
                    let tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cell.innerHTML;
                    let cleanedData = (tempDiv.textContent || tempDiv.innerText || '').replace(/(\r\n|\n|\r)/gm, "").trim();
                    cleanedData = cleanedData.replace(/,/g, '');
                    cleanedData = /[,\r\n]/.test(cleanedData) ? `"${cleanedData}"` : cleanedData;
                    rowData.push(cleanedData);
                }
            }
        }
        csvContent += rowData.join(',') + '\r\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.setAttribute("download", filename);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
}

var tallyButton = document.createElement('a');
tallyButton.classList.add('btn');
tallyButton.classList.add('btn-info');
tallyButton.classList.add('btn-sm');
tallyButton.style.marginLeft = "0.5rem";
tallyButton.innerHTML = "Get Total";
tallyButton.onclick = tallyTable;
parentInject.appendChild(tallyButton);

function tallyTable() {
    var total = 0;
    var trElements = document.getElementsByTagName('tr');
    for (let i = 0; i < trElements.length; i++) {
        var trObj = trElements[i];
        if (trObj.classList.contains('odd') || trObj.classList.contains('even')) {
            var tdElements = trObj.getElementsByTagName('td');
            if (tdElements.length >= 4) {
                var fourthTd = tdElements[3];
                var strongElement = fourthTd.querySelector('strong');
                if (strongElement !== null) {
                    var numberString = strongElement.textContent.trim();
                    var number = parseInt(numberString, 10);
                    total += number;
                }
            }
        }
    }
    
    if (document.getElementById('showTotal')) {
        document.getElementById('showTotal').remove();
    }
    
    var showTotal = document.createElement('span');
    showTotal.id = "showTotal";
    showTotal.style.height = "38px";
    showTotal.style.borderTopRightRadius = "20px";
    showTotal.style.borderBottomRightRadius = "20px";
    showTotal.style.backgroundColor = "rgb(0,0,0,0.1)";
    showTotal.style.display = "flex";
    showTotal.style.justifyContent = "center";
    showTotal.style.alignItems = "center";
    showTotal.style.textAlign = "center";
    showTotal.style.paddingLeft = "20px";
    showTotal.style.paddingRight = "20px";
    showTotal.style.border = "1px solid black";
    showTotal.innerHTML = "<strong>" + total + "</strong>"
    parentInject.appendChild(showTotal);
}