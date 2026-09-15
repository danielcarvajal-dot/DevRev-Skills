# Keycloak Password Reset Skill

## Purpose
Recover a Keycloak user from DevRev: look up the account, clear a brute-force
lockout, re-enable the user, and reset the password (temporary Admin API
password, or a Keycloak reset email when realm SMTP is configured).

## Trigger phrases
- "reset their password"
- "locked out of Keycloak"
- "forgot password"
- "unlock this account"
- "build me a password reset snap-in"

## How it works
The **Keycloak Password Reset** snap-in (`keycloak-password-reset/`) exposes
discussion commands, a ticket-created automation, and an `agent_handler`
function that Computer uses for chat (JSON in, JSON out — no ticket comment).

From **Computer**, say "reset my password", "unlock danielcarvajal", or
"check testuser@yourcompany.com". Skills accept an email **or** username
(no HTTP method or client secret). Daniel's Keycloak email is
`daniel.carvajal@devrev.ai` — Computer emails his OTP to
`carvajaldae@gmail.com` via DevRev ticket TKT-23 (it cannot Notify the
same DevRev account that opened the chat, and FormSubmit is blocked from
server-side skills). Unlock and reset re-enable a permanent
lockout (`enabled: false`) — they do not only clear the brute-force counter.
See [ComputerPasswordResetSkill.md](ComputerPasswordResetSkill.md).

Use the commands on a ticket or conversation:

- `/reset_password user@example.com 123456` — unlock, enable, then reset (email link if SMTP works, otherwise a temp password)
- `/reset_password danielcarvajal 123456 --temp` — unlock, enable, set a temp password
- `/unlock_account danielcarvajal` — unlock and enable only
- `/check_account user@example.com` — report status only

If the customer already wrote an email or username on the ticket, the command
can run without arguments.

Do **not** paste a temporary password into an external / customer-visible
comment. `--temp` posts internally on purpose.

## Required configuration
- Keycloak base URL (must be reachable from DevRev, not `localhost`, for hosted functions)
- For a laptop Keycloak, expose it with ngrok: `ngrok http 8080`, then use the
  `https://….ngrok-free.app/` URL (see `keycloak-password-reset/README.md`).
  Do not pin `KC_HOSTNAME` on a free/ephemeral URL — that 302s later tunnels
  to a dead host and Chrome reports `net::ERR_ABORTED`. Verify with curl and
  `ngrok-skip-browser-warning`, not by loading `/admin` in the browser.
- Realm (demo default `account-unlock`)
- Confidential client `unlock-agent` with service-account roles `manage-users`, `view-users`, `query-users`
- Client secret stored as a Keycloak Admin connection

## Escalation
If Keycloak returns 401/403, the client credentials or realm-management roles
are wrong. Reset is still functional without realm SMTP: Computer
`ResetPassword` and the snap-in fall back to `PUT /reset-password` and
return a temporary password. `--temp` forces that path on a ticket.

If snap-in activate fails with Unauthorized on `command` objects, grant
**Command Interactor** to the snap-in bot (or include `command:write` in the
manifest). ActivateSnapIn creates slash commands as that service account.
