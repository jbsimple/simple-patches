const pictureLogger_modal = false; // show modal after upload
const pictureLogger_api = 'https://simple-patches.vercel.app/api/pictrack';

async function pictureLogger_fetch(filters = {item:null,person:null,date:null}) {
		const params = new URLSearchParams();
		if (filters.item) params.set('item', filters.item);
		if (filters.person) params.set('person', filters.person);
		if (filters.date) params.set('date', filters.date);
		params.set('limit', '500');
	
		const getRes = await fetch(`${pictureLogger_api}?${params.toString()}`, {
        method: 'GET'
    });
    const getData = await getRes.json();

    if (!getData.success) {
        console.error('[PICTURE LOGGER] Failed to fetch last log:', getData.error);
        return;
    }
    
    console.debug('[PICTURE LOGGER] Full Log:', getData.data);
    return getData;
}

function pictureLogger_init() {
		// permission to write?
		if (typeof pictureLogger_password === 'undefined') return;
		
		// limit where
		if (!window.location.href.includes("/products/") && !window.location.href.includes("/product/items/")) return;
		
		// verify the transfer flag is present
		if (typeof isPicTransfer !== 'boolean') return;
		
		// find person
		const kt_header_user_menu_toggle = document.getElementById('kt_header_user_menu_toggle');
		if (!kt_header_user_menu_toggle) return;
		const nameElem = kt_header_user_menu_toggle.querySelector('.menu-sub > .menu-item > .menu-content > .d-flex.flex-column > .fw-bold.d-flex.align-items-center.fs-5');
		if (!nameElem) return
		const nameElemClone = nameElem.cloneNode(true);
		const badge = nameElemClone.querySelector('.badge');
    if (badge) badge.remove();
    const person = nameElemClone.textContent.trim();
    
    // find item
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    if (!kt_app_content_container) return;
    let item = kt_app_content_container.querySelector('.card')?.querySelector('.card-title')?.textContent.trim() ?? null;
    if (!item) return;
    
    
    // mutation observer to track when done uploading
		const dropbox = document.getElementById('rc_product_media');
		if (!dropbox) return;
		function pictureLogger_beforeUnload(e) {
		    e.preventDefault();
		    e.returnValue = '';
		    return '';
		}

		let dropbox_wasStarted = dropbox.classList.contains('dz-started');
		const observer = new MutationObserver(async() => {
        const dropbox_isStarted = dropbox.classList.contains('dz-started');
        if (dropbox_wasStarted && !dropbox_isStarted) {
        		// get current media count
				    let count = 0;
				    const product_images_container = document.getElementById('product-images-container');
				    if (product_images_container) {
				    		count = product_images_container.querySelectorAll('div[data-id]').length ?? 0;
				    }
				    window.addEventListener('beforeunload', pictureLogger_beforeUnload);
				    let response = null;
				    try {
						    if (pictureLogger_modal) {
						    		const modalResult = await pictureLogger_recordModal(person, item, count);
								    if (!modalResult) {
								        console.debug('[PICTURE LOGGER] Cancelled by user.');
								        return;
								    }
								    count = modalResult.count;
								    let notes = modalResult.notes ?? '';
				        		response = await pictureLogger_record({item,count,notes,person});
						    } else {
						    		response = await pictureLogger_record({item,count,notes:'',person});
						    }
		        		
		        		if (response.success) {
		        				console.debug('[PICTURE LOGGER] Picture Log Successfully Recorded.');
		        				if (!pictureLogger_modal) fireToast('Picture Logged', 'Successfully logged your picture upload.', 'primary');
		        		} else {
		        				console.error('[PICTURE LOGGER] Failed to record Picture Log.');
		        				if (!pictureLogger_modal) fireToast('Error Logging Picture', 'Unable to log your picture upload.', 'danger');
		        		}
				    } finally {
		            window.removeEventListener('beforeunload', pictureLogger_beforeUnload);
		        }
        }
        dropbox_wasStarted = dropbox_isStarted;
    });
    observer.observe(dropbox, {attributes: true, attributeFilter: ['class']});
}
setTimeout(pictureLogger_init, 500);

