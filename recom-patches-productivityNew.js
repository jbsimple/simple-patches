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

function printProductivity(data, user = null, department = null) {
    if (department === null) { department = department_name.toLowerCase(); }

    const uniqueData = Array.from(
        new Map(data.map(obj => [JSON.stringify(obj), obj])).values()
    );
    console.debug('PATCHES - Unique data:', uniqueData);

    let cards = [];
    cards.push(createCard(null, null, '50%'));
    cards.push(createCard('task', null, '50%'));
    cards.push(createCard('po', null, '50%'));

    if (user === null) {
        cards.push(createCard('user', null, '50%'));
    }

    if (department === 'production') {
        cards.push(createCard('brand', 'Apple/Samsung', '33%'));
        cards.push(createCard('brand', 'OtterBox/Designer', '33%'));
        // still need to get the listing breakdown omg
    }
    
    console.debug('PATCHES - Productivity Cards:', cards);

    const content_container = document.getElementById('kt_app_content_container');
    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'display: flex; flex-wrap: wrap; justify-content: space-between;');
    cards.forEach(card => {
        wrapper.appendChild(card);
    });
    content_container.appendChild(wrapper);
    
    function createCard(breakdown = null, title = null, width = '50%') {
        let groupKey = null;
        let subdata = [{
            key:"all",
            data:data
        }]; // default to have all data

        const card = document.createElement('div');
        card.classList.add('card', 'card-bordered', 'patches-card');
        card.setAttribute('style', `--width: ${width}`);

        // card heading
        const card_header = document.createElement('div');
        card_header.classList = 'card-header';
        const card_title = document.createElement('div');
        card_title.classList = 'card-title';
        const card_title_h2 = document.createElement('h2');
        switch (breakdown) {
            case 'task':
                card_title_h2.textContent = 'Task Stats';
                groupKey = 'Task';
                break;
            case 'po':
                card_title_h2.textContent = 'PO Stats';
                groupKey = 'PO_Number';
                break;
            case 'user':
                card_title_h2.textContent = 'User Stats';
                groupKey = 'User';
                break;
            case 'brand':
                card_title_h2.textContent = title ?? 'Beand Stats';
                groupKey = 'Brand';
                break;
            default:
                card_title_h2.textContent = 'All Stats';
        }
        card_title.appendChild(card_title_h2);
        card_header.appendChild(card_title);
        card.appendChild(card_header);

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
                if (title.includes('Apple/Samsung')) {
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
                } else if (title.includes('OtterBox/Designer')) {
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
        }

        const card_body = document.createElement('div');
        card_body.classList = 'card-body';
        
        console.debug('PATCHES - Subdata:', subdata);

        if (subdata.length > 1) {
            let tbody = '';
            subdata.forEach(subset => {
                const stats = getStats(subset['data']);
                tbody += `<tr>
                    <td class="dtr-control">
                        <h4>${subset['key']}</h4>
                    </div>
                    <td>
                        <span class="text-gray-900">${stats['units']}</span>
                    </td>
                    <td>
                        <span class="text-gray-900">${stats['unique_lines']}</span>
                    </td>
                    <td>
                        <span class="text-gray-900">${stats['minutes']} Minutes</span>
                    </td>
                    <td>
                        <span class="text-gray-900">${stats['average']} ${stats['average_label']}</span>
                    </td>
                </tr>`;
            });

            card_body.innerHTML = `<table class="table align-middle table-row-dashed fs-6 gy-3 dataTable no-footer dtr-inline">
            <thead>
                <tr>
                    <th width="40%" class="sorting_disabled" rowspan="1" colspan="1">
                        <span class="fw-boldest">${groupKey}</span>
                    </th>
                    <th class="sorting_disabled" rowspan="1" colspan="1">
                        <span class="fw-boldest">Units</span>
                    </th>
                    <th class="sorting_disabled" rowspan="1" colspan="1">
                        <span class="fw-boldest">Unique Items</span>
                    </th>
                    <th class="sorting_disabled" rowspan="1" colspan="1">
                        <span class="fw-boldest">Time</span>
                    </th>
                    <th class="sorting_disabled" rowspan="1" colspan="1">
                        <span class="fw-boldest">Average</span>
                    </th>
                </tr>
            </thead>
            <tbody class="fw-bolder text-gray-600">${tbody}</tbody>
            </table>`;
        } else {
            const stats = getStats(subdata[0]['data']);
            card_body.innerHTML = `<div class="d-flex flex-stack">
                <div class="text-gray-700 fw-bold fs-6 me-2">Units:</div>
                <div class="d-flex align-items-senter">
                    <span class="text-gray-900 fw-boldest fs-6">${stats['units']}</span>
                </div>
            </div>
            <div class="separator separator-dashed my-3"></div>
            <div class="d-flex flex-stack">
                <div class="text-gray-700 fw-bold fs-6 me-2">Unique Items:</div>
                <div class="d-flex align-items-senter">
                    <span class="text-gray-900 fw-boldest fs-6">${stats['unique_lines']}</span>
                </div>
            </div>
            <div class="separator separator-dashed my-3"></div>
            <div class="d-flex flex-stack">
                <div class="text-gray-700 fw-bold fs-6 me-2">Time:</div>
                <div class="d-flex align-items-senter">
                    <span class="text-gray-900 fw-boldest fs-6">${stats['minutes']} Minutes</span>
                </div>
            </div>
            <div class="separator separator-dashed my-3"></div>
            <div class="d-flex flex-stack">
                <div class="text-gray-700 fw-bold fs-6 me-2">Average:</div>
                <div class="d-flex align-items-senter" style="gap: 0.5rem;">
                    <span class="text-gray-900 fw-boldest fs-6" data-inventory-stats="in-stock">${stats['average']}</span>
                    <span class="text-gray-400 fw-bolder fs-6" title="Out of Stock" data-inventory-stats="out-stock-percent">${stats['average_label']}</span>
                </div>
            </div>
            `;
            // add number of worked po
        }

        card.appendChild(card_body);
        return card;

        function getStats(subset) {
            let units = 0;
            let minutes = 0;
            let minutes_avg = 0;
            let unique_lines = [];
            subset.forEach(line => {
                const lineUnits = parseInt(line.Units) || 0;
                const lineMinutes = parseFloat(line.Time_Spent_in_mintues) || 0;

                if (lineUnits > 0) {
                    units += lineUnits;
                    if (!unique_lines.includes(line.SKU)) {
                        unique_lines.push(line.SKU);
                    }
                    minutes_avg += lineMinutes;
                }

                minutes += lineMinutes;
            });

            const round2 = num => Math.round((num + Number.EPSILON) * 100) / 100;
            let average, average_label;
            if (department === 'listing') {
                average = units > 0 ? minutes_avg / units : 0;
                average_label = 'Mins/Unit';
            } else {
                average = minutes > 0 ? units / minutes_avg : 0;
                average_label = 'Units/Min';
            }

            return {
                units: units,
                minutes: round2(minutes),
                unique_lines: unique_lines.length,
                average: round2(average),
                average_label: average_label
            };
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
        content_container.innerHTML = `<style>
            .card.patches-card {
                width: calc(var(--width) - 0.5rem);
            }
            @media (max-width: 899px) {
                .card.patches-card {
                    --width: 50%;
                }
            }

        </style>`;
    }

    await fetchUserDetails();

    const report = await fetchProductivity('team');
    console.debug('PATCHES TEST - Report:', report);
    printProductivity(report.data);

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