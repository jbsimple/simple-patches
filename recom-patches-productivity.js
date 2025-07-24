async function getUserID() {
    try {
        const response = await fetch('/user/me');
        const html = await response.text();

        const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatch) {
            for (const script of scriptMatch) {
                const userIdMatch = script.match(/userID\s*=\s*(\d+);/);
                if (userIdMatch) {
                    console.debug('PATCHES - Extracted userID:', userIdMatch[1]);
                    return parseInt(userIdMatch[1], 10);
                }
            }
        }
        console.log('userID not found');
        return null;
    } catch (error) {
        console.error('Error fetching the page:', error);
        return null;
    }
}

async function getReport(type) {
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');

        const today = new Date();
        const today_mm = String(today.getMonth() + 1).padStart(2, '0');
        const today_dd = String(today.getDate()).padStart(2, '0');
        const today_yyyy = today.getFullYear();
        const todayFormatted = `${today_mm}/${today_dd}/${today_yyyy}`;

        let date = todayFormatted;

        const dateInput = document.getElementById('patches-productivity-dateInput');
        if (dateInput) {
            const rawValue = dateInput.value;
            if (rawValue) {
                const [yyyy, mm, dd] = rawValue.split('-');
                date = `${mm}/${dd}/${yyyy}`;
            }
        }
        
        let request = null;
        if (type === 'self') {
            const userId = await getUserID();
            request = {
                report: {
                    type: "user_clock",
                    columns: [
                        "user_profile.user_id",
                        "user_profile.department_id",
                        "user_clocks.task_id",
                        "purchase_orders.id",
                        "user_clock_activity.activity_id",
                        "user_clock_activity.activity_code",
                        "user_clock_activity.notes",
                        "user_clock_activity.units",
                        "user_clock_activity.created_at",
                        "user_clock_activity.time_spent",
                        "user_clocks.time_in",
                        "user_clocks.time_out",
                        "user_clocks.user_id",
                        "user_clocks.clock_date",
                        "products.sid",
                        "products.name",
                        "product_items.sku",
                        "product_items.condition_id",
                        "products.category_id"
                    ],
                    filters: [{
                            column: "user_profile.user_id",
                            opr: "{0} = '{1}'",
                            value: `${userId}`
                        },
                        {
                            column: "user_clocks.clock_date",
                            opr: "between",
                            value: `${date} - ${date}`
                        }
                    ]
                },
                csrf_recom: csrfToken
            };
        } else if (type === 'team') {
            request = {
                report: {
                    type: "user_clock",
                    columns: [
                        "user_profile.user_id",
                        "user_profile.department_id",
                        "user_clocks.task_id",
                        "purchase_orders.id",
                        "user_clock_activity.activity_id",
                        "user_clock_activity.activity_code",
                        "user_clock_activity.notes",
                        "user_clock_activity.units",
                        "user_clock_activity.created_at",
                        "user_clock_activity.time_spent",
                        "user_clocks.time_in",
                        "user_clocks.time_out",
                        "user_clocks.user_id",
                        "user_clocks.clock_date",
                        "products.sid",
                        "products.name",
                        "product_items.sku",
                        "product_items.condition_id",
                        "products.category_id"
                    ],
                    filters: [{
                            column: "user_profile.department_id",
                            opr: "{0} IN {1}",
                            value: ["23"]
                        },
                        {
                            column: "user_clocks.clock_date",
                            opr: "between",
                            value: `${date} - ${date}`
                        }
                    ]
                },
                csrf_recom: csrfToken
            };
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                dataType: "json",
                url: "/reports/create",
                data: request,
            }).done(function(data) {
                if (data.success && data.results.results && Array.isArray(data.results.results)) {
                    resolve({
                        data: data.results.results,
                        download: `/renderfile/download?folder=reports&path=${data.results.filename}`,
                        filename: data.results.filename
                    });
                } else {
                    resolve(null);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Request failed: " + textStatus + ", " + errorThrown);
                reject(new Error("Request failed: " + textStatus + ", " + errorThrown));
            });
        });
    } else {
        console.error('Unable to get CSRF');
        return null;
    }
}

