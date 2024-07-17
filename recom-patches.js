const version = '7-17-2024__02';

const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
if (nav_sidebar) {
    nav_sidebar.style.display = 'flex';
    nav_sidebar.style.flexDirection = 'column';

    const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
    nav_sidebar_links.style.flex = '1';

    const version_container = document.createElement('div');
    version_container.setAttribute('style', 'padding: 0 25px; margin-top: 1rem; display: flex; flex-direction: column;');

    const separator = document.createElement('div');
    separator.setAttribute('class', 'app-sidebar-separator separator');
    version_container.appendChild(separator);
    
    const loaded_message = document.createElement('span');
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Patches Loaded: ' + version;
    version_container.appendChild(loaded_message);

    nav_sidebar.appendChild(version_container);

} else {
    console.error('Sidebar could not be found.');
}

document.head.innerHTML += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
let script_patch = document.createElement('script');
script_patch.name = 'n/a';
script_patch.onload = function() {
    console.log('Patch Loaded:', script_patch.name);
};

if (window.location.href.includes('/receiving/queues/listing/')) {

    script_patch.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-listing.js?v=" + Date.now();
    script_patch.name = 'recom-patches-listing.js';

}

if (window.location.href.includes('/queues/conditions/')) {
    
    script_patch.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-condqueue.js?v=" + Date.now();
    script_patch.name = 'recom-patches-condqueue.js';

}

if (window.location.href.includes('/products/') || window.location.href.includes('/product/items/')) {
    // ending slash is needed to ensure that the code only applies the patch for the sku and sid pages

    document.head.innerHTML += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-product.css?v=' + Date.now() + '" type="text/css"/>';
    script_patch.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-productPage.js?v=" + Date.now();
    script_patch.name = 'recom-patches-productPage.js';

}

if (window.location.href.includes('/receiving') && document.getElementById('searchProductForm')) {
    
    script_patch.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-newInventory.js?v=" + Date.now();
    script_patch.name = 'recom-patches-newInventory.js';

}

if (window.location.href.includes('/reports')) {

    script_patch.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-reports.js?v=" + Date.now();
    script_patch.name = "recom-patches-reports.js";

}

document.body.appendChild(script_patch);
console.log('Patch Loading Complete');