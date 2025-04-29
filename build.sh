#!/bin/bash

echo "Generating buildInfo.js..."

short_sha=$(echo "${VERCEL_GIT_COMMIT_SHA}" | cut -c1-7)
build_time=$(TZ="America/New_York" date +"%Y-%m-%d %H:%M:%S")
build_version=$(TZ="America/New_York" date +"%Y-%m-%d")-${short_sha}

cat <<EOF > buildInfo.js
window.BUILD_INFO = {
    buildId: "${short_sha}",
    fullCommitId: "${VERCEL_GIT_COMMIT_SHA}",
    commitMessage: "${VERCEL_GIT_COMMIT_MESSAGE}",
    repoBranch: "${VERCEL_GIT_COMMIT_REF}",
    repoOwner: "${VERCEL_GIT_REPO_OWNER}",
    repoName: "${VERCEL_GIT_REPO_SLUG}",
    environment: "${VERCEL_ENV}",
    deployUrl: "https://${VERCEL_URL}",
    buildTime: "${build_time}",
    build_version: "${build_version}"
};
EOF

echo "buildInfo.js generated:"
cat buildInfo.js