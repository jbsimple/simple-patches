async function checkPics() {
	const table = document.getElementById('dtTable_wrapper');
	const products = table.querySelectorAll('[data-url^="ajax/modals/productitems/"]');

	for (const product of products) {
		const url = product.getAttribute('data-url');

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			const img = doc.querySelector('img');
			if (img) {
				let parent = product.parentElement;
				parent.innerHTML = `<img src="${img.src}" style="width:42px; height:42px; display:inline-block; margin-right:1rem;"><div style="display: flex; flex-direction: column;">${parent.innerHTML}</div>`;
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
    if (picontainer) {
        const checkImgButton = document.createElement('button');
        checkImgButton.classList.add('btn', 'btn-info');
        checkImgButton.id = 'patch_openAllImages';
        checkImgButton.textContent = 'Check Images';
        checkImgButton.style.color = 'white';
        checkImgButton.style.border = 'none';
        checkImgButton.style.padding = '10px 20px';
        checkImgButton.style.cursor = 'pointer';
        checkImgButton.style.borderRadius = '5px';
        checkImgButton.onclick = checkPics;
        
        const toolbar = picontainer.querySelector('.card-toolbar.flex-row-fluid.justify-content-end');
        if (toolbar && toolbar.classList.contains('justify-content-end')) {
            toolbar.classList.remove('flex-row-fluid', 'justify-content-end');
            toolbar.setAttribute('style', 'flex-direction: row; width: 100%;');

            const spacer = document.createElement('div');
            spacer.setAttribute('style', 'flex: 1;');
            toolbar.prepend(spacer);
            toolbar.prepend(checkImgButton);
        }
    }
}

window.onload = piInit;