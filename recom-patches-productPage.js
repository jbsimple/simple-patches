// epic wait
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback();
    } else {
        setTimeout(() => waitForElement(selector, callback), 100);
    }
}

function prettyPrintMeta() {
    let metakeys = [];
    async function fetchMeta() {
        const defaultMeta = [
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
        
        const url = `/datatables/meta?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=20&search%5Bvalue%5D=&search%5Bregex%5D=false&_=${Date.now()}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const json = await response.json();

            metakeys = json.data.map(row => {
                const metaNameMatch = row[1].match(/<pre[^>]*>(.*?)<\/pre>/);
                const meta_name = metaNameMatch ? metaNameMatch[1] : null;

                const metaIdMatch = row[5].match(/data-id="(\d+)"/);
                const meta_id = metaIdMatch ? parseInt(metaIdMatch[1]) : null;

                return { meta_id, meta_name };
            }).filter(item => item.meta_id && item.meta_name);

            // Fallback if somehow live data returns empty
            if (metakeys.length === 0) {
                console.warn('Patches: Live meta returned empty, falling back to default meta');
                metakeys = defaultMeta;
            }
        } catch (error) {
            console.error('Patches: Failed to fetch live meta, using default meta instead:', error);
            metakeys = defaultMeta;
        }

        if (metakeys.length === 0) {
            console.warn('Patches: Live meta returned empty, falling back to default meta');
            metakeys = defaultMeta;
        }
    }

    async function getMetaName(meta_id) {
        if (metakeys.length === 0) {
            await fetchMeta();
        }

        const metaItem = metakeys.find(item => item.meta_id === meta_id);
        return metaItem ? metaItem.meta_name : null;
    }

    function injectMetaKeys() {
        document.querySelectorAll('.json__key').forEach(async function(keyDiv) {
            if (keyDiv.textContent.trim() === 'meta_id') {
                let nextDiv = keyDiv.nextElementSibling;
                if (nextDiv && nextDiv.classList.contains('json__value') && nextDiv.classList.contains('json__value--update')) {
                    const meta_id = parseInt(nextDiv.textContent, 10);
                    const meta_name = await getMetaName(meta_id);
                    nextDiv.textContent = `(${meta_id}) ${meta_name}`;
                }
            }
        });
    }

    const loadMoreButton = document.getElementById('logEntriesLoadMore');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', function() {
            setTimeout(function() { injectMetaKeys() }, 500);
        });
    }

    // default run
    setTimeout(function() { injectMetaKeys() }, 500);
}

waitForElement('#LogEntriesTable', prettyPrintMeta);

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
                } else if (label.textContent === 'Renewed Premium ASIN' && parent) {
                    asinSingleLink(parent, 'patches-meta-premium');
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
                const copyButton = document.createElement('button');
                copyButton.classList.add('btn', 'btn-icon', 'btn-sm', 'btn-light', 'btn-sm', 'my-sm-1', 'ms-1');
                copyButton.innerHTML = '<i class="fas fa-copy fs-2"></i>';

                copyButton.addEventListener('click', () => {
                    const range = document.createRange();
                    const selection = window.getSelection();
                    selection.removeAllRanges();

                    let text = main_title.textContent.trim();
                    if (text.startsWith('SC-') && currentuser && currentuser !== 'luke' && currentuser !== 'kurtis') {
                        text = text.substring(3).trim();
                        main_title.innerHTML = `<h2 style="display: inline;">SC-</h2><h2 data-clipboard="true" style="display: inline;">${text}</h2>`; // this is annoying but works
                    } else {
                        main_title.innerHTML = `<h2 data-clipboard="true" style="display: inline;">${text}</h2>`; // not needed but consistency
                    }

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

function modifyColorAttribute() {
    const form_groups = document.querySelectorAll('.form-group');
    const allowed_colors = [
        "Beige", "Black", "Blue", "Brown", "Clear", "Gold", "Gray", "Green",
        "Multicolor", "Orange", "Pink", "Purple", "Red", "Silver", "White", "Yellow"
    ];

    function randomID(length = 4) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    function updateBackground(values_input, visual, allowed_colors) {
        const selected_values = Array.from(values_input.selectedOptions).map(opt => opt.value.trim());
        const has_invalid = selected_values.some(val => !allowed_colors.includes(val));

        if (visual) {
            visual.style.backgroundColor = has_invalid
                ? 'color-mix(in srgb, var(--bs-danger) 35%, transparent 85%)'
                : 'transparent';
        }
    }

    form_groups.forEach(row => {
        const input_name = row.querySelector('input[name*="[name]"]');
        if (input_name && input_name.value.trim() === 'Color') {
            const values_input = row.querySelector('select.form-select.select2-hidden-accessible');
            if (values_input) {
                const seen = new Set();
                const options = Array.from(values_input.options);

                options.forEach(option => {
                    const val = option.value.trim();
                    if (seen.has(val)) {
                        option.remove();
                    } else {
                        seen.add(val);
                    }
                });

                allowed_colors.forEach(color => {
                    if (!seen.has(color)) {
                        const opt = document.createElement('option');
                        opt.value = color;
                        opt.textContent = color;
                        opt.setAttribute('data-select2-id', `select2-data-${Math.floor(Math.random()*1000)}-${randomID()}`);
                        values_input.appendChild(opt);
                        seen.add(color);
                    }
                });

                const visual = row.querySelector('.select2-selection.select2-selection--multiple.form-select');
                updateBackground(values_input, visual, allowed_colors);

                values_input.addEventListener('change', () => {
                    updateBackground(values_input, visual, allowed_colors);
                });
            }
        }
    });
}

waitForElement('#el_product_form', modifyColorAttribute);


function modifyMediaTable() {
    const product_images_container = document.getElementById('product-images-container');

    if (!product_images_container) return;
    if (product_images_container.dataset.observerAttached === 'true') return;

    function applyLayout() {
        product_images_container.setAttribute('style', 'display: flex; flex-direction: column; gap: 0.25rem; flex-wrap: unset;');
        if (product_images_container) {
            const cards = product_images_container.querySelectorAll('.col.draggable');
            cards.forEach(card => {
                if (card.dataset.modified === 'true') return;

                card.setAttribute('style', 'width: 100% !important; display: flex;');
                const card_title = card.querySelector('.card-title');
                const card_toolbar = card.querySelector('.card-toolbar');
                const image = card.querySelector('a[data-type="image"]');
                const card_footer = card.querySelector('.card-footer');
                
                const newCont = document.createElement('div');
                newCont.setAttribute('style', 'display: flex; flex-direction: row; gap: 1.5rem; width: 100%; border: var(--bs-border-width) solid var(--bs-card-border-color); padding: 1.25rem; border-radius: 0.625rem; box-sizing: border-box;');
                
                let image_filename = '[ New ]';
                if (image) {
                    image.setAttribute('style', 'width: 100px; height: 100px;');
                    image.querySelector('img').setAttribute('style', 'border-radius: 0.625rem;');
                    image_filename = image.querySelector('img').getAttribute('src').split('/').pop().split(/[?#]/)[0];
                    newCont.appendChild(image);
                }
                
                const subCont = document.createElement('div');
                subCont.setAttribute('style', 'display: flex; flex-direction: column; flex: 1;');
                
                const subContRow1 = document.createElement('div');
                subContRow1.setAttribute('style', 'display: flex; flex-direction: row; gap: 1rem; flex: 1;');
                
                if (card_title) {
                    card_title.setAttribute('style', 'flex: 1; padding-top: 0.315rem;');
                    card_title.querySelector('.card-label').setAttribute('style', 'font-size: 1.5rem;');
                    subContRow1.appendChild(card_title);
                } else {
                    const new_card_title = document.createElement('div');
                    new_card_title.setAttribute('style', 'flex: 1; padding-top: 0.315rem;');
                    new_card_title.innerHTML = `<strong class="card-label" style="font-size: 1.5rem;">New Image</strong>`;
                }
                
                subContRow1.appendChild(card_toolbar);
                
                subCont.appendChild(subContRow1);
                
                const subContRow2 = document.createElement('div');
                subContRow2.setAttribute('style', 'display: flex; flex-direction: row; gap: 1rem; padding-bottom: 0.315rem;');
                
                const filename = document.createElement('span');
                filename.classList.add('text-muted');
                filename.setAttribute('style', 'flex: 1;');
                if (card_footer) {
                    filename.textContent = card_footer.textContent ?? image_filename;
                } else {
                    filename.textContent = image_filename;
                    newCont.style.backgroundColor = 'color-mix(in srgb, var(--bs-primary) 10%, transparent 90%)';
                    filename.title = 'Just Uploaded';
                }
                subContRow2.appendChild(filename);
                
                subCont.appendChild(subContRow2);
                
                newCont.appendChild(subCont)

                card.dataset.modified = 'true';
                card.replaceChildren(newCont);
            });
        }
    }

    applyLayout();

    const observer = new MutationObserver(() => {
        applyLayout();
    });

    observer.observe(product_images_container, {
        childList: true,
        subtree: true
    });

    product_images_container.dataset.observerAttached = 'true';
}

waitForElement('#product-images-container', modifyMediaTable);

/* photo stuff */
function initURLMedia() {
	const dropzone_container = document.getElementById('rc_product_media');

	if (dropzone_container) {
		const pasteURL_container = document.createElement('div');
		pasteURL_container.classList.add('patches-box', 'patches-column', 'gap');
		pasteURL_container.setAttribute('style', 'width: 100%; margin-top: 2rem; padding: 1.5rem; background-color: rgba(255,255,255,0.15);');
		pasteURL_container.innerHTML = `<h4 style="margin: 0; padding: 0;" class="fw-bolder d-flex align-items-center text-dark">Upload from URL:</h4>
		<div class="patches-row" style="gap: 1.25rem;">
			<div class="patches-column" style="gap: 0.25rem !important;">
				<h5 class="fw-bolder d-flex align-items-center text-dark">Preview:</h5>
				<div class="patches-imgcont" style="max-height: 100px; max-width: 100px; border-radius: 0.625rem;">
					<img src="https://s3.amazonaws.com/elog-cdn/no-image.png" style="border-radius: 0.625rem;" id="patches-urlView">
				</div>
				<div class="patches-spacer"></div>
			</div>
			<div class="patches-separatorY"></div>
			<div class="patches-column patches-spacer patches-spacer">
				<div class="patches-column">
					<p style="margin: 0; padding: 0;">Paste in a DIRECT image url and the script will try and upload it.</p>
					<p style="margin: 0; padding: 0;">Please Note: Only URLS from system CDN servers will work!</p>
				</div>
				<div class="patches-spacer"></div>
				<div class="patches-column">
					<label for="patches-urlImg" style="font-size: 1.1rem;" class="fw-bolder d-flex align-items-center text-dark">URL:</label>
					<input class="form-control rounded-1" style="color: var(--bs-text-gray-800); width: unset;" type="text" id="patches-urlImg" autocomplete="false">
				</div>
			</div>
			<div class="patches-column">
				<div class="patches-spacer"></div>
				<button id="patches-urlSubmit" class="btn btn-large btn-primary">
					Upload
          <span class="svg-icon svg-icon-4 ms-1 me-0">
	          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
	          <rect opacity="0.5" x="18" y="13" width="13" height="2" rx="1" transform="rotate(-180 18 13)" fill="currentColor"></rect>
	          <path d="M15.4343 12.5657L11.25 16.75C10.8358 17.1642 10.8358 17.8358 11.25 18.25C11.6642 18.6642 12.3358 18.6642 12.75 18.25L18.2929 12.7071C18.6834 12.3166 18.6834 11.6834 18.2929 11.2929L12.75 5.75C12.3358 5.33579 11.6642 5.33579 11.25 5.75C10.8358 6.16421 10.8358 6.83579 11.25 7.25L15.4343 11.4343C15.7467 11.7467 15.7467 12.2533 15.4343 12.5657Z" fill="currentColor"></path>
	          </svg>
          </span>
        </button>
			</div>
		</div>`;

		dropzone_container.parentNode.insertBefore(pasteURL_container, dropzone_container.nextSibling);
		
		const urlInput = document.getElementById('patches-urlImg');
		const urlPreview = document.getElementById('patches-urlView');
		const urlSubmit = document.getElementById('patches-urlSubmit');
		if (urlInput && urlPreview && urlSubmit) {
			urlInput.addEventListener('input', () => {
				const url = urlInput.value.trim();
				const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
				const fallback = 'https://s3.amazonaws.com/elog-cdn/no-image.png';
			
				if (!isImage) {
					urlPreview.src = fallback;
					return;
				}
			
				const testImg = new Image();
				testImg.onload = () => {
					urlPreview.src = url;
				};
				testImg.onerror = () => {
					urlPreview.src = fallback;
				};
				testImg.src = url;
			});
			
			urlSubmit.addEventListener('click', async () => {
				console.debug('Patches - Attempting to convert from URL.');
				
				const imageURL = urlPreview.src;
				const fallback = 'https://s3.amazonaws.com/elog-cdn/no-image.png';
			
				if (!imageURL || imageURL === fallback) {
					alert('Please enter a valid image URL.');
					return;
				}
			
				try {
					const filenameFromURL = imageURL.split('/').pop()?.split('?')[0] || '';
					const response = await fetch(`https://simple-patches.vercel.app/api/proxy-image?url=${encodeURIComponent(imageURL)}&filename=${encodeURIComponent(filenameFromURL)}`);
					if (!response.ok) throw new Error('Failed to fetch image.');
					
					const blob = await response.blob();
					const fileType = blob.type || 'image/jpeg';
					const extension = fileType.split('/')[1] || 'jpg';
					let filename = filenameFromURL || `${Date.now()}.${extension}`;
					const disposition = response.headers.get('Content-Disposition');
					if (disposition && disposition.includes('filename=')) {
						const match = disposition.match(/filename="(.+?)"/);
						if (match && match[1]) {
							filename = match[1];
						}
					}

					const file = new File([blob], filename, { type: fileType });
			
					const dzElement = Dropzone.forElement("#rc_product_media");
					if (!dzElement) {
						alert("Dropzone instance not found.");
						return;
					}
			
					const lastImgIndex = $(".draggable:last .imgpos").text();
					dzElement.options.params.position = lastImgIndex ? parseInt(lastImgIndex) + 1 : 1;
			
					dzElement.addFile(file);
			
				} catch (err) {
					console.error('Image upload failed:', err);
					alert('Image upload failed.');
				}
			});
		}
	}
}
waitForElement('#rc_product_media', initURLMedia);

