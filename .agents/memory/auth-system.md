---
name: Auth system design
description: Session-based login, RBAC, password reset flow — key decisions and gotchas
---

## Auth architecture
- Server-side sessions via `express-session` + `connect-pg-simple` (table: `user_sessions`)
- Passwords hashed with bcryptjs (12 rounds), stored in `users.password_hash`
- Cookie name: `ict.sid`, 8-hour max age, httpOnly, sameSite=lax
- Session secret from `SESSION_SECRET` env var

## First-time login
- If `password_hash` is NULL, any password is accepted and then hashed + stored immediately
- This lets seeded users log in without a pre-set password

## Roles and RBAC
- DB roles used in seed: `admin`, `ict_officer`, `user`
- Frontend `hasRole()` rank: admin=3, ict_officer=2, technician=2, user=1
- Nav items gated by minRole: Assets/Inventory/Maintenance/Reports need ict_officer+; Users page needs admin
- ROLE_BADGE in layout maps `ict_officer` → "ICT Officer" (blue badge)

## Password reset flow
- Table: `password_reset_tokens` (token, user_id FK, expires_at, used_at)
- Token: 32 random bytes hex, expires in 60 minutes, single-use (used_at set on redemption)
- `POST /api/auth/forgot-password` always returns 200 (no email enumeration)
- `POST /api/auth/reset-password` validates token not expired and not used
- Reset URL: `https://${REPLIT_DEV_DOMAIN}/reset-password?token=<hex>`
- Frontend `/reset-password` route is public — checked via window.location.pathname before auth gate

**Why:** Standard secure patterns — server sessions avoid JWT revocation complexity; single-use tokens prevent replay attacks; always-200 on forgot prevents account enumeration.
