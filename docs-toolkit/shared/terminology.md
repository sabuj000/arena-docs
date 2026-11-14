# Terminology Reference: Arena

Enforced by the quality gate across every file a change touches (body, headings, metadata, nav, link
labels, URLs).

## Brand and product names
| Correct form | Do not use |
|---|---|
| Arena | ARENA, "the Arena", Arena's API (use "the Arena API") |
| Arena API | ArenaAPI, Arena-API |
| `api.arena.example` | any real domain |

## Settled terms
| Correct form | Do not use |
|---|---|
| leaderboard | leader board, scoreboard |
| webhook | web hook, callback URL (when meaning a webhook endpoint) |
| sandbox | test environment, staging (for Arena test mode) |
| player | user, gamer (for the Arena `player` resource) |
| item | product, SKU (for the Arena `item` resource) |
| idempotency key | idempotent key, request ID (for the `Idempotency-Key` header) |

## Acronyms: always uppercase
API · SDK · JSON · HTTP · HTTPS · URL · ID

## Concept pairs that must not be swapped
| Term | Not to be confused with | Why it matters |
|---|---|---|
| grant | purchase | A grant adds an item with no payment. A purchase takes payment and grants automatically. |
| secret key (`sk_`) | publishable key (`pk_`) | Secret keys must never ship in a game client. |
| end a match | cancel a match | Ending stores results. Cancelling stores none. |
| entitlement | inventory item | Entitlements are permanent non-consumable purchases. |

## Notes
- Resource names in code (`player`, `match`) are lowercase and in code font.
