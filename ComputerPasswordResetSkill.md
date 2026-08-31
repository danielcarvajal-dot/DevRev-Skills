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
| `KeycloakCheckAccount` | Read-only status (enabled / brute-force lockout) | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |
| `KeycloakUnlockAccount` | Clear lockout. No password change. | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |
| `ResetPassword` | Send a Keycloak `UPDATE_PASSWORD` email | `{ "email": "..." }` or `{ "username": "danielcarvajal" }` |

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
3. If locked: `KeycloakUnlockAccount` with the same identity.
4. For a password reset: `ResetPassword` with the same identity (sends
   `UPDATE_PASSWORD` via `execute-actions-email`).
5. Confirm what changed. Do not dump client secrets, tokens, or API internals.

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
