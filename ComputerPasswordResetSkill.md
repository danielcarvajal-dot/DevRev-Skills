# Computer: Keycloak password reset

## Purpose
Let any Keycloak user reset or unlock their account from **Computer**
chat — including `danielcarvajal` managing his own account. Computer uses
org skills that call the same Keycloak Admin API as the **Keycloak Password
Reset** snap-in (`/reset_password`, `/unlock_account`, `/check_account`).

## Trigger phrases
- "reset my password"
- "I'm locked out of Keycloak"
- "forgot my password"
- "unlock my account"
- "check my Keycloak account"
- "unlock danielcarvajal"
- "check testuser@yourcompany.com"

## Skills on Computer
In org **dcm-test**, Computer (`ai_agent-4`) and **Password Reset Assistant**
(`ai_agent-6`) have these skills. Open Computer (the search bar) or the
Password Reset Assistant and ask in natural language.

Start a **new** Computer chat after a skill change so the agent picks up the
latest input schema.

| Skill | When to use | What to pass |
| --- | --- | --- |
| `KeycloakCheckAccount` | Read-only status (enabled / brute-force lockout). `enabled: false` is a permanent lockout — call unlock next. | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |
| `KeycloakUnlockAccount` | Clear lockout **and** re-enable the user (`PUT enabled: true`). Lifts permanent lockout. | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |
| `ResetPassword` | Re-enable if needed, then send a Keycloak `UPDATE_PASSWORD` email | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |

Do **not** pass `method`, `url`, `headers`, `body`, a client secret, or an
access token. Those stay on the skill workflow. Each run mints a **new**
Keycloak token via client credentials against the public Keycloak URL
(ngrok). A JWT copied from laptop Keycloak (`iss: localhost:8080`) is
rejected on that public URL and is not stored on the skill.

`KeycloakGetToken` is no longer attached. Each skill fetches its own token.

## Flow
1. Identify the Keycloak user. Accept an email, username, or user UUID.
   If the user says "my password" / "unlock me", try in this order:
   - their DevRev email
   - the same mailbox on `@devrev.com` when the login is `@devrev.ai`
   - username `danielcarvajal` when the requester is Daniel
   - the DevRev display name with hyphens stripped (`daniel-carvajal` → `danielcarvajal`)
2. Call `KeycloakCheckAccount` with that email **or** username.
3. If `enabled` is false or the account is brute-force locked, call
   `KeycloakUnlockAccount` with the same identity. That skill re-enables
   the user. Do not treat `enabled: false` as an admin hold you cannot lift.
4. For a password reset: `ResetPassword` with the same identity (also
   re-enables, then sends `UPDATE_PASSWORD` via `execute-actions-email`).
5. Confirm the account is enabled. Do not dump client secrets, tokens, or API internals.

Published skill versions in **dcm-test**: Check **35.9**, Unlock **36.10**,
Reset **33.9**. Start a new Computer chat after those publishes.

The realm is not limited to `testuser`. Any user in `account-unlock` can be
looked up this way.

## Guardrails
- A requester may manage **their own** Keycloak account (Daniel unlocking
  `danielcarvajal` is expected).
- Do not reset someone else's account unless the requester is clearly helping
  that person and names their email or username.
- Never paste a temporary password into a public ticket or customer thread.
- If Keycloak is unreachable, tell the user to keep the laptop tunnel up.

## Demo accounts (realm `account-unlock`)
- `danielcarvajal` / `daniel.carvajal@devrev.com` (DevRev login is `@devrev.ai`)
- `testuser` / `testuser@yourcompany.com`

## ngrok: token 200 then Admin API 401

If the ngrok inspector shows this sequence:

```text
POST /realms/account-unlock/protocol/openid-connect/token             200 OK
GET  /admin/realms/account-unlock/users                               401 Unauthorized
GET  /admin/realms/account-unlock/attack-detection/brute-force/users/ 401 Unauthorized
```

the token mint worked. The next calls were sent **without a usable Bearer token**
(often `Bearer "eyJ..."` with extra quotes, or a missing `Authorization` header).
The lockout path ending in `users/` means Find User did not return a user id.

Computer skills **33.8 / 35.8 / 36.8** send
`"Bearer " & $replace($string($get('get_token','output').body), '"', '')`.
Do not use `$eval` — DevRev JSONata does not implement it, and Find User
fails while building headers (`cannot call non-function $eval`).
Start a **new** Computer chat and try `check danielcarvajal`. In ngrok you want:

```text
POST /realms/.../token                                               200
GET  /admin/realms/account-unlock/users?search=danielcarvajal        200
GET  /admin/realms/.../brute-force/users/<uuid>                      200
```

Confirm Keycloak itself accepts the service account (from the laptop):

```bash
TOKEN=$(curl -sS -H 'ngrok-skip-browser-warning: true' \
  -d 'grant_type=client_credentials&client_id=unlock-agent&client_secret=<secret>' \
  https://<your-ngrok-host>/realms/account-unlock/protocol/openid-connect/token \
  | jq -r .access_token)

curl -sS -D- -o /tmp/users.json \
  -H "Authorization: Bearer $TOKEN" \
  -H 'ngrok-skip-browser-warning: true' \
  "https://<your-ngrok-host>/admin/realms/account-unlock/users?search=danielcarvajal"
```

You want `HTTP/2 200` and a JSON array. `401` with a quoted `Bearer "eyJ..."` is
the same Computer-skill bug. `401` with a raw token means the `unlock-agent`
service account is missing `view-users` / `manage-users` (usually `403`) or
Keycloak was restarted onto a new hostname — update the snap-in **Keycloak URL**
and the Computer skill HTTP URLs to the current `https://….ngrok-free.dev/` origin.
