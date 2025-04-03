function initQuickLinks() {
    const content_container = document.getElementById('kt_app_content_container');

    // add separator
    const separator = document.createElement('div');
    separator.setAttribute('class', 'separator separator-dashed');
    separator.setAttribute('style', 'margin-bottom: 2.25rem;')
    content_container.prepend(separator);

    const quickLinks = document.createElement('div');
    quickLinks.id = 'patches-dashboard-quicklinks';

    const quicklinks = [
        {
            "label":"Your Productivity",
            "href":"/productivity/employee/0",
            "desc":"Your own productivity statistics."
        },
        {
            "label":"Team Productivity",
            "href":"/productivity",
            "desc":"Listing team productivity statistics."
        },
        {
            "label":"Items Catalog",
            "href":"/product/items",
            "desc":"SKU catalog and search."
        },
        {
            "label":"Products Catalog",
            "href":"/products",
            "desc":"SID catalog and search."
        },
        {
            "label":"New Inventory",
            "href":"/receiving",
            "desc":"New inventory search."
        },
        {
            "label":"Pending Listing",
            "href":"/receiving/queues/listing",
            "desc":"Pending Listing queue."
        },
        {
            "label":"FBA Check",
            "href":"/receiving/queues/fba-check",
            "desc":"Queue before pending inventory."
        },
        {
            "label":"Pending Inventory",
            "href":"/receiving/queues/inventory",
            "desc":"IC queue."
        }
    ]

    quicklinks.forEach(link => {
        let desc = link.desc;
        if (Array.isArray(link.desc)) {
            desc = link.desc.join('<br>');
        }

        const quickLink = document.createElement('a');
        quickLink.setAttribute('class', 'card card-flush h-md-50 mb-xl-10 blockui item');
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

setTimeout(function () { initQuickLinks(); }, 200);