#!/bin/bash
# build.sh

echo "Generating buildInfo.json..."

cat <<EOF > buildInfo.json
{
  "buildId": "${BUILD_ID}",
  "commitMessage": "${VERCEL_GIT_COMMIT_MESSAGE}",
  "repoBranch": "${VERCEL_GIT_COMMIT_REF}"
}
EOF
