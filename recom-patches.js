const version = '01-02-2025__3';

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
    const modal = `<style>
        #patch_clockout_fullModal .modal-content {
            transform: translateY(-15vh) !important;
            opacity: 0.25 !important;
            transition: all 0.1s ease !important;
        }

        #patch_clockout_fullModal.show .modal-content {
            transform: unset !important;
            opacity: 1.0 !important;
        }
    </style>

    <div class="modal fade" id="patch_clockout_fullModal" data-bs-backdrop="static" tabindex="-1" aria-hidden="true" role="dialog" style="display: none; background: rgba(0, 0, 0, .4) !important;">
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
                        <label class="fs-6 fw-semibold form-label">Type notes below and clock out while recording time.</label>
                        <label class="fs-6 fw-semibold form-label">* Please Note: Activity Code will be a mirror of the task name, units will be 0, and no PO will be attached.</label>
                    </div>
                    <div class="d-flex flex-column mb-8">
                        <label class="fs-6 fw-bold mb-2" for="patch-clockout-textarea-notes">Notes:</label>
                        <textarea class="form-control form-control-solid" rows="3" name="notes" id="patch-clockout-textarea-notes" placeholder="Provide some notes if any" spellcheck="false"></textarea>
                    </div>
                     <div class="separator my-10"></div>
                    <div class="text-center">
                        <button type="reset" id="patches_clockout_cancel" data-bs-dismiss="modal" class="btn btn-light me-3">Cancel</button>
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

        rcAjaxModal.parentNode.insertBefore(modalContainer, rcAjaxModal);
        //rcAjaxModal.parentNode.insertBefore(modalContainer.firstElementChild, rcAjaxModal);

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
                    console.error("FAIL", error);
                    ajaxFailAlert(error);
                });
            };
        }

        const closeButton = document.getElementById('patches_clockout_close');
        if (closeButton) {
            closeButton.onclick = closeModal;
        }

        const cancelButton = document.getElementById('patches_clockout_cancel');
        if (cancelButton) {
            cancelButton.onclick = closeModal;
        }

        function closeModal() {
            const fullModal = document.getElementById('patch_clockout_fullModal');
            if (fullModal) {
                newModal.classList.remove('show');
                setTimeout(() => {
                    fullModal.remove();
                }, 200);
            }
        }

        const newModal = document.getElementById('patch_clockout_fullModal');
        if (newModal) {
            newModal.style.display = 'block';
            newModal.removeAttribute('aria-hidden');
            newModal.setAttribute('aria-modal', 'true');

            setTimeout(() => {
                newModal.classList.add('show');
            }, 200);
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
    console.debug('Patch Loaded:', script_patch.name);
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

async function checkWeatherAndCreateEffects() {
    function setCookie(name, value, minutes) {
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + minutes);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    function getCookie(name) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=');
            if (key === name) {
                return value;
            }
        }
        return null;
    }

    function createSnow() {
        const appMain = document.getElementById('kt_app_main');
        const snowContainer = document.createElement('div');
        snowContainer.classList.add('snow');
        appMain.appendChild(snowContainer);

        const snowflakeCount = 50;
        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDelay = `${Math.random() * 5}s`;
            snowflake.style.animationDuration = `${5 + Math.random() * 5}s`;
            snowContainer.appendChild(snowflake);
        }
    }

    function createRain() {
        const appMain = document.getElementById('kt_app_main');
        const rainContainer = document.createElement('div');
        rainContainer.classList.add('rain');
        appMain.appendChild(rainContainer);

        const raindropCount = 100;
        for (let i = 0; i < raindropCount; i++) {
            const raindrop = document.createElement('div');
            raindrop.classList.add('raindrop');
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDelay = `${Math.random() * 2}s`;
            raindrop.style.animationDuration = `${2 + Math.random()}s`;
            rainContainer.appendChild(raindrop);
        }
    }

    const snowStatus = getCookie('patch_snowStatus');
    const rainStatus = getCookie('patch_rainStatus');

    if (snowStatus !== null) {
        console.debug(`Patch - Using cached snow status: ${snowStatus}`);
        if (snowStatus === 'true') {
            createSnow();
        } else if (rainStatus === 'true') {
            createRain();
        }
        return;
    }

    const latitude = 39.3737;
    const longitude = -76.9678;

    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode&timezone=auto`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const weatherData = await response.json();

        const currentWeatherCode = weatherData.current_weather.weathercode;
        const isSnowingNow = [71, 73, 75, 77, 85, 86].includes(currentWeatherCode);
        const isRainingNow = [61, 63, 65, 80, 81, 82].includes(currentWeatherCode);

        const dailyForecast = weatherData.daily.weathercode || [];
        const isSnowInForecast = dailyForecast.some(code => [71, 73, 75, 77, 85, 86].includes(code));
        const isRainInForecast = dailyForecast.some(code => [61, 63, 65, 80, 81, 82].includes(code));

        const shouldShowSnow = isSnowingNow || isSnowInForecast;
        const shouldShowRain = isRainingNow || isRainInForecast;

        console.debug(`Patch - Snow detected: ${shouldShowSnow}`);
        console.debug(`Patch - Rain detected: ${shouldShowRain}`);

        setCookie('patch_snowStatus', shouldShowSnow, 30);
        setCookie('patch_rainStatus', shouldShowRain, 30);

        if (shouldShowSnow) {
            createSnow();
        } else if (shouldShowRain) {
            createRain();
        }
    } catch (error) {
        console.error('Patch - Error fetching or processing weather data:', error);
    }
}

