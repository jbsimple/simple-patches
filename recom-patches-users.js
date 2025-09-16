async function downloadUserLog(interval = 3) {
    // interval is how many days back to go
    let userID = null;
    const pathParts = window.location.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (/^\d+$/.test(lastPart)) {
        userID = lastPart;
    } else {
        const kt_user_view_details = document.getElementById("kt_user_view_details");
        if (kt_user_view_details) {
            const textgrays = kt_user_view_details.querySelectorAll(".text-gray-600");
            for (const textgray of textgrays) {
                const txt = textgray.textContent.trim();
                if (txt.startsWith("ID-")) {
                    const candidate = txt.substring(3).trim();
                    if (/^\d+$/.test(candidate)) {
                        userID = candidate;
                        break;
                    }
                }
            }
        }
    }

    if (!userID) {
        fireSwal("UHOH!", "Unable to find the User ID.", "error", true);
        console.error('PATCHES - Unable to find the user error.');
        return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - interval);

    const allLogs = [];

    async function fetchPage(page = 1) {
        const ajax = `/ajax/actions/LogEntriesByUser/${userID}?page=${page}`;
        const res = await fetch(ajax);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        if (!json.success) { throw new Error("API returned success=false"); }
        for (const entry of json.data) {
            const entryDate = new Date(entry.date);
            if (entryDate >= cutoffDate) { allLogs.push(entry); } else { return false; }
        }
        if (json.pagination && json.pagination.more) { return fetchPage(page + 1); }
        return true;
    }

    try {
        await fetchPage(1);
        console.log("Collected log entries:", allLogs);

        const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user_${userID}_logs.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error fetching user logs:", err);
        fireSwal("Error", "Could not fetch logs. Check console for details.", "error");
    }
}

function downloadUserLogsInit() {
    const LogEntriesTable = document.getElementById('LogEntriesTable');
    if (LogEntriesTable) {
        const parent_card = LogEntriesTable.parentElement.parentElement;
        if (parent_card.classList.contains('card')) {
            const card_title = parent_card.querySelector('.card-header > .card-title');
            if (card_title) {
                const card_toolbar = document.createElement('div');
                card_toolbar.classList = 'card-toolbar';

                const downloadLogButton = document.createElement('button');
                downloadLogButton.classList.add('btn', 'btn-info');
                downloadLogButton.id = 'patches_downloadUserLogs';
                downloadLogButton.textContent = 'Download';
                downloadLogButton.title = "Downloads logs from past 3 days.";
                downloadLogButton.style.cssText = `
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    cursor: pointer;
                    border-radius: 5px;
                `;
                downloadLogButton.onclick = () => downloadUserLog(3);
                card_toolbar.appendChild(donloadLogButton);

                card_title.insertAdjacentElement('afterend', card_toolbar);
            }
        }
    }
}

// this is already in source html so this should be fine to run
downloadUserLogsInit();