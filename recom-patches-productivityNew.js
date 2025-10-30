// page structure:
// graph
// breakdown

let department_name = null;
let department_id = null;
let user_name = null;
let user_id = null;

async function fetchUserDetails() {
    try {
        const response = await fetch('/user/me');
        if (!response.ok) throw new Error('Failed to fetch user page');
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const deptIcon = doc.querySelector('i.fas.fa-exclamation-circle[data-bs-content="Department"]');
        if (deptIcon && deptIcon.parentElement) {
            // this is because each department handles averages differently, needs unique data presented
            department_name = deptIcon.parentElement.textContent.trim();

            // this is just to get the user's department id for the report
            const departmentLookUp = await searchDataList('department', department_name);
            if (departmentLookUp && departmentLookUp[0] && departmentLookUp.length === 1) {
                department_id = departmentLookUp[0]['id'] ?? null;
            }
        }

        // this is to get the user's full name
        const userSpan = doc.querySelector('span.fs-3.text-gray-800.text-hover-primary.fw-bolder.mb-3');
        if (userSpan) {
            user_name = userSpan.textContent.trim();
        }

        // this is to get the user's id for the report
        const accountLabel = doc.querySelector('div.fw-bolder.mt-5');
        if (accountLabel && accountLabel.textContent.trim() === 'Account ID') {
            const nextElem = accountLabel.nextElementSibling;
            if (nextElem) {
                user_id = nextElem.textContent.replace(/^ID-/, '').trim();
            }
        }

        console.debug('PATCHES - Fetched user details:', {
            user_name,
            user_id,
            department_name,
            department_id
        });

        return { user_name, user_id, department_name, department_id };
    } catch (err) {
        console.error('PATCHES - Error fetching user details:', err);
        return {
            user_name: null,
            user_id: null,
            department_name: null,
            department_id: null,
            error: err.message
        };
    }
}

async function fetchProductivity(type, department = null, range = null) {
    let filters = [];
    if (department === null) {
        switch (type) {
            case 'user':
                if (user_id === null) {
                    fireSwal('Error', ['Invalid Productivity Fetch Request','The User ID was not set.'], 'error');
                    return null;
                } else {
                    filters.push({
                        column: "user_profile.user_id",
                        opr: "{0} = '{1}'",
                        value: `${user_id}`
                    });
                }
                break;
            case 'team':
                if (department_id === null) {
                    fireSwal('Error', ['Invalid Productivity Fetch Request','The Department ID was not set.'], 'error');
                    return null;
                } else {
                    filters.push({
                        column: "user_profile.department_id",
                        opr: "{0} IN {1}",
                        value: [department_id]
                    });
                }
                break;
            default:
                fireSwal('Error', ['Invalid Productivity Fetch Request','See Console for More Information'], 'error');
                return null;
        }
    } else {
        if (typeof department === 'string' && isNaN(Number(department))) {
            const departmentLookUp = await searchDataList('department', department);
            if (departmentLookUp && departmentLookUp[0] && departmentLookUp.length === 1) {
                department = departmentLookUp[0]['id'] ?? null;
            }
        }

        if (department === null) {
            fireSwal('Error', ['Invalid Productivity Fetch Request','Invalid Department.'], 'error');
        } else {
            filters.push({
                column: "user_profile.department_id",
                opr: "{0} IN {1}",
                value: [department]
            });
        }
    }

    if (range === null) {
        const today = new Date();
        const today_mm = String(today.getMonth() + 1).padStart(2, '0');
        const today_dd = String(today.getDate()).padStart(2, '0');
        const today_yyyy = today.getFullYear();
        const todayFormatted = `${today_mm}/${today_dd}/${today_yyyy}`;

        const past = new Date(today);
        past.setDate(past.getDate() - 6); // last 7 days

        const past_mm = String(past.getMonth() + 1).padStart(2, '0');
        const past_dd = String(past.getDate()).padStart(2, '0');
        const past_yyyy = past.getFullYear();
        let start  = `${past_mm}/${past_dd}/${past_yyyy}`;
        let end = todayFormatted;
        range = `${start} - ${end}`;
    } else {
        const rangeRegex = /^\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\s*$/;
        const match = range.match(rangeRegex);

        if (!match) {
            fireSwal('Error', ['Invalid Productivity Fetch Request',`Invalid Range: "${range}". Expected "MM/DD/YYYY - MM/DD/YYYY"`], 'error');
            console.error(`Invalid range format: "${range}". Expected "MM/DD/YYYY - MM/DD/YYYY".`);
            return null;
        }

        const [ , startStr, endStr ] = match;
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);

        if (isNaN(startDate) || isNaN(endDate)) {
            fireSwal('Error', ['Invalid Productivity Fetch Request',`Invalid date(s) in range: "${range}".`], 'error');
            console.error(`Invalid date(s) in range: "${range}".`);
            return null;
        }

        if (endDate < startDate) {
            fireSwal('Error', ['Invalid Productivity Fetch Request',`End date cannot be before start date: "${range}".`], 'error');
            console.error(`End date cannot be before start date: "${range}".`);
            return null;
        }

        let start = startStr;
        let end = endStr;

        range = `${start} - ${end}`;
    }

    filters.push({
        column: "user_clocks.clock_date",
        opr: "between",
        value: range
    });

    const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
    if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
        const csrfToken = csrfMeta.getAttribute('content');
        const request = {
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
                    "inventory_receiving.condition_id",
                    "products.category_id",
                    "categories.type",
                    "products.brand_id",
                    "order_lines.line_sku",
                    "orders.number",
                    "order_lines.line_quantity",
                    "order_lines.line_price",
                    "product_items.bulk_price",
                    "products.mpn",
                    "products.gtin",
                    "products.asin"
                ],
                filters: filters
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
        fireSwal('Error', ['Invalid Productivity Fetch Request','Unable to find CSRF Token.'], 'error');
        return null;
    }
}

