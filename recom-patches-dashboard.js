let quicklinks = [];
let randomImages = [];

function initQuickLinks() {
    if (panic) { return null; }

    const content_container = document.getElementById('kt_app_content_container');

    // add separator
    const separator = document.createElement('div');
    separator.setAttribute('class', 'separator separator-dashed');
    separator.setAttribute('style', 'margin-bottom: 2.25rem;')
    content_container.prepend(separator);

    const quickLinks = document.createElement('div');
    quickLinks.id = 'patches-dashboard-quicklinks';

    quicklinks.forEach(link => {
        let desc = link.desc;
        if (Array.isArray(link.desc)) {
            desc = link.desc.join('<br>');
        }

        const quickLink = document.createElement('a');
        quickLink.setAttribute('class', `card card-flush h-md-50 mb-xl-10 blockui item ${link.class}`);
        quickLink.setAttribute('href', link.href);
        quickLink.innerHTML = `<div class="card-header pt-5">
            <h3 class="card-title text-gray-800">${link.label}</h3>
        </div>
        <div class="card-body pt-5">
            <div class="text-gray-700 fw-bold fs-6 me-2">${desc}</div>
        </div>`;
        quickLinks.appendChild(quickLink);
    });

    content_container.prepend(quickLinks);
}

function replaceEngagewidget() {
    if (panic) { return null; }

    const kt_app_content_container = document.getElementById('kt_app_content_container');
    const engagewidget = kt_app_content_container.querySelector('.card.bg-primary.card-flush.h-md-50.mb-xl-10');
    engagewidget.classList = '';
    engagewidget.classList.add('card' ,'overflow-hidden' ,'card-flush' ,'h-md-50' ,'mb-5' ,'mb-xl-10');
    engagewidget.removeAttribute('data-bs-theme');
    if (engagewidget) {
        const previous = engagewidget.previousElementSibling;
        if (previous) {
            previous.classList.add('mb-5');
        }

        const selectedImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        engagewidget.innerHTML = `<div class="card-body d-flex flex-column">
            <div class="m-0">
                <h1 class="fw-semibold text-white text-center lh-lg">
                    You have the Patches!<br>
                    <span class="fw-bolder">See all the changes made!</span>
                </h1>
                <img src="${selectedImage.url}" 
                    title="${selectedImage.title}"
                    patches="noEnlarge"
                    class="flex-grow-1 card-rounded-bottom h-100px mh-200px my-5" 
                    style="object-fit: contain; object-position: center; width: 100%; height: 100%;">
            </div>
            <div class="text-center">
                <a title="Opens External Page" class="btn btn-light btn-sm" target="_blank" href="https://simple-patches.vercel.app/">Read More</a>
            </div>
        </div>`;
        engagewidget.classList.remove('bg-primary');
    }
}

function fixStatCards() {
    function getTheme() {
        var theme = 'light';
        if (document.documentElement.getAttribute('data-bs-theme')) {
            theme = document.documentElement.getAttribute('data-bs-theme');
        }
        return theme;
    }

    const statcardfix = document.querySelectorAll('.card.card-xl-stretch.mb-xl-8');
    if (statcardfix && statcardfix.length === 3 && getTheme() === 'dark') {
        const statcardParent = statcardfix[0].parentElement?.parentElement;
        if (statcardParent) {
            statcardParent.setAttribute('style', `margin-bottom: calc(-1 * var(--bs-gutter-y));`);
        }
        statcardfix[0].setAttribute('style', `--bs-card-bg: rgb(65,40,50); color: white !important;`);
        statcardfix[1].setAttribute('style', `--bs-card-bg: rgb(15,50,50); color: white !important;`);
        statcardfix[2].setAttribute('style', `--bs-card-bg: rgb(50,60,85); color: white !important;`);
    }
}

