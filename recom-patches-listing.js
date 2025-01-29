// verify gtin code for listing
var gtin_input = document.querySelectorAll('.product_gtin')[0]; //inital
gtin_input = document.querySelector('input[name="product[gtin]"]'); //if specific loaded

var listingSubmit = document.querySelector('button[data-kt-stepper-action="submit"]');
var listingResults = document.getElementById('listing-results');

var initGTIN = null;
var curGTIN = null;

var generateButton = document.querySelector('a[href="javascript:generateGtin();"]');

function fixSimilarProduct() {
    const titleInput = document.querySelector('[name="product[name]"]');
    
    const newTitleInput = titleInput.cloneNode(true);
    titleInput.parentNode.replaceChild(newTitleInput, titleInput);

    const divRow = document.createElement('div');
    divRow.setAttribute('style', 'display: inline-flex; flex-direction: row; align-items: center;');

    const styles = 'margin-left: 0.5rem; padding: 0.5rem 1rem; border-radius: 0 0 0.5rem 0.5rem; font-weight: 700; color: white;';
    const charCountSpan = document.createElement("span");
    charCountSpan.textContent = "0 / 80";
    charCountSpan.setAttribute('style', `background-color: var(--bs-info-active) !important; ${styles}`);
    divRow.appendChild(charCountSpan);

    const spacer = document.createElement('div');
    spacer.setAttribute('style', 'flex: 1;');
    divRow.appendChild(spacer);

    newTitleInput.parentNode.insertBefore(divRow, newTitleInput.nextSibling);

    newTitleInput.addEventListener("input", () => {
        if (newTitleInput.value.length === 80) {
            charCountSpan.setAttribute('style', `background-color: var(--bs-danger) !important; ${styles}`);
        } else {
            charCountSpan.setAttribute('style', `background-color: var(--bs-info-active) !important; ${styles}`);
        }
        charCountSpan.textContent = `${newTitleInput.value.length} / 80`;
    });
}

// https://stackoverflow.com/questions/13605340/how-to-validate-a-ean-gtin-barcode-in-javascript
// There are more checks in place for valid gtins I guess.
function isValidBarcode(value) {
    // We only allow correct length barcodes
    if (!value.match(/^(\d{8}|\d{12,14})$/)) {
      return false;
    }
  
    const paddedValue = value.padStart(14, '0');
  
    let result = 0;
    for (let i = 0; i < paddedValue.length - 1; i += 1) {
      result += parseInt(paddedValue.charAt(i), 10) * ((i % 2 === 0) ? 3 : 1);
    }
  
    return ((10 - (result % 10)) % 10) === parseInt(paddedValue.charAt(13), 10);
}

if (gtin_input) {
    initGTIN = gtin_input.value;
    curGTIN = gtin_input.value;

    if (gtin_input.value || gtin_input.getAttribute('value')) {
        verifyGTIN();
    }
    
    gtin_input.addEventListener('input', function() {
        verifyGTIN();
    });
    
    if (generateButton) {
            generateButton.addEventListener('click', function() {

                    setTimeout(function() {
                            verifyGTIN();
                    }, 500); // yikes
            });
    }
    
    function verifyGTIN() {
        // update flag
        curGTIN = gtin_input.value;

        var valueLength = gtin_input.value.length;
        console.log(valueLength);
        
        if (valueLength > 12 || !isValidBarcode(curGTIN)) {
            gtin_input.style.outline = "2px solid var(--bs-danger)";
            gtin_input.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
            addInvalidFeedback();
        } else {
            gtin_input.style.outline = "";
            gtin_input.style.backgroundColor = "";
            removeInvalidFeedback();
        }
    }
    
    function addInvalidFeedback() {
        if (!document.getElementById('gtin-feedback')) {
            var feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'gtin-feedback';
            feedbackDiv.className = 'fv-plugins-message-container invalid-feedback';
            feedbackDiv.textContent = 'The GTIN is invalid';

            gtin_input.parentNode.appendChild(feedbackDiv);
        }
    }
    
    function removeInvalidFeedback() {
        var feedbackDiv = document.getElementById('gtin-feedback');
        if (feedbackDiv) {
            feedbackDiv.parentNode.removeChild(feedbackDiv);
        }
    }

    if (listingSubmit && listingResults) {
        listingSubmit.addEventListener('click', function() {
            setTimeout(function() {
                if (initGTIN !== curGTIN) {
                    var code = `<br>
                    <style>
                        .patches-warning {
                            padding: 0.775rem 1.5rem !important;
                            font-size: 1.1rem;
                            line-height: 1.5;
                            font-weight: 500;
                            background-color: transparent;
                            color: var(--bs-danger) !important;
                            border: 1px solid var(--bs-danger);
                            border-radius: 0.475rem;
                            display: inline-block;
                            margin: 1rem 0;
                        }

                        .patches-warning i {
                            color: inherit;
                            text-align: center;
                        }

                        .patches-warning span {
                            margin: 0 0.5rem;
                        }

                        .patches-row {
                            display: flex;
                            flex-direction: row;
                            gap: 0.5rem;
                            margin: 1.5rem 0;
                        }

                        .patches-column {
                            display: flex;
                            flex-direction: column;
                            gap: 0.5rem;
                            margin: 1.5rem 0;
                        }

                        #productsGTIN-response {
                            display: flex;
                            align-items: center;
                            font-weight: 700;
                        }
                    </style>
                    <strong class="patches-warning">
                        <i class="fa fa-triangle-exclamation fs-2"></i>
                        <span>GTIN Change Detected!</span>
                        <i class="fa fa-triangle-exclamation fs-2"></i>
                    </strong>
                    <br>
                    <div class="patches-column">
                        <span>Because the GTIN was rewritten from the original listing, scanning it in won't work. Below is a wizard to fix that.</span>
                        <div class="patches-row">
                            <strong>Original Queue GTIN:</strong>
                            <input type="text" disabled value="${initGTIN}"></input>
                        </div>
                        <div class="patches-row">
                            <strong>Current Listing GTIN:</strong>
                            <input type="text" disabled value="${curGTIN}"></input>
                        </div>
                        <span>Below, the fields are filled out to replace the product's GTIN with the original listing queue GTIN. The GTIN used when creating becomes the secondary GTIN. 
                        Modify the fields as needed, secondary gtin is not required.</span>
                    </div>
                    <div class="patches-column">
                        <label for="patches-oldgtin">Product GTIN:</label>
                        <input type="text" id="patches-oldgtin" class="form-control form-control-solid form-control-lg" value="${initGTIN}"></input>
                    </div>
                    <div class="patches-column">
                        <label for="patches-newgtin">Product Secondary GTIN:</label>
                        <input type="text" id="patches-newgtin" class="form-control form-control-solid form-control-lg" value="${curGTIN}"></input>
                    </div>
                    <div class="patches-column">
                        <span style="flex: 1;">You can set the GTIN back to the original and the generated GTIN as the secondary by pressing the button below.<br><br>
                            * Old GTIN becomes the product's real GTIN.<br>
                            * Current GTIN becomes the product's secondary GTIN.
                            * If it doesn't save here, the GTIN is REALLY invalid and there's nothing that can be done.
                        </span>
                    </div>
                    <div class="patches-row">
                        <a class="btn btn-lg btn-light-warning me-3" onclick="productGTIN()">Update GTINS</a>
                        <div style="flex: 1;" id="productsGTIN-response"></div>
                    </div>`;
                    listingResults.innerHTML += code;
                }
            }, 500); // yikes
        });
    }
}

