# VM Script Runner (Computer + snap-in)

Trigger cataloged scripts on a Computer VM. The snap-in is the picker;
Computer executes one Python dispatcher. The catalog is not limited to
the printer installer or Firefox shutdown — add any script later.

---

## When to use

- The user wants to run a VM script from DevRev / Computer
- A ticket or conversation uses `/vm-script`
- A timeline comment titled **Computer VM task** is posted by this snap-in
- Someone asks to add another operational script to the VM

---

## What Computer must run

The demo target is a **Windows VM**. From an **elevated** PowerShell in the repo checkout, never a rewritten one-liner:

```powershell
Set-Location C:\DevRev-Skills
python scripts\run_script.py run <script-id>
```

Examples:

```powershell
python scripts\run_script.py list
python scripts\run_script.py run hello-vm
python scripts\run_script.py run install-printer-driver
python scripts\run_script.py run shutdown-firefox -- -Force
```

On Linux VMs only, use `python3 scripts/run_script.py ...` instead.

If the snap-in comment includes a `cd /path && ...` prefix or
`--extra-catalog-json`, run that command exactly.

After the process exits, reply with the exit code and the last ~30 lines
of output. Do not claim success if the exit code is non-zero.

---

## How the snap-in is triggered

| Surface | What happens |
|---|---|
| `/vm-script` | SnapKit picker of every cataloged script |
| `/vm-script list` | Timeline list of ids |
| `/vm-script run <id>` | Posts a Computer VM task for that id |
| SnapKit button | Same as `run <id>` |
| Optional Computer webhook | Snap-in POSTs `{script_id, command}` if configured |

---

## Adding a script (not just printer / Firefox)

1. Put an executable under `scripts/` (Python, bash, or PowerShell).
2. Append an object to `scripts/catalog.json`:

```json
{
  "id": "disk-cleanup",
  "name": "Disk cleanup",
  "description": "Free space on the VM",
  "platforms": {
    "linux": {
      "argv": ["bash", "scripts/disk-cleanup.sh"],
      "default_args": [],
      "needs_root": true
    }
  }
}
```

3. Copy the same entry into `vm-script-snap-in/code/src/catalog.json`
   (or paste it into the snap-in’s **Extra catalog JSON** input so you
   do not need a new snap-in version).
4. Redeploy the snap-in only if you changed the bundled catalog file.

`id` values must be unique. The dispatcher refuses paths outside
`scripts/`.

---

## Built-in catalog

| id | Script |
|---|---|
| `install-printer-driver` | Windows: `scripts/install-printer-driver.ps1` (Print to PDF). Linux: `.sh` |
| `shutdown-firefox` | `scripts/shutdown-firefox.sh` / `.ps1` |
| `hello-vm` | `scripts/hello_vm.py` (example) |

---

## Troubleshooting

| Symptom | What to check |
|---|---|
| `unknown script id` | `python3 scripts/run_script.py list`; catalog id typo |
| `refusing path outside scripts/` | Catalog `argv` must stay under `scripts/` |
| `script file not found` | File missing on the VM checkout |
| Snap-in posts a task but nothing runs | Computer must execute the fenced PowerShell as Administrator; or set Computer webhook URL |
| `#Requires -RunAsAdministrator` | Re-run the same command in an elevated PowerShell |
| `python` not found | Install Python 3 from python.org and tick **Add python.exe to PATH** |
| Print to PDF missing on Server SKUs | Add the Print Server / Print to PDF feature, or pass a vendor `-InfPath` |
| Extra script missing from picker | Update bundled catalog.json or Extra catalog JSON, then reinstall |