async function dashboardAlerts() {
    document.getElementById('productsStats').querySelector('.card-title').textContent = 'Stats';
    if (typeof currentTask !== 'string') { return null; }

    if (currentTask.toLowerCase() === 'pictures') {
        await warning_photoRecent();
        await warning_photosMissing();
    }
    
    async function warning_photoRecent() {
        // Get today's date
        let today = new Date();
        let todayFormatted = formatDate(today);

        // Get the date 30 days ago
        let pastDate = new Date();
        pastDate.setDate(today.getDate() - 30);
        let pastDateFormatted = formatDate(pastDate);

        const data = await fetchWarningReport(
            'item_images', ["product_items.sku"], [
                {
                    column: "product_items.created_at",
                    opr: "between",
                    value: `${pastDateFormatted} - ${todayFormatted}`
                },
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: [6, 8, 18]
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                }
            ]
        );
        const count = Array.isArray(data) ? data.length : 0;
        if (count !== 0) {
            parseAndPrintWarning('Missing Recent Photos', count, '/reports?template=picture_missingSpecial');
        }
    }

    async function warning_photosMissing() {
        let items_images_qunique_report = await fetchWarningReport(
            'item_images', [
                "product_items.sku",
                "products.sid"
            ],
            [
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.in_stock",
                    opr: "{0} > {1}",
                    value: 0
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: ["6", "8", "18"]
                }
            ]
        );

        let items_images_set = await fetchWarningReport(
            'item_images', [
                "product_items.sku",
                "products.sid"
            ],
            [
                {
                    column: "item_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "product_items.in_stock",
                    opr: "{0} > {1}",
                    value: 0
                },
                {
                    column: "product_items.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                },
                {
                    column: "product_items.condition_id",
                    opr: "{0} IN {1}",
                    value: ["1", "2", "4", "5", "9", "31", "32", "34", "35", "39", "42", "44", "45", "49", "71", "92", "94", "95", "99"]
                }
            ]
        );

        let product_images_set = await fetchWarningReport(
            'product_images', ["products.sid"], [
                {
                    column: "product_images.url",
                    opr: "({0} IS NULL OR {0} = '')",
                    value: ""
                },
                {
                    column: "products.status",
                    opr: "{0} = '{1}'",
                    value: "1"
                }
            ]
        );

        if (items_images_set === null) { items_images_set = []; }

        if (product_images_set === null) { product_images_set = []; }

        if (items_images_qunique_report === null) { items_images_qunique_report = [] }

        if (items_images_set && Array.isArray(items_images_set) && product_images_set && Array.isArray(product_images_set) && items_images_qunique_report && Array.isArray(items_images_qunique_report)) {

            console.log("uniques:", items_images_qunique_report);
            console.log("items:", items_images_set);
            console.log("products:", product_images_set);

            var list = [];
            for (let i = 0; i < items_images_qunique_report.length; i++) {
                var item = items_images_qunique_report[i];
                list.push(item);
            }

            for (let i = 0; i < items_images_set.length; i++) {
                for (let j = 0; j < product_images_set.length; j++) { 
                    if (items_images_set[i].SID === product_images_set[j].SID) {
                        var item = items_images_set[i];
                        if (product_images_set[j].items) {
                            product_images_set[j].items.push(item);
                        } else {
                            product_images_set[j].items = [item];
                        }
                        break;
                    }
                }
            }

            var filtered__product_images_set = product_images_set.filter(obj => obj.hasOwnProperty('items'));
            console.log('filtered products:', filtered__product_images_set);

            for (let i = 0; i < filtered__product_images_set.length; i++) {
                const married_product = filtered__product_images_set[i];
                list.push(married_product);
            }

            console.log('final list:', list);
            const count = Array.isArray(list) ? list.length : 0;
            if (count !== 0) {
                parseAndPrintWarning('In Stock Missing Photos', count, '/reports?template=picture_missingFull');
            }
        }
    }

    async function fetchWarningReport(type, columns, filters) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (!csrfMeta || csrfMeta.getAttribute('content').length === 0) { return Promise.resolve(null); }
        const csrfToken = csrfMeta.getAttribute('content');

        const request = {
            report: {
                type: type,
                columns: columns,
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

    function parseAndPrintWarning(name, count, link) {
        if (count === null || count === 0) { return; }

        const container = document.getElementById('productsStats').querySelector('.card-body');

        const separator = document.createElement('div');
        separator.setAttribute('class', 'separator separator-dashed my-3');
        container.appendChild(separator);

        const row = document.createElement('a');
        row.setAttribute('href', link);
        row.setAttribute('target', '_blank');
        row.setAttribute('class', 'd-flex flex-stack');
        row.innerHTML = `<div class="fw-bold fs-6 me-2" style="color: var(--bs-danger);">${name}</div>
        <div class="d-flex align-items-senter">
            <span class="text-gray-900 fw-boldest fs-6">${count}</span>
        </div>`;
        container.appendChild(row);

    }

    function formatDate(date) {
        let month = (date.getMonth() + 1).toString().padStart(2, '0');
        let day = date.getDate().toString().padStart(2, '0');
        let year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
}

setTimeout(async function () { 
    fixStatCards();
    await dashboardAlerts();
    try {
        await loadEdgeConfig('dashboard');
        console.debug('PATCHES - Dashboard Edge Config Loaded.');

        initQuickLinks();
        replaceEngagewidget();
    } catch (err) {
        console.error('PATCHES - Dashboard Edge config failed:', err);
    }
}, 200);