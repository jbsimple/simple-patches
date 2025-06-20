let version = '...';
let currentuser = '';

function injectGoods() {
    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
    let script_patch = document.createElement('script');
    script_patch.name = 'n/a';
    script_patch.onload = function() { console.debug('Patch Loaded:', script_patch.name); };

    if (window.location.href.includes('/receiving/queues/listing') || window.location.href.includes('/products/new')) {

        document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-listing.css?v=' + Date.now() + '" type="text/css"/>';
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

    if (window.location.href.includes('/integrations/store/logs')) {
        
        script_patch.src = "https://simple-patches.vercel.app/recom-patches-errors.js?v=" + Date.now();
        script_patch.name = 'recom-patches-errors.js';

    }

    if (window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board')) {
        
        script_patch.src = "https://simple-patches.vercel.app/recom-patches-productivity.js?v=" + Date.now();
        script_patch.name = 'recom-patches-productivity.js';

    }

    if (window.location.href.includes('/tools') && !window.location.href.includes('/tools/import')) {
        
        script_patch.src = "https://simple-patches.vercel.app/recom-patches-tools.js?v=" + Date.now();
        script_patch.name = 'recom-patches-tools.js';

    }

    if (window.location.href.includes('/receiving/queues/inventory')) {
        
        script_patch.src = "https://simple-patches.vercel.app/recom-patches-pendinginv.js?v=" + Date.now();
        script_patch.name = 'recom-patches-pendinginv.js';

    }

    if (document.title.includes('Dashboard - ')) {

        document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-dashboard.css?v=' + Date.now() + '" type="text/css"/>';
        script_patch.src = "https://simple-patches.vercel.app/recom-patches-dashboard.js?v=" + Date.now();
        script_patch.name = "recom-patches-dashboard.js";

    }

    document.body.appendChild(script_patch);

    let script_version = document.createElement('script');
    script_version.src = "https://simple-patches.vercel.app/buildInfo.js?v=" + Date.now();
    script_version.onload = function() { console.debug('Patch Loaded: buildInfo.js'); };
    document.body.appendChild(script_version);
}

function injectExtraTheme() {
    const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
    if (nav_sidebar) {
        // version tracker in build.sh
        const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
        if (nav_sidebar_links) {
            const name = nav_sidebar_links.querySelectorAll('.menu-heading')[0];
            currentuser = name.textContent.replace(/^Hi,\s*/, '').toLocaleLowerCase();
            let icon = "https://pbvppkf0kuzw4c6s.public.blob.vercel-storage.com/cat-jam.gif";

            if (name && name.textContent.includes('Hi, Luke')) {
                icon = "https://pbvppkf0kuzw4c6s.public.blob.vercel-storage.com/abe.gif";
                name.textContent = 'Hi, Psychopath';
                scheduleRun(15, 50, () => {
                    modalWarning("It's 3:50PM, get ready to detect METAL.");
                });
                scheduleRun(15, 55, () => {
                    modalWarning("It's 3:55PM, Detect the METAL.");
                });
            } else if (name && name.textContent.includes('Hi, Nate')) {
                icon = "https://pbvppkf0kuzw4c6s.public.blob.vercel-storage.com/abe.gif";
                name.textContent = 'Hi, Nasty Nate';
            }

            /*
            const allImgs = document.querySelectorAll('img');
            allImgs.forEach(avatar => {
                const src = avatar.getAttribute('src') || '';
                if (src.includes('assets') && src.includes('avatars')) {
                    console.debug('PATCHES - Swapping Avatar:', src);
                    avatar.src = icon;
                }
            });
            */        

            const links = nav_sidebar_links.querySelectorAll('.menu-link');
            if (links.length > 0) {
                links.forEach(link => {
                    const href = link.getAttribute('href'); 
                    const title = link.querySelector('.menu-title');
                    if (href && href.includes('productivity/employee')) {
                        title.textContent = 'My Productivity';
                    } else if (href && href.includes('productivity') && !href.includes('productivity/board')) {
                        title.textContent = 'Team Productivity';
                    }
                });
            } else {
                console.error('PATCHES - Unable to parse button links');
            }
        }

    } else {
        console.error('Sidebar could not be found.');
    }

    const nav_footer = document.getElementById('kt_app_footer');
    if (nav_footer) {
        const copyrights = nav_footer.querySelectorAll('.text-muted.fw-semibold.me-1');
        if (copyrights) {
            copyrights.forEach(copyright => {
                if (copyright.textContent = '2023©') {
                    copyright.textContent = '(C)2025';

                    const newCopyright = document.createElement('span');
                    newCopyright.classList.add('text-muted', 'fw-semibold', 'me-1');
                    newCopyright.textContent = ' | Simple Patches';
                    copyright.parentElement.appendChild(newCopyright);
                }
            })
        }
    }

    // fix top button, why is it green???
    const nav_header = document.getElementById('kt_app_header');
    if (nav_header) {
        const greenButton = nav_header.querySelector('.btn-color-primary');
        if (greenButton) {
            greenButton.setAttribute('class', 'btn btn-icon btn-custom btn-color-gray-600 btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px');
        }
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
}

function scheduleRun(hour, minute, callback) {
    const now = new Date();

    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    const delay = target - now;
    setTimeout(() => {
        callback();
        runAtSpecificTime(hour, minute, callback);
    }, delay);
}

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

function modalWarning(message) {
    let modal = document.createElement('div');
    modal.className = "swal2-container swal2-center swal2-backdrop-show";
    modal.style.overflowY = "auto";
    modal.innerHTML = `
        <div aria-labelledby="swal2-title" aria-describedby="swal2-html-container" class="swal2-popup swal2-modal swal2-icon-warning swal2-show" tabindex="-1" role="dialog" aria-live="assertive" aria-modal="true" style="display: grid;">
            <button type="button" class="swal2-close" aria-label="Close this dialog" style="display: none;">×</button>
            <div class="swal2-icon swal2-warning swal2-icon-show" style="display: flex;">
                <div class="swal2-icon-content">!</div>
            </div>
            <div class="swal2-html-container" id="swal2-html-container" style="display: block;">${message}</div>
            <div class="swal2-actions" style="display: flex;">
                <div class="swal2-loader"></div>
                <button type="button" class="swal2-confirm btn btn-primary" aria-label="" style="display: inline-block;">Okay</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.swal2-confirm').addEventListener('click', () => {
        modal.remove();
    });
}

function modalError(message) {
    let modal = document.createElement('div');
    modal.className = "swal2-container swal2-center swal2-backdrop-show";
    modal.style.overflowY = "auto";
    modal.innerHTML = `
        <div aria-labelledby="swal2-title" aria-describedby="swal2-html-container"
             class="swal2-popup swal2-modal swal2-icon-error swal2-show" tabindex="-1"
             role="dialog" aria-live="assertive" aria-modal="true" style="display: grid;">
            <div class="swal2-icon swal2-error swal2-icon-show" style="display: flex;">
                <span class="swal2-x-mark">
                    <span class="swal2-x-mark-line-left"></span>
                    <span class="swal2-x-mark-line-right"></span>
                </span>
            </div>
            <div class="swal2-html-container" id="swal2-html-container" style="display: block;">${message}</div>
            <div class="swal2-actions" style="display: flex;">
                <div class="swal2-loader"></div>
                <button type="button" class="swal2-confirm btn btn-primary" aria-label="" style="display: inline-block;">Okay</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.swal2-confirm').addEventListener('click', () => {
        modal.remove();
    });
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
                        <p class="fs-6 fw-bold">You are about to clock out! Quickly record time below.</p>
                        <p class="fs-6 fw-semibold form-label mb-2"><b>Actvitiy/Event</b>: Use if needing to tack multiple things in same task.</p>
                        <p class="fs-6 fw-semibold form-label mb-2"><b>Notes</b>: Provide extra notes if needed.</p>
                        <p class="fs-6 fw-semibold form-label mb-2"><i>* Please Note: Actvity defaults to task name, notes default to placeholder value when left blank.</i></p>
                    </div>
                    <div class="d-flex flex-column mb-8">
                        <label class="fs-6 fw-bold mb-2" for="patch-clockout-text-task">Activity/Event:</label>
                        <input type="text" class="form-control form-control-solid" name="task" id="patch-clockout-text-task" placeholder="Enter Activity/Event" value="${task ?? ''}" spellcheck="false">
                    </div>
                    <div class="d-flex flex-column mb-8">
                        <label class="fs-6 fw-bold mb-2" for="patch-clockout-textarea-notes">Notes:</label>
                        <textarea style="max-height: 50vh;" class="form-control form-control-solid" rows="3" name="notes" id="patch-clockout-textarea-notes" placeholder="Provide some notes if any" spellcheck="false"></textarea>
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

                const actionInput = document.getElementById('patch-clockout-text-task');
                let action = "OFF_SYSTEM";

                if (actionInput && actionInput.value.trim() !== '') {
                    action = actionInput.value.trim();
                } else if (typeof task !== 'undefined' && task.trim() !== '') {
                    action = task.trim();
                }

                console.debug('Patch: Notes for Clock Out:', notes);

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/productivity/record",
                    data: {
                    csrf_recom: $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                        "clock_activity[activity_code]": action,
                        "clock_activity[units]": "0",
                        "clock_activity[notes]": notes || "Off System Clock Out",
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

        document.addEventListener('keydown', (event) => {
            const notesTextarea = document.getElementById('patch-clockout-textarea-notes');
            
            if (event.key === 'Escape' && notesTextarea && document.activeElement !== notesTextarea) {
                closeModal();
            }
        });

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

function clockTaskVisualRefresh() {
    const href = '/user/me';
    const checkButtonSelector = 'a[href^="javascript:clockInOut"]';

    async function checkAndUpdate() {
        try {
            const response = await fetch(href);
            if (!response.ok) throw new Error('Failed to fetch page content');

            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const currentButton = document.querySelector(checkButtonSelector);
            const newButton = doc.querySelector(checkButtonSelector);

            if (!currentButton || !newButton) {
                console.debug('No clock button found in one or both DOMs.');
                return;
            }

            const currentText = currentButton.textContent.trim().toLowerCase();
            const newText = newButton.textContent.trim().toLowerCase();

            console.debug('Current Clock Button Text:', currentText);
            console.debug('Fetched Clock Button Text:', newText);

            if (currentText !== newText) {
                console.debug('Patches - CLOCK IN TASK CHANGED');
                const currentParentDiv = currentButton.closest('div');
                const newParentDiv = newButton.closest('div');
                if (currentParentDiv && newParentDiv) {
                    currentParentDiv.replaceWith(newParentDiv);
                    modifiedClockInit();
                } else {
                    console.warn('Could not find parent <div> to replace.');
                }
            } else {
                console.debug('Patches - Clock In Task the same.');
            }
        } catch (error) {
            console.error('Error updating clock task:', error);
        }
    }
    checkAndUpdate();
    setInterval(checkAndUpdate, 60000);
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

    if (snowStatus !== null && rainStatus !== null) {
        console.debug(`Patch - Using cached snow status: ${snowStatus}`);
        console.debug(`Patch - Using cached rain status: ${rainStatus}`);
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
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=weathercode&timezone=auto`
        );        
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const weatherData = await response.json();
        
        const currentWeatherCode = weatherData.current_weather.weathercode;

        const snowCodes = [71, 73, 75, 77, 85, 86];
        const rainCodes = [61, 63, 65, 80, 81, 82];

        let shouldShowRain = rainCodes.includes(currentWeatherCode);
        let shouldShowSnow = snowCodes.includes(currentWeatherCode);
        if (!shouldShowSnow) {
            const hourlyWeatherCodes = weatherData.hourly.weathercode;
            const hourlyTimestamps = weatherData.hourly.time;
        
            const now = new Date();
            const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
            shouldShowSnow = hourlyTimestamps.some((timestamp, i) => {
                const time = new Date(timestamp);
                return time > now && time <= cutoff && snowCodes.includes(hourlyWeatherCodes[i]);
            });
        }

        console.debug(`Patch - Enable Snow: ${shouldShowSnow}`);
        console.debug(`Patch - Enable Rain: ${shouldShowRain}`);

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

function hijackAjaxModal() {
    let modal = document.getElementById('rc_ajax_modal');
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

    const observer = new MutationObserver(async (mutationsList) => {
        const mutation = mutationsList[0];
        if (mutation) {
            console.debug('Patches - Mutation Fired:', mutation);
            if (lastEvent) {
                let { target } = lastEvent;

                if (target.matches('i.fas')) {
                    console.log('Patches - Getting Parent:', target);
                    target = target.parentElement;
                }                

                if ((target.id === "rc_ajax_modal" && target.querySelector('.fw-bold.fs-6.text-gray-400')?.textContent.trim() === 'GTIN' && target.querySelector('table').classList.contains('table-row-bordered')) 
                        || (target.tagName === 'A' && target.hasAttribute('data-url') && target.getAttribute('data-url').includes('ajax/modals/productitems/') && target.classList.contains('ajax-modal'))) {
                    console.debug('Patches - AJAX modal is product glace:', target);
                    
                    modalPictureCount();

                } else if (target.getAttribute('href') === "javascript:clockInOut('in');") {
                    console.debug('Patches - AJAX modal is clock in:', target);
                    modalClockIn();
                } else {
                    console.debug('Patches - AJAX modal not defined modal:', target);
                }
            }
        }
    });


    const config = {
        childList: true,
        attributes: true,
        subtree: true,
    };

    observer.observe(modal, config);

    console.debug('Patch: MutationObserver is now monitoring the modal content.');

    async function modalPictureCount() {
        const descriptionDiv = modal.querySelector('div.d-flex.flex-wrap.fw-bold.mb-4.fs-5.text-gray-400');
        if (descriptionDiv) {
            const descriptionText = descriptionDiv.textContent.trim();
    
            if (!processedContent.has(descriptionText) && !inProgressContent.has(descriptionText)) {
                inProgressContent.add(descriptionText);
    
                try {
                    const item_images = await getItemDetails(descriptionText);
                    console.debug('PATCHES: Item Details:', item_images);

                    const product_images = await getProductDetails(descriptionText);
                    console.debug('PATCHES: Product Details:', product_images);

                    processedContent.add(descriptionText);
                    const image_counts = countUrlsBySku(item_images);
    
                    console.debug('Patch: SKU img counts:', image_counts);
                    const table = modal.querySelector('table.table-row-bordered');
                    if (table) {
                        const thead = table.querySelector('thead');
                        if (thead) {
                            const headerRow = thead.querySelector('tr');
                            if (headerRow) {
                                const w50s = headerRow.querySelectorAll('.w-50');
                                w50s.forEach(w50 => {
                                    w50.classList.remove('w-50');
                                    w50.setAttribute('style', 'width: 35% !important;');
                                });

                                const headings = headerRow.querySelectorAll('th');

                                const skuHeading = Array.from(headings).find(th => th.textContent.trim() === 'SKU');
                                skuHeading.setAttribute('style', 'width: 12% !important;');

                                const conditionHeading = Array.from(headings).find(th => th.textContent.trim() === 'Condition');
                                conditionHeading.setAttribute('style', 'width: 15% !important;');

                                const stockHeading = Array.from(headings).find(th => th.textContent.trim() === 'In Stock');
                                stockHeading.textContent = 'Stock';
                                stockHeading.title = 'In Stock';

                                const availableHeading = Array.from(headings).find(th => th.textContent.trim() === 'Total Available');
                                availableHeading.textContent = 'Avai..';
                                availableHeading.title = "Total Available";

                                const priceHeading = Array.from(headings).find(th => th.textContent.trim() === 'Base Price');
                                priceHeading.textContent = 'Price';
                                priceHeading.title = 'Base Price';

                                const createdHeader = document.createElement('th');
                                createdHeader.setAttribute('style', 'width: 16% !important;');
                                createdHeader.textContent = 'Creaated At';
                                headerRow.appendChild(createdHeader);

                                const pictureHeader = document.createElement('th');
                                pictureHeader.textContent = 'Pictures';
                                headerRow.appendChild(pictureHeader);
                            }
                        }
    
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach((row) => {
                            const td = row.querySelector('td:nth-child(1)');
                            let sku = '';
                            if (td) {
                                const link = td.querySelector('a');
                                if (link) {
                                    for (const node of link.childNodes) {
                                        if (node.nodeType === Node.TEXT_NODE) {
                                            sku = node.textContent.trim();
                                            break;
                                        }
                                    }

                                    if (sku !== '') {
                                        const skuObj = image_counts.find((item) => item.sku.trim() === sku);
                                        if (skuObj.Item_Status === 'Inactive') { link.innerHTML += `<span class="badge badge-danger ms-2">Inactive</span>`; }

                                        const createdCell = document.createElement('td');
                                        if (skuObj && skuObj.Created_Date) {
                                            const dateObj = new Date(skuObj.Created_Date);
                                            const options = { month: 'short' };
                                            const month = new Intl.DateTimeFormat('en-US', options).format(dateObj);
                                            const day = String(dateObj.getDate()).padStart(2, '0');
                                            const year = dateObj.getFullYear();
                                            const time = dateObj.toTimeString().split(' ')[0];

                                            createdCell.innerHTML = `${month} ${day} ${year} ${time}`;
                                        } else {
                                            createdCell.textContent = '';
                                            console.error(`PATCHES: Unable to get created date for ${sku}:`, skuObj);
                                        }
                                        row.appendChild(createdCell);
                
                                        const pictureCell = document.createElement('td');
                                        pictureCell.textContent = skuObj ? skuObj.count : '0';
                                        row.appendChild(pictureCell);
                                    }
                                }
                            }
                        });
                        
                    } else {
                        console.debug('Patch: Table not found in the modal content.');
                    }
    
                    const images = modal.querySelectorAll('img');
    
                    if (images.length > 0) {
                        const img = images[0];
                        const filename = img.src.split('/').pop();
    
                        const parentContainer = modal.querySelector(
                            '.d-flex.flex-wrap.justify-content-start'
                        );

                        if (parentContainer) {
                            const targetContainer = parentContainer.querySelector('.d-flex.flex-wrap');

                            if (targetContainer) {

                                if (product_images !== null && product_images.length > 0) {
                                    if (product_images[0].Created_Date) {
                                        const dateObj = new Date(product_images[0].Created_Date);
                                        const options = { month: 'short' };
                                        const month = new Intl.DateTimeFormat('en-US', options).format(dateObj);
                                        const day = String(dateObj.getDate()).padStart(2, '0');
                                        const year = dateObj.getFullYear();
                                        const time = dateObj.toTimeString().split(' ')[0];
                                        createDetailBox('Created At', `${month} ${day} ${year} ${time}`, 'SID Created Timestamp.');
                                    }

                                    if (product_images[0].Product_Status && product_images[0].Product_Status === 'Inactive') {
                                        createDetailBox('Status', product_images[0].Product_Status, 'SID Status.', 'text-danger');
                                    } else if (product_images[0].Product_Status) {
                                        createDetailBox('Status', product_images[0].Product_Status, 'SID Status.', 'text-success');
                                    }
                                    
                                } else {
                                    console.error('PATCHES: Unable to get product details.', product_images);
                                }

                                if (filename !== 'no-image.png') {
                                    createDetailBox('Number of Pictures', String(product_images?.length ?? 0), 'Number of pictures on the SID.');
                                    createDetailBox('Image Filename', filename, 'Filename of the first image on the SID.');
                                } else {
                                    createDetailBox('Number of Pictures', '0', 'Number of pictures on the SID.');
                                }

                                function createDetailBox(bold, value, title = '', color = '') {
                                    const newElement = document.createElement('div');
                                    newElement.title = title;
                                    newElement.className = 'border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3';
    
                                    const numberContainer = document.createElement('div');
                                    numberContainer.className = 'd-flex align-items-center';
                                    const filenameDiv = document.createElement('div');
                                    filenameDiv.className = 'fs-4 fw-bolder';
                                    if (color !== '') {
                                        console.debug('PATCHES: There is a COLOR!', color); // this HAS to be here or the color wont be set, dont ask me why
                                        filenameDiv.setAttribute('style', `color: var(--bs-${color}) !important;`);
                                    }
                                    filenameDiv.textContent = value;
    
                                    numberContainer.appendChild(filenameDiv);
    
                                    const labelDiv = document.createElement('div');
                                    labelDiv.className = 'fw-bold fs-6 text-gray-400';
                                    labelDiv.textContent = bold;
    
                                    newElement.appendChild(numberContainer);
                                    newElement.appendChild(labelDiv);
    
                                    targetContainer.appendChild(newElement);
                                }
                            } else {
                                console.error('Patches - Target container with class "d-flex flex-wrap" not found.');
                            }
                        } else {
                            console.error('Patches - Parent container with class "d-flex flex-wrap justify-content-start" not found.');
                        }
                    } else {
                        console.debug('Patches - No images found.');
                    }
                } catch (error) {
                    console.error('Patches - API call failed for:', descriptionText, error);
                } finally {
                    inProgressContent.delete(descriptionText);
                }
            } else {
                console.debug('Patches - API call already in progress or completed for:', descriptionText);
            }
        } else {
            console.debug('Patches - Description div not found in the modal content.');
        }
    
        async function getItemDetails(SID) {
            const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
            if (!csrfMeta || csrfMeta.getAttribute('content').length === 0) {
                return Promise.resolve(null);
            }

            const csrfToken = csrfMeta.getAttribute('content');

            function makeRequest(statusValue) {
                const request = {
                    report: {
                        type: "item_images",
                        columns: [
                            "product_items.sku",
                            "item_images.url",
                            "product_items.status",
                            "product_items.created_at"
                        ],
                        filters: [
                            {
                                column: "products.sid",
                                opr: "{0} = '{1}'",
                                value: `${SID}`
                            },
                            {
                                column: "product_items.status",
                                opr: "{0} = '{1}'",
                                value: statusValue
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
                    }).done(function (data) {
                        if (data.success && Array.isArray(data.results?.results)) {
                            resolve(data.results.results);
                        } else {
                            resolve([]);
                        }
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        console.error("Request failed: " + textStatus + ", " + errorThrown);
                        reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
                    });
                });
            }

            return Promise.all([makeRequest("1"), makeRequest("0")])
                .then(([status1Results, status0Results]) => {
                    return [...status1Results, ...status0Results];
                })
                .catch(error => {
                    console.error("Error during combined request:", error);
                    return null;
                });
        }

        async function getProductDetails(SID) {
            const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
            if (!csrfMeta || csrfMeta.getAttribute('content').length === 0) {
                return null;
            }

            const csrfToken = csrfMeta.getAttribute('content');

            function makeRequest(statusValue) {
                const request = {
                    report: {
                        type: "product_images",
                        columns: [
                            "product_images.url",
                            "products.status",
                            "products.created_at"
                        ],
                        filters: [
                            {
                                column: "products.sid",
                                opr: "{0} = '{1}'",
                                value: `${SID}`
                            },
                            {
                                column: "products.status",
                                opr: "{0} = '{1}'",
                                value: statusValue
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
                        if (data.success && Array.isArray(data.results?.results)) {
                            resolve(data.results.results);
                        } else {
                            resolve([]);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        console.error("Request failed: " + textStatus + ", " + errorThrown);
                        reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
                    });
                });
            }

            try {
                const [status1Results, status0Results] = await Promise.all([
                    makeRequest("1"),
                    makeRequest("0")
                ]);
                return [...status1Results, ...status0Results];
            } catch (error) {
                console.error("Error during combined product request:", error);
                return null;
            }
        }
    
        function countUrlsBySku(data) {
            const skuMap = {};

            data.forEach((item) => {
                const { SKU, URL, Item_Status, Created_Date} = item;
                if (!skuMap[SKU]) {
                    skuMap[SKU] = {
                        sku: SKU,
                        count: 0,
                        Created_Date: Created_Date,
                        Item_Status: Item_Status
                    };
                }
                if (URL !== null) {
                    skuMap[SKU].count++;
                }
            });

            return Object.values(skuMap);
        }
    
        modal.addEventListener('hidden.bs.modal', () => {
            console.debug('Patch: Modal has been hidden.');
        });
    }
    

    async function modalClockIn() {
        modal = document.querySelector('.swal2-container');
        const selects = document.querySelectorAll('select');
        if (selects) {
            console.debug(selects);
            selects.forEach(select => {
                const hasDisabledOption = Array.from(select.options).some(option => 
                    option.disabled && option.value === "" && option.text.trim() === "Select a task"
                );

                if (hasDisabledOption) {
                    console.debug('Patches - Found Select, Attempting to add.');
                    const quickTasks = [
                        { value: "7", text: "BREAK", title: "BREAK (Off System)" },
                        { value: "8", text: "LUNCH", title: "LUNCH (Off System)" },
                        { value: "5", text: "Meeting", title: "ADHOC - Meeting (Off System)" },
                        { value: "22", text: "Listing", title: "Listing (On System)" },
                        { value: "28", text: "Listing Side Work", title: "Listing Side Work (Off System)" },
                        { value: "29", text: "Pictures", title: "Pictures (Off System)" },
                        { value: "31", text: "Pictures Side Work", title: "Pictures Side Work (Off System)" }
                    ];
        
                    const buttonContainer = document.createElement("div");
                    buttonContainer.setAttribute('style', 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; justify-content: center;')
                    buttonContainer.style.display = "flex";
                    buttonContainer.style.flexWrap = "wrap";
                    buttonContainer.style.gap = "0.5rem";
                    buttonContainer.style.marginBottom = "1rem";
        
                    quickTasks.forEach(task => {
                        const button = document.createElement("button");
                        button.textContent = task.text;
                        button.setAttribute("data-value", task.value);
                        button.title = task.title;
                        button.classList.add('btn', 'btn-color-gray-700', 'btn-active-color-white', 'btn-outline', 'btn-outline-success');
        
                        button.addEventListener("click", () => {
                            select.value = task.value;
                            console.log(`Selected task: ${task.text}`);
        
                            const submitButton = modal.querySelector(".swal2-confirm");
                            if (submitButton) {
                                submitButton.click();
                            }
                        });
        
                        buttonContainer.appendChild(button);
                    });
        
                    select.parentNode.insertBefore(buttonContainer, select);
                }
            });
        } else {
            console.error('Patches - Unable to find select.');
        }
    }
}

function adjustToolbar() {
    const toolbar = document.getElementById('kt_app_toolbar');
    const text = toolbar.querySelector('h1.page-heading').textContent;
    if (text === 'Dashboard') {
        toolbar.style.display = 'none';
    }
}

function patchInit() {
    version = "4-30-2025__1";
    injectGoods();
    injectExtraTheme();
    clockTaskVisualRefresh();
    modifiedClockInit();
    checkWeatherAndCreateEffects();
    adjustToolbar();

    setTimeout(hijackAjaxModal, 500);
    console.log('Patch Loading Complete');
}
window.onload = patchInit;