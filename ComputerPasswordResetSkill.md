# Computer: Keycloak password reset

## Purpose
Let the main user reset or unlock their Keycloak account from **Computer**
chat. Computer uses the **Keycloak Password Reset** snap-in configuration
(same Admin API as `/reset_password`, `/unlock_account`, `/check_account`).

## Trigger phrases
- "reset my password"
- "I'm locked out of Keycloak"
- "forgot my password"
- "unlock my account"
- "check my Keycloak account"
- "reset the password for testuser@yourcompany.com"

## Skills on Computer
In org **dcm-test**, Computer (`ai_agent-4`) and **Password Reset Assistant**
(`ai_agent-6`) already have these skills. Open Computer (the search bar) or
the Password Reset Assistant and ask in natural language.

| Skill | When to use |
| --- | --- |
| `KeycloakGetToken` | First. Client-credentials token for the snap-in confidential client. |
| `KeycloakCheckAccount` | Read-only status (enabled / brute-force lockout). |
| `KeycloakUnlockAccount` | Clear lockout and re-enable. No password change. |
| `ResetPassword` | Unlock if needed, then send `UPDATE_PASSWORD` email or set a temp password. |

## Flow
1. Identify the Keycloak email (or user UUID). If the user says "my password",
   use their DevRev email. If that address is not in the realm, ask once.
2. Call `KeycloakGetToken`. Keep the access token out of the user-visible reply.
3. `GET /admin/realms/{realm}/users?email={email}&exact=true` (or GET by id).
4. `GET /admin/realms/{realm}/attack-detection/brute-force/users/{userId}`.
5. If locked: `DELETE` the same brute-force path. If `enabled: false`:
   `PUT /admin/realms/{realm}/users/{userId}` with the full user body and
   `enabled: true`.
6. Password reset: `PUT .../users/{userId}/execute-actions-email` with
   `["UPDATE_PASSWORD"]`. If realm SMTP is missing, set a temporary password
   (`PUT .../reset-password`, `temporary: true`) and show it only to the
   requesting user.
7. Confirm what changed. Do not dump client secrets, tokens, or API internals.

## Guardrails
- Do not reset someone else's account unless the requester is clearly helping
  that person and names their email.
- Never paste a temporary password into a public ticket or customer thread.
- Send `ngrok-skip-browser-warning: true` on every Keycloak call when the
  realm is reached through a free ngrok URL.
- If Keycloak is unreachable, tell the user to keep the laptop tunnel up and
  update the snap-in **Keycloak URL**.

## Demo accounts (realm `account-unlock`)
- `testuser@yourcompany.com`
- `daniel.carvajal@devrev.com` (not the `@devrev.ai` DevRev login)
