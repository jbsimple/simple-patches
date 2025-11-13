let version = '...';
let currentuser = '';
let settings = {};

// empty defaults
let metals = [];
let queueDelete = [];
let customNames = {};
let rainbowAnnounce = [];
let autoLocationUpdate = true;
let allowed_colors = [];

let mockupProductivity = false;
let mockupProductivityDepartment = null;

async function loadEdgeConfig(key) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await fetch(`https://simple-patches.vercel.app/api/json?${key}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const { value } = await res.json();

            if (typeof value === 'object' && value !== null) {
                for (const prop in value) {
                    try {
                        eval(`${prop}`);
                        eval(`${prop} = ${JSON.stringify(value[prop])}`);
                    } catch (e) {}
                }
            }

            resolve();
        } catch (err) {
            console.error('Failed to load Edge Config:', err);
            reject(err);
        }
    });
}

function setupFromConfig() {
    if (currentuser && currentuser !== '') {
        // new metals warning
        const userMeta = metals.find(m => m.name === currentuser);
        if (userMeta?.warnings) {
            userMeta.warnings.forEach(({ hour, minute, message }) => {
                scheduleRun(hour, minute, () => {
                    fireSwal("CLOCK CHECK!", message);
                });
            });
        }

        const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
        if (nav_sidebar_links) {
            const nameElem = nav_sidebar_links.querySelectorAll('.menu-heading')[0];
            currentuser = nameElem.textContent
                            .replace(/hi[\s,]*/i, '')
                            .trim()
                            .toLowerCase();
            
            if (customNames[currentuser]) { nameElem.textContent = customNames[currentuser]; }
        }
    }

    const patches_bulkUpdateLocationsClock = document.getElementById('patches_bulkUpdateLocationsClock');
    if (autoLocationUpdate && patches_bulkUpdateLocationsClock) {
        patches_bulkUpdateLocationsClock.style.removeProperty('display');
    }
}

function injectGoods() {
    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
    let script_patch = document.createElement('script');
    script_patch.name = 'n/a';
    script_patch.onload = function() { console.debug('Patch Loaded:', script_patch.name); };

    // new modal handler
    loadPatchScript('recom-patches-modal.js');

    if (location.pathname.includes('/receiving/queues/listing') || location.pathname.includes('/products/new')) {

        loadPatchStyle('recom-patches-listing.css');
        loadPatchScript('recom-patches-listing.js');

        if (location.pathname === '/receiving/queues/listing') {
            loadPatchScript('recom-patches-dtTableParams.js');
        }

    } else if (location.pathname.includes('/queues/conditions/')) {
        
        loadPatchScript('recom-patches-condqueue.js');
        loadPatchScript('recom-patches-dtTableParams.js');

    } else if ((location.pathname.includes('/products/') || location.pathname.includes('/product/items/')) && !location.pathname.includes('/products/new')) {
        // ending slash is needed to ensure that the code only applies the patch for the sku and sid pages

        loadPatchStyle('recom-patches-product.css');
        loadPatchScript('recom-patches-productPage.js');

    } else if (location.pathname.includes('/receiving') && document.getElementById('searchProductForm')) {
        
        loadPatchScript('recom-patches-newInventory.js');

    } else if (location.pathname.includes('/reports')) {

        loadPatchStyle('recom-patches-reports.css');
        loadPatchScript('recom-patches-reports.js');

    } else if (location.pathname.includes('/users/show')) {

        loadPatchStyle('recom-patches-users.css');
        loadPatchScript('recom-patches-users.js');

    } else if (location.pathname.includes('/integrations/store/logs')) {

        loadPatchScript('recom-patches-errors.js');
        loadPatchScript('recom-patches-dtTableParams.js');

    } else if (location.pathname.includes('/productivity') && !location.pathname.includes('/productivity/board')) {

        if (mockupProductivity) {
            loadPatchScript('recom-patches-productivityNew.js');
        } else {
            loadPatchScript('recom-patches-productivity.js');
        }

    } else if (location.pathname.includes('/tools') && !location.pathname.includes('/tools/import')) {

        loadPatchScript('recom-patches-tools.js');

    } else if (location.pathname.includes('/receiving/queues/inventory')) {

        loadPatchScript('recom-patches-pendinginv.js');
        loadPatchScript('recom-patches-dtTableParams.js');

    } else if (location.pathname.includes('/receiving/queues/fba-check')) {

        loadPatchScript('recom-patches-dtTableParams.js');

    } else if (document.title.includes('Dashboard - ')) {

        loadPatchStyle('recom-patches-dashboard.css');
        loadPatchScript('recom-patches-dashboard.js');

    } else if (location.pathname.includes('/po') && !location.pathname.includes('/po/')) {

        loadPatchScript('recom-patches-dtTableParams.js');
    }

    // get build info, might move around
    let script_version = document.createElement('script');
    script_version.src = "https://simple-patches.vercel.app/buildInfo.js?v=" + Date.now();
    script_version.onload = function() { console.debug('Patch Loaded: buildInfo.js'); };
    document.body.appendChild(script_version);
}

function loadPatchScript(script) {
    let script_patch = document.createElement('script');
    script_patch.name = 'n/a';
    script_patch.onload = function() { console.debug('Patch Loaded:', script_patch.name); };
    script_patch.src = `https://simple-patches.vercel.app/${script}?v=${Date.now()}`;
    script_patch.name = script;
    document.body.appendChild(script_patch);
}

