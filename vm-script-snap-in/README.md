# VM Script Runner snap-in

DevRev snap-in that lets you **choose a cataloged script** and have
[Computer](https://support.devrev.ai) run it on the VM through one Python
dispatcher:

```bash
python3 scripts/run_script.py run <script-id>
```

The catalog is not limited to the printer installer or Firefox closer.
Add any script by editing `scripts/catalog.json`.

## Install

1. Authenticate: `devrev profiles authenticate -o <org> -u <you@org>`
2. `devrev snap_in_package create-one --slug vm-script-runner`
3. From this folder (`vm-script-snap-in/`):

```bash
cd code
npm install
npm test
npm run build
npm run package
cd ..
devrev snap_in_version create-one --path .
devrev snap_in draft
```

4. In the snap-in config UI, set **VM repo path** to the checkout Computer uses
   (`.` if Computer starts in the repo). Optionally set **Extra catalog JSON**
   and a **Computer webhook URL**.
5. Deploy the snap-in.

## Use

On an issue, ticket, conversation, or part:

| Command | Result |
|---|---|
| `/vm-script` | SnapKit picker |
| `/vm-script list` | Catalog on the timeline |
| `/vm-script run hello-vm` | Posts a Computer VM task |
| `/vm-script run shutdown-firefox -- --force` | Same, with extra args |

Computer should execute the fenced command in that comment. See
`../VmScriptRunnerSkill.md`.

## Add a script

1. Add `scripts/your-script.sh` (or `.py` / `.ps1`).
2. Append an entry to `../scripts/catalog.json` **and**
   `code/src/catalog.json` (keep them identical), **or** paste the entry
   into Extra catalog JSON.
3. Upgrade the snap-in version if you changed the bundled catalog.
