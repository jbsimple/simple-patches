const version = '12-31-2024__4';

const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
if (nav_sidebar) {
    nav_sidebar.style.display = 'flex';
    nav_sidebar.style.flexDirection = 'column';
    
    //the sidebar sets the height with a js resize listener and also on init.
    //regular init function doesn't set the value properly so this is to fix it.
    nav_sidebar.style.height = (parseInt(nav_sidebar.style.height) + 40) + 'px';

    const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
    nav_sidebar_links.style.flex = '1';

    const version_container = document.createElement('div');
    version_container.setAttribute('style', 'padding: 0 25px; margin-top: 0.5rem; display: flex; flex-direction: column;');

    const separator = document.createElement('div');
    separator.setAttribute('class', 'app-sidebar-separator separator');
    version_container.appendChild(separator);
    
    const loaded_message = document.createElement('a');
    loaded_message.href = "https://simple-patches.vercel.app/";
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Patches Loaded: ' + version;
    loaded_message.classList = 'patches-loaded';
    loaded_message.setAttribute('target', '_blank');
    loaded_message.setAttribute('rel', 'noreferrer');
    version_container.appendChild(loaded_message);

    nav_sidebar.appendChild(version_container);

} else {
    console.error('Sidebar could not be found.');
}

/* theme stuff */
function getTheme() {
    var theme = 'light';
    if (document.documentElement.getAttribute('data-bs-theme')) {
        theme = document.documentElement.getAttribute('data-bs-theme');
    }
    return theme;
}

function rainbowMessage(message) {
    const mainelem = document.getElementById('rc_header_search').parentElement;
    if (mainelem) {
        const newMessage = document.createElement('div');
        newMessage.innerHTML = `<strong style="font-size: 1.25rem;" class="rainbow_text_animated">${message}</strong>`;
        newMessage.setAttribute('style', 'flex: 1; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 1rem; margin-right: 1rem;');
        mainelem.appendChild(newMessage);
    }
}

const statcardfix = document.querySelectorAll('.card.card-xl-stretch.mb-xl-8');
if (statcardfix && statcardfix.length === 3 && getTheme() === 'dark') {
    statcardfix[0].setAttribute('style', `background-color: rgb(65,40,50) !important; color: white !important;`);
    statcardfix[1].setAttribute('style', `background-color: rgb(15,50,50) !important; color: white !important;`);
    statcardfix[2].setAttribute('style', `background-color: rgb(50,60,85) !important; color: white !important;`);
}

/* end of theme stuff */

/* clock in stuff */
$(document).ready(function() {
    modifiedClockInit();
});

function modifiedClockInit() {
	const recordTime_button = document.querySelector('a[data-url="productivity/record"]');
	if (recordTime_button) {
		const recordTime_parent = recordTime_button.parentElement;
		if (recordTime_parent) {
            const clockButton = recordTime_button.nextSibling;

			const taskHTML = clockButton.innerHTML;
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = taskHTML;
			const task = tempDiv.textContent.trim().replace("Clock out -", "").trim();

            clockButton.innerHTML = `<i class="bi bi-stopwatch-fill fs-2 mobilefix"></i><span class="mobilefix">Clock Out - ${task}</span>`;
			
			const newButton = document.createElement('a');
            newButton.className = 'btn btn-color-gray-700 btn-active-color-white btn-outline btn-outline-warning me-2';
            newButton.href = `javascript:modifiedClock('${task}');`;
            newButton.innerHTML = '<i class="bi bi-stopwatch-fill fs-2 mobilefix"></i><span class="mobilefix">Record Clock Out</span>';
            newButton.title = 'Off System: Clock Out';
            // newButton.setAttribute('onclick', 'modifiedClock();');

            recordTime_button.innerHTML = '<i class="bi bi-hourglass fs-2 mobilefix"></i><span class="mobilefix">Record Time</span>';
            recordTime_button.title = 'Off System: Record Time';
            
            recordTime_parent.insertBefore(newButton, recordTime_button.nextSibling);
		}
	}
}

