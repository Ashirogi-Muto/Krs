# Server operations files (KRS on the shared Oracle host)

The source of truth for the server. `sudo krs-pull-deploy` copies these to their places on the server
(`/usr/local/sbin`, `/etc/systemd/system`, `/opt/krs/deploy`), so change them here, not on the server.
The host is shared with other projects: nothing here changes host-wide settings (Docker daemon, sysctl, TRIM,
nginx). Routing/TLS is Nginx Proxy Manager. New server setup and day-to-day deploys: the operator's private notes (`docs-private/NEW-SERVER.md`, kept outside the repo).

| File | Installed at | Purpose |
|---|---|---|
| bin/krs-health-check | /usr/local/sbin | Every-minute check; WARN/CRIT when a resource loses its 20% headroom (journal tag `krs-health`) |
| bin/krs-heavy-guard | /usr/local/sbin | Wrap heavy jobs; refuses without headroom, interrupts on IO pressure / low disk |
| bin/krs-safety | /usr/local/sbin | Shared lock + headroom checks (sourced by the scripts above and the deploy scripts) |
| bin/krs-pull-deploy | /usr/local/sbin | **The deploy command**: pull the branch, install changed ops files, deploy new website/finance images (`--init` on a new server) |
| bin/krs-deploy | /usr/local/sbin | Pull a GHCR image built by GitHub Actions, swap, health-check, auto-rollback |
| bin/krs-finance-deploy | /usr/local/sbin | Same for the finance portals (both ledgers) |
| bin/krs-db-backup | /usr/local/sbin | Nightly pg_dump of the website and both finance databases, keep 7 |
| bin/krs-finance-reload | /usr/local/sbin | `sudo krs-finance-reload official\|unofficial\|all`: apply edits to the finance env files (accounts) |
| bin/krs-finance-passwd | /usr/local/sbin | `sudo krs-finance-passwd official\|unofficial <username>`: reset a finance account password (prompted, audit-logged); the only reset path besides the ADMIN in the portal |
| systemd/* | /etc/systemd/system | Health-check and backup timers |
| deploy/compose.yml | /opt/krs/deploy | Website + KRS PostgreSQL (secrets in `.env` beside it, never in git) |
| deploy/finance/compose.yml | /opt/krs/deploy/finance | Finance portals, both ledgers (`official.env`, `unofficial.env`) |
