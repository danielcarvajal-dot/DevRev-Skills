# Keycloak Password Reset snap-in

DevRev snap-in for a password-reset / account-unlock demo against Keycloak.

It implements the admin API flow from the attached Postman collection, then adds
the missing password-reset step:

1. **Access Token** — `POST /realms/{realm}/protocol/openid-connect/token` (client credentials, `unlock-agent`)
2. **Find User** — email, username, user ID, or a `search=` query (also maps `@devrev.ai` ↔ `@devrev.com`)
3. **Check Lockout** — `GET /admin/realms/{realm}/attack-detection/brute-force/users/{userId}`
4. **Unlock User** — `DELETE` the same brute-force path
5. **Enable User** — `PUT /admin/realms/{realm}/users/{userId}` with `enabled: true`
6. **Password reset** — `PUT .../execute-actions-email` with `["UPDATE_PASSWORD"]`, or `--temp` to set a temporary password

## Sales engineer enablement

Train SEs with these two documents. The configuration guide stands up the
**dcm-test** lab. The demo script is the customer talk track.

- [Configure the Computer identity recovery demo](docs/se-configuration-guide.md)
  ([PDF](docs/se-configuration-guide.pdf))
- [Demo Computer as the service desk teammate](docs/se-demo-script.md)
  ([PDF](docs/se-demo-script.pdf))

Regenerate the PDFs after you edit the markdown:

```bash
python3 keycloak-password-reset/docs/export-pdfs.py
```

## Computer

After the snap-in is installed, Computer in the same org can reset a password
in chat. Skills `KeycloakCheckAccount`, `KeycloakUnlockAccount`, and
`ResetPassword` take `{ "email": "..." }` or `{ "username": "..." }` — method,
URL, and client credentials are stored on the skill. (`agent_handler` is the
snap-in JSON entrypoint for a future function-backed skill.)

See [ComputerPasswordResetSkill.md](../ComputerPasswordResetSkill.md).

Open Computer and try:

- `unlock my account` (uses your DevRev email, including `@devrev.ai` → `@devrev.com`)
- `check danielcarvajal`
- `unlock testuser@yourcompany.com`

If realm SMTP is not configured, ask Computer for a temporary password.

## Commands

Use these in the Discussions tab of a ticket, issue, or conversation:

| Command | What it does |
| --- | --- |
| `/reset_password user@example.com` | Unlock if locked, enable if disabled, send a reset email |
| `/reset_password danielcarvajal --temp` | Same recovery, then set a temporary password (commented internally) |
| `/unlock_account user@example.com` | Unlock + enable only |
| `/check_account danielcarvajal` | Report lockout and enabled status |

If the identity is omitted, the snap-in tries the ticket title, body, then reporter email. Username and Keycloak user ID also work.

Creating a ticket whose title or body mentions a forgotten password or lockout
also posts a Keycloak status comment and the command hints.

## Configure at install time

Create a **Keycloak Admin** connection with:

| Field | Demo default |
| --- | --- |
| Keycloak URL | `http://localhost:8080/` |
| Realm | `account-unlock` |
| Client ID | `unlock-agent` |
| Client Secret | `unlock-agent-demo-secret` |

Or use a snap-in secret that is only the client secret, and fill **Keycloak URL**,
**Realm**, and **Client ID** as organization inputs.

The confidential client needs a service account with realm-management roles
`manage-users`, `view-users`, and `query-users`.

`execute-actions-email` requires realm SMTP. If email is not configured, use
`--temp` for the demo.

## Local Keycloak demo

```bash
docker compose -f keycloak-password-reset/docker-compose.yml up
```