async function injectUserReport() {
    const content = document.getElementById('kt_app_content');
    if (content) {
        Array.from(content.children).forEach(child => {
            if (child.id !== "patches-productivity-donotremove") {
                child.remove();
            }
        });
    }

    const report = await getReport('self');
    const userData = report.data;

    const downloadButton = document.getElementById('patches-productivity-download');
    if (downloadButton) {
        downloadButton.href = report.download;
        downloadButton.download = report.filename;
        downloadButton.disabled = false;
    } else {
        console.error('Patches - No Download Button', downloadButton);
    }

    if (userData && userData.length > 0) {
        const uniqueData = [];
        const seenKeys = new Set();

        userData.forEach(row => {
            const key = `${row.User}-${row.Task}-${row.SKU}-${row.Event_Date}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueData.push(row);
            }
        });

        console.debug('PATCHES - uniqueData', uniqueData);

        const taskData = {};
        uniqueData.forEach(row => {
            const task = row.Task;
            const eventCode = row.Event_Code;
            const timeSpentInMinutes = parseFloat(row.Time_Spent_in_mintues) || 0;

            if (task === "BREAK" || task === "LUNCH" || eventCode === "Clock In") return;

            if (!taskData[task]) {
                taskData[task] = {};
            }
            if (!taskData[task][eventCode]) {
                taskData[task][eventCode] = { totalUnits: 0, totalTime: 0 };
            }

            taskData[task][eventCode].totalTime += timeSpentInMinutes;
            taskData[task][eventCode].totalUnits += parseFloat(row.Units) || 0;
        });

        const summaryWrapper = document.createElement('div');
        summaryWrapper.style.display = 'flex';
        summaryWrapper.style.flexWrap = 'wrap';
        summaryWrapper.style.gap = '20px';
        summaryWrapper.style.marginBottom = '30px';
        summaryWrapper.style.margin = '2rem 30px';

        Object.keys(taskData).forEach(task => {
            Object.keys(taskData[task]).forEach(eventCode => {
                const { totalUnits, totalTime } = taskData[task][eventCode];
                const timeSpentHours = (totalTime / 60).toFixed(2);
                const timePerUnit = totalUnits > 0 ? (totalTime / totalUnits).toFixed(2) : "0";

                let label = `"${eventCode}" while in ${task}`;
                if (eventCode === task) {
                    label = `${task}`;
                }

                const unitBox = `
                    <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(65,40,50) !important; color: white !important; flex: 1; min-width: 400px;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex flex-column flex-grow-1" style="margin-bottom: 1.5rem;">
                                <span class="text-white fw-bolder fs-3">Units Added | ${label}</span>
                            </div>
                            <div class="pt-5">
                                <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalUnits}</span>
                                <span class="text-white fw-bolder fs-6 lh-0">${timePerUnit} mins/unit</span>
                            </div>
                        </div>
                    </div>
                `;

                const timeBox = `
                    <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(50,60,85) !important; color: white !important; flex: 1; min-width: 400px;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex flex-column flex-grow-1">
                                <span class="text-white fw-bolder fs-3">Time Spent | ${label}</span>
                            </div>
                            <div class="pt-5">
                                <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalTime.toFixed(2)} min</span>
                                <span class="text-white fw-bolder fs-6 lh-0">${timeSpentHours} hours</span>
                            </div>
                        </div>
                    </div>
                `;

                summaryWrapper.innerHTML += unitBox + timeBox;
            });
        });

        content.appendChild(summaryWrapper);
        content.appendChild(await printTable(uniqueData));
    } else {
        content.innerHTML = '<p>No data available</p>';
    }
}

async function injectTeamReport() {
    const content = document.getElementById('kt_app_content');
    if (content) {
        Array.from(content.children).forEach(child => {
            if (child.id !== "patches-productivity-donotremove") {
                child.remove();
            }
        });
    }

    const report = await getReport('team');
    const teamData = report.data;

    const downloadButton = document.getElementById('patches-productivity-download');
    if (downloadButton) {
        downloadButton.href = report.download;
        downloadButton.download = report.filename;
        downloadButton.disabled = false;
    } else {
        console.error('Patches - No Download Button', downloadButton);
    }

    if (teamData && teamData.length > 0) {
        const uniqueData = [];
        const seenKeys = new Set();

        teamData.forEach(row => {
            const key = `${row.User}-${row.Task}-${row.SKU}-${row.Event_Date}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueData.push(row);
            }
        });

        console.debug('PATCHES - uniqueData', uniqueData);

        const userDataMap = {};

        uniqueData.forEach(row => {
            const user = row.User;
            const task = row.Task;
            const eventCode = row.Event_Code;

            const timeSpentInMinutes = parseFloat(row.Time_Spent_in_mintues) || 0;

            if (task === "BREAK" || task === "LUNCH" || eventCode === 'Clock In') return;

            if (!userDataMap[user]) {
                userDataMap[user] = {};
            }
            if (!userDataMap[user][task]) {
                userDataMap[user][task] = {};
            }
            if (!userDataMap[user][task][eventCode]) {
                userDataMap[user][task][eventCode] = { totalUnits: 0, totalTime: 0 };
            }
            userDataMap[user][task][eventCode].totalTime += timeSpentInMinutes;

            userDataMap[user][task][eventCode].totalUnits += parseFloat(row.Units) || 0;
        });

        const summaryWrapper = document.createElement('div');
        summaryWrapper.style.display = 'flex';
        summaryWrapper.style.flexDirection = 'column';
        summaryWrapper.style.gap = '40px';
        summaryWrapper.style.marginBottom = '30px';

        Object.keys(userDataMap).forEach(user => {
            const userContainer = document.createElement('div');
            userContainer.style.marginBottom = '30px';

            const userHeader = document.createElement('h2');
            userHeader.textContent = `Productivity Breakdown for ${user}`;
            userHeader.setAttribute('style', 'background-color: var(--bs-body-bg) !important;padding: 2rem 2rem !important;margin: 2rem 30px !important;margin-bottom: 0 !important;border: var(--bs-border-width) solid var(--bs-border-color) !important;border-radius: 0.625rem !important;');

            userContainer.appendChild(userHeader);

            const userSummaryWrapper = document.createElement('div');
            userSummaryWrapper.style.display = 'flex';
            userSummaryWrapper.style.flexWrap = 'wrap';
            userSummaryWrapper.style.gap = '20px';
            userSummaryWrapper.style.margin = '2rem 30px';

            Object.keys(userDataMap[user]).forEach(task => {
                Object.keys(userDataMap[user][task]).forEach(eventCode => {
                    const { totalUnits, totalTime } = userDataMap[user][task][eventCode];
                    const timeSpentHours = (totalTime / 60).toFixed(2);
                    const timePerUnit = totalUnits > 0 ? (totalTime / totalUnits).toFixed(2) : "0";

                    let label = `"${eventCode}" while in ${task}`;
                    if (eventCode === task) {
                        label = `${task}`;
                    }

                    const unitBox = `
                        <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(65,40,50) !important; color: white !important; flex: 1; min-width: 400px;">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex flex-column flex-grow-1" style="margin-bottom: 1.5rem;">
                                    <span class="text-white fw-bolder fs-3">Units Added | ${label}</span>
                                </div>
                                <div class="pt-5">
                                    <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalUnits}</span>
                                    <span class="text-white fw-bolder fs-6 lh-0">${timePerUnit} mins/unit</span>
                                </div>
                            </div>
                        </div>
                    `;

                    const timeBox = `
                        <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(50,60,85) !important; color: white !important; flex: 1; min-width: 400px;">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex flex-column flex-grow-1">
                                    <span class="text-white fw-bolder fs-3">Time Spent | ${label}</span>
                                </div>
                                <div class="pt-5">
                                    <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalTime.toFixed(2)} min</span>
                                    <span class="text-white fw-bolder fs-6 lh-0">${timeSpentHours} hours</span>
                                </div>
                            </div>
                        </div>
                    `;

                    userSummaryWrapper.innerHTML += unitBox + timeBox;
                });
            });

            userContainer.appendChild(userSummaryWrapper);
            summaryWrapper.appendChild(userContainer);
        });

        content.appendChild(summaryWrapper);
        content.appendChild(await printTable(uniqueData));
    } else {
        content.innerHTML = '<p>No data available</p>';
    }
}

