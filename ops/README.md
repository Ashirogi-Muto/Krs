# Server operations files (KRS VM)

The source of truth for the server. `sudo krs-pull-deploy` copies these to their places on the server
(`/usr/local/sbin`, `/etc/systemd/system`, `/etc/sysctl.d`, `/opt/krs/deploy`, `/etc/nginx`), so change them here,
not on the server. New server setup and day-to-day deploys: `docs/NEW-SERVER.md`.

| File | Installed at | Purpose |
|---|---|---|
| bin/krs-health-check | /usr/local/sbin | Every-minute check; WARN/CRIT when a resource loses its 20% headroom (journal tag `krs-health`) |
| bin/krs-heavy-guard | /usr/local/sbin | Wrap heavy jobs; refuses without headroom, interrupts on IO pressure / low disk |
| bin/krs-pull-deploy | /usr/local/sbin | **The deploy command**: pull the branch, install changed ops files, deploy new website/finance images (`--init` on a new server) |
| bin/krs-deploy | /usr/local/sbin | Pull a GHCR image built by GitHub Actions, swap, health-check, auto-rollback |
| bin/krs-fstrim-gentle | /usr/local/sbin | Weekly TRIM in 512 MB slices (replaces stock fstrim; root is mounted without `discard`) |
| bin/krs-db-backup | /usr/local/sbin | Nightly pg_dump, keep 7 |
| bin/krs-finance-passwd | /usr/local/sbin | `sudo krs-finance-passwd official\|unofficial <username>` — reset a finance account password (prompted, audit-logged); the only reset path besides the ADMIN in the portal |
| systemd/* | /etc/systemd/system | Timers/services and fstrim overrides |
| sysctl/90-krs-writeback.conf | /etc/sysctl.d | Small dirty-page limits (64 MB / 256 MB) |
| deploy/compose.yml | /opt/krs/deploy | Website + PostgreSQL (secrets in `.env` beside it, never in git) |
| deploy/finance/compose.yml | /opt/krs/deploy/finance | Finance portals, both ledgers (`official.env`, `unofficial.env`) |
| nginx/krs.conf | /etc/nginx/sites-available/krs | Site, short links, finance + ledger (Cloudflare origin cert) |
| docker/daemon.json | /etc/docker | Container log limits (installed only if missing) |
