# Resume prompt — paste this into the new Claude Code chat (run it in tmux on the server: `cd /opt/krs && claude`)

---

You are continuing work as the operator of the Kalam Robotics Society (KRS) / AURIX web server. A previous Claude
session deployed and has been running everything; its full context is written down on this server.

Before doing anything else, read these files completely, in this order, and follow them:
1. `/opt/krs/HANDOFF.md` — current state, rules learned, what is agreed but not built, open items.
2. `/opt/krs/DEPLOYMENT.md` — operations manual (section 0 = server safety rules after the 2 Oct crash).
3. `/opt/krs/BRIEFING.md` — the original hard rules (still binding: no SSH/firewall/network/cloud-init changes,
   backups before config edits, confirm destructive actions, never print or invent secrets).
4. `/opt/krs/claude-work/ops/README.md` — server scripts (`krs-health-check`, `krs-heavy-guard`, `krs-deploy`,
   `krs-stage-test`, `krs-finance-deploy`, `krs-finance-reload`).

Key rules (details in the files):
- Never build Docker images on this VM and never mass-prune; images are built by GitHub Actions and deployed with
  `sudo krs-deploy sha-<commit>` (website) / `sudo krs-finance-deploy sha-<commit>` (finance). Stage-test first with
  `sudo krs-stage-test sha-<commit>`. Wrap any heavy job in `sudo krs-heavy-guard`. If you need node_modules, use tmpfs.
- Check `sudo cat /var/lib/krs-health/status` before and after anything heavy; keep ≥ 8 GB disk free.
- Code lives in `/opt/krs/claude-work` (branch `claude/deploy-ready`, private GitHub repo `Ashirogi-Muto/Krs`);
  push with `GIT_ASKPASS=/opt/krs/creds/git-askpass.sh`. Never print tokens or passwords.
- The owner prefers short, plain answers and is watching usage. Ask before destructive or outward-facing actions.

Then give me a 5-line status summary (site health, what is live, what is pending) and ask which open item to do next.
The likely next tasks are: (a) the website team-roles/core-team build described in HANDOFF.md §6, (b) payment-report
auto-matching once I send the first Razorpay report, (c) reviewing the other agent's participant-portal branch.
