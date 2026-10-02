# Server operations files (KRS VM)

Copies of what is installed on the VM (`/usr/local/sbin`, `/etc/systemd/system`, `/etc/sysctl.d`).
Keep these in sync when changing the server. See `/opt/krs/DEPLOYMENT.md` sections 0 and 3.

| File | Installed at | Purpose |
|---|---|---|
| bin/krs-health-check | /usr/local/sbin | Every-minute check; WARN/CRIT when a resource loses its 20% headroom (journal tag `krs-health`) |
| bin/krs-heavy-guard | /usr/local/sbin | Wrap heavy jobs; refuses without headroom, interrupts on IO pressure / low disk |
| bin/krs-deploy | /usr/local/sbin | Pull a GHCR image built by GitHub Actions, swap, health-check, auto-rollback |
| bin/krs-fstrim-gentle | /usr/local/sbin | Weekly TRIM in 512 MB slices (replaces stock fstrim; root is mounted without `discard`) |
| bin/krs-db-backup | /usr/local/sbin | Nightly pg_dump, keep 7 |
| systemd/* | /etc/systemd/system | Timers/services and fstrim overrides |
| sysctl/90-krs-writeback.conf | /etc/sysctl.d | Small dirty-page limits (64 MB / 256 MB) |