function modifiedClock(task) {
    const modal = `<div class="modal fade" id="patch_clockout_fullModal" data-bs-backdrop="static" tabindex="-1" aria-modal="true" role="dialog" style="background: rgba(0, 0, 0, .4) !important;">
        <div class="modal-dialog modal-dialog-centered mw-650px">
            <div class="modal-content rounded">
                <div class="modal-header">
                    <h2 class="fw-bolder">Record Clock Out</h2>
                    <div class="btn btn-icon btn-sm btn-active-icon-primary" id="patches_clockout_close">
                        <span class="svg-icon svg-icon-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="currentColor"></rect>
                                <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="currentColor"></rect>
                            </svg>
                        </span>
                    </div>
                </div>
                <div class="modal-body scroll-y px-10 px-lg-15 pt-0 pb-15" style="padding-top: 1.5rem !important;">
                    <div class="d-flex flex-column mb-8">
                        <label class="fs-6 fw-bold mb-2">You are about to clock out!</label>
                        <label class="fs-6 fw-semibold form-label" for="record_and_clockout">Type notes below and clock out while recording time.</label>
                    </div>
                    <div class="d-flex flex-column mb-8">
                        <label class="fs-6 fw-bold mb-2" for="patch-clockout-textarea-notes">Notes:</label>
                        <textarea class="form-control form-control-solid" rows="3" name="notes" id="patch-clockout-textarea-notes" placeholder="Provide some notes if any" spellcheck="false"></textarea>
                    </div>
                     <div class="separator my-10"></div>
                    <div class="text-center">
                        <button type="reset" data-bs-dismiss="modal" class="btn btn-light me-3">Cancel</button>
                        <button type="submit" id="patches_clockout_submit" class="btn btn-primary">
                            <span class="indicator-label">Submit</span>
                            <span class="indicator-progress" style="display: none;">Please wait...
                                <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    const rcAjaxModal = document.getElementById("rc_ajax_modal");

    if (rcAjaxModal) {
        const modalContainer = document.createElement("div");
        modalContainer.innerHTML = modal;

        rcAjaxModal.parentNode.insertBefore(modalContainer.firstElementChild, rcAjaxModal);

        const submit = document.getElementById('patches_clockout_submit');
        if (submit) {
            submit.onclick = function() {
                const noteTextBox = document.getElementById('patch-clockout-textarea-notes');
                let notes = '';
                if (noteTextBox.value.length > 0) {
                    notes = noteTextBox.value;
                }
                submit.querySelector('.indicator-label').style.display = 'none';
                submit.querySelector('.indicator-progress').style.display = 'inherit';

                var action = "OFF_SYSTEM";
                if (task && task !== '') {
                    action = task;
                }

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/productivity/record",
                    data: {
                    csrf_recom: $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                        "clock_activity[activity_code]": action,
                        "clock_activity[units]": "0",
                        "clock_activity[notes]": notes.value || "Off System Clock Out",
                        "clock_activity[clock_out]": "1"
                    },
                    headers: {
                        "X-CSRF-TOKEN": $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                    },
                })
                .done(function (data) {
                    apiResponseAlert(data);
                })
                .fail(function (error) {
                    console.log("FAIL", error);
                    ajaxFailAlert(error);
                });
            };
        }

        const close = document.getElementById('patches_clockout_close');
        if (close) {
            close.onclick = function() {
                const fullModal = document.getElementById('patch_clockout_fullModal');
                if (fullModal) {
                    fullModal.remove();
                }
            };
        }

        const newModal = document.getElementById('patch_clockout_fullModal');
        if (newModal) {
            newModal.style.display = 'block';
            newModal.classList.add('show');
        }

    } else {
        console.error("Element with ID 'rc_ajax_modal' not found.");
    }
}

/* end of clock in stuff */

document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
let script_patch = document.createElement('script');
script_patch.name = 'n/a';
script_patch.onload = function() {
    console.log('Patch Loaded:', script_patch.name);
};

if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) {

    script_patch.src = "https://simple-patches.vercel.app/recom-patches-listing.js?v=" + Date.now();
    script_patch.name = 'recom-patches-listing.js';

}

if (window.location.href.includes('/queues/conditions/')) {
    
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-condqueue.js?v=" + Date.now();
    script_patch.name = 'recom-patches-condqueue.js';

}

if ((window.location.href.includes('/products/') || window.location.href.includes('/product/items/')) && !window.location.href.includes('/products/new')) {
    // ending slash is needed to ensure that the code only applies the patch for the sku and sid pages

    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-product.css?v=' + Date.now() + '" type="text/css"/>';
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-productPage.js?v=" + Date.now();
    script_patch.name = 'recom-patches-productPage.js';

}

if (window.location.href.includes('/receiving') && document.getElementById('searchProductForm')) {
    
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-newInventory.js?v=" + Date.now();
    script_patch.name = 'recom-patches-newInventory.js';

}

if (window.location.href.includes('/reports')) {

    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-reports.css?v=' + Date.now() + '" type="text/css"/>';
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-reports.js?v=" + Date.now();
    script_patch.name = "recom-patches-reports.js";

}

if (window.location.href.includes('/users/show')) {

    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-userShow.css?v=' + Date.now() + '" type="text/css"/>';

}

document.body.appendChild(script_patch);

const today = new Date();
if (today.getDate() === 30 && today.getMonth() === 9) {
    rainbowMessage('Happy Birthday Luke!');
}

if (today.getDate() === 29 && today.getMonth() === 9) {
    rainbowMessage('Happy Early Birthday Luke!');
}

if (today.getDate() === 28 && today.getMonth() === 11) {
    rainbowMessage('Happy Birthday Nate!');
}

if (today.getDate() === 27 && today.getMonth() === 11) {
    rainbowMessage('Happy Early Birthday Nate!');
}

console.log('Patch Loading Complete');