async function pictureLogger_record({item,count,notes,person}) {
		if (typeof pictureLogger_password === 'undefined') return;
		const postRes = await fetch(pictureLogger_api, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-upload-password': pictureLogger_password},
        body: JSON.stringify({item, count, notes, person})
    });
    const response = await postRes.json();
    console.debug('[PICTURE LOGGER] Response from DB Update:', response);
    return response;
}

function pictureLogger_recordModal(person, item, count = 0) {
    if (typeof pictureLogger_password === 'undefined') return;
    const modalEl = document.getElementById('rc_ajax_modal');
    if (!modalEl) {
        console.error('[PICTURE LOGGER] Modal element not found.');
        return;
    }

    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Log Picture</h5>
                    <button type="button" class="btn-close" id="rc_ajax_modal_close" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-4">
                        <strong>Person:</strong> ${person}<br>
                        <strong>Item:</strong> ${item}
                    </p>
                    <div class="mb-3">
                        <label for="rc_ajax_modal_count" class="form-label">Count</label>
                        <input type="number" class="form-control" id="rc_ajax_modal_count" min="0" value="${count}" required>
                    </div>
                    <div class="mb-3">
                        <label for="rc_ajax_modal_notes" class="form-label">Notes</label>
                        <textarea class="form-control" id="rc_ajax_modal_notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="rc_ajax_modal_cancel">Cancel</button>
                    <button type="button" class="btn btn-primary" id="rc_ajax_modal_submit">Submit</button>
                </div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    return new Promise((resolve) => {
        const cleanup = () => {
            submitBtn.removeEventListener('click', onSubmit);
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
        };

        const submitBtn = modalEl.querySelector('#rc_ajax_modal_submit');
        const cancelBtn = modalEl.querySelector('#rc_ajax_modal_cancel');
        const closeBtn = modalEl.querySelector('#rc_ajax_modal_close');
        const countInput = modalEl.querySelector('#rc_ajax_modal_count');
        const notesInput = modalEl.querySelector('#rc_ajax_modal_notes');

        let resolved = false;

        function onSubmit() {
            const count = countInput.value.trim();
            if (count === '' || isNaN(count)) {
                countInput.classList.add('is-invalid');
                return;
            }
            resolved = true;
            cleanup();
            modal.hide();
            resolve({ count: Number(count), notes: notesInput.value.trim() });
        }

        function onCancel() {
            resolved = true;
            cleanup();
            modal.hide();
            resolve(null);
        }

        function onHidden() {
            if (!resolved) {
                cleanup();
                resolve(null);
            }
        }

        submitBtn.addEventListener('click', onSubmit);
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
        modalEl.addEventListener('hidden.bs.modal', onHidden);
    });
}

// productivity table