function extraMediaInit() {
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

    if (media_tab && media_tree) {
        var newElement = document.createElement('div');
        newElement.classList.add('fv-row');
        newElement.classList.add('mb-2');
        newElement.setAttribute('style', 'padding-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center');
        
        // Add button if there are image elements
        if (imageElements.length > 0) {

            // open all button
            var openAllButton = document.createElement('button');
            openAllButton.classList.add('btn');
            openAllButton.classList.add('btn-info');
            openAllButton.id = 'patch_openAllImages';
            openAllButton.textContent = 'Open All Images';
            openAllButton.style.color = 'white';
            openAllButton.style.border = 'none';
            openAllButton.style.padding = '10px 20px';
            openAllButton.style.cursor = 'pointer';
            openAllButton.style.borderRadius = '5px';
            openAllButton.onclick = openAllImages;
            if (!checkPopup()) {
                openAllButton.title = "Popups are disabled, please enable for this to work.";
            }
            newElement.appendChild(openAllButton);

            // delete all button
            var deleteAllButton = document.createElement('button');
            deleteAllButton.classList.add('btn');
            deleteAllButton.classList.add('btn-info');
            deleteAllButton.classList.add('btn-danger');
            deleteAllButton.id = 'deleteAllImages';
            deleteAllButton.textContent = 'Delete All Images';
            deleteAllButton.style.color = 'white';
            deleteAllButton.style.border = 'none';
            deleteAllButton.style.padding = '10px 20px';
            deleteAllButton.style.cursor = 'pointer';
            deleteAllButton.style.borderRadius = '5px';
            deleteAllButton.onclick = deleteAllImages;
            newElement.appendChild(deleteAllButton);

        }
        
        media_tree_parent.insertBefore(newElement, media_tree);
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

    function deleteAllImages() {
        const imgwrap = document.getElementById('product-images-container');
        const imgs = imgwrap.querySelectorAll('.col.draggable[data-id]');

        let type = '';
        const url = window.location.href;
        if (url.includes('/products/')) {
            type = 'product';
        } else if (url.includes('/items/')) {
            type = 'item';
        }

        const csrfToken = $('meta[name="X-CSRF-TOKEN"]').attr("content");

        imgs.forEach(img => {
            const id = img.getAttribute('data-id');

            $.post({
                url: "ajax/actions/productimagedelete/" + id,
                dataType: "json",
                data: {
                    id: id,
                    type: type
                },
                headers: {
                    "X-CSRF-TOKEN": csrfToken,
                },
                success: function(data) {
                    apiResponseAlert(data);
                    $(img).closest(".col").remove();
                },
                error: function(error) {
                    console.log("FAIL", error);
                    ajaxFailAlert(error);
                }
            });
        });
    }

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
}
waitForElement('#rc_product_media_tab', extraMediaInit);