function loadPatchStyle(name) {
    document.head.innerHTML += `<link rel="stylesheet" href="https://simple-patches.vercel.app/${name}?v=${Date.now()}" type="text/css"/>`;
}

function loadPatchSettings() {
    settings = fetchSettings();
    console.debug('PATCHES - Loaded Patch Settings', settings);
    setupFromSettings();

    const kt_drawer_chat_toggle = document.getElementById('kt_drawer_chat_toggle');
    if (kt_drawer_chat_toggle) {
        const newbutton = `<a class="btn btn-icon btn-custom btn-color-gray-600 btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px" id="patches_settings" href="#">
            <i class="fas fa-cogs fs-2"></i>
        </a>`;
        kt_drawer_chat_toggle.insertAdjacentHTML("beforebegin", newbutton);
        const patches_settings = document.getElementById("patches_settings");
        if (patches_settings) {
            patches_settings.addEventListener("click", function (e) {
                e.preventDefault();
                patchesSettingsModal();
            });
        }
    }

    function fetchSettings() {
        const saved = localStorage.getItem('patch_settings');
        if (!saved) return {};

        try {
            return JSON.parse(saved) || {};
        } catch (e) {
            console.error("Invalid patch_settings JSON:", e);
            return {};
        }
    }

    function setupFromSettings() {
        const icon = (settings && settings.pfpurl && settings.pfpurl !== '') ? settings.pfpurl.trim() : null;
        if (icon !== null && icon !== '') {
            const allImgs = document.getElementById('kt_app_header_container').querySelectorAll('img');
            allImgs.forEach(avatar => {
                const src = avatar.getAttribute('src') || '';
                if (src.includes('assets') && src.includes('avatars')) {
                    console.debug('PATCHES - Swapping Avatar:', src);
                    avatar.src = icon;
                }
            });
        }

        const bgsrc = (settings && settings.bgurl && settings.bgurl !== '') ? settings.bgurl.trim() : null;
        const bgpos = (settings && settings.bgpos && settings.bgpos !== '') ? settings.bgpos.trim() : null;
        const bgobf = (settings && settings.bgobf && settings.bgobf !== '') ? settings.bgobf.trim() : null;
        const bgopa = (settings && settings.bgopa && settings.bgopa !== '') ? settings.bgopa.trim() : null;
        if (bgsrc !== null && bgsrc !== '') {
            const sidebar = document.getElementById("kt_app_sidebar");
            const header = document.getElementById("kt_app_header_navbar");
            const container = document.getElementById("kt_app_main");
            if (container) {
                const bgImg = document.createElement("img");
                bgImg.src = bgsrc;
                if (bgpos !== null && bgpos !== '') { bgImg.style.objectPosition = bgpos; } else { bgImg.style.objectPosition = 'center center'; }
                if (bgobf !== null && bgobf !== '') { bgImg.style.objectFit = bgobf; } else { bgImg.style.objectFit = 'cover'; }

                let bgImgOpa = "0.8";
                if (bgopa !== null && bgopa !== '') {
                    if (typeof bgopa === 'number') {
                        bgImgOpa = Math.min(Math.max(bgopa, 0), 1).toFixed(2);
                    } else if (!isNaN(parseFloat(bgopa))) {
                        const num = parseFloat(bgopa);
                        bgImgOpa = Math.min(Math.max(num, 0), 1).toFixed(2).toString();
                    } else {
                        bgImgOpa = String(bgopa);
                    }
                }

                bgImg.className = "dynamic-bgimg";

                const computedStyle = window.getComputedStyle(container);
                if (computedStyle.position === "static") {
                    container.style.position = "relative";
                }
                
                container.appendChild(bgImg);
                const styleTag = document.createElement("style");
                styleTag.id = 'dynamic-bgimg-style';
                styleTag.textContent = `
                    #kt_app_main > .dynamic-bgimg {
                        position: fixed;
                        top: 0px;
                        left: 0px;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        z-index: -1;
                        opacity: 0;
                        transition: opacity 1s ease, padding 0.3s ease;
                        pointer-events: none;
                        user-select: none;
                    }

                    @media (max-width: 1199.98px) {
                        #kt_app_main > .dynamic-bgimg {
                            padding-left: 0px !important;
                        }
                    }

                    .card {
                        background-color: color-mix(in srgb, var(--bs-card-bg) 85%, transparent 15%) !important;
                    }
                `;
                document.head.appendChild(styleTag);

                updatePadding();
                const resizeObserver = new ResizeObserver(() => updatePadding());
                if (sidebar) resizeObserver.observe(sidebar);
                if (header) resizeObserver.observe(header);

                bgImg.addEventListener('load', () => {
                    requestAnimationFrame(() => {
                        bgImg.style.opacity = bgImgOpa;
                    });
                });

                function updatePadding() {
                    const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
                    const headerHeight = header ? header.offsetHeight : 0;
                    bgImg.style.paddingLeft = `${sidebarWidth}px`;
                    bgImg.style.paddingTop = `${headerHeight}px`;
                }
            }
        }

        let customcss = (settings && settings.customcss && settings.customcss !== '') ? settings.customcss.trim() : null;
        if (customcss !== null && customcss !== '') {
            const customcss_id = 'patches_settings_customcss';
            const oldTag = document.getElementById(customcss_id);
            if (oldTag) oldTag.remove();
            const styleTag = document.createElement('style');
            styleTag.id = customcss_id;
            styleTag.textContent = customcss;
            document.head.appendChild(styleTag);
        }

        //activitylist
        let activitylist = (settings && settings.activitylist && settings.activitylist !== '') ? settings.activitylist.trim() : null;
        if (activitylist !== null && activitylist !== '') {
            const listArray = activitylist
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            settings.activitylist = listArray;
        }

        // mockup productivity
        mockupProductivity = settings.mockupProductivity ?? false;

        let mockupProductivity_department = (settings && settings.mockupProductivityDepartment && settings.mockupProductivityDepartment !== '') ? settings.mockupProductivityDepartment.trim() : null;
        if (mockupProductivity_department) {
            mockupProductivityDepartment = mockupProductivity_department;
        }
    }
}

