# Printer Driver Installer

Install printer drivers inside a VM (or any machine this Computer session
is running on). Prefer the bundled scripts over ad-hoc package commands so
the install stays idempotent and works without a physical printer attached.

---

## When to use

- The user asks to install a printer driver, set up printing, or add a printer
  in a VM / Computer environment
- A workflow, test, or app needs CUPS / Windows print queues available
- The VM should be able to “print” even with no USB/network printer (virtual PDF)

Do not use this for Windows kernel-mode exploit drivers, unsigned malware
droppers, or anything other than legitimate printer/PPD/INF installation.

---

## Scripts

| OS | Script | How to run |
|---|---|---|
| Linux (Debian/Ubuntu, RHEL/Fedora, Alpine, SUSE, Arch) | `scripts/install-printer-driver.sh` | `sudo bash scripts/install-printer-driver.sh --yes` |
| Windows | `scripts/install-printer-driver.ps1` | `powershell -ExecutionPolicy Bypass -File scripts/install-printer-driver.ps1` |

The Linux script requires root. Always pass `--yes` in a VM / non-interactive
session. Use `--dry-run` first when you only want to see what would change.

---

## Default Linux behavior

Running with `--yes` and no other flags:

1. Detects the distro and installs CUPS, Ghostscript, filters, Gutenprint, and
   Foomatic PPDs
2. Enables and starts the CUPS service
3. Adds a virtual **PDF** printer (cups-pdf when available, otherwise a file
   URI queue) and makes it the system default if none exists

That is enough for a headless VM: `lpstat -p -d` should show a queue, and
`echo hello | lp` should submit a job.

---

## Linux options

```bash
# Core printing stack only (CUPS + filters, no extra vendor drivers)
sudo bash scripts/install-printer-driver.sh --yes --drivers core --no-pdf-printer

# Also pull HP / Brother / Epson packages
sudo bash scripts/install-printer-driver.sh --yes --drivers vendor

# Add a network IPP printer
sudo bash scripts/install-printer-driver.sh --yes \
  --printer-name Office \
  --device-uri ipp://192.168.1.50/ipp/print

# Install a vendor PPD and print a test page
sudo bash scripts/install-printer-driver.sh --yes \
  --printer-name LabPrinter \
  --device-uri socket://10.0.0.20:9100 \
  --ppd /path/to/model.ppd \
  --test-page
```

Useful flags: `--model` (CUPS `lpinfo -m` URI), `--skip-packages`,
`--no-start`, `--no-pdf-printer`, `--dry-run`.

Log file: `/var/log/install-printer-driver.log` when run as root (otherwise a per-user file under `/tmp`). Override with `PRINTER_DRIVER_LOG`.

---

## Windows options

```powershell
# Enable Print to PDF / confirm built-in drivers
powershell -ExecutionPolicy Bypass -File scripts/install-printer-driver.ps1

# Add a TCP/IP printer using Microsoft IPP Class Driver
powershell -ExecutionPolicy Bypass -File scripts/install-printer-driver.ps1 `
  -PrinterName Office -PortHost 192.168.1.50

# Install a vendor INF, then add the queue
powershell -ExecutionPolicy Bypass -File scripts/install-printer-driver.ps1 `
  -InfPath C:\drivers\oemsetup.inf `
  -DriverName "HP Universal Printing PCL 6" `
  -PrinterName LabPrinter `
  -PortHost 10.0.0.20
```

---

## How the Computer agent should run this

1. Detect OS (`uname`, `/etc/os-release`, or `Get-ComputerInfo`).
2. Copy or use the script from this repo; do not rewrite package lists by hand
   unless the script is missing a distro.
3. Linux: `sudo bash scripts/install-printer-driver.sh --yes` plus any
   printer URI/PPD the user provided. Windows: run the `.ps1` as Administrator.
4. Verify:
   - Linux: `lpstat -r`, `lpstat -p -d`, `lpinfo -m | head`
   - Windows: `Get-PrinterDriver`, `Get-Printer`
5. If the user named a network printer but gave no URI/IP, ask once, then
   proceed with the virtual PDF printer so the VM still has a working queue.
6. If package install fails (offline VM, missing repo), report the log path
   and the exact failing command; do not claim the driver is installed.

On Ubuntu 24.04 this script was verified to:
- install CUPS, Ghostscript, Gutenprint, Foomatic, and `printer-driver-cups-pdf`
- start `cupsd` even when PID 1 is not systemd
- create a default queue named `PDF` using `cups-pdf:/`
- accept `echo hello | lp` and write a PDF under `$HOME/PDF/`

---

## Troubleshooting

| Symptom | What to check |
|---|---|
| `lpadmin: Bad file descriptor` / CUPS not running | `systemctl status cups`; re-run without `--no-start` |
| `lpinfo: Bad file descriptor` | CUPS socket not up yet; wait and retry `lpstat -r` |
| PDF printer missing | Install `printer-driver-cups-pdf` / `cups-pdf`, or accept the `file://` fallback. Output lands in `$HOME/PDF/` |
| Network printer not printing | Confirm URI (`ipp://`, `socket://host:9100`, `usb://`), firewall, and `lpstat -v` |
| Need a specific model | `lpinfo -m \| grep -i <brand>` then pass `--model` |
| Permission denied | Script must run as root / Administrator |
