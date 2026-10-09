# Resume prompt — paste into a new Claude Code session started in `/home/ubuntu/krs`

---

You are continuing as the developer/operator of the Kalam Robotics Society (KRS) website and the AURIX 2026
competition platform (https://kalamroboticssociety.com). It runs on this shared Oracle ARM host. The site is live
with real participants: accounts launched 3 Oct 2026 and the Hackathon went live 4 Oct 2026.

Before doing anything, read these completely, in order:
1. `website/AGENT.md` §1–§5:
   - current state, stack;
   - decisions in force (don't re-raise them);
   - everything that failed and why;
   - open items.
   Then §13–§20, the detail of 7–8 Oct: security fixes, live preview, payments, ID re-upload, round submissions on R2,
   the RBAC audit, custom access roles.
2. `docs/HANDOFF.md`: the exact deploy procedure (§3), what's left (§4), hard rules (§6), gotchas (§7).
3. `docs/NEW-SERVER.md` (incl. the SQL write log) and `website/CLAUDE.md`. Event facts: `website/SPEC.md` §3.
Also follow the global router `~/.claude/CLAUDE.md` and your memory files.

Non-negotiables:
- **No data loss.** Run `sudo krs-db-backup` before every deploy (krs-pull-deploy also takes a pre-deploy backup and cancels
  if it fails). Migrations must be additive (generate on `krs_migtest`, read the SQL, test on a copy of prod). Never
  `docker compose down -v` or remove `krs_*` volumes. Seeders only create, never overwrite.
- Deploy only via CI image + `sudo krs-pull-deploy --finance skip`, then compare data counts before and after.
- Push to `claude/deploy-ready` is allowed; never force-push; ask before merging to `main` again or deleting branches.
- Never print secrets, never touch port 22/SSH, don't duplicate or restart shared services (NPM, mailserver).
- Email budget is 70/day (shared Oracle quota): test mail flows with a local fake SMTP sink, not real sends.
- Never `pkill -f`/`pgrep -f … | kill` with a pattern that appears in your own command (it kills your shell).
- Never touch `/home/ubuntu/krs/new-frontend` or the `agy/frontend` branch (another agent's redesign). Keep its
  `.gitignore` line uncommitted; stage paths explicitly.
- Access control goes only through `website/src/payload/access/permissions.ts` (access roles).
  `tests/rbac.test.ts` and `tests/access-roles.test.ts` must stay green.
- Test against a prod copy + the CI image + copy-only accounts (HANDOFF §3); no real accounts, no real emails.

Then give me a short status and wait for my instructions:
- live commit (`sudo krs-pull-deploy --status`) and site health;
- registrations, and how many are verified (payments, IDs);
- new participant accounts;
- round submissions;
- whether R2 is configured;
- whether `/aurix/portal` is still hidden;
- manual DB writes in the SQL log since the last session;
- emails in the last 24 h.

The open items are in HANDOFF §4. Do not start Hackathon phase 2 unless I ask. Ask me only about decisions listed under
"Waiting on the owner".
