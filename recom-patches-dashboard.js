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
}

function replaceEngagewidget() {
    const kt_app_content_container = document.getElementById('kt_app_content_container');
    const engagewidget = kt_app_content_container.querySelector('.card.bg-primary.card-flush.h-md-50.mb-xl-10');
    engagewidget.classList = '';
    engagewidget.classList.add('card' ,'overflow-hidden' ,'card-flush' ,'h-md-50' ,'mb-5' ,'mb-xl-10');
    engagewidget.setAttribute('style', 'background-color: #1e1e2d !important; border: 1px solid #2B2B40 !important;');
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
                    class="flex-grow-1 card-rounded-bottom h-100px mh-200px my-5" 
                    style="object-fit: contain; object-position: center; width: 100%; height: 100%;">
            </div>
            <div class="text-center">
                <a title="Opens External Page" class="btn btn-sm bg-white btn-color-gray-800 me-2" target="_blank" href="https://simple-patches.vercel.app/">Read More</a>
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

setTimeout(async function () { 
    fixStatCards();
    loadEdgeConfig('dashboard').then(() => {
        console.debug('PATCHES - Dashboard Edge Config Loaded.');
        initQuickLinks();
        replaceEngagewidget();
    }).catch(err => {
        console.error('PATCHES - Dashboard Edge config failed:', err);
    });
}, 200);