function printProductivity(data, department = null) {
    if (department === null) { department = department_name.toLowerCase(); }

    const uniqueData = Array.from(
        new Map(data.map(obj => [JSON.stringify(obj), obj])).values()
    );
    console.debug('PATCHES - Unique data:', uniqueData);

    let cards = [];
    cards.push(createCard);
    cards.push(createCard('task'));
    cards.push(createCard('po'));
    cards.push(createCard('user'));
    cards.push(createCard('brand', 'Apple/Samsung'));
    cards.push(createCard('brand', 'OtterBox/Designer'));
    console.debug('PATCHES - Productivity Cards:', cards);

    const content_container = document.getElementById('kt_app_content_container');
    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'display: flex; flex-wrap: wrap; justify-content: space-around;');
    cards.forEach(card => {
        wrapper.appendChild(cards);
    });
    content_container.appendChild(wrapper);
    
    function createCard(breakdown = null, title = null) {
        let groupKey = null;
        let subdata = [{
            key:"all",
            data:data
        }]; // default to have all data

        const card = document.createElement('div');
        card.classList.add('card', 'card-bordered');

        // card heading
        const card_header = document.createElement('div');
        card_header.classList = 'card-header';
        const card_title = document.createElement('div');
        card_title.classList = 'card-title';
        switch (breakdown) {
            case 'task':
                card_title.textContent = 'Task Stats';
                groupKey = 'Task';
                break;
            case 'po':
                card_title.textContent = 'PO Stats';
                groupKey = 'PO_Number';
                break;
            case 'user':
                card_title.textContent = 'User Stats';
                groupKey = 'User';
                break;
            case 'brand':
                card_title.textContent = title ?? 'Beand Stats';
                groupKey = 'User';
                break;
            default:
                card_title.textContent = 'All Stats';
        }
        card_header.appendChild(card_title);
        card.appendChild(card_title);


        const card_body = document.createElement('div');
        card_body.classList = 'card-body';
        if (groupKey) {
            const grouped = {};
            for (const row of uniqueData) {
                const key = row[groupKey] ?? 'Unknown';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(row);
            }

            subdata = Object.entries(grouped).map(([key, value]) => ({
                key,
                data: value
            }));

            if (title !== null) {
                // removing subsets, combining subsets into one
                if (title.contains('Apple/Samsung')) {
                    const appleEntry = subdata .find(entry => 
                        entry.key?.toLowerCase() === 'apple'
                    );
                    const samsungEntry = subdata .find(entry => 
                        entry.key?.toLowerCase() === 'samsung'
                    );

                    const combinedData = [
                        ...(appleEntry?.data ?? []),
                        ...(samsungEntry?.data ?? [])
                    ];

                    subdata = [
                        { key: 'Apple/Samsung', data: combinedData }
                    ];
                } else if (title.contains('OtterBox/Designer')) {
                    const otterEntry = subdata.find(entry =>
                        entry.key?.toLowerCase() === 'otterbox'
                    );
                    const designerEntry = subdata.find(entry =>
                        entry.key?.toLowerCase() === 'designer'
                    );

                    const combinedData = [
                        ...(otterEntry?.data ?? []),
                        ...(designerEntry?.data ?? [])
                    ];

                    subdata = [
                        { key: 'OtterBox/Designer', data: combinedData }
                    ];
                }
            }

            let html = '';

            subdata.forEach(subset => {
                console.debug('PATCHES - Subset:', subset);
                const stats = getStats(subset['data']);
                html += `<div style="display: flex; flex-direction: row; justify-content: space-between; gap: 0.75rem; alsign-items: center;">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <h4>${subset['key']}:</h4>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <span class="text-gray-700 fw-bold">Units:</span>
                        <span class="text-gray-900 fw-boldest">${stats['units']}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <span class="text-gray-700 fw-bold">Unique Items:</span>
                        <span class="text-gray-900 fw-boldest">${stats['unique_lines']}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <span class="text-gray-700 fw-bold">Time:</span>
                        <span class="text-gray-900 fw-boldest">${stats['minutes']} Minutes</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <span class="text-gray-700 fw-bold">Average:</span>
                        <span class="text-gray-900 fw-boldest">${stats['average']} ${stats['average_label']}</span>
                    </div>
                </div>
                <div class="separator separator-dashed my-3"></div>`;
            });

            card_body.innerHTML = html;


        } else {
            //to-do
        }

        card.appendChild(card_body);
        return card;

        function getStats(subset) {
            let units = 0;
            let minutes = 0;
            let unique_lines = 0;
            subset.forEach(line => {
                if (line.Units > 0) {
                    units += line.Units;
                    unique_lines++;
                }

                minutes += line.Time_Spent_in_mintues;
            });

            if (department === 'listing') {
                return {
                    units: units,
                    minutes: minutes,
                    unique_lines: unique_lines,
                    average: minutes / units,
                    average_label: 'Minutes / Unit'
                };
            } else {
                return {
                    units: units,
                    minutes: minutes,
                    unique_lines: unique_lines,
                    average: units / minutes,
                    average_label: 'Units / Minute'
                };
            }
        }
    }
}

/* init */
(async () => {
    const content_container = document.getElementById('kt_app_content_container');
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

    if (content_container) {
        content_container.innerHTML = '';
    }

    await fetchUserDetails();

    const report = await fetchProductivity('team', 'Production');
    console.debug('PATCHES TEST - Report:', report);
    printProductivity(report.data, 'production');

    if (content_container && window.location.href.includes('/productivity/employee')) { // simgle user
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

        // function calls

    } else if (content_container && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && !window.location.href.includes('/productivity/employee')) { // team
        document.title = document.title.replace('Productivity', 'Team Productivity');

        if (heading) {
            heading.textContent = 'Team Productivity';
        }

        // function calls
    }
})();