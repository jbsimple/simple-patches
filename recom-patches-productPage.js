/* transcribe meta fields in activity log */
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

// epic wait
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback();
    } else {
        setTimeout(() => waitForElement(selector, callback), 100);
    }
}

/* pretty print links for asins */
function prettyLinkAsins() {
    const productForm = document.getElementById('el_product_form');
    if (productForm) {
        const labels = productForm.querySelectorAll('.form-label');
        if (labels) {
            labels.forEach(label => {
                const parent = label.parentElement;
                if (label.textContent === 'Secondary ASINs' && parent) {
                    const select = parent.querySelector('select');
                    if (select) {
                        const createASINLinks = () => {
                            const existingLinks = document.getElementById('patches-meta-secondaryAsins');
                            if (existingLinks) {
                                existingLinks.remove();
                            }
                            const asinLinks = document.createElement('div');
                            asinLinks.setAttribute('style', 'display: flex; flex-wrap: wrap; gap: 1rem; margin-top: .75rem !important; margin-right: .5rem !important; margin-left: .5rem !important;');
                            asinLinks.id = 'patches-meta-secondaryAsins';

                            const options = select.querySelectorAll('option');
                            options.forEach(option => {
                                if (option.value && option.value !== '') {
                                    const asinLink = document.createElement('a');
                                    asinLink.target = '_blank';
                                    asinLink.href = `https://amazon.com/dp/${option.value}`;
                                    asinLink.textContent = option.value;
                                    asinLinks.appendChild(asinLink);
                                }
                            });

                            parent.appendChild(asinLinks);
                        };

                        createASINLinks();

                        const observer = new MutationObserver(() => {
                            createASINLinks();
                        });

                        observer.observe(select, {
                            childList: true
                        });
                    }
                } else if (label.textContent === 'ASIN Renewed' && parent) {
                    asinSingleLink(parent, 'patches-meta-renewedAsin');
                } else if (label.textContent === 'ASIN' && parent) {
                    asinSingleLink(parent, 'patches-meta-asin');
                }
            });
        } else {
            console.error(labels);
        }
    }

    function asinSingleLink(parent, id) {
        const input = parent.querySelector('input[type="text"]');
        if (input) {
            const createASINLink = () => {
                const existingLinks = document.getElementById(id);
                if (existingLinks) {
                    existingLinks.remove();
                }
                if (input.value && input.value !== '') {
                    const asinLink = document.createElement('div');
                    asinLink.setAttribute('style', 'display: flex; flex-wrap: wrap; gap: 1rem; margin-top: .75rem !important; margin-right: .5rem !important; margin-left: .5rem !important;');
                    asinLink.id = id;
                    const link = document.createElement('a');
                    link.target = '_blank';
                    link.href = `https://amazon.com/dp/${input.value}`;
                    link.textContent = input.value;
                    asinLink.appendChild(link);
                    parent.appendChild(asinLink);
                }
            };

            createASINLink();

            const observer = new MutationObserver(() => {
                createASINLink();
            });

            observer.observe(input, {
                attributes: true,
                attributeFilter: ['value']
            });

            input.addEventListener('input', () => {
                createASINLink();
            });
        }
    }
}

waitForElement('#kt_app_content_container', prettyLinkAsins);

// Copy button
function initCopyPasteButton() {
    const main_content = document.getElementById('kt_app_content_container');
    if (main_content) {
        const main_card = main_content.querySelector('.w-lg-300px > .card > .card-header');
        if (main_card) {
            const main_title = main_card.querySelector('.card-title');
            if (main_title) {
                let text = main_title.textContent.trim();
                if (text.startsWith('SC-') && currentuser && currentuser !== 'luke' && currentuser !== 'kurtis') {
                    text = text.substring(3).trim();
                    main_title.innerHTML = `<h2 style="display: inline;">SC-</h2><h2 data-clipboard="true" style="display: inline;">${text}</h2>`; // this is annoying but works
                } else {
                    main_title.innerHTML = `<h2 data-clipboard="true" style="display: inline;">${text}</h2>`; // not needed but consistency
                }

                const copyButton = document.createElement('button');
                copyButton.classList.add('btn', 'btn-icon', 'btn-sm', 'btn-light', 'btn-sm', 'my-sm-1', 'ms-1');
                copyButton.innerHTML = '<i class="fas fa-copy fs-2"></i>';

                copyButton.addEventListener('click', () => {
                    const range = document.createRange();
                    const selection = window.getSelection();
                    selection.removeAllRanges();

                    const clipboardText = main_title.querySelector('h2[data-clipboard="true"]');
                    
                    if (clipboardText) {
                        range.selectNodeContents(clipboardText);
                        navigator.clipboard.writeText(clipboardText.textContent.trim());
                    } else {
                        range.selectNodeContents(main_title);
                        navigator.clipboard.writeText(main_title.textContent.trim());
                    }

                    selection.addRange(range);
                    
                    navigator.clipboard.writeText(text).then(() => {
                        copyButton.innerHTML = '<i class="fas fa-clipboard fs-2"></i>';
                        copyButton.title = 'Copied!';
                        copyButton.classList.add('btn-primary');
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="fas fa-copy fs-2"></i>';
                            copyButton.classList.remove('btn-primary');
                            copyButton.removeAttribute('title');
                        }, 2000);
                    }).catch(err => console.error('Failed to copy:', err));
                });

                let card_toolbar = main_card.querySelector('.card-toolbar');

                if (!card_toolbar) {
                    card_toolbar = document.createElement('div');
                    card_toolbar.classList.add('card-toolbar');
                    main_card.insertBefore(card_toolbar, main_title.nextSibling);
                } else {
                    main_card.setAttribute('style', 'padding: 1.25rem 2.15rem; padding-bottom: 0;');
                }
                card_toolbar.setAttribute('style', 'display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem;');
                card_toolbar.insertBefore(copyButton, card_toolbar.firstChild);
            } else {
                console.error('Patches - Unknown Title', main_title);
            }
        } else {
            console.error('Patches - Unknown Card', main_card);
        }
    } else {
        console.error('Patches - Unknown Content', main_content);
    }
}

waitForElement('#kt_app_content_container', initCopyPasteButton);

/* photo stuff */
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
        console.debug('Patches: Opening all images by simulating clicks with delay:', imageElements);

        for (let i = 0; i < imageElements.length; i++) {
            setTimeout(() => {
                const imageElement = imageElements[i];
                console.debug(`Patches: Simulating click for URL: ${imageElement.href}`);
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

        if (!checkPopup()) {
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

// get it to open all images
function checkPopup() {
    const popupStatus = getCookie("popupsEnabled");
    if (popupStatus === "true") {
        console.debug("Patches: Popups are enabled (from cookie).");
        return true;
    } else if (popupStatus === "false") {
        console.debug("Patches: Popups are disabled (from cookie).");
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
        const nameEQ = `patch_${name}` + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
            if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length, cookie.length);
        }
        return null;
    }
}