async function hijackPrefillWindow(updateLocation = true) {
    console.debug('PATCHES - Hijacking prefill window.');
    const modal = document.getElementById('rc_ajax_modal');
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0 || mutation.type === 'attributes' || mutation.type === 'subtree' ) {
                observer.disconnect();
                (async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    console.log('PATCHES - Modal has updated.');

                    const form = document.getElementById('rc_ajax_modal_form');
                    if (!form) return;

                    const img = form.querySelector('.img-thumbnail');
                    if (!img) return;

                    // basic picture warnings
                    const warning = await checkForImageWarnings(img);
                    if (warning !== null) { printWarning(warning, true); }

                    // condition warnings
                    const condition = form.querySelector('select[name="item[condition_id]"]');
                    if (condition) {
                        const conditionId = parseInt(condition.value, 10);
                        if ((conditionId === 6 || conditionId === 8 || conditionId === 18) && (before === before.toUpperCase() && filename.includes('__'))) {
                            printWarning('BLUE STICKER: Images still require red text', true);
                        } else if (conditionId === 1) {
                            printWarning('Prefilling a brand new item? Give those details a once-over, please.', false);
                        }
                    } else {
                        console.error('PATCHES - Unable to find condition?', condition);
                    }

                    // candidate indicator warning
                    const productTitle = form.querySelector('h1').textContent.toUpperCase();
                    if (await searchForCandidateImage(productTitle)) { printWarning('BLUE STICKER: This product has an image candidate!', true); }

                    console.debug('PATCHES - Listing - Img Checks Done');

                    // handle swapping of the condition notes button
                    conditionsNotesPopulator(form);

                    const submitButton = document.getElementById('rc_ajax_modal_submit');
                    let sku = form.querySelector('input[name="item[sku]"]'); //default grab
                    if (submitButton && sku && !submitButton.dataset.patchesBound) {
                        submitButton.dataset.patchesBound = 'true';
                        let fired = false;
                        submitButton.addEventListener('click', async function() {
                            sku = form.querySelector('input[name="item[sku]"]'); //regrab
                            if (sku && sku.value !== '' && sku.value.length > 0) {
                                if (fired) return;
                                const observer = new MutationObserver(() => {
                                    const swal = document.querySelector('.swal2-popup');
                                    if (!swal) return;
                                    const text = swal.innerText || swal.textContent || '';
                                    if (text.toLowerCase().includes('saved successfully')) {
                                        fired = true;
                                        observer.disconnect();

                                        setTimeout(() => {
                                            window.open(`${window.location.origin}/product/items/${sku.value}`, '_blank');
                                        }, 1000);
                                    }
                                });

                                observer.observe(document.body, {
                                    childList: true,
                                    subtree: true
                                });
                            }
                        });
                    }

                    // am getting to this in a minute
                    if (updateLocation && autoLocationUpdate) {
                        await handlePrefillLocationUpdate();
                    }
                })();
                break;
            }
        }
    });
    observer.observe(modal, {
        childList: true,
        subtree: false,
        attributes: false
    });

    async function checkForImageWarnings(img) {
        const imgsrc = img.getAttribute('src');
        const filename = imgsrc.split('/').pop();
        const baseName = filename.substring(0, filename.lastIndexOf('.'));

        if (pictureWarnings.some(w => filename.includes(w))) { return 'NEW IMAGES REQUIRED: filename flagged for new.'; }

        await new Promise((resolve, reject) => {
            if (img.complete) {
                resolve();
            } else {
                img.onload = resolve;
                img.onerror = reject;
            }
        });
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w < 1199 || w > 1201 || h < 1199 || h > 1201) { return `NEW IMAGES: Image is not 1200x1200 (actual: ${w}x${h}).`; }

        if (!filename.includes('__')) { return 'NEW IMAGES REQUIRED, filename incorrect format.'; }

        const [before, after] = baseName.split('__', 2);
        if (before !== before.toUpperCase()) { return 'CHECK IMAGES, file from old system.'; }

        return null;
    }

    function printWarning(message, single) {
        const form = document.getElementById('rc_ajax_modal_form');
        if (single) {
            const existingMessage = form.querySelector('div.patches-alert');
            if (existingMessage) return;
        }

        const messageHTML = `<div class="patches-alert alert alert-danger my-5">${message}<br></div>`; 
        if (form) {
            const walker = document.createTreeWalker(form, NodeFilter.SHOW_COMMENT, {
                acceptNode: (node) => {
                    return node.nodeValue.trim() === 'end::Heading' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                }
            });

            const commentNode = walker.nextNode();
            if (commentNode) {
                const container = document.createElement('div');
                container.innerHTML = messageHTML;
                commentNode.parentNode.insertBefore(container.firstElementChild, commentNode.nextSibling);
            }
        }
    }

    async function searchForCandidateImage(productTitle) {
        if (productTitle.includes('GB') || productTitle.includes('TB') || productTitle.includes('SMARTPHONE')) {
            const groqPrompt = (type, title) => { return `Below is a title for a product. I need you to identify the ${type} of the phone if the title is FOR A SMARTPHONE. If the title is for anything other than a smartphone, print NA. Your response should only be the phone ${type} or NA. ${title}`; }
            const groqTitleCheck = await groq(groqPrompt('model number', productTitle));
            if (groqTitleCheck.response && groqTitleCheck.response.toUpperCase !== 'NA') {
                const report = await fetchAPI("reports", {
                    body: {
                        type: "catalog_report",
                        page: 1,
                        per_page: 1000,
                        filters: [
                            {"field": "products.category_id", "operator": "gte", "value": "23"},
                            {"field": "products.name", "operator": "contains", "value": "A2484"}
                        ],
                        columns: ["products.sid", "products.name", "first_image"]
                    }
                });
                if (report.data.data) {
                    const groqGetColor = await groq(groqPrompt('color', productTitle));
                    if (groqGetColor.response && groqGetColor.response.toUpperCase() !== 'NA') {

                        for (const sid of report.data.data) {
                            if (sid['Product_Name'].toUpperCase().includes(groqGetColor.response.toUpperCase())) {
                                // oh joy, another image check.
                                const createImage = document.createElement('img');
                                createImage.src = sid['Product_Image'];
                                const createImageWarnings = await checkForImageWarnings(createImage);
                                if (createImageWarnings === null) { return true; }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
}

async function handlePrefillLocationUpdate() {
    const ajax_button = document.getElementById('rc_ajax_modal_submit');
    if (!ajax_button) return;

    let prefillComplete = false;
    let redirectQueued = null;

    if (!window._patches_location_override) {
        window._patches_location_override = true;

        const originalAssign = window.location.assign.bind(window.location);
        const originalReplace = window.location.replace.bind(window.location);

        window.location.assign = function (url) {
            if (!prefillComplete) {
                redirectQueued = url;
            } else {
                originalAssign(url);
            }
        };

        window.location.replace = function (url) {
            if (!prefillComplete) {
                redirectQueued = url;
            } else {
                originalReplace(url);
            }
        };

        document.addEventListener('click', (e) => {
            let el = e.target;
            
            if (!(el instanceof Element)) { el = el.parentElement; }
            if (!el) return;

            const a = el.closest('a[href]');
            if (!a) return;

            if (!prefillComplete) {
                e.preventDefault();
                redirectQueued = a.href;
            }
        }, true);
    }

    ajax_button.addEventListener('click', async () => {
        window.addEventListener('beforeunload', unloadWarning);

        try {
            await prefillSubmit();
            prefillComplete = true;

            if (redirectQueued) {
                window.location.assign(redirectQueued);
            }
        } catch (err) {
            console.error('PATCHES - Error during prefillSubmit:', err);
            alert('Unexpected error. Check console for details.');
        } finally {
            window.removeEventListener('beforeunload', unloadWarning);
        }
    }, { once: true });

    async function prefillSubmit() {
        console.debug('PATCHES - PrefillSubmit Called');

        const ajax_modalForm = document.getElementById('rc_ajax_modal_form');
        if (!ajax_modalForm) return;

        const skuInput = ajax_modalForm.querySelector('input[name="item[sku]"]');
        if (!skuInput) return;

        const sku = skuInput.value.trim();
        if (!sku) {
            alert('SKU is missing.');
            return;
        } else if (sku.endsWith('-14') || sku.endsWith('-13') || sku.endsWith('-12')) {
            return;
        }

        try {
            const justCreated = await getTimeSpentInMinutes(sku);
            const eventID = justCreated?.event_id;

            if (!eventID) {
                throw new Error('Event ID not found from getTimeSpentInMinutes');
            }

            //const updateLocationResponse = await updateLocation(sku, eventID);
            const updateLocationResponse = await newUpdateLocation(sku, eventID);

            if (updateLocationResponse.success) {
                console.log('PATCHES - Location Updated');
            } else {
                console.error('PATCHES - Unable to Update Location:', updateLocationResponse);
                //alert(`Issue Updating Location: ${updateLocationResponse.message ?? 'Check Console'}`);
            }
        } catch (err) {
            console.error('PATCHES - Error during location update:', err);
            //alert('Failed to prefill location. Check console.');
        }
    }

    function unloadWarning(e) {
        if (!prefillComplete) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }
}