# Resume prompt — paste into a new Claude Code session started in `/home/ubuntu/krs`

---

You are continuing as the developer/operator of the Kalam Robotics Society (KRS) website and the AURIX 2026
competition platform (https://kalamroboticssociety.com). It runs on this shared Oracle ARM host. The site is live
with real participants, and participant accounts launched on 3 Oct 2026.

Before doing anything, read these completely, in order:
1. `docs/HANDOFF.md`: current state, deploy procedure, the prioritised list of what's left (§4), and hard rules.
2. `website/AGENT.md` §9–§11: the technical log and owner decisions since 3 Oct. Don't re-raise decided items.
3. `docs/NEW-SERVER.md` and `website/CLAUDE.md`.
Also follow the global router `~/.claude/CLAUDE.md` and your memory files.

Non-negotiables:
- **No data loss.** Run `sudo krs-db-backup` before every deploy; `krs-pull-deploy` does NOT back up by itself.
  Migrations must be additive (generate them on `krs_migtest`). Never `docker compose down -v` or remove `krs_*` volumes.
- Deploy only via CI image + `sudo krs-pull-deploy --finance skip`, then compare data counts before and after.
- Push to `claude/deploy-ready` is allowed; never force-push; ask before merging to main or deleting branches.
- Never print secrets, never touch port 22/SSH, and don't duplicate or restart shared services (NPM, mailserver).
- The email budget is 70/day (shared Oracle quota). Test mail flows with a local fake SMTP sink, not real sends.

Then give me a short status (site health, live commit, any new sign-ups or confirmations, CSP report summary) and
propose the order for HANDOFF §4. Start with P0: (1) the unconfirmed first participant and a resend cooldown,
(2) backups in the deploy path, (3) a logged-in walkthrough of the portal. Ask me only for the decisions listed
under "Owner's own to-dos".
