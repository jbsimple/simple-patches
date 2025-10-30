// page structure:
// graph
// breakdown

let department_name = null;
let department_id = null;
let user = null;

async function fetchUserDetails() {
    try {
        const response = await fetch('/user/me');
        if (!response.ok) throw new Error('Failed to fetch user page');
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const deptIcon = doc.querySelector('i.fas.fa-exclamation-circle[data-bs-content="Department"]');
        if (deptIcon && deptIcon.parentElement) {
            department_name = deptIcon.parentElement.textContent.trim();
            const departmentLookUp = await searchDataList('department', department_name);
            if (departmentLookUp && departmentLookUp[0] && departmentLookUp.length === 0) {
                department_id = departmentLookUp[0]['id'];
            }
            console.debug('PATCHES - Department Lookup:', departmentLookUp);
        }

        const userSpan = doc.querySelector('span.fs-3.text-gray-800.text-hover-primary.fw-bolder.mb-3');
        if (userSpan) {
            user = userSpan.textContent.trim();
        }

        console.debug('PATCHES - Fetched user details:', { user, department_name, department_id });
        return { user, department_name, department_id };
    } catch (err) {
        console.error('PATCHES - Error fetching user details:', err);
        return { user: null, department_name: null, department_id: null, error: err.message };
    }
}


(async () => {
    const content_container = document.getElementById('kt_app_content_container');
    const toolbar = document.getElementById('kt_app_toolbar');
    let heading = null;
    let breadcrumb = null;
    if (toolbar) {
        heading = toolbar.querySelector('.page-heading');
        breadcrumb = toolbar.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `<li class="breadcrumb-item text-muted">
                <a href="/" class="text-muted text-hover-primary">Dashboard</a>
            </li>
            <li class="breadcrumb-item">
                <span class="bullet bg-gray-400 w-5px h-2px"></span>
            </li>
            <li class="breadcrumb-item text-muted">
                <a href="/productivity" class="text-muted text-hover-primary">Productivity</a>
            </li>`;
        }
    }

    if (content_container) {
        content_container.innerHTML = '';
    }

    await fetchUserDetails();

    if (content_container && window.location.href.includes('/productivity/employee')) { // simgle user
        document.title = document.title.replace('Employee Productivity', 'My Productivity');
        
        if (heading) {
            heading.textContent = 'My Productivity';
        }

        if (breadcrumb) {
            breadcrumb.innerHTML += `<!-- ADDITIONAL -->
            <li class="breadcrumb-item">
                <span class="bullet bg-gray-400 w-5px h-2px"></span>
            </li>
            <li class="breadcrumb-item text-muted">
                <a href="/productivity/employee/0" class="text-muted text-hover-primary">My Productivity</a>
            </li>`;
        }

        // function calls

    } else if (content_container && window.location.href.includes('/productivity') && !window.location.href.includes('/productivity/board') && !window.location.href.includes('/productivity/employee')) { // team
        document.title = document.title.replace('Productivity', 'Team Productivity');

        if (heading) {
            heading.textContent = 'Team Productivity';
        }

        // function calls
    }
})();