function injectExtraTheme() {
    const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
    if (nav_sidebar) {
        // version tracker in build.sh
        const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
        if (nav_sidebar_links) {
            const nameElem = nav_sidebar_links.querySelectorAll('.menu-heading')[0];
            currentuser = nameElem.textContent
                            .replace(/hi[\s,]*/i, '')
                            .trim()
                            .toLowerCase();
            
            const links = nav_sidebar_links.querySelectorAll('.menu-link');
            if (links && links.length > 0 && mockupProductivity) {

            } else if (links && links.length > 0) {
                links.forEach(link => {
                    const href = link.getAttribute('href'); 
                    const title = link.querySelector('.menu-title');
                    if (href && href.includes('productivity/employee')) {
                        title.textContent = 'My Productivity';

                        const parentItem = link.closest('.menu-item');
                        if (parentItem && !nav_sidebar_links.querySelector('a[href="productivity?recentpics"]')) {
                            const newItem = document.createElement('div');
                            newItem.className = 'menu-item';
                            newItem.innerHTML = `
                                <a class="menu-link" href="productivity?recentpics">
                                    <span class="menu-bullet"><span class="bullet bullet-dot"></span></span>
                                    <span class="menu-title">Created Items</span>
                                </a>
                            `;
                            parentItem.insertAdjacentElement('afterend', newItem);
                        }
                    } else if (href && href.includes('productivity') && !href.includes('productivity/board')) {
                        title.textContent = 'Team Productivity';

                        const parentItem = link.closest('.menu-item');
                        if (parentItem && !nav_sidebar_links.querySelector('a[href="productivity?overview"]')) {
                            const newItem = document.createElement('div');
                            newItem.className = 'menu-item';
                            newItem.innerHTML = `
                                <a class="menu-link" href="productivity?overview">
                                    <span class="menu-bullet"><span class="bullet bullet-dot"></span></span>
                                    <span class="menu-title">Team Overview</span>
                                </a>
                            `;
                            parentItem.insertAdjacentElement('beforebegin', newItem);
                        }
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

    // fix apexcharts white gradient
    function fixApexCharts() {
        const svgs = document.querySelectorAll('svg.apexcharts-svg');
        if (!svgs.length) return;

        svgs.forEach(svg => {
            const adjustColor = (color) => {
                if (!color) return color;
                const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
                if (!m) return color;
                let [r, g, b] = m.slice(1).map(Number);
                const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (lightness > 200) {
                    r = g = b = 20;
                } else if (lightness > 150) {
                    r = Math.round(r * 0.4);
                    g = Math.round(g * 0.4);
                    b = Math.round(b * 0.4);
                }
                return `rgb(${r},${g},${b})`;
            };

            svg.querySelectorAll('defs stop[stop-color]').forEach(stop => {
                const val = stop.getAttribute('stop-color');
                const newColor = adjustColor(val);
                stop.setAttribute('stop-color', newColor);
                const [r, g, b] = newColor.match(/\d+/g).map(Number);
                const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const newOpacity = Math.max(0, Math.min(0.7, lightness / 360));
                stop.setAttribute('stop-opacity', newOpacity.toFixed(2));
            });
        });


        console.debug('PATCHES - Applied manual dark theme to all ApexCharts SVGs.');
    }

    fixApexCharts();

    const chartWatcher = new MutationObserver((changes) => {
        for (const mutation of changes) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                const hasNewChart = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === 1 && node.matches?.('svg.apexcharts-svg, .apexcharts-canvas, .apexcharts-inner')
                );
                if (hasNewChart) {
                    setTimeout(fixApexCharts, 150);
                    break;
                }
            }
        }
    });

    chartWatcher.observe(document.body, { childList: true, subtree: true });

    /* theme stuff */
    function rainbowMessage(message) {
        const mainelem = document.getElementById('rc_header_search').parentElement;
        if (mainelem) {
            const newMessage = document.createElement('div');
            newMessage.innerHTML = `<strong style="font-size: 1.25rem;" class="rainbow_text_animated">${message}</strong>`;
            newMessage.setAttribute('style', 'flex: 1; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 1rem; margin-right: 1rem;');
            mainelem.appendChild(newMessage);
        }
    }

    const today = new Date();
    rainbowAnnounce.forEach(announcement => {
        if (today.getDate() === announcement.day && today.getMonth() === (announcement.month - 1)) {
            rainbowMessage(announcement.message);
        }
    });

    /* cool logo animations */
    const logo = document.querySelector("#kt_app_sidebar .app-sidebar-logo");
    if (logo) {
        const day = new Date().getDay();
        let animation;
        switch (day) {
            case 0: animation = "ripple-wave 1s ease-in-out infinite"; break;
            case 1: animation = "wave 1s ease-in-out infinite"; break; // ripple monday
            case 2: animation = "twist 0.5s ease"; break; // twist tuesday
            case 3: animation = "wiggle 0.6s ease"; break; // wiggle wednesday
            case 4: animation = "thrust 0.5s ease"; break; // thrust thursday
            case 5: animation = "flip 2s ease-in-out infinite"; break; // flip friday
            case 6: animation = "ripple-wave 1s ease-in-out infinite"; break;
        }
        logo.style.setProperty("--logo-animation", animation);
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

            if (task === 'Pictures' || task === 'Testing') {
                const updatePuctureLocationsButton = document.createElement('a');
                updatePuctureLocationsButton.id = 'patches_bulkUpdateLocationsClock';
                updatePuctureLocationsButton.className = 'btn btn-color-gray-700 btn-active-color-white btn-outline btn-outline-primary me-2';
                updatePuctureLocationsButton.href = `javascript:updatePictureLocations();`;
                updatePuctureLocationsButton.innerHTML = '<i class="bi bi-arrow-repeat fs-2"></i><span class="mobilefix">Update Locations</span>';
                updatePuctureLocationsButton.title = 'Update Picture Locations';
                updatePuctureLocationsButton.style.display = 'none'; // this needs to update if actually true, doing in resolve LOL
                recordTime_parent.insertBefore(updatePuctureLocationsButton, recordTime_button);

                // enable logout bust because I still hate it
                bustUserTracker();
            }
		}
	}
}

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_BASE = 500;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function fetchJsonWithTimeout(url, options = {}, { timeoutMs = TIMEOUT_MS, retries = MAX_RETRIES } = {}) {
    let attempt = 0;
    let lastErr = null;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);

            if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
                lastErr = new Error(`HTTP ${res.status}`);
            } else if (!res.ok) {
                const text = await res.text().catch(() => '');
                return {
                    ok: false, timedOut: false, status: res.status, data: null,
                    error: new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
                };
            } else {
                try {
                    const data = await res.json();
                    return { ok: true, timedOut: false, status: res.status, data, error: null };
                } catch (e) {
                    return { ok: false, timedOut: false, status: res.status, data: null, error: new Error(`Invalid JSON from ${url}: ${e.message}`) };
                }
            }
        } catch (e) {
            clearTimeout(timer);
            lastErr = (e.name === 'AbortError')
                ? Object.assign(new Error(`Request timed out after ${timeoutMs} ms`), { timedOut: true })
                : e;
        }

        if (attempt < retries) {
            const backoff = Math.round(RETRY_BACKOFF_BASE * Math.pow(2, attempt) + Math.random() * 250);
            await sleep(backoff);
            attempt++;
        } else {
            const timedOut = !!lastErr?.timedOut;
            return { ok: false, timedOut, status: null, data: null, error: lastErr || new Error('Unknown fetch error') };
        }
    }
    return { ok: false, timedOut: false, status: null, data: null, error: new Error('Unexpected fetch loop exit') };
}

