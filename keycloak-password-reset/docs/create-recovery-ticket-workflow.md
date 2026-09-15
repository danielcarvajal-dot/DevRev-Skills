# Create a recovery ticket after Keycloak unlock or reset

Published in **dcm-test** as part of:

- `KeycloakUnlockAccount` workflow **36** (after Enable User)
- `ResetPassword` workflow **33** (after Set Temporary Password)

When Computer finishes an unlock or password reset, the skill creates a
DevRev ticket and returns it in the Computer skill output so the user
gets a notification with ticket info and a working link.

## What Computer shows

Skill output fields:

| Field | Example |
| --- | --- |
| `ticket_id` | `TKT-25` |
| `ticket_url` | `https://app.devrev.ai/dcm-test/works/TKT-25` |
| `temporary_password` | Reset only. Example `KcReset-<otp-exp>-Aa1!` |
| `message` | includes the same id, URL, and (on reset) the temp password |

Computer must paste `ticket_url` as-is so it is clickable. On reset,
Computer also tells the user the temporary password once. Do not write
that password on the ticket.

## Ticket contents

| Field | Value |
| --- | --- |
| Type | Ticket |
| Part | Default Product 1 |
| Owner | Daniel (`DEVU-1`) |
| Title | `Keycloak unlock complete: <username or email>` or `Keycloak password reset complete: ...` |
| Body | Short audit note. No OTP and no temporary password. |

## Flow

Unlock: Get Token → Find User → Read OTP → Unlock → Enable → **Create ticket** → Skill output

Reset: same, plus **Set Temporary Password** (`PUT …/reset-password`), then
**Create ticket** → Skill output (`temporary_password` + `ticket_url`)

OTP send (workflow 41) does not create a new ticket; it comments on TKT-23
to email Gmail.