async function printTable(uniqueData) {
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.maxWidth = '100%';
    tableWrapper.style.margin = '2rem 30px';

    const table = document.createElement('table');
    table.classList.add('table', 'table-striped');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const keys = Object.keys(uniqueData[0]);

    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.style.padding = '8px';
        th.style.minWidth = '200px';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    uniqueData.forEach(row => {
        const tr = document.createElement('tr');
        keys.forEach(key => {
            const td = document.createElement('td');
            const value = row[key];
            td.style.padding = '8px';
            td.style.minWidth = '200px';

            if ((key === 'SID') && value) {
                const a = document.createElement('a');
                a.href = `/products/${encodeURIComponent(value)}`;
                a.textContent = value;
                a.target = '_blank';
                td.appendChild(a);
            } else if ((key === 'SKU') && value) {
                const a = document.createElement('a');
                a.href = `/product/items/${encodeURIComponent(value)}`;
                a.textContent = value;
                a.target = '_blank';
                td.appendChild(a);
            } else {
                td.textContent = value !== null ? value : '';
            }

            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
}

async function injectUserLog(userID) {
    const baseUrl = `/ajax/actions/LogEntriesByUser/${userID}`;
    const today = new Date().toISOString().split("T")[0];
    let page = 1;
    let allLogs = [];
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(`${baseUrl}?page=${page}`);
            if (!response.ok) {
                console.error(`Fetch failed:`, response.status, response.statusText);
                break;
            }

            const data = await response.json();
            if (!data.success || !Array.isArray(data.data)) {
                console.error(`Invalid response format:`, data);
                break;
            }

            for (const log of data.data) {
                if (log.date.split(" ")[0] !== today) {
                    hasMore = false;
                    break;
                }
                allLogs.push(log);
            }

            if (!hasMore || !data.pagination.more) break;
            page++;

        } catch (error) {
            console.error("Error fetching logs:", error);
            break;
        }
    }

    console.debug(`Patches - All today's logs for user ${userID}:`, allLogs);
}

function injectDateSelect(funct, content) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "10px";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = '2rem 30px';
    wrapper.id = "patches-productivity-donotremove";

    const downloadButton = document.createElement('a');
    downloadButton.textContent = 'Download Data';
    downloadButton.id = 'patches-productivity-download';
    downloadButton.classList.add('btn', 'btn-large', 'btn-primary');
    downloadButton.disabled = true;

    const spacer = document.createElement('div');
    spacer.setAttribute('style', 'flex: 1;');

    const label = document.createElement('label');
    label.for = "patches-productivity-dateInput";
    label.textContent = 'Select Date:';
    label.classList.add('fw-bolder', 'd-flex', 'align-items-center', 'text-dark');

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "patches-productivity-dateInput";
    dateInput.classList.add('form-control', 'rounded-1');
    dateInput.setAttribute('style', 'color:var(--bs-text-gray-800); width: unset;');

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.classList.add('btn', 'btn-large', 'btn-primary');
    submitButton.addEventListener("click", () => {
        if (typeof window[funct] === "function") {
            window[funct](dateInput.value);
        } else {
            console.error(`Function ${funct} is not defined.`);
        }
    });
    wrapper.appendChild(downloadButton);
    wrapper.appendChild(spacer);
    wrapper.appendChild(label);
    wrapper.appendChild(dateInput);
    wrapper.appendChild(submitButton);

    content.prepend(wrapper);
}

/* recent picture check */
async function recentPictureCheckInit() {
    const content = document.getElementById('kt_app_content');
    if (content) {
        Array.from(content.children).forEach(child => {
            if (child.id !== "patches-productivity-donotremove") {
                child.remove();
            }
        });
    }
    
    /* heading css */
    const heading_css = 'padding: 0.5rem 30px; display: flex; justify-content: center; align-items: center;';
    
    /* spinner */
    const loading = document.createElement('div');
		loading.id = 'patches-loading-indicator';
		loading.setAttribute('style', heading_css);
		loading.innerHTML = `
		    <div class="d-flex align-items-center px-30 pb-5 gap-3">
		        <div class="spinner-border text-primary" role="status"></div>
		        <strong class="fs-4 text-gray-700">Loading recent pictures...</strong>
		    </div>`;
    kt_app_content.appendChild(loading);
    
    /* main wrap */
    const wrap = document.createElement('div');
    wrap.setAttribute('style', 'display: flex; padding: 30px; flex-wrap: wrap; gap: 1rem;');
    wrap.id = 'patches-productivity-recentPicsWrap';
    kt_app_content.appendChild(wrap);

    let report = await getReport('team');
    report = report.data;

    // Filter out entries with a null SKU
    const entries = report.filter(entry => entry.SKU !== null && typeof entry.SKU !== 'undefined');
    let counter = 0;

    for (const entry of entries) {
        const sku = entry.SKU;
        const url = `/product/items/${sku}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed for ${sku}`);

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const aTag = doc.querySelector('a[data-fslightbox="gallery"][data-type="image"]');
						const img = aTag?.querySelector('img');
						const imgSrc = img?.getAttribute('src') || aTag?.getAttribute('href') || null;
            
            const eyeballBtn = doc.querySelector('a.ajax-modal[data-url^="ajax/modals/productitems/"]');
            const eyeball = eyeballBtn ? eyeballBtn.outerHTML : '';

            printResult(wrap, entry, eyeball, imgSrc);
            counter++;
        } catch (err) {
            console.warn(`Failed to fetch image for SKU ${sku}:`, err);
        }
    }
    
    /* if it is here, loading is done */
    const loadingEl = document.getElementById('patches-loading-indicator');
		if (loadingEl) {
            /* heading */
                const today = new Date();
                const today_mm = String(today.getMonth() + 1).padStart(2, '0');
                const today_dd = String(today.getDate()).padStart(2, '0');
                const today_yyyy = today.getFullYear();
                const todayFormatted = `${today_mm}/${today_dd}/${today_yyyy}`;

                let date = todayFormatted;
                const dateInput = document.getElementById('patches-productivity-dateInput');
                if (dateInput) {
                    const rawValue = dateInput.value;
                    if (rawValue) {
                        const [yyyy, mm, dd] = rawValue.split('-');
                        date = `${mm}/${dd}/${yyyy}`;
                    }
                }
                const heading = document.createElement('h2');
                heading.textContent = `The ${counter} SKUS Created on ${date}:`;
                heading.setAttribute('style', heading_css);

				loadingEl.replaceWith(heading);
		}
    
    if (wrap.innerHTML === '') {
    		wrap.innerHTML += `<div class="card p-5">
                <div class="card-body d-flex flex-center flex-column pt-12 p-9">
                    <div type="button" class="btn btn-clear d-flex flex-column flex-center" data-index="0" data-id="0" data-catalog="0">
                        <img src="assets/media/illustrations/dozzy-1/4.png" alt="" class="mw-100 mh-300px mb-7">
                        <h1 class="fs-1 text-center pt-5 pb-10 text-muted">No Listings?</h1>
                    </div>
                </div>
            </div>`;
    }
    
    function printResult(wrap, entry, eyeball, imgSrc) {
        console.debug('PATCHES - Result', {
            "entry": entry,
            "eyeball": eyeball,
            "imgSrc": imgSrc
        });

        const box = document.createElement('div');
        box.classList = 'card';

        let color = '';
        if (
            entry.Condition.includes('6-Defective') ||
            entry.Condition.includes('8-Incomplete') ||
            entry.Condition.includes('18-Used Phones - Imaging')
        ) {
            color = 'background-color:color-mix(in srgb, red 15%, transparent 85%);';
        }

        const filename = imgSrc ? imgSrc.split('/').pop().split('?')[0] : 'no-image.png';
        const isPlaceholder = filename.toLowerCase() === 'no-image.png';

        const stats = `
            <div class="mb-5 text-center"></div>
            <div class="d-flex flex-center text-center flex-wrap" style="transform: rotate(0);">
                <div class="border border-gray-300 border-dashed rounded min-w-80px py-3 px-4 mx-2 mb-3">
                    <span class="fs-6 fw-bolder text-gray-700">SID</span>
                    <a target="_blank" href="/products/${entry.SID}" class="fw-bold text-gray-400">${entry.SID}</a>
                </div>
                <div class="border border-gray-300 border-dashed rounded min-w-80px py-3 px-4 mx-2 mb-3">
                    <span class="fs-6 fw-bolder text-gray-700">Filename</span>
                    <span class="fw-bold text-gray-400" data-filename>${isPlaceholder ? 'N/A' : filename}</span>
                </div>
                <div class="border border-gray-300 border-dashed rounded min-w-80px py-3 px-4 mx-2 mb-3">
                    <span class="fs-6 fw-bolder text-gray-700">Resolution</span>
                    <span class="fw-bold text-gray-400" data-resolution>${isPlaceholder ? 'N/A' : 'Loading...'}</span>
                </div>
            </div>
        `;

        box.setAttribute('style', `width:calc(33% - 0.5rem);${color}`);
        box.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">
                    <a target="_blank" class="text-success" href="/product/items/${entry.SKU}">${entry.SKU}</a>
                </h3>
                <div class="card-toolbar">${eyeball}</div>
            </div>
            <div class="card-body p-0">
                <div class="text-center px-4 my-5">
                    <img class="mw-100 mh-250px card-rounded-bottom" src="${imgSrc || ''}"/>
                </div>
                <div class="card-p">
                    <div class="fw-bold text-gray-800 text-center mb-6 fs-3">${entry.Product_Name}</div>
                    ${stats}
                </div>
            </div>
        `;

        wrap.appendChild(box);

        if (!isPlaceholder && imgSrc) {
            const tempImg = new Image();
            tempImg.src = imgSrc;
            tempImg.onload = () => {
                const width = tempImg.naturalWidth;
                const height = tempImg.naturalHeight;
                const resolutionEl = box.querySelector('[data-resolution]');
                if (resolutionEl) resolutionEl.textContent = `${width}x${height}`;
            };
        }
    }
}

(async () => {
    console.debug('PATCHES - Start');
    const params = new URLSearchParams(window.location.search);
    const content = document.getElementById('kt_app_content');
    const toolbar = document.getElementById('kt_app_toolbar');
    let heading = null;
    let breadcrumb = null;
    if (toolbar) {
        heading = toolbar.querySelector('.page-heading');
        breadcrumb = toolbar.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `<li class="breadcrumb-item text-muted">
                <a href="/" class="text-muted text-hover-primary">Dashboard</a>
            </li>
            <li class="breadcrumb-item">
                <span class="bullet bg-gray-400 w-5px h-2px"></span>
            </li>
            <li class="breadcrumb-item text-muted">
                <a href="/productivity" class="text-muted text-hover-primary">Productivity</a>
            </li>`;
        }
    }


    if (content && window.location.href.includes('/productivity/employee') && !params.has('recentpics')) {
        injectDateSelect('injectUserReport', content);
        injectUserReport();

        document.title = document.title.replace('Employee Productivity', 'My Productivity');
        
        if (heading) {
            heading.textContent = 'My Productivity';
        }

        if (breadcrumb) {
            breadcrumb.innerHTML += `<!-- ADDITIONAL -->
            <li class="breadcrumb-item">
                <span class="bullet bg-gray-400 w-5px h-2px"></span>
            </li>
            <li class="breadcrumb-item text-muted">
                <a href="/productivity/employee/0" class="text-muted text-hover-primary">My Productivity</a>
            </li>`;
        }
        
    } else if (content && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && !params.has('recentpics')) {
        injectDateSelect('injectTeamReport', content);
        injectTeamReport();

        document.title = document.title.replace('Productivity', 'Team Productivity');

        if (heading) {
            heading.textContent = 'Team Productivity';
        }
    } else if (content && typeof recentPictureCheckInit === 'function' && window.location.href.includes('/productivity') && params.has('recentpics')) {
        injectDateSelect('recentPictureCheckInit', content);
        recentPictureCheckInit();

        document.title = document.title.replace('Productivity', 'Recent Pictures');

        if (heading) {
            heading.textContent = 'Recent Pictures';
        }
    }
    
})();