/*
const submitButton = document.getElementById('rc_new_inventory_modal_submit');
const gtinInput = document.querySelector('input[name="inventory[meta][gtin]"]');
if (submitButton) {
    submitButton.addEventListener('click', function(e) {
        e.preventDefault();
        const gtinInputTrim = gtinInput.value.trim();
        if (gtinInputTrim === '' || gtinInputTrim.length > 12) {
            gtinInput.style.borderColor = 'red';
            gtinInput.style.backgroundColor = 'rgb(255,100,100,0.1)';
            
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
                errorMessage.style.color = 'rgb(255,100,100)';
                errorMessage.classList.add('error-message');
                document.querySelector('.col-md-12.fv-row').appendChild(errorMessage);
    
                e.stopPropagation(); // disable form input
            } else {
                // reset style
                gtinInput.style.borderColor = '';
                gtinInput.style.backgroundColor = 'inherit';
                
                // remove error
                if (document.getElementById('patches_invalidGTIN')) {
                    document.getElementById('patches_invalidGTIN').remove();
                }
            }
        }
    }, true);
}
*/