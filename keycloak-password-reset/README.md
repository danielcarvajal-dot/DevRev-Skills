# Keycloak Password Reset snap-in

DevRev snap-in for a password-reset / account-unlock demo against Keycloak.

It implements the admin API flow from the attached Postman collection, then adds
the missing password-reset step:

1. **Access Token** — `POST /realms/{realm}/protocol/openid-connect/token` (client credentials, `unlock-agent`)
2. **Find User** — `GET /admin/realms/{realm}/users?email=`
3. **Check Lockout** — `GET /admin/realms/{realm}/attack-detection/brute-force/users/{userId}`
4. **Unlock User** — `DELETE` the same brute-force path
5. **Enable User** — `PUT /admin/realms/{realm}/users/{userId}` with `enabled: true`
6. **Password reset** — `PUT .../execute-actions-email` with `["UPDATE_PASSWORD"]`, or `--temp` to set a temporary password

## Commands

Use these in the Discussions tab of a ticket, issue, or conversation:

| Command | What it does |
| --- | --- |
| `/reset_password user@example.com` | Unlock if locked, enable if disabled, send a reset email |
| `/reset_password user@example.com --temp` | Same recovery, then set a temporary password (commented internally) |
| `/unlock_account user@example.com` | Unlock + enable only |
| `/check_account user@example.com` | Report lockout and enabled status |

If the email is omitted, the snap-in tries the ticket title, body, then reporter.

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

Demo user: `demo.user@example.com` / `DemoPass123!`.

Fail the password a few times to lock the account, then run `/unlock_account`
or `/reset_password` from DevRev.

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

A DevRev PAT and Keycloak URL / realm / client credentials are enough to install
this into an org. Localhost Keycloak is only reachable from your machine, not
from DevRev-hosted functions — use a public Keycloak URL for a live org demo.
