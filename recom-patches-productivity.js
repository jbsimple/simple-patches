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
        injectDateSelect('injectRecentPicturesCheck', content);
        recentPictureCheckInit();

        document.title = document.title.replace('Productivity', 'Recent Pictures');

        if (heading) {
            heading.textContent = 'Recent Pictures';
        }
    }
    
})();