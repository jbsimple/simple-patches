const content_container = document.getElementById('kt_app_content_container');

const quickLinks = document.createElement('div');
quickLinks.id = 'patches-dashboard-quicklinks';

const quicklinks = [
    {"label":"Your Productivity", "href":"/productivity/employee/0"},
    {"label":"Team Productivity", "href":"/productivity"},
    {"label":"Items Catalog", "href":"/product/items"},
    {"label":"Products Catalog", "href":"/products"},
    {"label":"New Inventory", "href":"/receiving"},
    {"label":"Pending Listing", "href":"/receiving/queues/listing"},
    {"label":"FBA Check", "href":"/receiving/queues/fba-check"},
    {"label":"Pending Inventory", "href":"/receiving/queues/inventory"}
]

quicklinks.forEach(link => function() {
    const quickLink = document.createElement('a');
    quickLink.setAttribute('class', 'card card-flush h-md-50 mb-xl-10 blockui');
    quickLink.setAttribute('href', link.href);
    quickLink.innerHTML = `<div class="card-header pt-5">
        <h3 class="card-title text-gray-800">${item.label}</h3>
    </div>`;
    quickLinks.appendChild(quickLink);
});

content_container.prepend(quickLinks);