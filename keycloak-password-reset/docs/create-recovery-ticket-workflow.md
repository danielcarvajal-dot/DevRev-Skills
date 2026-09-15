# Create a recovery ticket after Keycloak unlock or reset

Published in **dcm-test** as part of:

- `KeycloakUnlockAccount` workflow **36** (after Enable User)
- `ResetPassword` workflow **33** (after Send Reset Email)

When Computer finishes an unlock or password reset, the skill creates a
DevRev ticket and returns it in the Computer skill output so the user
gets a notification with ticket info and a working link.

## What Computer shows

Skill output fields:

| Field | Example |
| --- | --- |
| `ticket_id` | `TKT-25` |
| `ticket_url` | `https://app.devrev.ai/dcm-test/works/TKT-25` |
| `message` | includes the same id and URL |

Computer must paste `ticket_url` as-is so it is clickable.

## Ticket contents

| Field | Value |
| --- | --- |
| Type | Ticket |
| Part | Default Product 1 |
| Owner | Daniel (`DEVU-1`) |
| Title | `Keycloak unlock complete: <username or email>` or `Keycloak password reset complete: ...` |
| Body | Short audit note. No OTP. |

## Flow

Unlock: Get Token → Find User → Read OTP → Unlock → Enable → **Create ticket** → Skill output

Reset: same, plus Send Reset Email, then **Create ticket** → Skill output

OTP send (workflow 41) does not create a new ticket; it comments on TKT-23
to email Gmail.
