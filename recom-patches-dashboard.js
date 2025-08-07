let quicklinks = [];
let randomImages = [];

function initQuickLinks() {
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

    const quickLinksLabel = document.createElement('span');
    quickLinksLabel.setAttribute('class', 'text-dark fw-bolder fs-3');
    quickLinksLabel.setAttribute('style', 'margin: 1rem 0.5rem; margin-top: 0; display: block;');
    quickLinksLabel.textContent = "Quick Links:";
    content_container.prepend(quickLinksLabel);
}

function replaceEngagewidget() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    const engagewidget = kt_app_content_container.querySelector('.card.bg-primary.card-flush.h-md-50.mb-xl-10');
    if (engagewidget) {
        const selectedImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        engagewidget.innerHTML = `<div class="card-body d-flex flex-column">
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
        engagewidget.classList.remove('bg-primary');
        engagewidget.setAttribute('style', "background-color: black !important;");
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
        statcardfix[0].setAttribute('style', `background-color: rgb(65,40,50) !important; color: white !important;`);
        statcardfix[1].setAttribute('style', `background-color: rgb(15,50,50) !important; color: white !important;`);
        statcardfix[2].setAttribute('style', `background-color: rgb(50,60,85) !important; color: white !important;`);
    }
}

setTimeout(async function () { 
    fixStatCards();
    loadEdgeConfig('config').then(() => {
        console.debug('PATCHES - Dashboard Edge Config Loaded.');
        initQuickLinks();
        // replaceEngagewidget();
    }).catch(err => {
        console.error('PATCHES - Dashboard Edge config failed:', err);
    });
}, 200);