#!/bin/bash

echo "Generating buildInfo.js..."

short_sha=$(echo "${VERCEL_GIT_COMMIT_SHA}" | cut -c1-7)

clean_commit_message=$(echo "${VERCEL_GIT_COMMIT_MESSAGE}" | \
    sed 's/\\/\\\\/g; s/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

build_time=$(TZ="America/New_York" date +"%Y-%m-%d %H:%M:%S %Z")
build_version=$(TZ="America/New_York" date +"%Y-%m-%d")-${short_sha}

cat <<EOF > buildInfo.js
window.BUILD_INFO = {
    buildId: "${short_sha}",
    fullCommitId: "${VERCEL_GIT_COMMIT_SHA}",
    commitMessage: "${clean_commit_message}",
    repoBranch: "${VERCEL_GIT_COMMIT_REF}",
    repoOwner: "${VERCEL_GIT_REPO_OWNER}",
    repoName: "${VERCEL_GIT_REPO_SLUG}",
    repoID: "${VERCEL_GIT_REPO_ID}",
    environment: "${VERCEL_ENV}",
    deployUrl: "https://${VERCEL_URL}",
    buildTime: "${build_time}",
    build_version: "${build_version}"
};

// this is hear to hopefully make loading better...
// this is sloppy and I don't even really need a version tracker on the page
// but I want it.
const nav_sidebar = document.getElementById('kt_app_sidebar_navs_wrappers');
if (nav_sidebar) {
nav_sidebar.style.display = 'flex';
    nav_sidebar.style.flexDirection = 'column';
    
    //the sidebar sets the height with a js resize listener and also on init.
    //regular init function doesn't set the value properly so this is to fix it.
    nav_sidebar.style.height = (parseInt(nav_sidebar.style.height) + 40) + 'px';
    
    const version_container = document.createElement('div');
    version_container.setAttribute('style', 'padding: 0 25px; margin-top: 0.5rem; display: flex; flex-direction: column;');

    const separator = document.createElement('div');
    separator.setAttribute('class', 'app-sidebar-separator separator');
    version_container.appendChild(separator);
    
    const loaded_message = document.createElement('a');
    loaded_message.href = "https://simple-patches.vercel.app/";
    loaded_message.setAttribute('style', 'text-align: center;');
    loaded_message.textContent = 'Ver. ${build_version}';
    loaded_message.title = '${clean_commit_message}';
    loaded_message.classList = 'patches-loaded';
    loaded_message.setAttribute('target', '_blank');
    loaded_message.setAttribute('rel', 'noreferrer');
    version_container.appendChild(loaded_message);

    nav_sidebar.appendChild(version_container);
}
EOF

echo "buildInfo.js generated:"
cat buildInfo.js