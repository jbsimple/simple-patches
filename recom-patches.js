const version = '09-04-2024__2';

const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
if (nav_sidebar) {
    nav_sidebar.style.display = 'flex';
    nav_sidebar.style.flexDirection = 'column';
    
    //the sidebar sets the height with a js resize listener and also on init.
    //regular init function doesn't set the value properly so this is to fix it.
    nav_sidebar.style.height = (parseInt(nav_sidebar.style.height) + 40) + 'px';

    const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
    nav_sidebar_links.style.flex = '1';

    const version_container = document.createElement('div');
    version_container.setAttribute('style', 'padding: 0 25px; margin-top: 0.5rem; display: flex; flex-direction: column;');

    const separator = document.createElement('div');
    separator.setAttribute('class', 'app-sidebar-separator separator');
    version_container.appendChild(separator);
    
    const loaded_message = document.createElement('span');
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Patches Loaded: ' + version;
    loaded_message.classList = 'patches-loaded';
    version_container.appendChild(loaded_message);

    nav_sidebar.appendChild(version_container);

} else {
    console.error('Sidebar could not be found.');
}

/* theme stuff */
function getTheme() {
    var theme = 'light';
    if (document.documentElement.getAttribute('data-bs-theme')) {
        theme = document.documentElement.getAttribute('data-bs-theme');
    }
    return theme;
}

/* nah
if ((typeof toggle_darkreader === 'undefined' || toggle_darkreader === true) && getTheme() === 'dark') {
    const darkreader = document.createElement('script');
    darkreader.src = 'https://cdn.jsdelivr.net/npm/darkreader@latest/darkreader.min.js';
    darkreader.onload = function() {
        DarkReader.enable({
            brightness: 100,
            contrast: 100,
            sepia: 0
        });
        console.log('Patch Loaded: Darkreader');
    };
    document.body.appendChild(darkreader);
} else if (toggle_darkreader === false) {
    console.log('Patch Skipped: Darkreader');
} else {
    console.log('Patch Error: Darkreader');
}
*/

const statcardfix = document.querySelectorAll('.card.card-xl-stretch.mb-xl-8');
if (statcardfix && statcardfix.length === 3 && getTheme() === 'dark') {
    statcardfix[0].setAttribute('style', `background-color: rgb(65,40,50) !important; color: white !important;`);
    statcardfix[1].setAttribute('style', `background-color: rgb(15,50,50) !important; color: white !important;`);
    statcardfix[2].setAttribute('style', `background-color: rgb(50,60,85) !important; color: white !important;`);
}

/* end of theme stuff */

document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
let script_patch = document.createElement('script');
script_patch.name = 'n/a';
script_patch.onload = function() {
    console.log('Patch Loaded:', script_patch.name);
};

if (window.location.href.includes('/receiving/queues/listing/') || window.location.href.includes('/products/new')) {

    script_patch.src = "https://simple-patches.vercel.app/recom-patches-listing.js?v=" + Date.now();
    script_patch.name = 'recom-patches-listing.js';

}

if (window.location.href.includes('/queues/conditions/')) {
    
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-condqueue.js?v=" + Date.now();
    script_patch.name = 'recom-patches-condqueue.js';

}

if ((window.location.href.includes('/products/') || window.location.href.includes('/product/items/')) && !window.location.href.includes('/products/new')) {
    // ending slash is needed to ensure that the code only applies the patch for the sku and sid pages

    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-product.css?v=' + Date.now() + '" type="text/css"/>';
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-productPage.js?v=" + Date.now();
    script_patch.name = 'recom-patches-productPage.js';

}

if (window.location.href.includes('/receiving') && document.getElementById('searchProductForm')) {
    
    script_patch.src = "https://simple-patches.vercel.app/recom-patches-newInventory.js?v=" + Date.now();
    script_patch.name = 'recom-patches-newInventory.js';

}

if (window.location.href.includes('/reports')) {

    script_patch.src = "https://simple-patches.vercel.app/recom-patches-reports.js?v=" + Date.now();
    script_patch.name = "recom-patches-reports.js";

}

document.body.appendChild(script_patch);
console.log('Patch Loading Complete');