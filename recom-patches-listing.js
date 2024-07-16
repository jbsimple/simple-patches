// verify gtin code for listing
var gtin_input = document.querySelectorAll('.product_gtin')[0]; //inital
gtin_input = document.querySelector('input[name="product[gtin]"]'); //if specific loaded

var generateButton = document.querySelector('a[href="javascript:generateGtin();"]');

if (gtin_input) {
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
        var valueLength = gtin_input.value.length;
        console.log(valueLength);
        
        if (valueLength > 12) {
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
} // end gtin verify for listing