Admin console: [http://localhost:8080](http://localhost:8080) (`admin` / `admin`).

Demo users: `demo.user@example.com` / `DemoPass123!`, and `danielcarvajal`
(`daniel.carvajal@devrev.com`).

Fail the password a few times to lock the account, then run `/unlock_account`
or `/reset_password` from DevRev.

## Expose local Keycloak with ngrok

DevRev-hosted snap-in functions cannot reach `http://localhost:8080`. Tunnel
that port so the org can call your laptop Keycloak over HTTPS.

### 1. Install ngrok and sign in

Create a free account at [https://dashboard.ngrok.com](https://dashboard.ngrok.com)
and copy your authtoken.

```bash
# macOS
brew install ngrok

# or download from https://ngrok.com/download
```

```bash
ngrok config add-authtoken <your-authtoken>
```

### 2. Start Keycloak on port 8080

Leave this running in one terminal:

```bash
docker compose -f keycloak-password-reset/docker-compose.yml up
```

Optional: if password-reset emails should link back through the tunnel, set the
public hostname after the first `ngrok http` run, then restart compose with the
ngrok override:

```bash
export KC_HOSTNAME=https://<random>.ngrok-free.app
docker compose -f keycloak-password-reset/docker-compose.yml \
  -f keycloak-password-reset/docker-compose.ngrok.yml up
```

`start-dev` is already host-lenient for Admin API calls. `KC_HOSTNAME` mainly
matters for browser redirects and `execute-actions-email` links.

### 3. Open the tunnel

In a second terminal:

```bash
ngrok http 8080
```

The inspector prints a public URL, for example:

```text
Forwarding   https://a1b2c3d4.ngrok-free.app -> http://localhost:8080
```

Confirm it reaches Keycloak:

```bash
curl -sS -H 'ngrok-skip-browser-warning: true' \
  https://a1b2c3d4.ngrok-free.app/realms/account-unlock/.well-known/openid-configuration \
  | head
```

You should see JSON with `issuer` / `token_endpoint`, not an HTML interstitial.

### 4. Point the snap-in at that URL

Use the **https** origin **with a trailing slash** as **Keycloak URL**:

```text
https://a1b2c3d4.ngrok-free.app/
```

Realm, client id, and client secret stay the same (`account-unlock`,
`unlock-agent`, your client secret).

On the snap-in settings page:

1. Edit the **Keycloak Admin** connection (or create one) and paste the ngrok URL.
2. Set organization input **Keycloak URL** to the same value if you are not
   storing the URL inside the connection JSON.
3. Click **Deploy**.

Paste the public URL back here if you want the demo keyring updated for you.

### Free-tier gotchas

| Issue | What to do |
| --- | --- |
| Free tunnels show a browser warning page | The snap-in sends `ngrok-skip-browser-warning: true` on every Admin API call. Browsers still see the interstitial unless you click **Visit Site**. |
| URL changes every time you restart ngrok | Update the connection / `keycloak_url` each time, or reserve a domain on a paid plan (`ngrok http --url your-name.ngrok-free.app 8080`). |
| Tunnel dies when the laptop sleeps | Keep ngrok and Docker running while you demo. |
| `execute-actions-email` links still say localhost | Restart Keycloak with `KC_HOSTNAME` set to a **reserved** ngrok HTTPS origin, or use `/reset_password user@example.com --temp`. |
| Token `200` then Admin API `401`, lockout URL ends at `/users/` | Computer sent a bad/missing Bearer token. Skills 33.8+ use `$replace` (not `$eval`) to strip jq quotes around `access_token`. Start a new Computer chat. Confirm with curl: `Authorization: Bearer $(jq -r .access_token)` — not `Bearer "eyJ..."`. |
| Find User: `cannot call non-function $eval` | The Authorization header used `$eval`, which DevRev JSONata does not provide. Fixed in skills 33.8 / 35.8 / 36.8. |

Do not commit the ngrok URL, authtoken, or client secret.

### Fix `net::ERR_ABORTED` on the ngrok URL

Chrome reports `ERR_ABORTED` when the document request is cancelled. With Keycloak
on a **new** free ngrok URL that is almost always one of these:

1. **The free ngrok interstitial aborted the page.**  
   Opening `https://….ngrok-free.app/admin` in a browser does **not** send
   `ngrok-skip-browser-warning`. ngrok returns an HTML warning; Keycloak’s
   admin SPA then loads JS as HTML and Chrome aborts those requests.

   - Open the HTTPS URL once, click **Visit Site**, then go to `/admin`.
   - Or verify the tunnel with curl (this is what the snap-in does):

     ```bash
     curl -sS -D- -o /tmp/kc.json -H 'ngrok-skip-browser-warning: true' \
       https://<your-subdomain>.ngrok-free.app/realms/account-unlock/.well-known/openid-configuration
     ```

     You want `HTTP/2 200` and JSON. HTML from ngrok means the skip header is
     missing; a 302 to a *different* ngrok host means Keycloak still has the
     old hostname pinned.

2. **Keycloak is still pinned to the previous ngrok host.**  
   If you ever started compose with `KC_HOSTNAME=https://old.ngrok-free.app`,
   Keycloak 302s the new URL to the dead tunnel and the browser aborts.

   ```bash
   unset KC_HOSTNAME
   docker compose -f keycloak-password-reset/docker-compose.yml down
   docker compose -f keycloak-password-reset/docker-compose.yml up
   ngrok http 8080
   ```

   Do **not** pass `docker-compose.ngrok.yml` on a free/ephemeral URL. That
   file is only for a reserved domain. `KC_PROXY_HEADERS=xforwarded` and
   `KC_HOSTNAME_STRICT=false` are already in the base compose file.

3. **You opened the `http://` ngrok URL.**  
   Use only `https://….ngrok-free.app/` (trailing slash) as **Keycloak URL**.

The snap-in does not need the admin console to load in Chrome. If curl returns
JSON, paste the `https://….ngrok-free.app/` URL into the Keycloak Admin
connection and click **Deploy**.

## Develop and test the function code

```bash
cd keycloak-password-reset/code
npm install
npm test
npm run build
npm run package
```

`npm run package` writes `code/build.tar.gz` for `devrev snap_in_version create-one`.

Replay a fixture (needs a reachable Keycloak if you do not mock):

```bash
npm run start -- --functionName=command_handler --fixturePath=reset_password_command.json
```

## Install with the DevRev CLI

```bash
devrev profiles authenticate -o <dev-org-slug> -u <you@example.com>
devrev snap_in_version create-one --path ./keycloak-password-reset --create-package
devrev snap_in draft
```

Open the draft URL, attach the Keycloak connection, then deploy.

Deploy creates the slash commands as the snap-in service account. The
manifest requests `command:write` for that. If activate still errors with
`Unauthorized` on `command` objects, grant the **Command Interactor** role
to the snap-in bot (Settings → User management → Roles).

A DevRev PAT and Keycloak URL / realm / client credentials are enough to install
this into an org. Localhost Keycloak is only reachable from your machine, not
from DevRev-hosted functions — use a public Keycloak URL for a live org demo.