function fireSwal(title, message, icon = 'warning', refresh = false) {
    const isArray = Array.isArray(message);
    const htmlMessage = isArray ? message.join('<br>') : message;

    const validIcons = ['success', 'error', 'warning', 'info', 'question'];
    if (!validIcons.includes(icon)) {
        console.warn(`Invalid icon "${icon}" passed to fireSwal. Defaulting to "warning".`);
        icon = 'warning';
    }

    Swal.fire({
        title: title,
        html: htmlMessage,
        icon: icon,
        showCancelButton: refresh,
        confirmButtonText: (refresh ? 'Refresh' : 'Gotcha'),
        cancelButtonText: "Close",
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false,
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: true
    }).then((result) => {
        console.debug('PATCHES - Swal response:', result);
        if (result.isConfirmed && refresh) {
            location.reload();
        }
    });
}

async function confirmSwal(title, message, icon = 'warning', confirmText = 'Yes', cancelText = 'Cancel') {
    const isArray = Array.isArray(message);
    const htmlMessage = isArray ? message.join('<br>') : message;

    const validIcons = ['success', 'error', 'warning', 'info', 'question'];
    if (!validIcons.includes(icon)) {
        console.warn(`Invalid icon "${icon}" passed to confirmSwal. Defaulting to "warning".`);
        icon = 'warning';
    }

    const result = await Swal.fire({
        title: title,
        html: htmlMessage,
        icon: icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false,
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: true
    });

    console.debug('PATCHES - ConfirmSwal response:', result);
    return result.isConfirmed === true;
}

