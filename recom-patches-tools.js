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
        "/tools?tool=desc"
    );
}

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

    const style = document.createElement("style");
    style.textContent = `
    .tools-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
    .tool-card {
        width: 100%;
        height: auto !important;
    }
    @media (max-width: 900px) {
        .tools-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 550px) {
        .tools-grid {
            grid-template-columns: 1fr;
        }
    }
    `;
    document.head.appendChild(style);

    toolContainer.classList.add("tools-grid");

    const replacedTools = toolContainer.querySelectorAll('.card.card-flush');
    replacedTools.forEach(tool => {
        tool.classList.add("tool-card");
    });
}

(async () => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get('tool');

    if (!tool) {
        // Only run if ?tool is missing or has no value
        console.debug('PATCHES - No tool parameter detected, initializing Add Tools...');
        initAddTools();
    } else {
        console.debug(`PATCHES - Skipping initAddTools(), found tool=${tool}`);
    }
})();

