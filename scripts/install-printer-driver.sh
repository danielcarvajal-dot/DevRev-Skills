#!/usr/bin/env bash
# install-printer-driver.sh
#
# Install printer drivers (and CUPS) on a Linux VM. Safe to re-run.
# Default: CUPS + generic/open-source drivers + a virtual PDF printer
# so printing works even when no physical printer is attached.
#
# Usage:
#   sudo ./install-printer-driver.sh
#   sudo ./install-printer-driver.sh --pdf-printer
#   sudo ./install-printer-driver.sh --printer-name Office --device-uri ipp://192.168.1.50/ipp/print
#   sudo ./install-printer-driver.sh --ppd /path/to/model.ppd --printer-name LabPrinter --device-uri socket://10.0.0.20:9100
#   sudo ./install-printer-driver.sh --drivers all --yes
#
# Windows VMs: use the sibling script install-printer-driver.ps1

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE=""

DRIVERS="generic"          # generic | core | vendor | all
PDF_PRINTER=1              # on by default: VMs rarely have a physical printer
PRINTER_NAME=""
DEVICE_URI=""
PPD_FILE=""
DRIVER_MODEL=""            # CUPS model URI from `lpinfo -m`, e.g. drv:///sample.drv/generic.ppd
DRY_RUN=0
ASSUME_YES=0
START_CUPS=1
SKIP_PACKAGES=0
TEST_PAGE=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  cat <<EOF
${SCRIPT_NAME} — install printer drivers on a Linux VM

Usage:
  sudo ${SCRIPT_NAME} [options]