function clockTaskVisualRefresh(ping = false) {
    const href = '/user/me';
    const checkButtonSelector = 'a[href^="javascript:clockInOut"]';

    async function checkAndUpdate() {
        if (ping) {
            function sendPing() {
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/ajax/actions/ping",
                    data: { task: "ping" },
                    headers: {
                        "X-CSRF-TOKEN": $('meta[name="X-CSRF-TOKEN"]').attr("content"),
                    },
                    success: function(response) {
                        console.debug('Ping request sent successfully:', response);
                    },
                    error: function(xhr, status, error) {
                        console.warn('Ping request failed:', status, error);
                    }
                });
            }
            sendPing(); // user activity busting
        }

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
    const id = setInterval(checkAndUpdate, 60000);
    checkAndUpdate.__isMine = true;
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
    });

    const observer = new MutationObserver(async (mutationsList) => {
        const mutation = mutationsList[0];
        if (mutation) {
            if (lastEvent) {
                let { target } = lastEvent;

                if (!(target instanceof Element)) return;

                if (target && target.matches('i.fas')) { target = target.parentElement; }

                if (target && (target.id === "rc_ajax_modal" && target.querySelector('.fw-bold.fs-6.text-gray-400')?.textContent.trim() === 'GTIN' && target.querySelector('table').classList.contains('table-row-bordered')) 
                        || (target.tagName === 'A' && target.hasAttribute('data-url') && target.getAttribute('data-url').includes('ajax/modals/productitems/') && target.classList.contains('ajax-modal'))) {
                    modalProduct();
                } else if (target.getAttribute('href') === "javascript:clockInOut('in');") {
                    modalClockIn();
                } else {
                    console.warn('PATCHES - AJAX modal not defined modal:', target);
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

    async function modalProduct() {
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
    } else {
        toolbar.classList.add('card');
        toolbar.classList.remove('app-toolbar');
    }
}

// epic search of the datalist
// to be used when assembling auto reports
async function searchDataList(type, value) {
    type = String(type || '').toLowerCase();

    let results = [];
    let url = '/ajax/datalist/';
    let page = 1;

    switch (type) {
        case 'purchaseorders':
        case 'po':
            url += 'PurchaseOrders';
            break;
        case 'usersprofiles':
        case 'users':
        case 'username':
            url += 'UsersProfiles';
            break;
        case 'departments':
        case 'department':
            url += 'departments';
            break;
        case 'clockintasks':
        case 'tasks':
            url += 'ClockInTasks';
            break;
        case 'conditions':
        case 'condition':
            url += 'Conditions';
            break;
        case 'categories':
        case 'category':
            url += 'categories';
            break;
        case 'brands':
        case 'brand':
            url += 'brands';
            break;
        default:
            console.error('PATCHES - Invalid datalist type:', type);
            return results;
    }

    url += `?_type=query`;
    if (value !== '') {
        url += `&term=${encodeURIComponent(value)}&q=${encodeURIComponent(value)}`;
    }

    let hasMore = true;

    do {
        try {
            const response = await fetch(`${url}&page=${page}`);
            const data = await response.json();

            if (Array.isArray(data.results)) {
                results.push(...data.results);
            }

            hasMore = data.pagination && data.pagination.more === true;
            page++;
        } catch (error) {
            console.error('PATCHES - Failed to fetch datalist:', error);
            hasMore = false;
        }

    } while (hasMore);

    return results;
}

async function fetchPurchaseOrdersList(onlyIds = false) {
    const response = await fetch('/datatables/purchaseorders?start=0&length=9999');
    const json = await response.json();

    function parse(json) {
        return json.data.map(row => {
            const id = row[0];
            const linkHtml = row[1];

            const temp = document.createElement("div");
            temp.innerHTML = linkHtml;
            const text = temp.textContent.trim();

            return { id, text };
        });
    }

    const parsed = parse(json);

    if (onlyIds === true) { return parsed.map(item => parseInt(item.id, 10)); }

    return parsed;
}

function bustUserTracker() {
    function simulateUserActivity() {
        console.debug('PATCHES - Simulated events for userTracker');
        const events = ["mousemove", "keydown", "scroll", "click"];
        events.forEach(eventType => {
            const event = new Event(eventType, {
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(event);
        });
    }

    const workerCode = `
        const channel = new BroadcastChannel('userSim');
        let interval = 30000;

        function start() {
            setInterval(() => {
                channel.postMessage('simulate');
            }, interval);
        }

        start();
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    const worker = new Worker(workerUrl);
    const channel = new BroadcastChannel('userSim');

    let aggressiveIntervalId = null;

    channel.onmessage = (e) => {
        if (e.data === 'simulate' && document.visibilityState === 'visible') {
            simulateUserActivity();
        }
    };

    document.addEventListener('visibilitychange', () => {
        console.debug('Document visibility changed:', document.visibilityState);
        if (document.visibilityState === 'hidden') {
            console.debug('Entering aggressive simulation mode');

            if (!aggressiveIntervalId) {
                aggressiveIntervalId = setInterval(() => {
                    simulateUserActivity();
                }, 10000); // when tab not visible, change to 10s to "bypass" browser inactive tab behavior
            }
        } else {
            console.debug('Resuming normal simulation mode');
            if (aggressiveIntervalId) {
                clearInterval(aggressiveIntervalId);
                aggressiveIntervalId = null;
            }
        }
    });

    // still do it on first run
    simulateUserActivity();
}

/* hover to enlarge image */
function peekAtImages() {
    const MIN_W = 249;
    const MIN_H = 249;
    const HOVER_DELAY_MS = 1000;

    const preview = document.createElement('div');
    preview.className = 'image-peek';
    Object.assign(preview.style, {
        position: 'fixed',
        zIndex: '99999',
        display: 'none',
        padding: '6px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        pointerEvents: 'auto'
    });

    const previewImg = document.createElement('img');
    Object.assign(previewImg.style, {
        display: 'block',
        maxWidth: '512px',
        maxHeight: '512px',
        objectFit: 'contain'
    });
    preview.appendChild(previewImg);
    document.body.appendChild(preview);

    let activeImg = null;
    let hoverTimer = null;
    let lastMouse = { x: 0, y: 0 };

    function positionPreview(x, y) {
        const margin = 16;
        const { innerWidth: vw, innerHeight: vh } = window;
        preview.style.left = Math.min(x + margin, vw - preview.offsetWidth - 8) + 'px';
        preview.style.top = Math.min(y + margin, vh - preview.offsetHeight - 8) + 'px';
    }

    function showPreviewFor(img) {
        if (!img) return;
        previewImg.src = img.currentSrc || img.src || '';
        preview.style.display = 'block';
        if (previewImg.complete) {
            positionPreview(lastMouse.x, lastMouse.y);
        } else {
            previewImg.onload = () => positionPreview(lastMouse.x, lastMouse.y);
        }
    }

    function hidePreview() {
        preview.style.display = 'none';
        previewImg.removeAttribute('src');
        activeImg = null;
    }

    function clearHoverTimer() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    }

    preview.addEventListener('mouseenter', () => {
        clearHoverTimer();
    });
    preview.addEventListener('mousemove', (e) => {
        lastMouse = { x: e.clientX, y: e.clientY };
        positionPreview(lastMouse.x, lastMouse.y);
    });
    preview.addEventListener('mouseleave', (e) => {
        if (activeImg && e.relatedTarget === activeImg) return;
        hidePreview();
    });

    const tracked = new Set();
    const cleanupMap = new WeakMap();

    function attachToImage(img) {
        if (tracked.has(img)) return;
        tracked.add(img);

        let wantsPeek = false;
        const eligible = () => {
            const rect = img.getBoundingClientRect();
            return rect.width < MIN_W || rect.height < MIN_H;
        };

        const onEnter = (e) => {
            lastMouse = { x: e.clientX, y: e.clientY };
            wantsPeek = eligible();
            if (!wantsPeek) return;
            clearHoverTimer();
            hoverTimer = setTimeout(() => {
                activeImg = img;
                showPreviewFor(img);
            }, HOVER_DELAY_MS);
        };

        const onMove = (e) => {
            lastMouse = { x: e.clientX, y: e.clientY };
            if (preview.style.display === 'block') {
                positionPreview(lastMouse.x, lastMouse.y);
            }
        };

        const onLeave = (e) => {
            const toPreview = e.relatedTarget && (e.relatedTarget === preview || preview.contains(e.relatedTarget));
            clearHoverTimer();
            if (!toPreview) hidePreview();
        };

        const ro = new ResizeObserver(() => {
            if (activeImg === img && !eligible()) hidePreview();
        });
        ro.observe(img);

        img.addEventListener('mouseenter', onEnter);
        img.addEventListener('mousemove', onMove);
        img.addEventListener('mouseleave', onLeave);

        cleanupMap.set(img, () => {
            try { ro.disconnect(); } catch {}
            img.removeEventListener('mouseenter', onEnter);
            img.removeEventListener('mousemove', onMove);
            img.removeEventListener('mouseleave', onLeave);
            if (activeImg === img) hidePreview();
            tracked.delete(img);
        });
    }

    function detachFromImage(img) {
        const fn = cleanupMap.get(img);
        if (fn) fn();
    }

    function scanAndAttach(root) {
        if (!root) return;
        if (root.matches && (root.matches('img:not([patches="noEnlarge"])') || root.matches('image:not([patches="noEnlarge"])'))) {
            attachToImage(root);
        }
        if (root.querySelectorAll) {
            root.querySelectorAll('img:not([patches="noEnlarge"]), image:not([patches="noEnlarge"])').forEach(attachToImage);
        }
    }

    function scanAndDetach(root) {
        if (!root) return;
        if (tracked.has(root)) detachFromImage(root);
        if (root.querySelectorAll) {
            root.querySelectorAll('img, image').forEach((img) => {
                if (tracked.has(img)) detachFromImage(img);
            });
        }
    }
    // only do images in main app page, not top bar or sidebar :D
    document.getElementById('kt_app_main')
        .querySelectorAll('img:not([patches="noEnlarge"]), image:not([patches="noEnlarge"])')
        .forEach(attachToImage);

    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes && m.addedNodes.forEach((node) => scanAndAttach(node));
            m.removedNodes && m.removedNodes.forEach((node) => scanAndDetach(node));
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    return function cleanup() {
        hidePreview();
        mo.disconnect();
        Array.from(tracked).forEach(detachFromImage);
        preview.remove();
    };
}

async function patchInit() {
    loadPatchSettings();
    injectGoods();
    injectExtraTheme();
    clockTaskVisualRefresh(false);
    modifiedClockInit();
    checkWeatherAndCreateEffects();
    adjustToolbar();
    peekAtImages();

    loadEdgeConfig('config').then(() => {
        console.debug('PATCHES - Edge Config Loaded.');
        setupFromConfig();
        
    }).catch(err => {
        console.error('PATCHES - Edge config failed:', err);
    });

    setTimeout(hijackAjaxModal, 500);
    console.log('PATCHES - Loading Complete');
}
window.onload = patchInit;