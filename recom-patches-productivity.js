async function getUserID() {
    try {
        const response = await fetch('/user/me');
        const html = await response.text();

        const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatch) {
            for (const script of scriptMatch) {
                const userIdMatch = script.match(/userID\s*=\s*(\d+);/);
                if (userIdMatch) {
                    console.log('PATCHES - Extracted userID:', userIdMatch[1]);
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
                        "purchase_orders.type",
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
                        "purchase_orders.type",
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
        } else {
            request = {
                report: {
                    type: "user_clock",
                    columns: [
                        "user_profile.user_id",
                        "user_profile.department_id",
                        "user_clocks.task_id",
                        "purchase_orders.id",
                        "purchase_orders.type",
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
                            value: "87"
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

async function injectUserReport() {
    const content = document.getElementById('kt_app_content');
    if (content) {
        Array.from(content.children).forEach(child => {
            if (child.id !== "patches-productivity-donotremove") {
                child.remove();
            }
        });
    }

    const userData = await getReport('self');
    console.debug('PATCHES - User Data', userData);

    if (userData && userData.length > 0) {
        const uniqueData = [];
        const seenKeys = new Set();

        userData.forEach(row => {
            const key = `${row.User}-${row.SKU}-${row.Event_Date}`;
            console.debug(`PATCHES - Key: ${key}`);
            if (!seenKeys.has(key)) {
                console.debug(`PATCHES - Detected Deduplicate Key: ${key}`);
                seenKeys.add(key);
                uniqueData.push(row);
            }
        });

        console.debug('PATCHES - User Data (After Deduplication)', uniqueData);
        
        const taskData = {};
        userData.forEach(row => {
            const task = row.Task;
            
            if (task === "BREAK" || task === "LUNCH") return;
            
            if (!taskData[task]) {
                taskData[task] = { totalUnits: 0, totalTime: 0 };
            }

            if (row.Event_Code === "Clock In") {
                taskData[task].totalTime += parseFloat(row.Total_Time) || 0;
            }

            taskData[task].totalUnits += parseFloat(row.Units) || 0;
        });

        const summaryWrapper = document.createElement('div');
        summaryWrapper.style.display = 'flex';
        summaryWrapper.style.flexWrap = 'wrap';
        summaryWrapper.style.gap = '20px';
        summaryWrapper.style.marginBottom = '30px';
        summaryWrapper.style.margin = '2rem 30px';

        Object.keys(taskData).forEach(task => {
            const { totalUnits, totalTime } = taskData[task];
            const timeSpentHours = (totalTime / 60).toFixed(2);
            const timePerUnit = totalUnits > 0 ? (totalTime / totalUnits).toFixed(2) : "0";

            const unitBox = `
                <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(65,40,50) !important; color: white !important; flex: 1; min-width: 300px;">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex flex-column flex-grow-1" style="margin-bottom: 1.5rem;">
                            <span class="text-white fw-bolder fs-3">Units Added In ${task}</span>
                        </div>
                        <div class="pt-5">
                            <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalUnits}</span>
                            <span class="text-white fw-bolder fs-6 lh-0">${timePerUnit} mins/unit</span>
                        </div>
                    </div>
                </div>
            `;

            const timeBox = `
                <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(50,60,85) !important; color: white !important; flex: 1; min-width: 300px;">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex flex-column flex-grow-1">
                            <span class="text-white fw-bolder fs-3">Time Spent In ${task}</span>
                        </div>
                        <div class="pt-5">
                            <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalTime} min</span>
                            <span class="text-white fw-bolder fs-6 lh-0">${timeSpentHours} hours</span>
                        </div>
                    </div>
                </div>
            `;

            summaryWrapper.innerHTML += unitBox + timeBox;
        });

        content.appendChild(summaryWrapper);

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
        Object.keys(userData[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            th.style.padding = '8px';
            th.style.minWidth = '200px';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        userData.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value !== null ? value : '';
                td.style.padding = '8px';
                td.style.minWidth = '200px';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableWrapper.appendChild(table);
        content.appendChild(tableWrapper);
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

    const teamData = await getReport('team');
    console.debug('PATCHES - Team Data (Before Deduplication)', teamData);

    if (teamData && teamData.length > 0) {
        const uniqueData = [];
        const seenKeys = new Set();

        teamData.forEach(row => {
            const key = `${row.User}-${row.SKU}-${row.Event_Date}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueData.push(row);
            }
        });

        console.debug('PATCHES - Team Data (After Deduplication)', uniqueData);

        const userDataMap = {};

        uniqueData.forEach(row => {
            const user = row.User;
            const task = row.Task;

            if (task === "BREAK" || task === "LUNCH") return;

            if (!userDataMap[user]) {
                userDataMap[user] = {};
            }
            if (!userDataMap[user][task]) {
                userDataMap[user][task] = { totalUnits: 0, totalTime: 0 };
            }

            if (row.Event_Code === "Clock In") {
                userDataMap[user][task].totalTime += parseFloat(row.Total_Time) || 0;
            }

            userDataMap[user][task].totalUnits += parseFloat(row.Units) || 0;
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
                const { totalUnits, totalTime } = userDataMap[user][task];
                const timeSpentHours = (totalTime / 60).toFixed(2);
                const timePerUnit = totalUnits > 0 ? (totalTime / totalUnits).toFixed(2) : "0";

                const unitBox = `
                    <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(65,40,50) !important; color: white !important; flex: 1; min-width: 300px;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex flex-column flex-grow-1" style="margin-bottom: 1.5rem;">
                                <span class="text-white fw-bolder fs-3">Units Added In ${task}</span>
                            </div>
                            <div class="pt-5">
                                <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalUnits}</span>
                                <span class="text-white fw-bolder fs-6 lh-0">${timePerUnit} mins/unit</span>
                            </div>
                        </div>
                    </div>
                `;

                const timeBox = `
                    <div class="card card-xl-stretch mb-xl-8" style="background-color: rgb(50,60,85) !important; color: white !important; flex: 1; min-width: 300px;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex flex-column flex-grow-1">
                                <span class="text-white fw-bolder fs-3">Time Spent In ${task}</span>
                            </div>
                            <div class="pt-5">
                                <span class="text-white fw-bolder fs-3x me-2 lh-0">${totalTime} min</span>
                                <span class="text-white fw-bolder fs-6 lh-0">${timeSpentHours} hours</span>
                            </div>
                        </div>
                    </div>
                `;

                userSummaryWrapper.innerHTML += unitBox + timeBox;
            });

            userContainer.appendChild(userSummaryWrapper);
            summaryWrapper.appendChild(userContainer);
        });

        content.appendChild(summaryWrapper);

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
        Object.keys(uniqueData[0]).forEach(key => {
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
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value !== null ? value : '';
                td.style.padding = '8px';
                td.style.minWidth = '200px';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableWrapper.appendChild(table);
        content.appendChild(tableWrapper);
    } else {
        content.innerHTML = '<p>No data available</p>';
    }
}

function injectDateSelect(funct, content) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "10px";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = '2rem 30px';
    wrapper.id = "patches-productivity-donotremove";

    const label = document.createElement('label');
    label.for = "patches-productivity-dateInput";
    label.textContent = 'Select Date:';
    label.classList.add('fw-bolder', 'd-flex', 'align-items-center', 'text-dark');

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "patches-productivity-dateInput";
    dateInput.classList.add('form-control', 'rounded-1');

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.style.width = 'unset';
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

    wrapper.innerHTML = `<span style="flex: 1;"></span>`;

    wrapper.appendChild(label);
    wrapper.appendChild(dateInput);
    wrapper.appendChild(submitButton);

    content.prepend(wrapper);
}

window.onload = async () => {
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


    if (content && window.location.href.includes('/productivity/employee')) {
        injectUserReport();
        injectDateSelect('injectUserReport', content);
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
        
    } else if (content && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board')) {
        injectTeamReport();
        injectDateSelect('injectTeamReport', content);
        document.title = document.title.replace('Productivity', 'Team Productivity');

        if (heading) {
            heading.textContent = 'Team Productivity';
        }
    }
    
};