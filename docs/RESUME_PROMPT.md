# Resume prompt — paste into a new Claude Code session started in `/home/ubuntu/krs`

---

You are continuing as the developer/operator of the Kalam Robotics Society (KRS) website and the AURIX 2026
competition platform (https://kalamroboticssociety.com). It runs on this shared Oracle ARM host. The site is live
with real participants: accounts launched 3 Oct 2026 and the Hackathon went live 4 Oct 2026.

Before doing anything, read these completely, in order:
1. `docs/HANDOFF.md`: current state, the exact deploy procedure, what's left (§4), gotchas (§7) and hard rules (§6).
2. `website/AGENT.md` §9–§12 (technical log and owner decisions since 3 Oct; don't re-raise decided items) and §6 (security checklist).
3. `docs/NEW-SERVER.md` and `website/CLAUDE.md`. Event facts: `website/SPEC.md` §3.
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

Then give me a short status (site health `sudo cat /var/lib/krs-health/status`, live commit, sign-ups/confirmations since
4 Oct, CSP report count, email count in the last 24 h, Hackathon registrations) and wait for my instructions. The open
items are in HANDOFF §4; do not start Hackathon phase 2, payment matching or branch cleanup unless I ask. Ask me only about
decisions listed under "Waiting on the owner".
