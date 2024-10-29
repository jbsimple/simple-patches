const version = '10-28-2024__1';

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
    
    const loaded_message = document.createElement('a');
    loaded_message.href = "https://simple-patches.vercel.app/";
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Patches Loaded: ' + version;
    loaded_message.classList = 'patches-loaded';
    loaded_message.setAttribute('target', '_blank');
    loaded_message.setAttribute('rel', 'noreferrer');
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

function rainbowMessage(message) {
    const mainelem = document.getElementById('rc_header_search').parentElement;
    if (mainelem) {
        const newMessage = document.createElement('div');
        newMessage.innerHTML = `<strong style="font-size: 1.25rem;" class="rainbow_text_animated">${message}</strong>`;
        newMessage.setAttribute('style', 'height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 1rem; margin-right: 1rem;');
        mainelem.appendChild(newMessage);
    }
}

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

if (window.location.href.includes('/users/show')) {

    document.head.innerHTML += '<link rel="stylesheet" href="https://simple-patches.vercel.app/recom-patches-userShow.css?v=' + Date.now() + '" type="text/css"/>';

}

document.body.appendChild(script_patch);

const today = new Date();
if (today.getDate() === 30 && today.getMonth() === 9) {
    rainbowMessage('Happy Birthday Luke!');
}

if (today.getDate() === 29 && today.getMonth() === 9) {
    rainbowMessage('Happy Early Birthday Luke!');
}

if (today.getDate() === 28 && today.getMonth() === 11) {
    rainbowMessage('Happy Birthday Nate!');
}

if (today.getDate() === 27 && today.getMonth() === 11) {
    rainbowMessage('Happy Early Birthday Nate!');
}

console.log('Patch Loading Complete');