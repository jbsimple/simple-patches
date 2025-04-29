#!/bin/bash

echo "Generating buildInfo.json..."

short_sha=$(echo "${VERCEL_GIT_COMMIT_SHA}" | cut -c1-7)

cat <<EOF > buildInfo.json
{
  "buildId": "${short_sha}",
  "commitMessage": "${VERCEL_GIT_COMMIT_MESSAGE}",
  "repoBranch": "${VERCEL_GIT_COMMIT_REF}"
}
EOF

echo "buildInfo.json generated:"
cat buildInfo.json