let quicklinks = [];
let randomImages = [];

function getTheme() {
    var theme = 'light';
    if (document.documentElement.getAttribute('data-bs-theme')) {
        theme = document.documentElement.getAttribute('data-bs-theme');
    }
    return theme;
}

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
        quickLink.setAttribute('class', `card card-flush h-md-50 mb-xl-10 blockui item colorCard ${getTheme()} ${link.class}`);
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
    if (panic) {
        engagewidget.classList.remove('bg-primary');
        engagewidget.classList.add('colorCard', getTheme(), 'green');
    } else {
        engagewidget.classList = '';
        engagewidget.classList.add('card' ,'overflow-hidden' ,'card-flush' ,'h-md-50' ,'mb-5' ,'mb-xl-10');
        engagewidget.removeAttribute('data-bs-theme');

        const previous = engagewidget.previousElementSibling;
        if (previous) { previous.classList.add('mb-5'); }

        const selectedImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        engagewidget.innerHTML = `<div class="card-body d-flex flex-column">
            <div class="m-0">
                <h1 class="fw-bolder text-gray-800 text-center lh-lg">You have the Patches!</h1>
                <h4 class="fw-semibold text-gray-700 text-center">See all the changes made!</h4>
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
    const statcardfix = document.querySelectorAll('.card.card-xl-stretch.mb-xl-8');
    if (!statcardfix || statcardfix.length !== 3) return;

    const statcardParent = statcardfix[0].parentElement?.parentElement;
    if (statcardParent) {
        statcardParent.setAttribute('style', `margin-bottom: calc(-1 * var(--bs-gutter-y));`);
    }

    const classes = ['red', 'blue', 'green'];
    for (let i = 0; i < statcardfix.length; i++) {
        statcardfix[i].removeAttribute('style');
        statcardfix[i].classList.add('colorCard', getTheme(), classes[i]);
    }
}

setTimeout(async function () { 
    fixStatCards();
    try {
        await loadEdgeConfig('dashboard');
        console.debug('PATCHES - Dashboard Edge Config Loaded.');
        initQuickLinks();
        replaceEngagewidget();

        // theme change observer
        const themeObserver = new MutationObserver(() => {
            const theme = getTheme();
            document.querySelectorAll('.colorCard').forEach(card => {
                card.classList.remove('light', 'dark');
                card.classList.add(theme);
            });
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });

    } catch (err) {
        console.error('PATCHES - Dashboard Edge config failed:', err);
    };
}, 200);