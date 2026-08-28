#!/usr/bin/env bash
# shutdown-firefox.sh
#
# Gracefully stop Firefox on a Linux VM (stable, ESR, Nightly, Dev Edition,
# snap, and Flatpak). Safe to re-run: exits 0 if Firefox is not running.
#
# Usage:
#   ./shutdown-firefox.sh
#   ./shutdown-firefox.sh --force
#   ./shutdown-firefox.sh --timeout 15 --dry-run
#
# Windows VMs: use the sibling script shutdown-firefox.ps1

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
TIMEOUT=10
FORCE=0
DRY_RUN=0
ALL_USERS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  cat <<EOF
${SCRIPT_NAME} — shut down Firefox

Usage:
  ${SCRIPT_NAME} [options]

Options:
  --timeout SECONDS  Wait this long after SIGTERM before giving up (default: 10)
  --force            Send SIGKILL to leftovers after the timeout
  --all-users        Stop Firefox for every user (requires root)
  --dry-run          List matching processes without signaling them
  -h, --help         Show this help

Examples:
  ${SCRIPT_NAME}
  ${SCRIPT_NAME} --force --timeout 5
  sudo ${SCRIPT_NAME} --all-users --force
EOF
}

log() {
  local level="$1"; shift
  case "$level" in
    INFO)  printf '%b[INFO]%b  %s\n' "$BLUE" "$NC" "$*" ;;
    OK)    printf '%b[OK]%b    %s\n' "$GREEN" "$NC" "$*" ;;
    WARN)  printf '%b[WARN]%b  %s\n' "$YELLOW" "$NC" "$*" ;;
    ERROR) printf '%b[ERROR]%b %s\n' "$RED" "$NC" "$*" ;;
    *)     printf '%s\n' "$*" ;;
  esac
}

die() { log ERROR "$*"; exit 1; }

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --timeout)   TIMEOUT="${2:-}"; shift 2 ;;
      --force)     FORCE=1; shift ;;
      --all-users) ALL_USERS=1; shift ;;
      --dry-run)   DRY_RUN=1; shift ;;
      -h|--help)   usage; exit 0 ;;
      *)           die "Unknown argument: $1 (use --help)" ;;
    esac
  done
  [[ "$TIMEOUT" =~ ^[0-9]+$ ]] || die "--timeout must be a non-negative integer"
  if [[ "$ALL_USERS" -eq 1 && "$(id -u)" -ne 0 && "$DRY_RUN" -eq 0 ]]; then
    die "--all-users requires root (try: sudo $0 --all-users)"
  fi
}

