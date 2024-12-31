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

const dropbox = document.getElementById('rc_product_media');

if (dropbox) {
    const expectedClasses = ['dropzone', 'dz-clickable'];

    window.onbeforeunload = function () {
        const hasExactClasses = 
            dropbox.classList.length === expectedClasses.length &&
            expectedClasses.every(cls => dropbox.classList.contains(cls));

        if (!hasExactClasses) {
            return "Are you sure you want to leave? Images are still uploading.";
        }
        return undefined;
    };
}

function openAllImages() {
    if (imageElements && imageElements.length > 0) {
        console.debug('Opening all images by simulating clicks with delay:', imageElements);

        for (let i = 0; i < imageElements.length; i++) {
            setTimeout(() => {
                const imageElement = imageElements[i];
                console.debug(`Simulating click for URL: ${imageElement.href}`);
                imageElement.click();
            }, i * 50);
        }
    }
}


if (media_tab && media_tree) {
    var newElement = document.createElement('div');
    newElement.classList.add('fv-row');
    newElement.classList.add('mb-2');
    newElement.setAttribute('style', 'padding-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center');
    
    // Add button if there are image elements
    if (imageElements.length > 0) {

        if (checkPopup()) {
            var button_label = document.createElement('label');
            button_label.for = 'patch_openAllImages';
            button_label.textContent = '(Enable Popups):';
            button_label.setAttribute('style', 'color: var(--bs-danger); font-weight: 500; font-size: 1.1rem;');
            newElement.appendChild(button_label);
        }

        var button = document.createElement('button');
        button.classList.add('btn');
        button.classList.add('btn-info');
        button.id = 'patch_openAllImages';
        button.textContent = 'Open All Images';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '5px';
        button.onclick = openAllImages;
        newElement.appendChild(button);

    }
    
    media_tree_parent.insertBefore(newElement, media_tree);
}


function checkPopup() {
    const popupStatus = getCookie("popupsEnabled");
    if (popupStatus === "true") {
        console.log("Popups are enabled (from cookie).");
        return true;
    } else if (popupStatus === "false") {
        console.log("Popups are disabled (from cookie).");
        return false;
    }

    let isPopupBlocked = false;
    try {
        const options = 'width=100,height=100,left=100,top=100,resizable=yes';
        const testWindow = window.open('', '', options);
        if (!testWindow || testWindow.closed || typeof testWindow.closed === 'undefined') {
            isPopupBlocked = true;
        } else {
            testWindow.close();
        }
    } catch (e) {
        isPopupBlocked = true;
    }

    setCookie("popupsEnabled", !isPopupBlocked, 7);

    return !isPopupBlocked;

    // functions
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = `patch_${name}` + "=" + value + expires + "; path=/";
    }
    
    function getCookie(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
            if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length, cookie.length);
        }
        return null;
    }
}