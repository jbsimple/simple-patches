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
            "desc":"Your own productivity statistics.",
            "class":"green"
        },
        {
            "label":"Team Productivity",
            "href":"/productivity",
            "desc":"Listing team productivity statistics.",
            "class":"green"
        },
        {
            "label":"Items Catalog",
            "href":"/product/items",
            "desc":"SKU catalog and search.",
            "class":"blue"
        },
        {
            "label":"Products Catalog",
            "href":"/products",
            "desc":"SID catalog and search.",
            "class":"blue"
        },
        {
            "label":"New Inventory",
            "href":"/receiving",
            "desc":"New inventory search.",
            "class":"red"
        },
        {
            "label":"Pending Listing",
            "href":"/receiving/queues/listing",
            "desc":"Pending Listing queue.",
            "class":"red"
        },
        {
            "label":"FBA Check",
            "href":"/receiving/queues/fba-check",
            "desc":"Queue before pending inventory.",
            "class":"red"
        },
        {
            "label":"Pending Inventory",
            "href":"/receiving/queues/inventory",
            "desc":"IC queue.",
            "class":"red"
        }
    ]

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

    const quickLinksLabel = document.createElement('span');
    quickLinksLabel.setAttribute('class', 'text-dark fw-bolder fs-3');
    quickLinksLabel.setAttribute('style', 'margin: 1rem 0.5rem; margin-top: 0; display: block;');
    quickLinksLabel.textContent = "Quick Links:";
    content_container.prepend(quickLinksLabel);
}

function replaceEngageWiget() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    const engageWiget = kt_app_content_container.querySelector('.card.bg-primary.card-flush.h-md-50.mb-xl-10');
    const randomImages = [
        {
            "url": "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGsycjU3bTd0dGFkNmE5Y3NzcGpodGY4YW1mdTVrc3FoZmFqb2t4OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JqmupuTVZYaQX5s094/giphy.gif",
            "title": "typing..."
        },
        {
            "url": "https://media.tenor.com/GfSX-u7VGM4AAAAM/coding.gif",
            "title": "typing more..."
        },
        {
            "url": "https://media.tenor.com/PLIr_VkF6ywAAAAM/ghostedvpn-hacker-cat.gif",
            "title": "hacker cat!!!"
        },
        {
            "url": "https://i.gifer.com/6tXM.gif",
            "title": "average programming experience"
        }
    ];
    if (engageWiget) {
        const selectedImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        engageWiget.innerHTML = `<div class="card-body d-flex flex-column">
            <div class="m-0">
                <h1 class="fw-semibold text-white text-center lh-lg mb-9">
                    You have the Patches!<br>
                    <span class="fw-bolder">See all the changes made!</span>
                </h1>
                <div title="${selectedImage.title}" class="flex-grow-1 bgi-no-repeat bgi-size-contain bgi-position-x-center card-rounded-bottom h-100px mh-200px my-5" style="background-image:url('${selectedImage.url}')"></div>
            </div>
            <div class="text-center">
                <a title="Opens External Page" class="btn btn-sm bg-white btn-color-gray-800 me-2" target="_blank" href="https://simple-patches.vercel.app/">Read More</a>
            </div>
        </div>`;
        engageWiget.classList.remove('bg-primary');
        engageWiget.setAttribute('style', "background-color: black !important;");
    }
}

setTimeout(function () { 
    initQuickLinks();
    replaceEngageWiget();
}, 200);