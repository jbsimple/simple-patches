function initAddTools() {
    addButtonCard(
        'Parse Email List',
        [
            "For Mailchimp, takes a list of emails and then converts it into a csv for importing.",
            "Simple Patches Tool"
        ],
        "https://simple-patches.vercel.app/email-import.html"
    );

    addButtonCard(
        'CDN Uploader',
        [
            "For uploading things to the Simple Patches CDN.",
            "Password Required"
        ],
        "https://simple-patches.vercel.app/api"
    );

    addButtonCard(
        'Bulk Description Download',
        [
            "Bulk download the descriptions from a list of products.",
            "Requires good computer."
        ],
        "?tool=bulkDescDownload"
    );
}

initAddTools();

function addButtonCard(title, bullets, href) {
    const toolContainer = document.getElementById('kt_app_content_container');
    const tools = toolContainer.querySelectorAll('.card.card-flush');

    const newToolContainer = document.createElement('div');
    tools.forEach(tool => { newToolContainer.appendChild(tool); });
    toolContainer.innerHTML = newToolContainer.innerHTML;

    let bulletcode = '';
    if (Array.isArray(bullets) && bullets.length > 0) {
        bullets.forEach(bullet => {
            bulletcode += `<div class="d-flex align-items-center py-2">
                <span class="bullet bg-primary me-3"></span>
                <span>${bullet}</span>
            </div>`;
        })
    }

    // add new button
    const emailCard = `<div class="card card-flush h-md-100">
                <!--begin::Card header-->
                <div class="card-header">
                    <!--begin::Card title-->
                    <div class="card-title">
                        <h2>${title}</h2>
                    </div>
                    <!--end::Card title-->
                </div>
                <!--end::Card header-->
                <!--begin::Card body-->
                <div class="card-body pt-1">
                    <!--begin::Permissions-->
                    <div class="d-flex flex-column text-gray-600">${bulletcode}</div>
                    <!--end::Permissions-->
                </div>
                <!--end::Card body-->
                <!--begin::Card footer-->
                <div class="card-footer flex-wrap pt-0">
                    <a target="_blank" href="${href}" class="btn btn-light btn-active-light-primary my-1">Open</a>
                </div>
                <!--end::Card footer-->
            </div>`;
    toolContainer.innerHTML += emailCard;

    // fix the card sizing omg
    const replacedTools = toolContainer.querySelectorAll('.card.card-flush');
    replacedTools.forEach(tool => { tool.setAttribute('style', 'width: calc(33% - 1rem); height: unset !important;'); })

    toolContainer.setAttribute('style', 'display: flex; flex-wrap: wrap; gap: 2rem; justify-content: space-between;');
}