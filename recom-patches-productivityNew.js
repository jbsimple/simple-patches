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
            const departmentLookUp = await searchDataList(department_name);
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
    await fetchUserDetails();
})();