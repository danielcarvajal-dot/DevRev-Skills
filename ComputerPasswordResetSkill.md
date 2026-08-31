# Computer: Keycloak password reset

## Purpose
Let the main user reset or unlock their Keycloak account from **Computer**
chat. Computer uses org skills that call the same Keycloak Admin API as the
**Keycloak Password Reset** snap-in (`/reset_password`, `/unlock_account`,
`/check_account`).

## Trigger phrases
- "reset my password"
- "I'm locked out of Keycloak"
- "forgot my password"
- "unlock my account"
- "check my Keycloak account"
- "reset the password for testuser@yourcompany.com"

## Skills on Computer
In org **dcm-test**, Computer (`ai_agent-4`) and **Password Reset Assistant**
(`ai_agent-6`) have these skills. Open Computer (the search bar) or the
Password Reset Assistant and ask in natural language.

Start a **new** Computer chat after a skill change so the agent picks up the
latest input schema.

| Skill | When to use | What to pass |
| --- | --- | --- |
| `KeycloakCheckAccount` | Read-only status (enabled / brute-force lockout) | `{ "email": "user@example.com" }` |
| `KeycloakUnlockAccount` | Clear lockout. No password change. | `{ "email": "user@example.com" }` |
| `ResetPassword` | Send a Keycloak `UPDATE_PASSWORD` email | `{ "email": "user@example.com" }` |

Do **not** pass `method`, `url`, `headers`, `body`, or a client secret. Those
are stored on the skill workflow (token request included). Computer only
needs the Keycloak email.

`KeycloakGetToken` is no longer attached. Each skill fetches its own token.

## Flow
1. Identify the Keycloak email (or user UUID). If the user says "my password",
   use their DevRev email. If that address is not in the realm, ask once.
2. Call `KeycloakCheckAccount` with the email.
3. If locked: `KeycloakUnlockAccount` with the same email.
4. For a password reset: `ResetPassword` with the same email (sends
   `UPDATE_PASSWORD` via `execute-actions-email`).
5. Confirm what changed. Do not dump client secrets, tokens, or API internals.

## Guardrails
- Do not reset someone else's account unless the requester is clearly helping
  that person and names their email.
- Never paste a temporary password into a public ticket or customer thread.
- If Keycloak is unreachable, tell the user to keep the laptop tunnel up.

## Demo accounts (realm `account-unlock`)
- `testuser@yourcompany.com`
- `daniel.carvajal@devrev.com` (not the `@devrev.ai` DevRev login)
