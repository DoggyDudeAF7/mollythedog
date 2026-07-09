#!/usr/bin/env bash

set -u

WATCH_PATH="${1:-.}"
QUIET_SECONDS="${QUIET_SECONDS:-10}"
POLL_SECONDS="${POLL_SECONDS:-2}"
COMMIT_PREFIX="${COMMIT_PREFIX:-Update site}"

cd "$(dirname "$0")" || exit 1

last_state=""
last_change_time=0

echo "Watching ${WATCH_PATH} for changes."
echo "After ${QUIET_SECONDS}s with no new changes, I will commit and push."
echo "Press Ctrl+C to stop."

snapshot() {
  git status --porcelain -- "${WATCH_PATH}"
}

while true; do
  current_state="$(snapshot)"
  now="$(date +%s)"

  if [[ "${current_state}" != "${last_state}" ]]; then
    last_state="${current_state}"
    last_change_time="${now}"
  fi

  if [[ -n "${current_state}" ]] && (( now - last_change_time >= QUIET_SECONDS )); then
    branch="$(git branch --show-current)"

    if [[ -z "${branch}" ]]; then
      echo "Could not find the current branch. Skipping this push."
      last_change_time="${now}"
      sleep "${POLL_SECONDS}"
      continue
    fi

    git add -- "${WATCH_PATH}"

    if git diff --cached --quiet; then
      last_state="$(snapshot)"
      last_change_time="${now}"
      sleep "${POLL_SECONDS}"
      continue
    fi

    commit_message="${COMMIT_PREFIX}: $(date '+%Y-%m-%d %H:%M:%S')"

    if git commit -m "${commit_message}"; then
      git push origin "${branch}"
    else
      echo "Commit failed. I will keep watching."
    fi

    last_state="$(snapshot)"
    last_change_time="$(date +%s)"
  fi

  sleep "${POLL_SECONDS}"
done
