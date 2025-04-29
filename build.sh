#!/bin/bash

echo "Generating buildInfo.js..."

short_sha=$(echo "${VERCEL_GIT_COMMIT_SHA}" | cut -c1-7)

cat <<EOF > buildInfo.js
window.BUILD_INFO = {
    buildId: "${short_sha}",
    commitMessage: "${VERCEL_GIT_COMMIT_MESSAGE}",
    repoBranch: "${VERCEL_GIT_COMMIT_REF}"
};
EOF

echo "buildInfo.js generated:"
cat buildInfo.js