Options:
  --drivers SET        Driver set to install. One of:
                         core      CUPS + Ghostscript + filters only
                         generic   core + Gutenprint + Foomatic (default)
                         vendor    generic + HP/Brother/Epson packages
                         all       same as vendor
  --pdf-printer        Ensure a virtual PDF printer exists (default: on)
  --no-pdf-printer     Skip the virtual PDF printer
  --printer-name NAME  Queue name for a real/network printer
  --device-uri URI     CUPS device URI, e.g.
                         ipp://192.168.1.50/ipp/print
                         socket://10.0.0.20:9100
                         usb://HP/LaserJet
  --ppd PATH           Local PPD file to install for --printer-name
  --model MODEL        CUPS driver/model from \`lpinfo -m\`
  --test-page          Print a test page to the configured printer
  --skip-packages      Do not apt/dnf/yum install; only configure CUPS
  --no-start           Install packages but do not start/enable CUPS
  --dry-run            Print actions without changing the system
  -y, --yes            Non-interactive (required for unattended VMs)
  -h, --help           Show this help

Examples:
  sudo ${SCRIPT_NAME} --yes
  sudo ${SCRIPT_NAME} --yes --drivers vendor
  sudo ${SCRIPT_NAME} --yes --printer-name Office \\
      --device-uri ipp://printer.lab.local/ipp/print
EOF
}

init_log() {
  if [[ -n "${PRINTER_DRIVER_LOG:-}" ]]; then
    LOG_FILE="$PRINTER_DRIVER_LOG"
  elif [[ "$(id -u)" -eq 0 ]]; then
    LOG_FILE="/var/log/install-printer-driver.log"
  else
    LOG_FILE="${TMPDIR:-/tmp}/install-printer-driver-$USER.log"
  fi
  if ! : >"$LOG_FILE" 2>/dev/null; then
    LOG_FILE="${TMPDIR:-/tmp}/install-printer-driver-$(id -u).log"
    : >"$LOG_FILE" 2>/dev/null || LOG_FILE="/dev/null"
  fi
}

log() {
  local level="$1"; shift
  local ts
  ts="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  if [[ -n "$LOG_FILE" && "$LOG_FILE" != "/dev/null" ]]; then
    printf '%s [%s] %s\n' "$ts" "$level" "$*" >>"$LOG_FILE" 2>/dev/null || true
  fi
  case "$level" in
    INFO)  printf '%b[INFO]%b  %s\n' "$BLUE" "$NC" "$*" ;;
    OK)    printf '%b[OK]%b    %s\n' "$GREEN" "$NC" "$*" ;;
    WARN)  printf '%b[WARN]%b  %s\n' "$YELLOW" "$NC" "$*" ;;
    ERROR) printf '%b[ERROR]%b %s\n' "$RED" "$NC" "$*" ;;
    *)     printf '%s\n' "$*" ;;
  esac
}

die() { log ERROR "$*"; exit 1; }

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: $*"
    return 0
  fi
  log INFO "run: $*"
  "$@"
}

need_root() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    return 0
  fi
  if [[ "$(id -u)" -ne 0 ]]; then
    die "This script must be run as root (try: sudo $0 ...)"
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --drivers)        DRIVERS="${2:-}"; shift 2 ;;
      --pdf-printer)    PDF_PRINTER=1; shift ;;
      --no-pdf-printer) PDF_PRINTER=0; shift ;;
      --printer-name)   PRINTER_NAME="${2:-}"; shift 2 ;;
      --device-uri)     DEVICE_URI="${2:-}"; shift 2 ;;
      --ppd)            PPD_FILE="${2:-}"; shift 2 ;;
      --model)          DRIVER_MODEL="${2:-}"; shift 2 ;;
      --test-page)      TEST_PAGE=1; shift ;;
      --skip-packages)  SKIP_PACKAGES=1; shift ;;
      --no-start)       START_CUPS=0; shift ;;
      --dry-run)        DRY_RUN=1; shift ;;
      -y|--yes)         ASSUME_YES=1; shift ;;
      -h|--help)        usage; exit 0 ;;
      *)                die "Unknown argument: $1 (use --help)" ;;
    esac
  done

  case "$DRIVERS" in
    core|generic|vendor|all) ;;
    *) die "--drivers must be one of: core, generic, vendor, all" ;;
  esac

  if [[ -n "$PRINTER_NAME" && -z "$DEVICE_URI" ]]; then
    die "--printer-name requires --device-uri"
  fi
  if [[ -n "$DEVICE_URI" && -z "$PRINTER_NAME" ]]; then
    die "--device-uri requires --printer-name"
  fi
  if [[ -n "$PPD_FILE" && ! -f "$PPD_FILE" && "$DRY_RUN" -eq 0 ]]; then
    die "PPD file not found: $PPD_FILE"
  fi
}

confirm() {
  if [[ "$ASSUME_YES" -eq 1 || "$DRY_RUN" -eq 1 ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    die "Non-interactive session: pass --yes"
  fi
  read -r -p "Continue? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || die "Aborted"
}

detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    OS_ID="${ID:-unknown}"
    OS_LIKE="${ID_LIKE:-}"
    OS_VERSION_ID="${VERSION_ID:-}"
  else
    OS_ID="unknown"
    OS_LIKE=""
    OS_VERSION_ID=""
  fi
  log INFO "Detected OS: ${OS_ID} ${OS_VERSION_ID} (like: ${OS_LIKE:-n/a})"
}

pkg_install() {
  local pkgs=("$@")
  [[ ${#pkgs[@]} -eq 0 ]] && return 0

  if [[ "$SKIP_PACKAGES" -eq 1 ]]; then
    log INFO "Skipping package install (--skip-packages)"
    return 0
  fi

  case "$OS_ID" in
    ubuntu|debian|linuxmint|pop)
      export DEBIAN_FRONTEND=noninteractive
      export NEEDRESTART_MODE=a
      run apt-get update -y
      if [[ "$DRY_RUN" -eq 1 ]]; then
        log INFO "dry-run: apt-get install -y --no-install-recommends ${pkgs[*]}"
        return 0
      fi
      # Install what exists; skip packages the distro does not ship.
      local available=()
      local pkg
      for pkg in "${pkgs[@]}"; do
        if apt-cache show "$pkg" >/dev/null 2>&1; then
          available+=("$pkg")
        else
          log WARN "Package not available, skipping: $pkg"
        fi
      done
      if [[ ${#available[@]} -eq 0 ]]; then
        die "No printer packages were available. Check apt sources and network."
      fi
      run apt-get install -y --no-install-recommends "${available[@]}"
      ;;
    fedora|rhel|centos|rocky|almalinux|ol)
      if command -v dnf >/dev/null 2>&1; then
        run dnf install -y "${pkgs[@]}" || true
      else
        run yum install -y "${pkgs[@]}" || true
      fi
      ;;
    opensuse*|sles)
      run zypper --non-interactive install --no-recommends "${pkgs[@]}" || true
      ;;
    alpine)
      run apk add --no-cache "${pkgs[@]}" || true
      ;;
    arch|manjaro)
      run pacman -Sy --noconfirm "${pkgs[@]}" || true
      ;;
    *)
      if command -v apt-get >/dev/null 2>&1; then
        OS_ID=debian
        pkg_install "${pkgs[@]}"
      elif command -v dnf >/dev/null 2>&1; then
        OS_ID=fedora
        pkg_install "${pkgs[@]}"
      else
        die "Unsupported OS '${OS_ID}'. Install CUPS and drivers manually."
      fi
      ;;
  esac
}

driver_packages() {
  local set="$1"
  local pkgs=()

  case "$OS_ID" in
    ubuntu|debian|linuxmint|pop)
      pkgs+=(cups cups-client cups-bsd cups-filters cups-ppdc ghostscript)
      pkgs+=(foomatic-db-compressed-ppds foomatic-db-engine)
      if [[ "$set" == "generic" || "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(printer-driver-gutenprint printer-driver-pnm2ppa)
      fi
      if [[ "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(printer-driver-hpcups printer-driver-postscript-hp)
        pkgs+=(printer-driver-brlaser printer-driver-escpr)
        pkgs+=(hplip)
      fi
      if [[ "$PDF_PRINTER" -eq 1 ]]; then
        pkgs+=(printer-driver-cups-pdf cups-pdf)
      fi
      ;;
    fedora|rhel|centos|rocky|almalinux|ol)
      pkgs+=(cups cups-client cups-filters ghostscript)
      if [[ "$set" == "generic" || "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(gutenprint gutenprint-cups)
      fi
      if [[ "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(hplip)
      fi
      if [[ "$PDF_PRINTER" -eq 1 ]]; then
        pkgs+=(cups-pdf)
      fi
      ;;
    alpine)
      pkgs+=(cups cups-filters ghostscript)
      if [[ "$set" == "generic" || "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(gutenprint)
      fi
      ;;
    opensuse*|sles)
      pkgs+=(cups cups-client cups-filters ghostscript)
      if [[ "$set" == "generic" || "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(gutenprint)
      fi
      ;;
    arch|manjaro)
      pkgs+=(cups cups-filters ghostscript)
      if [[ "$set" == "generic" || "$set" == "vendor" || "$set" == "all" ]]; then
        pkgs+=(gutenprint foomatic-db foomatic-db-engine)
      fi
      if [[ "$PDF_PRINTER" -eq 1 ]]; then
        pkgs+=(cups-pdf)
      fi
      ;;
    *)
      pkgs+=(cups ghostscript)
      ;;
  esac

  printf '%s\n' "${pkgs[@]}"
}

cups_is_running() {
  # lpstat -r exits 0 even when the scheduler is down; trust the message.
  lpstat -r 2>/dev/null | grep -q 'scheduler is running'
}

start_cupsd_direct() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: mkdir -p cups runtime dirs && cupsd"
    return 0
  fi
  command -v cupsd >/dev/null 2>&1 || die "cupsd not found; CUPS package install likely failed"
  run mkdir -p /run/cups /var/run/cups /var/spool/cups /var/cache/cups /var/log/cups /etc/cups
  if cups_is_running; then
    log OK "CUPS already running"
    return 0
  fi
  run cupsd
}

start_cups() {
  [[ "$START_CUPS" -eq 1 ]] || { log INFO "Not starting CUPS (--no-start)"; return 0; }

  if [[ -d /run/systemd/system ]] && command -v systemctl >/dev/null 2>&1; then
    run systemctl enable --now cups || run systemctl enable --now cups.service || true
    run systemctl enable --now cups.socket 2>/dev/null || true
  elif command -v service >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
    run service cups start || run service cupsd start || true
  elif command -v rc-service >/dev/null 2>&1; then
    run rc-update add cupsd default || true
    run rc-service cupsd start || true
  else
    log INFO "No systemd session; starting cupsd directly (container/VM without an init)"
    start_cupsd_direct
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    return 0
  fi

  local i
  for i in $(seq 1 30); do
    if cups_is_running; then
      log OK "CUPS is running"
      return 0
    fi
    sleep 0.5
  done
  log WARN "CUPS may not be fully up yet; continuing"
}

enable_file_devices() {
  local conf updated=0
  for conf in /etc/cups/cups-files.conf /etc/cups/cupsd.conf; do
    [[ -f "$conf" ]] || continue
    if grep -qE '^[[:space:]]*FileDevice[[:space:]]' "$conf"; then
      run sed -i -E 's/^[[:space:]]*FileDevice[[:space:]].*/FileDevice Yes/' "$conf"
    else
      if [[ "$DRY_RUN" -eq 1 ]]; then
        log INFO "dry-run: append FileDevice Yes to $conf"
      else
        printf '\nFileDevice Yes\n' >>"$conf"
      fi
    fi
    updated=1
  done
  if [[ "$updated" -eq 1 && "$DRY_RUN" -eq 0 ]]; then
    if command -v cupsd >/dev/null 2>&1; then
      # cupsd -H graceful is not universal; HUP the running daemon.
      if pgrep -x cupsd >/dev/null 2>&1; then
        run pkill -HUP -x cupsd || true
        sleep 0.5
      fi
    fi
  fi
}

queue_exists() {
  local name="$1"
  lpstat -p "$name" >/dev/null 2>&1
}

pick_generic_model() {
  if [[ -n "$DRIVER_MODEL" ]]; then
    printf '%s\n' "$DRIVER_MODEL"
    return 0
  fi
  # Prefer CUPS sample generic PPD, then everywhere-PDF, then first available.
  local models
  models="$(lpinfo -m 2>/dev/null || true)"
  local candidate
  for candidate in \
      "lsb/usr/cups-pdf/CUPS-PDF_opt.ppd" \
      "lsb/usr/cups-pdf/CUPS-PDF.ppd" \
      "lsb/usr/cupsfilters/Generic-PDF_Printer-PDF.ppd" \
      "drv:///sample.drv/generic.ppd" \
      "everywhere"
  do
    if printf '%s\n' "$models" | grep -Fq "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  printf '%s\n' "everywhere"
}

add_or_update_printer() {
  local name="$1"
  local uri="$2"
  local extra=()

  if [[ -n "$PPD_FILE" ]]; then
    extra+=(-P "$PPD_FILE")
  else
    extra+=(-m "$(pick_generic_model)")
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: lpadmin -p $name -E -v $uri ${extra[*]}"
    return 0
  fi

  if queue_exists "$name"; then
    log INFO "Printer queue '$name' already exists; updating URI/driver"
  fi

  run lpadmin -p "$name" -E -v "$uri" "${extra[@]}"
  run cupsenable "$name" || true
  run cupsaccept "$name" || true
  log OK "Printer queue ready: $name ($uri)"
}

ensure_pdf_printer() {
  [[ "$PDF_PRINTER" -eq 1 ]] || return 0

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: add virtual PDF printer (cups-pdf if present, else file:// fallback)"
    return 0
  fi

  local name="${PDF_PRINTER_NAME:-PDF}"
  local uri="cups-pdf:/"
  local model=""
  local models
  models="$(lpinfo -m 2>/dev/null || true)"

  if printf '%s\n' "$models" | grep -Fq "lsb/usr/cups-pdf/CUPS-PDF_opt.ppd"; then
    model="lsb/usr/cups-pdf/CUPS-PDF_opt.ppd"
  elif printf '%s\n' "$models" | grep -Fq "lsb/usr/cups-pdf/CUPS-PDF.ppd"; then
    model="lsb/usr/cups-pdf/CUPS-PDF.ppd"
  elif printf '%s\n' "$models" | grep -q 'cups-pdf/CUPS-PDF'; then
    model="$(printf '%s\n' "$models" | awk '/cups-pdf\/CUPS-PDF/ {print $1; exit}')"
  elif printf '%s\n' "$models" | grep -Fq "lsb/usr/cupsfilters/Generic-PDF_Printer-PDF.ppd"; then
    model="lsb/usr/cupsfilters/Generic-PDF_Printer-PDF.ppd"
  else
    # Fallback: write PostScript/PDF to a spool file so the VM still has a queue.
    uri="file:///var/tmp/virtual-printer.ps"
    model="$(pick_generic_model)"
    log WARN "cups-pdf driver not found; using file URI $uri"
    enable_file_devices
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: lpadmin -p $name -E -v $uri -m $model"
    return 0
  fi

  if queue_exists "$name" && [[ "$uri" == cups-pdf:/* ]]; then
    log OK "PDF printer already present: $name"
  else
    run lpadmin -p "$name" -E -v "$uri" -m "$model"
    run cupsenable "$name" || true
    run cupsaccept "$name" || true
    log OK "Virtual PDF printer ready: $name"
  fi

  if ! lpstat -d >/dev/null 2>&1 || lpstat -d 2>/dev/null | grep -q "no system default"; then
    run lpadmin -d "$name" || true
    log OK "Set default printer: $name"
  fi
}

print_test_page() {
  [[ "$TEST_PAGE" -eq 1 ]] || return 0
  local target="${PRINTER_NAME:-${PDF_PRINTER_NAME:-PDF}}"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "dry-run: print test page to $target"
    return 0
  fi
  queue_exists "$target" || die "Cannot print test page: queue '$target' not found"
  printf 'Printer driver install test page\nHost: %s\nDate: %s\n' "$(hostname)" "$(date -u)" \
    | run lp -d "$target" -o job-sheets=none
  log OK "Submitted test page to $target"
}

summarize() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log INFO "Dry-run complete. Re-run without --dry-run to apply."
    return 0
  fi
  log INFO "Installed driver set: $DRIVERS"
  if command -v lpstat >/dev/null 2>&1; then
    log INFO "CUPS queues:"
    lpstat -p -d 2>/dev/null | tee -a "$LOG_FILE" || true
  fi
  if command -v lpinfo >/dev/null 2>&1; then
    local count
    count="$(lpinfo -m 2>/dev/null | wc -l | tr -d ' ')"
    log OK "Available CUPS models/drivers: $count"
  fi
  log OK "Done. Log: $LOG_FILE"
  if [[ "$PDF_PRINTER" -eq 1 ]]; then
    log INFO "PDF output (if cups-pdf is installed) is typically in ~/PDF or /var/spool/cups-pdf"
  fi
}

main() {
  parse_args "$@"
  init_log
  log INFO "Starting printer driver install (drivers=$DRIVERS pdf=$PDF_PRINTER)"
  detect_os
  need_root
  confirm

  mapfile -t PKGS < <(driver_packages "$DRIVERS")
  log INFO "Packages: ${PKGS[*]}"
  pkg_install "${PKGS[@]}"
  start_cups

  if [[ -n "$PRINTER_NAME" ]]; then
    add_or_update_printer "$PRINTER_NAME" "$DEVICE_URI"
  fi
  ensure_pdf_printer
  print_test_page
  summarize
}

main "$@"
