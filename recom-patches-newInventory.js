const submitButton = document.getElementById('rc_new_inventory_modal_submit');
const gtinInput = document.querySelector('input[name="inventory[meta][gtin]"]');

if (submitButton && gtinInput) {
    submitButton.addEventListener('click', function(e) {
        e.preventDefault();

        // if gtin is not valid, don't run
        if (!verifyGTIN()) {
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