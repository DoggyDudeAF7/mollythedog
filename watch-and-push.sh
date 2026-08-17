```bash
#!/usr/bin/env bash

set -u

WATCH_PATH="${1:-.}"
QUIET_SECONDS="${QUIET_SECONDS:-10}"
POLL_SECONDS="${POLL_SECONDS:-2}"
COMMIT_PREFIX="${COMMIT_PREFIX:-Update site}"

cd "$(dirname "$0")" || exit 1

last_state=""
last_change_time=0
announced_pending=false

echo "Watching ${WATCH_PATH} for changes."
echo "After ${QUIET_SECONDS}s with no new changes, changes will be committed and pushed."
echo "Press Ctrl+C to stop."
echo

snapshot() {
  git status --porcelain -- "${WATCH_PATH}"
}

show_changed_files() {
  echo "Changed files:"
  git status --short -- "${WATCH_PATH}" | sed 's/^/  • /'
}

while true; do
  current_state="$(snapshot)"
  now="$(date +%s)"

  if [[ "${current_state}" != "${last_state}" ]]; then
    last_state="${current_state}"
    last_change_time="${now}"
    announced_pending=false
  fi

  if [[ -n "${current_state}" && "${announced_pending}" == false ]]; then
    echo "✓ Changes detected"
    show_changed_files
    echo
    echo "Waiting ${QUIET_SECONDS}s for saves to settle..."
    announced_pending=true
  fi

  if [[ -n "${current_state}" ]] && (( now - last_change_time >= QUIET_SECONDS )); then
    branch="$(git branch --show-current)"

    if [[ -z "${branch}" ]]; then
      echo "✗ Could not determine the current Git branch."
      echo "Skipping this push."
      echo
      last_change_time="${now}"
      sleep "${POLL_SECONDS}"
      continue
    fi

    echo
    echo "✓ Save period complete"
    echo "Staging changes..."

    git add -- "${WATCH_PATH}"

    if git diff --cached --quiet; then
      echo "No staged changes found."
      echo
      last_state="$(snapshot)"
      last_change_time="${now}"
      sleep "${POLL_SECONDS}"
      continue
    fi

    echo "✓ Changes staged"

    echo
    echo "Files being committed:"
    git diff --cached --name-status | sed 's/^/  • /'

    commit_message="${COMMIT_PREFIX}: $(date '+%Y-%m-%d %H:%M:%S')"

    echo
    echo "Committing..."
    echo "Message: ${commit_message}"

    if git commit -m "${commit_message}"; then
      echo "✓ Commit successful"

      echo
      echo "Pushing to origin/${branch}..."

      if git push origin "${branch}"; then
        echo "✓ Push successful"
        echo "✓ Site update sent to GitHub"
      else
        echo "✗ Push failed"
        echo "The commit still exists locally."
      fi
    else
      echo "✗ Commit failed"
      echo "I will keep watching for changes."
    fi

    echo
    echo "Watching for more changes..."
    echo

    last_state="$(snapshot)"
    last_change_time="$(date +%s)"
    announced_pending=false
  fi

  sleep "${POLL_SECONDS}"
done
```