# Match Firefox binaries and helper processes only — never this script
# or a random command line that merely mentions "firefox".
is_firefox_process() {
  local comm="$1"
  local exe="$2"
  local cmdline="$3"

  case "$comm" in
    firefox|firefox-bin|firefox-esr|firefox-nightly|firefox-dev|firefox-developer-edition)
      return 0
      ;;
    "Web Content"|"WebExtensions"|"Privileged Cont"|"Privileged Cont+"|"RDD Process"|"Socket Process"|"Utility Process"|"Isolated Web Co"|"Fork Server")
      return 0
      ;;
  esac

  case "$exe" in
    */firefox|*/firefox-bin|*/firefox-esr|*/firefox-nightly|*/firefox-dev)
      return 0
      ;;
    */snap/firefox/*|*/flatpak/*firefox*|*/org.mozilla.firefox/*)
      return 0
      ;;
  esac

  case "$cmdline" in
    /usr/lib/firefox/firefox*| /usr/lib/firefox-esr/firefox*| \
    /opt/firefox/firefox*| /snap/firefox/*)
      return 0
      ;;
  esac
  return 1
}

proc_uid() {
  awk '/^Uid:/{print $2; exit}' "/proc/$1/status" 2>/dev/null || true
}

proc_ppid() {
  awk '/^PPid:/{print $2; exit}' "/proc/$1/status" 2>/dev/null || true
}

collect_pids() {
  local pid comm exe cmdline uid ppid
  local my_uid
  my_uid="$(id -u)"
  local -A matched=()
  local -A comms=()
  local -A exes=()
  local -A ppids=()

  for pid in /proc/[0-9]*; do
    pid="${pid##*/}"
    [[ "$pid" =~ ^[0-9]+$ ]] || continue
    [[ "$pid" == "$$" ]] && continue

    comm=""
    exe=""
    cmdline=""
    uid=""

    if [[ -r "/proc/$pid/comm" ]]; then
      comm="$(tr -d '\n' <"/proc/$pid/comm" 2>/dev/null || true)"
    fi
    exe="$(readlink -f "/proc/$pid/exe" 2>/dev/null || true)"
    if [[ -r "/proc/$pid/cmdline" ]]; then
      cmdline="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
    fi
    uid="$(proc_uid "$pid")"
    ppid="$(proc_ppid "$pid")"

    if [[ "$ALL_USERS" -eq 0 && -n "$uid" && "$uid" != "$my_uid" ]]; then
      continue
    fi

    comms["$pid"]="$comm"
    exes["$pid"]="${exe:-$cmdline}"
    ppids["$pid"]="$ppid"

    if is_firefox_process "$comm" "$exe" "$cmdline"; then
      matched["$pid"]=1
    fi
  done

  # Include children of Firefox (content processes that were not matched yet).
  local changed=1
  while [[ "$changed" -eq 1 ]]; do
    changed=0
    for pid in "${!ppids[@]}"; do
      [[ -n "${matched[$pid]:-}" ]] && continue
      ppid="${ppids[$pid]}"
      if [[ -n "$ppid" && -n "${matched[$ppid]:-}" ]]; then
        matched["$pid"]=1
        changed=1
      fi
    done
  done

  for pid in "${!matched[@]}"; do
    printf '%s\t%s\t%s\n' "$pid" "${comms[$pid]}" "${exes[$pid]}"
  done
}

list_targets() {
  local rows
  rows="$(collect_pids || true)"
  if [[ -z "$rows" ]]; then
    return 1
  fi
  printf '%s\n' "$rows"
}

signal_pids() {
  local sig="$1"
  shift
  local pid
  for pid in "$@"; do
    if [[ "$DRY_RUN" -eq 1 ]]; then
      log INFO "dry-run: kill -s $sig $pid"
      continue
    fi
    if kill -s "$sig" "$pid" 2>/dev/null; then
      log INFO "sent $sig to pid $pid"
    else
      log WARN "could not signal pid $pid (already gone?)"
    fi
  done
}

still_running() {
  local pid
  for pid in "$@"; do
    if [[ -d "/proc/$pid" ]]; then
      return 0
    fi
  done
  return 1
}

wait_for_exit() {
  local deadline=$((SECONDS + TIMEOUT))
  local pid
  while (( SECONDS < deadline )); do
    still_running "$@" || return 0
    sleep 0.2
  done
  still_running "$@" && return 1
  return 0
}

main() {
  parse_args "$@"

  local rows
  rows="$(list_targets || true)"
  if [[ -z "$rows" ]]; then
    log OK "Firefox is not running"
    exit 0
  fi

  local pids=()
  local line pid comm rest
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    pid="${line%%$'\t'*}"
    rest="${line#*$'\t'}"
    comm="${rest%%$'\t'*}"
    log INFO "found Firefox pid $pid ($comm)"
    pids+=("$pid")
  done <<<"$rows"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    signal_pids TERM "${pids[@]}"
    log INFO "dry-run complete; ${#pids[@]} process(es) would be stopped"
    exit 0
  fi

  signal_pids TERM "${pids[@]}"

  if wait_for_exit "${pids[@]}"; then
    log OK "Firefox shut down"
    exit 0
  fi

  local leftover=()
  for pid in "${pids[@]}"; do
    if [[ -d "/proc/$pid" ]]; then
      leftover+=("$pid")
    fi
  done

  if [[ "$FORCE" -eq 1 ]]; then
    log WARN "Firefox still running after ${TIMEOUT}s; sending SIGKILL"
    signal_pids KILL "${leftover[@]}"
    sleep 0.3
    if still_running "${leftover[@]}"; then
      die "Firefox did not exit after SIGKILL"
    fi
    log OK "Firefox force-stopped"
    exit 0
  fi

  die "Firefox still running after ${TIMEOUT}s (pids: ${leftover[*]}). Re-run with --force."
}

main "$@"
