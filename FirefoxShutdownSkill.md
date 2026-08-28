# Firefox Shutdown

Stop Firefox inside a VM (or any machine this Computer session is running
on). Prefer the bundled scripts over a raw `pkill firefox` so snap / ESR /
Nightly processes are included and unrelated command lines that merely
mention “firefox” are not killed.

---

## When to use

- The user asks to shut down, quit, close, or kill Firefox
- A workflow needs the browser gone before a profile copy, update, or logout
- Firefox is hung and a graceful stop (then optional force) is required

Do not use this to terminate arbitrary processes or to interfere with another
user’s session unless they asked for `--all-users`.

---

## Scripts

| OS | Script | How to run |
|---|---|---|
| Linux | `scripts/shutdown-firefox.sh` | `bash scripts/shutdown-firefox.sh` |
| Windows | `scripts/shutdown-firefox.ps1` | `powershell -ExecutionPolicy Bypass -File scripts/shutdown-firefox.ps1` |

Neither script needs root for the current user. Use `sudo` / Administrator
only with `--all-users` (Linux).

---

## Default Linux behavior

1. Scan `/proc` for Firefox binaries (`firefox`, `firefox-bin`, `firefox-esr`,
   Nightly / Dev Edition, snap, Flatpak)
2. Send SIGTERM
3. Wait up to 10 seconds
4. Exit 0 if everything stopped, or error if leftovers remain

If Firefox is not running, the script exits 0 and prints that it is already
stopped.

---

## Linux options

```bash
# Graceful stop (default)
bash scripts/shutdown-firefox.sh

# Force-kill leftovers after 5 seconds
bash scripts/shutdown-firefox.sh --force --timeout 5

# Preview matching PIDs
bash scripts/shutdown-firefox.sh --dry-run

# Every user on the VM
sudo bash scripts/shutdown-firefox.sh --all-users --force
```

---

## Windows options

```powershell
powershell -ExecutionPolicy Bypass -File scripts/shutdown-firefox.ps1
powershell -ExecutionPolicy Bypass -File scripts/shutdown-firefox.ps1 -Force -Timeout 5
powershell -ExecutionPolicy Bypass -File scripts/shutdown-firefox.ps1 -DryRun
```

---

## How the Computer agent should run this

1. Detect OS.
2. Run the matching script. Do not `pkill -f firefox` (that can match this
   script or an unrelated command line).
3. If the user said “force quit” / “kill”, pass `--force` / `-Force`.
4. Verify:
   - Linux: no remaining `firefox` / `firefox-bin` / `firefox-esr` in `/proc`
   - Windows: `Get-Process firefox -ErrorAction SilentlyContinue` is empty
5. If the script reports Firefox is not running, treat that as success.

---

## Troubleshooting

| Symptom | What to check |
|---|---|
| Script says Firefox is not running but a window is visible | It may be Chrome / a different browser, or another user’s process (use `--all-users`) |
| Exits with leftovers after the timeout | Re-run with `--force` |
| Snap Firefox respawns | Snap wrappers can restart once; re-run the script |
| Permission denied on another user’s PID | Drop `--all-users` or run as root |
