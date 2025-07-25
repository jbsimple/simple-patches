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

async function getReport(type, overview = false) {
    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');
        
        const today = new Date();
        const today_mm = String(today.getMonth() + 1).padStart(2, '0');
        const today_dd = String(today.getDate()).padStart(2, '0');
        const today_yyyy = today.getFullYear();
        const todayFormatted = `${today_mm}/${today_dd}/${today_yyyy}`;

        let start = null;
        let end = null;

        if (overview) {
            const past = new Date(today);
            past.setDate(past.getDate() - 13);

            const past_mm = String(past.getMonth() + 1).padStart(2, '0');
            const past_dd = String(past.getDate()).padStart(2, '0');
            const past_yyyy = past.getFullYear();
            start = `${past_mm}/${past_dd}/${past_yyyy}`;
            end = todayFormatted;
        } else {
            let date = todayFormatted;

            const dateInput = document.getElementById('patches-productivity-dateInput');
            if (dateInput) {
                const rawValue = dateInput.value;
                if (rawValue) {
                    const [yyyy, mm, dd] = rawValue.split('-');
                    date = `${mm}/${dd}/${yyyy}`;
                }
            }

            start = date;
            end = date;
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
                            value: `${start} - ${end}`
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
                            value: `${start} - ${end}`
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

function parseData(report) {
    const userGroups = {};
    const seenKeys = new Set();

    report.forEach(row => {
        const key = `${row.User}-${row.Task}-${row.SKU}-${row.Event_Date}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            if (!userGroups[row.User]) {
                userGroups[row.User] = [];
            }
            userGroups[row.User].push(row);
        }
    });

    const sortedData = Object.values(userGroups).flatMap(group =>
        group.sort((a, b) => new Date(a.Event_Date) - new Date(b.Event_Date))
    );

    return sortedData;
}

async function printTable(uniqueData) {
			const columnWidths = {
		    'User': '150px',
		    'Department': '150px',
		    'Task': '150px',
		    'Event_ID': '100px',
		    'Event_Code': '150px',
		    'Event_Date': '175px',
		    'Time_In': '175px',
		    'Time_Out': '175px',
		    'Clock_Date': '175px',
		    'Notes': '300px',
		    'SKU': '150px',
		    'SID': '150px',
		    'Product_Name': '300px',
		    'Condition': '150px',
		    'Category': '150px',
		    'Total_Time': '100px',
		    'Units': '100px',
		    'PO_Number': '100px',
		};

    const outerContainer = document.createElement('div');
    outerContainer.style.margin = '2rem 30px';

    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.display = 'flex';
    buttonWrapper.style.justifyContent = 'center';
    buttonWrapper.style.marginBottom = '1rem';

    const toggleButton = document.createElement('button');
    toggleButton.classList.add('btn', 'btn-light', 'btn-sm');
    toggleButton.textContent = 'Show Table';
    toggleButton.style.cursor = 'pointer';
    buttonWrapper.appendChild(toggleButton);

    const tableContainer = document.createElement('div');
    tableContainer.style.overflowX = 'auto';
    tableContainer.style.maxWidth = '100%';
    tableContainer.style.display = 'none';

    toggleButton.addEventListener('click', () => {
        const isVisible = tableContainer.style.display === 'block';
        tableContainer.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? 'Show Table' : 'Hide Table';
    });
    
    const resetButton = document.createElement('button');
		resetButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'ms-2');
		resetButton.innerHTML = `<span><i class="la la-close"></i><span>Reset</span></span>`;
		resetButton.style.cursor = 'pointer';
		resetButton.style.marginLeft = '1rem';
		
		resetButton.addEventListener('click', () => {
		    Object.values(filters).forEach(f => {
		        if (f instanceof HTMLElement) {
		            f.value = '';
		        } else {
		            Object.values(f).forEach(input => input.value = '');
		        }
		    });
		    renderTable(uniqueData);
		});
		tableContainer.appendChild(resetButton);

    const table = document.createElement('table');
    table.classList.add('table', 'table-striped');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const keys = Object.keys(uniqueData[0]);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.style.padding = '8px';
        const width = columnWidths[key] || '200px';
        th.style.minWidth = width;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const filterRow = document.createElement('tr');
    const filters = {};

    const getUniqueValues = (key) => [...new Set(uniqueData.map(r => r[key]).filter(v => v != null && v !== ''))];

    keys.forEach(key => {
        const th = document.createElement('th');
        let input;

        const asDropdown = ['User', 'Department', 'Task', 'PO_Number', 'Event_Code', 'Condition', 'Category'];
        const asText = ['Notes', 'SID', 'Product_Name', 'SKU'];
        const asInt = ['Event_ID', 'Units'];
        const asFloat = ['Time_Spent_in_mintues', 'Total_Time'];
        const asDate = ['Event_Date', 'Time_In', 'Time_Out', 'Clock_Date'];

        if (asDropdown.includes(key)) {
            input = document.createElement('select');
            input.innerHTML = `<option value="">All</option>`;
            input.className = 'form-control rounded-1';
            const width = columnWidths[key] || '200px';
            input.style.width = width;
            getUniqueValues(key).forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v;
                input.appendChild(opt);
            });
        } else if (key === 'Units' || asFloat.includes(key)) {
        		const width = columnWidths[key] || '200px';
				    const min = document.createElement('input');
				    min.type = 'number';
				    min.placeholder = 'Min';
				    min.style.width = width;
				    min.className = 'form-control rounded-1';
				    const max = document.createElement('input');
				    max.type = 'number';
				    max.placeholder = 'Max';
				    max.style.width = width;
				    max.className = 'form-control rounded-1';
				    th.appendChild(min);
				    th.appendChild(max);
				    filters[key] = { min, max };
				    filterRow.appendChild(th);
				    return;
				} else if (key === 'Event_ID') {
						const width = columnWidths[key] || '200px';
				    const input = document.createElement('input');
				    input.type = 'number';
				    input.placeholder = 'Enter ID';
				    input.style.width = width;
				    input.className = 'form-control rounded-1';
				    filters[key] = input;
				    th.appendChild(input);
				    filterRow.appendChild(th);
				    return;
				} else if (asDate.includes(key)) {
						const width = columnWidths[key] || '200px';
            const from = document.createElement('input');
            from.type = 'datetime-local';
            from.placeholder = 'From';
            from.style.width = width;
            from.className = 'form-control rounded-1';
            const to = document.createElement('input');
            to.type = 'datetime-local';
            to.placeholder = 'To';
            to.style.width = width;
            to.className = 'form-control rounded-1';
            th.appendChild(from);
            th.appendChild(to);
            filters[key] = { from, to };
            filterRow.appendChild(th);
            return;
        } else {
        		const width = columnWidths[key] || '200px';
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search...';
            input.className = 'form-control rounded-1';
            input.style.width = width;
        }

        if (input) {
            input.style.width = '100%';
            filters[key] = input;
            th.appendChild(input);
        }

        filterRow.appendChild(th);
    });

    thead.appendChild(filterRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            keys.forEach(key => {
                const td = document.createElement('td');
                const value = row[key];
                td.style.padding = '8px';
                const width = columnWidths[key] || '200px';
                td.style.minWidth = width;

                if (key === 'SID' && value) {
                    const a = document.createElement('a');
                    a.href = `/products/${encodeURIComponent(value)}`;
                    a.textContent = value;
                    a.target = '_blank';
                    td.appendChild(a);
                } else if (key === 'SKU' && value) {
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
    }

    function filterData() {
        let filtered = uniqueData.filter(row => {
            return keys.every(key => {
                const val = row[key];
                if (!(key in filters)) return true;

                const f = filters[key];

                if (f.min && f.max) {
                    const min = f.min.value ? parseFloat(f.min.value) : -Infinity;
                    const max = f.max.value ? parseFloat(f.max.value) : Infinity;
                    return parseFloat(val) >= min && parseFloat(val) <= max;
                }

                if (f.from && f.to) {
                    const from = f.from.value ? new Date(f.from.value).getTime() : -Infinity;
                    const to = f.to.value ? new Date(f.to.value).getTime() : Infinity;
                    const vTime = val ? new Date(val).getTime() : null;
                    return vTime !== null && vTime >= from && vTime <= to;
                }

                const filterVal = f.value.toLowerCase();
                return !filterVal || (val && val.toString().toLowerCase().includes(filterVal));
            });
        });

        renderTable(filtered);
    }

    Object.values(filters).forEach(f => {
        if (f instanceof HTMLElement) {
            f.addEventListener('input', filterData);
        } else {
            Object.values(f).forEach(input => input.addEventListener('input', filterData));
        }
    });

    renderTable(uniqueData);
    tableContainer.appendChild(table);
    outerContainer.appendChild(buttonWrapper);
    outerContainer.appendChild(tableContainer);

    return outerContainer;
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
        const uniqueData = parseData(userData);
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
        if (typeof printTable === 'function') {
            content.appendChild(await printTable(uniqueData));
        }
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
        const uniqueData = parseData(teamData);
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
        if (typeof printTable === 'function') {
            content.appendChild(await printTable(uniqueData));
        }
    } else {
        content.innerHTML = '<p>No data available</p>';
    }
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
    const uniqueData = parseData(report);

    const entries = uniqueData.filter(entry => entry.SKU !== null && typeof entry.SKU !== 'undefined');
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

        const fbacheck = `<a class="btn btn-icon btn-info btn-sm my-sm-1 ms-1" data-bs-toggle="tooltip" aria-label="View in FBA Check" data-bs-original-title="View in FBA Check" data-kt-initialized="1" href="/receiving/queues/fba-check?column=0&amp;keyword=${entry.SKU}" target="_blank"><i class="fas fa-shipping-fast"></i></a>`;
        const pendinginv = `<a class="btn btn-icon btn-success btn-sm my-sm-1 ms-1" data-bs-toggle="tooltip" aria-label="View in Pending Inventory" data-bs-original-title="View in Pending Inventory" data-kt-initialized="1" href="/receiving/queues/inventory?column=0&amp;keyword=${entry.SKU}" target="_blank"><i class="fas fa-boxes"></i></a>`;
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
                    <span class="fs-6 fw-bolder text-gray-700">SID</span><br>
                    <a target="_blank" href="/products/${entry.SID}" class="fw-bold text-gray-400">${entry.SID}</a>
                </div>
                <div class="border border-gray-300 border-dashed rounded min-w-80px py-3 px-4 mx-2 mb-3">
                    <span class="fs-6 fw-bolder text-gray-700">Filename</span><br>
                    <span class="fw-bold text-gray-400" data-filename>${isPlaceholder ? 'N/A' : filename}</span>
                </div>
                <div class="border border-gray-300 border-dashed rounded min-w-80px py-3 px-4 mx-2 mb-3">
                    <span class="fs-6 fw-bolder text-gray-700">Resolution</span><br>
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
                <div class="card-toolbar">${fbacheck}${pendinginv}${eyeball}</div>
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

/* overview */
async function injectOverview() {
    const content = document.getElementById('kt_app_content');
    if (content) {
        Array.from(content.children).forEach(child => {
            if (child.id !== "patches-productivity-donotremove") {
                child.remove();
            }
        });
    }

    const report = await getReport('team', true);
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
        const uniqueData = parseData(teamData);
        console.debug('PATCHES - uniqueData', uniqueData);
        
        const dailyStats = {};
        uniqueData.forEach(row => {
            if (row.Event_Code === "Inventory Listing") {
                const day = row.Event_Date.split(' ')[0];
                const units = parseFloat(row.Units) || 0;
                const minutes = parseFloat(row.Time_Spent_in_mintues) || 0;
        
                if (!dailyStats[day]) {
                    dailyStats[day] = {
                        units: 0,
                        minutes: 0
                    };
                }
        
                dailyStats[day].units += units;
                dailyStats[day].minutes += minutes;
            }
        });
        
        for (const day in dailyStats) {
            dailyStats[day].minutes = parseFloat(dailyStats[day].minutes.toFixed(2));
        }
        
        console.debug('PATCHES - Daily Inventory Listing Stats', dailyStats);
				
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = drawChart;
            document.head.appendChild(script);
        } else {
            drawChart();
        }

        function drawChart() {
            const container = document.createElement('div');
						container.style.display = 'flex';
						container.style.justifyContent = 'center';
						container.style.padding = '0 30px';
						container.style.marginTop = '2rem';
						
						const card = document.createElement('div');
						card.classList = 'card';
						card.style.width = '100%';
						card.style.boxSizing = 'border-box';
						card.style.padding = '2rem';
						
						const canvas = document.createElement('canvas');
						canvas.id = 'dailyStatsChart';
						canvas.style.width = 'calc(100% - 2rem)';
						canvas.style.display = 'block';
						canvas.style.margin = '0 auto';
						
						card.appendChild(canvas);
						container.appendChild(card);
						content.appendChild(container);

            const ctx = canvas.getContext('2d');

            const sortedDays = Object.keys(dailyStats).sort();
            const unitsData = sortedDays.map(day => dailyStats[day].units);
            const minutesData = sortedDays.map(day => dailyStats[day].minutes);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedDays,
                    datasets: [
                        {
                            label: 'Units',
                            data: unitsData,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.3
                        },
                        {
                            label: 'Time Spent (Minutes)',
                            data: minutesData,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Inventory Listing: Units & Time per Day'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Units / Minutes'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    }
                }
            });
        }

        const filteredRows = uniqueData.filter(row =>
            row.Event_Code === "Inventory Listing" &&
            row.SKU && row.SID && row.Product_Name && row.Condition && row.Category
        );

        if (filteredRows.length > 0) {
            const tableContainer = document.createElement('div');
            tableContainer.style.padding = '2rem 30px';

            const table = document.createElement('table');
            table.classList.add('table', 'table-striped');
            table.style.width = '100%';
            table.style.marginTop = '2rem';
            table.style.borderCollapse = 'collapse';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Date</th>
                    <th>SKU</th>
                    <th>SID</th>
                    <th>Product Title</th>
                    <th>Condition</th>
                    <th>Category</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            filteredRows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.Event_Date.split(' ')[0]}</td>
                    <td>${row.SKU}</td>
                    <td>${row.SID}</td>
                    <td>${row.Product_Name}</td>
                    <td>${row.Condition}</td>
                    <td>${row.Category}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            const searchWrapper = document.createElement('div');
            searchWrapper.style.marginBottom = '1rem';
            searchWrapper.style.textAlign = 'right';

            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search SID, SKU, or Product Name...';
            searchInput.classList.add('form-control');
            searchInput.style.maxWidth = '300px';
            searchInput.style.display = 'inline-block';

            searchWrapper.appendChild(searchInput);
            tableContainer.appendChild(searchWrapper);
            tableContainer.appendChild(table);
            content.appendChild(tableContainer);

            // Filtering logic
            searchInput.addEventListener('input', () => {
                const keyword = searchInput.value.toLowerCase();
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const sid = cells[2]?.textContent.toLowerCase() || '';
                    const sku = cells[1]?.textContent.toLowerCase() || '';
                    const product = cells[3]?.textContent.toLowerCase() || '';
                    const match = sid.includes(keyword) || sku.includes(keyword) || product.includes(keyword);
                    row.style.display = match ? '' : 'none';
                });
            });
        }

    } else {
        content.innerHTML = '<p>No data available</p>';
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
        
    } else if (content && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && !params.has('recentpics') && !params.has('overview')) 
    {
        injectDateSelect('injectTeamReport', content);
        injectTeamReport();

        document.title = document.title.replace('Productivity', 'Team Productivity');

        if (heading) {
            heading.textContent = 'Team Productivity';
        }
    } else if (content && typeof recentPictureCheckInit === 'function' && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && params.has('recentpics') && !params.has('overview')) {
        injectDateSelect('recentPictureCheckInit', content);
        recentPictureCheckInit();

        document.title = document.title.replace('Productivity', 'Recent Pictures - Productivity');

        if (heading) {
            heading.textContent = 'Recent Pictures';
        }
    } else if (content && typeof injectOverview === 'function' && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && params.has('overview') && !params.has('recentpics')) {
        injectOverview();

        document.title = document.title.replace('Productivity', 'Last 14 Days - Productivity');

        if (heading) {
            heading.textContent = 'Last 14 Days';
        }
    }
    
})();