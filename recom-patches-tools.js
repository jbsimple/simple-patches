function toolinit() {
    const toolContainer = document.getElementById('kt_app_content_container');
    const tools = toolContainer.querySelectorAll('.card.card-flush');

    const newToolContainer = document.createElement('div');
    tools.forEach(tool => { newToolContainer.appendChild(tool); });
    toolContainer.innerHTML = newToolContainer.innerHTML;

    // add new button
    const emailCard = `<div class="card card-flush h-md-100">
                <!--begin::Card header-->
                <div class="card-header">
                    <!--begin::Card title-->
                    <div class="card-title">
                        <h2>Parse Email List</h2>
                    </div>
                    <!--end::Card title-->
                </div>
                <!--end::Card header-->
                <!--begin::Card body-->
                <div class="card-body pt-1">
                    <!--begin::Permissions-->
                    <div class="d-flex flex-column text-gray-600">
                        <div class="d-flex align-items-center py-2">
                            <span class="bullet bg-primary me-3">From Simple Patches</span>
                        </div>
                    </div>
                    <!--end::Permissions-->
                </div>
                <!--end::Card body-->
                <!--begin::Card footer-->
                <div class="card-footer flex-wrap pt-0">
                    <a target="_blank" href="https://simple-patches.vercel.app/email-import.html" class="btn btn-light btn-active-light-primary my-1">Open</a>
                </div>
                <!--end::Card footer-->
            </div>`;
    toolContainer.innerHTML += emailCard;

    toolContainer.setAttribute('style', 'display: flex; flex-wrap: wrap; gap: 1rem;');
}

toolinit();