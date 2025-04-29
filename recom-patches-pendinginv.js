async function checkPics() {
	const table = document.getElementById('dtTable_wrapper');
    if (!table) {
        return false;
    }

	const products = table.querySelectorAll('[data-url^="ajax/modals/productitems/"]');

	for (const product of products) {
		const url = product.getAttribute('data-url');
        const id = url.split('/').pop();

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			const img = doc.querySelector('img');
			if (img) {
				let parent = product.parentElement;
				parent.innerHTML = `<a href="/products/${id}" data-url="${url}" class="ajax-modal">
                    <img src="${img.src}" style="width:42px; height:42px; display:inline-block; margin-right:1rem;">
                </a>
                <div style="display: flex; flex-direction: column;">${parent.innerHTML}</div>`;
				parent.setAttribute('style', 'display: inline-flex; flex-direction: row; align-items: center');
			} else {
				console.log('No image found in response for URL:', url);
			}
		} catch (error) {
			console.error('Failed to fetch or parse URL:', url, error);
		}
	}
}

function piInit() {
    const picontainer = document.getElementById('kt_app_content_container');
    if (!picontainer) return;

    const checkImgButton = document.createElement('button');
    checkImgButton.classList.add('btn', 'btn-info');
    checkImgButton.id = 'patch_openAllImages';
    checkImgButton.textContent = 'Check Images';
    checkImgButton.disabled = true;
    checkImgButton.title = "Loads image icons in queue.";
    checkImgButton.style.cssText = `
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 5px;
    `;
    checkImgButton.onclick = checkPics;

    const toolbar = picontainer.querySelector('.card-toolbar.flex-row-fluid.justify-content-end');
    if (toolbar && toolbar.classList.contains('justify-content-end')) {
        toolbar.classList.remove('flex-row-fluid', 'justify-content-end');
        toolbar.setAttribute('style', 'flex-direction: row; width: 100%;');

        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        toolbar.prepend(spacer);
        toolbar.prepend(checkImgButton);
    }

    let styleObserver = null;

    function updateButtonState() {
        const wrapper = document.getElementById('dtTable_wrapper');
        const processing = document.getElementById('dtTable_processing');
        const isReady = wrapper && (!processing || processing.style.display === 'none');
        checkImgButton.disabled = !isReady;
    }

    function observeProcessing() {
        const processing = document.getElementById('dtTable_processing');
        if (processing) {
            if (styleObserver) styleObserver.disconnect();
            styleObserver = new MutationObserver(updateButtonState);
            styleObserver.observe(processing, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }

    const globalObserver = new MutationObserver(() => {
        updateButtonState();
        observeProcessing();
    });

    globalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

piInit();