window.onload = checkWeatherAndCreateEffects;

function modalPictureCount() {
    const modal = document.getElementById('rc_ajax_modal');
    let lastEvent = null;
    const processedContent = new Set();
    const inProgressContent = new Set();

    ['click', 'input', 'keyup', 'change', 'mousedown', 'mouseup'].forEach((eventType) => {
        document.addEventListener(eventType, (event) => {
            lastEvent = event;
        }, true);
    });

    modal.addEventListener('hidden.bs.modal', () => {
        processedContent.clear();
        inProgressContent.clear();
        console.debug('Patch: Modal closed. Resetting processed and in-progress content.');
    });

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(async (mutation) => {
            if (lastEvent) {
                const { target } = lastEvent;

                if (
                    target.tagName === 'A' &&
                    target.hasAttribute('data-url') &&
                    target.getAttribute('data-url').includes('ajax/modals/productitems/')
                ) {
                    const descriptionDiv = modal.querySelector('div.d-flex.flex-wrap.fw-bold.mb-4.fs-5.text-gray-400');
                    if (descriptionDiv) {
                        const descriptionText = descriptionDiv.textContent.trim();

                        if (!processedContent.has(descriptionText) && !inProgressContent.has(descriptionText)) {
                            inProgressContent.add(descriptionText);

                            try {
                                const item_images = await getItemPictureCount(descriptionText);
                                processedContent.add(descriptionText);
                                const image_counts = countUrlsBySku(item_images);

                                console.debug('Patch: SKU img counts:', image_counts);
                                const table = modal.querySelector('table.table-row-bordered');
                                if (table) {
                                    const thead = table.querySelector('thead');
                                    if (thead) {
                                        const headerRow = thead.querySelector('tr');
                                        if (headerRow) {
                                            const newHeader = document.createElement('th');
                                            newHeader.textContent = 'Pictures';
                                            headerRow.appendChild(newHeader);
                                        }
                                    }

                                    const rows = table.querySelectorAll('tbody tr');
                                    rows.forEach((row) => {
                                        const newCell = document.createElement('td');
                                        const sku = row.querySelector('td:nth-child(1)')?.textContent?.trim();
                                        const countObj = image_counts.find((item) => item.sku === sku);

                                        newCell.textContent = countObj ? countObj.count : '0';
                                        row.appendChild(newCell);
                                    });
                                } else {
                                    console.debug('Patch: Table not found in the modal content.');
                                }
                            } catch (error) {
                                console.error('API call failed for:', descriptionText, error);
                            } finally {
                                inProgressContent.delete(descriptionText);
                            }
                        } else {
                            console.debug('Patch: API call already in progress or completed for:', descriptionText);
                        }
                    } else {
                        console.debug('Patch: Description div not found in the modal content.');
                    }
                }
            }
        });
    });


    const config = {
        childList: true,
        attributes: true,
        subtree: true,
    };

    observer.observe(modal, config);

    console.debug('Patch: MutationObserver is now monitoring the modal content.');

    async function getItemPictureCount(SID) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]')
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            const request = {
                report: {
                    type: "item_images",
                    columns: [
                        "product_items.sku",
                        "item_images.url",
                    ],
                    filters: [{
                            column: "products.sid",
                            opr: "{0} = '{1}'",
                            value: `${SID}`
                        },
                        {
                            column: "product_items.status",
                            opr: "{0} = '{1}'",
                            value: "1"
                        }
                    ]
                },
                csrf_recom: csrfToken
            };

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/reports/create",
                    data: request,
                }).done(function(data) {
                    if (data.success && data.results.results && Array.isArray(data.results.results)) {
                        resolve(data.results.results);
                    } else {
                        resolve(null);
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("Request failed: " + textStatus + ", " + errorThrown);
                    reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
                });
            });
        } else {
            return null;
        }
    }

    function countUrlsBySku(data) {
        const skuCounts = {};

        data.forEach((item) => {
            const { SKU, URL } = item;
            if (!skuCounts[SKU]) {
                skuCounts[SKU] = 0;
            }
            if (URL !== null) {
                skuCounts[SKU]++;
            }
        });

        return Object.entries(skuCounts).map(([sku, count]) => ({
            sku,
            count,
        }));
    }

    modal.addEventListener('hidden.bs.modal', () => {
        console.debug('Patch: Modal has been hidden.');
    });
}

window.onload = modalPictureCount;

console.log('Patch Loading Complete');