function productGTIN() {
    const gtin_input = document.getElementById('patches-oldgtin');
    const secondary_input = document.getElementById('patches-newgtin');

    if (gtin_input && secondary_input && listingResults) {
        const gtin = gtin_input.value;
        const secondary = secondary_input.value;

        console.debug('Patches - gtin', gtin);
        console.debug('Patches - secondary', secondary);

        const atags = listingResults.querySelectorAll('a');
        if (atags) {
            atags.forEach(atag => {
                const href = atag.getAttribute('href');
                if (href && href.includes('products/')) {
                    const productid = href.replace('products/', '');
                    console.debug('Patches - product id', productid);
                    const update = `/products/update/${productid}`;
                    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]')
                    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
                        const csrfToken = csrfMeta.getAttribute('content');
                        let meta_id = 14;
                        if (document.location.href.includes('dev.')) {
                            meta_id = 14;
                        } else if (document.location.href.includes('cell.')) {
                            meta_id = 5;
                        }
                        const request = {
                            product: {
                                gtin: gtin,
                            },
                            meta: [{
                                    meta_id: meta_id,
                                    value: secondary,
                                }
                            ],
                            csrf_recom: csrfToken,
                        };

                        $.ajax({
                            type: "POST",
                            dataType: "json",
                            url: update,
                            data: request,
                        }).done(function(data) {
                            const responseBlock = document.getElementById('productsGTIN-response');
                            if (responseBlock && data.success) {
                                responseBlock.innerHTML = '<span style="color: var(--bs-primary);">Updated!</span>';
                            }
                        
                            console.debug('Patches - Response:', data);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            console.error("Request failed: " + textStatus + ", " + errorThrown);
                            
                            const responseBlock = document.getElementById('productsGTIN-response');
                            let errors = 'Loading...';
                            if (jqXHR.responseText) {
                                try {
                                    const errorResponse = JSON.parse(jqXHR.responseText);
                                    errors = '[';
                                    if (errorResponse.errors) {
                                        Object.entries(errorResponse.errors).forEach(([key, value]) => {
                                            errors += `${key} => ${value}, `;
                                        });
                                        errors = errors.slice(0, -2) + ']';
                                    } else {
                                        errors = '[Unknown Error]';
                                    }
                                } catch (e) {
                                    errors = `[${jqXHR.responseText}]`;
                                }
                            } else {
                                errors = '[Unknown Error, See Console]';
                            }
                        
                            if (responseBlock) {
                                responseBlock.innerHTML = `<span style="color: var(--bs-danger);">Could not Update: ${errors}</span>`;
                            }
                        });
                        
                    }
                }
            })
        }
    }
}


// fix for the duplicated error messages
const observer = new MutationObserver(() => {
    const elements = document.querySelectorAll('.fv-plugins-message-container.invalid-feedback');
  
    let previousText = null;
    elements.forEach((element, index) => {
        const currentText = element.textContent.trim();
  
        if (currentText === previousText) {
            element.remove();
        } else {
            previousText = currentText;
            const block = element.querySelector('div');
            if (block) {
                const field = block.getAttribute('data-field');
                const validation = block.getAttribute('data-validator');
                if (field) {
                    const input = document.querySelector(`input[name="${field}"]`);
                    if (input) {
                        input.addEventListener('input', function handleError() {
                            if (validation === "notEmpty" && input.value.length > 0) {
                                element.style.display = 'none';
                            } else {
                                element.style.display = 'inherit';
                            }
                        });
                    }
                }
            }
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
  