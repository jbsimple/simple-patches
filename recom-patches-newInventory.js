const submitButton = document.getElementById('rc_new_inventory_modal_submit');
const gtinInput = document.querySelector('input[name="inventory[meta][gtin]"]');

if (submitButton && gtinInput) {
    submitButton.addEventListener('click', function(e) {
        e.preventDefault();

        // if gtin is not valid, don't run
        if (!verifyGTIN()) {
            alert('Could not submit: Invalid GTIN');
            e.stopPropagation();
        }
    }, true);

    gtinInput.addEventListener('input', function(e) {
        // just always listen for a change
        verifyGTIN();
    });
}

function verifyGTIN() {
    const gtinInputTrim = gtinInput.value.trim();
    if (gtinInputTrim === '' || gtinInputTrim.length > 12) {
        gtinInput.setAttribute('style', 'border-color: var(--bs-danger); background-color: var(--bs-danger-light);')
        
        // check to see if error message is already there
        if (!document.getElementById('patches_invalidGTIN')) {
            const errorMessage = document.createElement('span');
            errorMessage.id = 'patches_invalidGTIN'
            errorMessage.style.marginTop = "8px";
            errorMessage.textContent = 'This is an invalid GTIN.';
            if (gtinInputTrim === '') {
                errorMessage.title = "GTIN field cannot be left blank.";
            } else if (gtinInputTrim.length > 12) {
                errorMessage.title = "GTIN is too long.";
            }
            errorMessage.setAttribute('style', 'color: var(--bs-danger);')
            errorMessage.classList.add('error-message');
            document.querySelector('.col-md-12.fv-row').appendChild(errorMessage);

            return false;
        }
    } else {
        // reset style
        gtinInput.removeAttribute('style');
        
        // remove error
        if (document.getElementById('patches_invalidGTIN')) {
            document.getElementById('patches_invalidGTIN').remove();
        }
        return true;
    }
}

// fix the In Catalog button.
const inventory_results = document.getElementById('inventory_results');
if (inventory_results) {
    const observerCallback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.debug('Patch- Inventory results updated');
                parseInventoryResults();
            }
        }
    };
      
    const observer = new MutationObserver(observerCallback);
    const config = {
        childList: true,
        subtree: false,
    };
    observer.observe(inventory_results, config);

    function parseInventoryResults() {
        const spans = inventory_results.querySelectorAll('span');
        const inCatalogSpans = Array.from(spans).filter(span => span.textContent.includes('In Catalog'));
        inCatalogSpans.forEach(span => {
            const nextElement = span.nextElementSibling;
            if (nextElement && nextElement.tagName === 'A') {
                const href = nextElement.getAttribute('href');
                const target = nextElement.getAttribute('target');
                if (href && target === '_blank') {
                    const newLink = document.createElement('a');
                    newLink.href = "#";
                    newLink.textContent = span.textContent;
                    newLink.classList.add('text-success', 'fw-bold', 'ajax-modal');
                    newLink.setAttribute('data-url', `ajax/modals/productitems/${href.split("/").pop()}`);

                    span.replaceWith(newLink);
                }
            }
        });
    }
}

/* select field for quick searches */
function initSearchSelect() {
    const searchInput = document.getElementById('pSearchProduct');
    const searchResults = document.getElementById('inventory_results');
    if (!searchInput || !searchResults) return;

    const searchForm = document.getElementById('searchProductForm');
    const searchFormRow = searchForm.querySelector('.row.g-5');
    if (searchFormRow) {
        searchFormRow.setAttribute('style', 'gap: calc(var(--bs-gutter-x)* .5);');
        const categoryInputCont = searchFormRow.querySelector('.col-md-2');
        categoryInputCont.setAttribute('style', 'width: unset; flex-shrink: 0; min-width: 250px;');

        const sarchInputCont = searchFormRow.querySelector('.col-md-10');
        sarchInputCont.setAttribute('style', 'width: unset; padding: 0 !important; flex: 1; flex-shrink: 0');

        if (!document.getElementById('patch-autoSelect')) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('h-60px');
            wrapper.style.cssText = 'width: unset; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.5rem; align-items: center; justify-content: center;';
            
            const label = document.createElement('label');
            label.htmlFor = 'patch-autoSelect';
            label.textContent = 'Auto Select';
            label.style.cssText = 'font-size: 1.35rem; color: var(--bs-gray-700);';
            label.title = 'After a search is completed, the field is selected, for scanners.';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'patch-autoSelect';
            checkbox.style.cssText = 'width: 1.5rem; height: 1.5rem;';

            wrapper.appendChild(label);
            wrapper.appendChild(checkbox);
            searchFormRow.appendChild(wrapper);
        }
    }

    const observer = new MutationObserver(() => {
        const toggle = document.getElementById('patch-autoSelect');
        if (searchInput.value.trim() !== '' && toggle && toggle?.checked) {
            searchInput.focus();
            searchInput.select();
        }
    });

    observer.observe(searchResults, { childList: true, subtree: true });
}
initSearchSelect();


/* auto add GET parameters, auto search when loaded with GET parameters */
function initGetKeyword() {
    const searchInput = document.getElementById('pSearchProduct');

    if (searchInput.value !== '') {
        // simulate enter press after 500ms
    }

    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && searchInput.value.trim() !== '') {
            const keyword = encodeURIComponent(searchInput.value.trim());
            const url = new URL(window.location);
            url.searchParams.set('keyword', keyword);

            history.pushState(null, '', url.toString());
        }
    });
}

initGetKeyword();