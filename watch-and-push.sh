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

line() {
  printf '%*s\n' 60 '' | tr ' ' '─'
}

snapshot() {
  git status --porcelain -- "${WATCH_PATH}"
}

changed_count() {
  git status --porcelain -- "${WATCH_PATH}" | wc -l | tr -d ' '
}

show_changed_files() {
  git status --short -- "${WATCH_PATH}" | sed 's/^/  • /'
}

github_repo_url() {
  local remote_url

  remote_url="$(git remote get-url origin 2>/dev/null || true)"

  # HTTPS GitHub URL
  if [[ "${remote_url}" =~ ^https://github\.com/(.+)\.git$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
    return
  fi

  # HTTPS URL without .git
  if [[ "${remote_url}" =~ ^https://github\.com/(.+)$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
    return
  fi

  # SSH GitHub URL
  if [[ "${remote_url}" =~ ^git@github\.com:(.+)\.git$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
    return
  fi

  echo ""
}

echo
line
echo "🐶 MOLLY & SHAINA — GITHUB AUTO PUSHER"
line
echo
echo "📁 Watching: ${WATCH_PATH}"
echo "⏱  Save delay: ${QUIET_SECONDS}s"
echo "🔄 Poll rate: ${POLL_SECONDS}s"
echo
echo "Press Ctrl+C to stop."
echo
echo "👀 Watching for changes..."
echo

while true; do
  current_state="$(snapshot)"
  now="$(date +%s)"

  if [[ "${current_state}" != "${last_state}" ]]; then
    last_state="${current_state}"
    last_change_time="${now}"
    announced_pending=false
  fi

  if [[ -n "${current_state}" && "${announced_pending}" == false ]]; then
    count="$(changed_count)"

    echo
    echo "✏️  Changes detected — ${count} file(s) currently modified"
    echo "⏳ Waiting ${QUIET_SECONDS}s for saves to settle..."

    announced_pending=true
  fi

  if [[ -n "${current_state}" ]] &&
     (( now - last_change_time >= QUIET_SECONDS )); then

    branch="$(git branch --show-current)"

    if [[ -z "${branch}" ]]; then
      echo
      echo "✗ Could not determine the current Git branch."
      echo "Skipping this push."
      echo

      last_change_time="${now}"
      sleep "${POLL_SECONDS}"
      continue
    fi

    echo
    line
    echo "📦 PREPARING UPDATE"
    line
    echo
    echo "Changed files:"
    show_changed_files
    echo

    echo "Staging changes..."
    git add -- "${WATCH_PATH}"

    if git diff --cached --quiet; then
      echo "ℹ️  No staged changes found."
      echo

      last_state="$(snapshot)"
      last_change_time="${now}"
      announced_pending=false

      sleep "${POLL_SECONDS}"
      continue
    fi

    staged_files="$(git diff --cached --name-only | wc -l | tr -d ' ')"

    insertions="$(
      git diff --cached --numstat |
      awk '
        $1 ~ /^[0-9]+$/ { additions += $1 }
        END { print additions + 0 }
      '
    )"

    deletions="$(
      git diff --cached --numstat |
      awk '
        $2 ~ /^[0-9]+$/ { deletions += $2 }
        END { print deletions + 0 }
      '
    )"

    echo "✓ ${staged_files} file(s) staged"
    echo "  +${insertions} additions"
    echo "  -${deletions} deletions"
    echo

    commit_message="${COMMIT_PREFIX}: $(date '+%Y-%m-%d %H:%M:%S')"

    echo "💾 Creating commit..."
    echo "   ${commit_message}"

    if git commit --quiet -m "${commit_message}"; then

      commit_hash="$(git rev-parse --short HEAD)"
      full_commit_hash="$(git rev-parse HEAD)"

      echo "✓ Commit ${commit_hash} created"
      echo

      echo "🌐 Pushing to origin/${branch}..."

      push_log="$(mktemp)"
      push_start="$(date +%s)"

      if git push --quiet origin "${branch}" >"${push_log}" 2>&1; then

        push_end="$(date +%s)"
        push_seconds=$((push_end - push_start))

        repo_url="$(github_repo_url)"

        echo
        line
        echo "🚀 PUSH COMPLETE"
        line
        echo
        printf "Branch:     %s\n" "${branch}"
        printf "Commit:     %s\n" "${commit_hash}"
        printf "Files:      %s changed\n" "${staged_files}"
        printf "Changes:    +%s  -%s\n" "${insertions}" "${deletions}"
        printf "Push time:  %ss\n" "${push_seconds}"
        printf "Remote:     origin/%s\n" "${branch}"

        if [[ -n "${repo_url}" ]]; then
          printf "GitHub:     %s/commit/%s\n" \
            "${repo_url}" \
            "${full_commit_hash}"
        fi

        echo
        echo "✓ Site update sent to GitHub"

      else

        echo
        line
        echo "❌ PUSH FAILED"
        line
        echo
        echo "Commit ${commit_hash} still exists locally."
        echo
        echo "Git's error:"
        echo

        sed 's/^/  /' "${push_log}"

        echo
        echo "The auto-pusher will keep watching."

      fi

      rm -f "${push_log}"

    else

      echo
      echo "❌ Commit failed."
      echo "The auto-pusher will keep watching."

    fi

    echo
    line
    echo
    echo "👀 Watching for more changes..."
    echo

    last_state="$(snapshot)"
    last_change_time="$(date +%s)"
    announced_pending=false
  fi

  sleep "${POLL_SECONDS}"
done