function pictureLogger_tableContainer(date = null) {
    const isoToday = new Date().toISOString().slice(0, 10);
    const selectedDate = date || isoToday;
 
    const container = document.createElement('div');
    container.className = 'picture-logger-table-container';
    container.innerHTML = `
        <div class="mb-3 d-flex align-items-center gap-2">
            <label for="rc_table_date" class="form-label mb-0">Date</label>
            <input type="date" class="form-control w-auto" id="rc_table_date" value="${selectedDate}">
        </div>
        <div id="rc_table_body">
            <div class="text-center py-5">
                <div class="spinner-border" role="status"></div>
            </div>
        </div>
        <div class="mt-3">
            <button type="button" class="btn btn-secondary" id="rc_table_copy">Copy Table</button>
        </div>
    `;
 
    const dateInput = container.querySelector('#rc_table_date');
    const copyBtn = container.querySelector('#rc_table_copy');
 
    async function loadTable(forDate) {
        const bodyEl = container.querySelector('#rc_table_body');
        if (!bodyEl) return;
        bodyEl.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>`;
        let records = [];
        try {
            const result = await pictureLogger_fetch({ date: forDate });
            records = (result && result.data) || [];
        } catch (err) {
            console.error('[PICTURE LOGGER] Failed to load table data:', err);
        }
        bodyEl.innerHTML = pictureLogger_buildTableHTML(records, forDate);
    }
 
    dateInput.addEventListener('change', () => loadTable(dateInput.value));
    copyBtn.addEventListener('click', () => pictureLogger_copyTable(container, copyBtn));
 
    loadTable(selectedDate);
 
    return container;
}

async function pictureLogger_copyTable(container, copyBtn) {
    const rows = container.querySelectorAll('#rc_table_body table tbody tr');
    if (!rows.length) return;

    const bodyRows = Array.from(rows).slice(1);
    const tsv = bodyRows.map(row => Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim()).join('\t')).join('\n');
 
    const originalLabel = copyBtn.textContent;
    try {
        await navigator.clipboard.writeText(tsv);
        copyBtn.textContent = 'Copied!';
    } catch (err) {
        console.error('[PICTURE LOGGER] Failed to copy table:', err);
        copyBtn.textContent = 'Copy failed';
    } finally {
        setTimeout(() => { copyBtn.textContent = originalLabel; }, 1500);
    }
}

function pictureLogger_buildTableHTML(records, dateVal = '') {
    const chronological = [...records].reverse();
 
    const byPerson = {};
    const personOrder = [];
    for (const rec of chronological) {
        const person = rec.person || 'Unknown';
        const item = rec.item || 'Unknown';
        if (!byPerson[person]) {
            byPerson[person] = { items: {}, itemOrder: [] };
            personOrder.push(person);
        }
        const personData = byPerson[person];
        if (!personData.items[item]) {
            personData.items[item] = { count: 0, notes: [] };
            personData.itemOrder.push(item);
        }
        personData.items[item].count += Number(rec.count) || 0;
        if (rec.notes) personData.items[item].notes.push(rec.notes);
    }
 
    const people = personOrder.sort();
 
    if (people.length === 0) { return `<div class="text-center text-muted py-5">No picture logs found for this date.</div>`; }
 
    const perPerson = people.map(person => {
        const { items, itemOrder } = byPerson[person];
        const totalItems = itemOrder.length;
        const totalProcessed = itemOrder.reduce((sum, name) => sum + items[name].count, 0);
        return { person, items, itemNames: itemOrder, totalItems, totalProcessed };
    });
 
    const maxRows = Math.max(...perPerson.map(p => p.itemNames.length), 0);

    let colgroup = '<colgroup>';
    perPerson.forEach((p, i) => {
        colgroup += '<col style="width:30%"><col style="width:30%"><col style="width:40%">';
        if (i === 0 && perPerson.length > 1) colgroup += '<col style="width:2%">';
    });
    colgroup += '</colgroup>';

 
    let theadTop = '<tr>';
    perPerson.forEach((p, i) => {
        theadTop += `<th colspan="3" class="text-center align-middle">${pictureLogger_escapeHtml(p.person)}</th>`;
        if (i === 0 && perPerson.length > 1) theadTop += '<th></th>';
    });
    theadTop += '</tr>';
 
    let theadSub = '<tr class="text-center">';
    perPerson.forEach((p, i) => {
        theadSub += '<th>Item</th><th>Processed</th><th>Notes</th>';
        if (i === 0 && perPerson.length > 1) theadSub += '<th></th>';
    });
    theadSub += '</tr>';
 
    let summaryRow = '<tr class="table-active text-center fw-bold">';
    perPerson.forEach((p, i) => {
        summaryRow += `<td>${p.totalItems}</td><td>${p.totalProcessed}</td><td></td>`;
        if (i === 0 && perPerson.length > 1) { summaryRow += `<td class="text-center">${pictureLogger_escapeHtml(dateVal)}</td>`; }
    });
    summaryRow += '</tr>';

    let bodyRows = '';
    for (let i = 0; i < maxRows; i++) {
        bodyRows += '<tr>';
        perPerson.forEach((p, idx) => {
            const name = p.itemNames[i];
            if (name) {
                const info = p.items[name];
                const notes = info.notes.join('; ');
                bodyRows += `<td>${pictureLogger_escapeHtml(name)}</td><td>${info.count}</td><td>${pictureLogger_escapeHtml(notes)}</td>`;
            } else {
                bodyRows += '<td></td><td></td><td></td>';
            }
            if (idx === 0 && perPerson.length > 1) bodyRows += '<td></td>';
        });
        bodyRows += '</tr>';
    }
 
    return `
        <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle">
                ${colgroup}
                <thead>
                    ${theadTop}
                    ${theadSub}
                </thead>
                <tbody>
                    ${summaryRow}
                    ${bodyRows}
                </tbody>
            </table>
        </div>
    `;
}
 
function pictureLogger_escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}