const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
if (nav_sidebar) {
    nav_sidebar.style.display = 'flex';
    nav_sidebar.style.flexDirection = 'column';
    nav_sidebar.style.height = '100%';

    const nav_sidebar_links = document.getElementById('#kt_app_sidebar_menu');
    nav_sidebar_links.style.flex = '1';

    const separator = document.createElement('div');
    separator.setAttribute('class', 'app-sidebar-separator separator');
    nav_sidebar.appendChild(separator);
    
    const loaded_message = document.createElement('span');
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Patches Loaded: 7-16-2024__4';
    nav_sidebar.appendChild(loaded_message);
} else {
    console.error('Sidebar could not be found.');
}

document.head.innerHTML += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches.css?v=' + Date.now() + '" type="text/css"/>';
let script = document.createElement('script');
script.name = 'n/a';
script.onload = function() {
    console.log('Patch Loaded:', script.name);
};

if (window.location.href.includes('/receiving/queues/listing/')) {

    script.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-listing.js?v=" + Date.now();
    script.name = 'recom-patches-listing.js';

}

if (window.location.href.includes('/queues/conditions/')) {
    
    script.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-condqueue.js?v=" + Date.now();
    script.name = 'recom-patches-condqueue.js';

}

if (window.location.href.includes('/products') || window.location.href.includes('/product/item')) {

    document.head.innerHTML += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-product.css?v=' + Date.now() + '" type="text/css"/>';
    script.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-productPage.js?v=" + Date.now();
    script.name = 'recom-patches-productPage.js';

}

if (window.location.href.includes('/receiving') && document.getElementById('searchProductForm')) {
    
    script.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-newInventory.js?v=" + Date.now();
    script.name = 'recom-patches-newInventory.js';

}

if (window.location.href.includes('/reports')) {

    script.src = "https://cdn.jsdelivr.net/gh/jbsimple/simple-patches@main/recom-patches-reports.js?v=" + Date.now();
    script.name = "recom-patches-reports.js";

}

document.body.appendChild(script);
console.log('Patch Loading Complete');