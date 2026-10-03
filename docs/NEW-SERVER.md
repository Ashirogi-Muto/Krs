# KRS server: setup and deploys (pull-only, shared Oracle host)

Since 3 Oct 2026 KRS runs on the owner's Oracle Cloud server (Ubuntu 24.04, **arm64**, public IP 161.118.168.100).
The old Proxmox VM is lost, along with its database and backups, so KRS started with fresh databases and new passwords.

The server never builds or stages anything. GitHub Actions builds arm64 images on GitHub's arm runners and pushes
them to GHCR. The server only pulls finished code and images, then restarts what changed, with one command:
`sudo krs-pull-deploy`.

**This host is shared** with other projects (mailserver, portfolio, CyberRakshak, ERP, …). KRS uses what the
host already provides and changes nothing host-wide:

| Need | Provided by | KRS side |
|---|---|---|
| HTTPS, routing, TLS | **Nginx Proxy Manager** (container `nginx-proxy-manager-app-1`, ports 80/443, admin UI on 81) | 4 proxy hosts (below); KRS containers listen on `172.17.0.1` (docker0) for NPM and on `127.0.0.1` for scripts |
| Docker | Host Docker (shared) | Log limits per service in the compose files; `/etc/docker/daemon.json` is never touched (changing it restarts every container) |
| Disk TRIM, kernel tuning | Host defaults (stock `fstrim.timer`) | Nothing. The VM-only TRIM/sysctl fixes were removed |
| Database | KRS's own PostgreSQL 16 container `krs-website-postgres` (website + both finance ledgers) | Internal Docker network `krs_internal` only, no published port |

## First-time setup (once)

Packages are already on this host (`docker.io`, `docker-compose-v2`, `git`, `curl`, `openssl`). **Do not install
host nginx**: NPM owns ports 80/443. Do not change ufw for 80/443: Docker publishes NPM's ports itself.

1. **Read-only access to GitHub** (both read-only; nothing in `/opt/krs` can push)
   - Code: a deploy key. Its public key goes to GitHub → repo **krs** → Settings → Deploy keys, with
     "Allow write access" **off**:
     ```bash
     sudo mkdir -p -m 700 /opt/krs/creds
     sudo ssh-keygen -t ed25519 -N '' -C krs-server -f /opt/krs/creds/repo-deploy-key
     sudo cat /opt/krs/creds/repo-deploy-key.pub
     ```
   - Images: GitHub → Settings → Developer settings → Tokens (classic), a token with only **read:packages**
     (no expiry, or put the renewal in a calendar). Paste it when this command waits; it is not shown:
     ```bash
     sudo sh -c 'umask 077; cat > /opt/krs/creds/ghcr-read.txt'    # paste, Enter, then Ctrl-D
     ```
   - Revoke every deploy key and token that was on the old VM (GitHub → krs → Deploy keys; Developer settings →
     Tokens). The VM is gone, but its disk may still exist at the provider.

2. **Get the code**
   ```bash
   sudo git clone -b claude/deploy-ready -c core.sshCommand="ssh -i /opt/krs/creds/repo-deploy-key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
     git@github.com:Ashirogi-Muto/krs.git /opt/krs/repo
   sudo mkdir -p /opt/krs/deploy && echo 'BRANCH=claude/deploy-ready' | sudo tee /opt/krs/deploy/deploy.conf
   ```

3. **First deploy** (after the **Build website image** / **Build finance images** runs on GitHub are green)
   ```bash
   sudo /opt/krs/repo/ops/bin/krs-pull-deploy --init
   ```
   This installs the ops scripts and timers (health check every minute, nightly backup). It creates
   `/opt/krs/deploy/.env` and `/opt/krs/deploy/finance/{official,unofficial}.env` with new random secrets
   (mode 600) and creates the databases. Then it pulls and starts the newest website and finance images.

4. **Create the CMS owner account before the site is public.** On a fresh database the first person to open
   `/admin` becomes Super Admin, so do it through an SSH tunnel before DNS points here:
   ```bash
   ssh -L 3003:127.0.0.1:3003 ubuntu@161.118.168.100      # then open http://127.0.0.1:3003/admin
   ```

5. **Finance accounts**: set the passwords (12+ characters) in the two finance env files, then apply:
   ```bash
   sudo nano /opt/krs/deploy/finance/official.env      # ACCOUNT_*_PASSWORD lines
   sudo nano /opt/krs/deploy/finance/unofficial.env
   sudo krs-finance-reload all
   ```

6. **TLS certificate**: Cloudflare → SSL/TLS → Origin Server → create a certificate for
   `kalamroboticssociety.com` and `*.kalamroboticssociety.com`. Set SSL/TLS mode to **Full (strict)**. In NPM →
   SSL Certificates → Add → Custom, upload it as **KRS Cloudflare origin**.

7. **NPM proxy hosts** (they live in NPM's database, not in git; keep this table in sync if you change them).
   All four use the Cloudflare origin certificate, **Force SSL**, **HTTP/2**, **Block common exploits**, and
   *Advanced* = the "common" block below.

   | Domain names | Forward to | Extra |
   |---|---|---|
   | `kalamroboticssociety.com`, `www.kalamroboticssociety.com` | `http://172.17.0.1:3003` | Advanced also: `if ($host = www.kalamroboticssociety.com) { return 301 https://kalamroboticssociety.com$request_uri; }` |
   | `go.kalamroboticssociety.com` | `http://172.17.0.1:3003` | Advanced also: the `location /` block below (short link `/x` → site `/go/x`) |
   | `finance.kalamroboticssociety.com` | `http://172.17.0.1:3051` | Custom location `/api/` → `http://172.17.0.1:8051` |
   | `ledger.kalamroboticssociety.com` | `http://172.17.0.1:3052` | Custom location `/api/` → `http://172.17.0.1:8052` |

   Common Advanced block. It applies only to these hosts: real visitor IPs from Cloudflare (NPM's global list
   only knows CloudFront) and the upload limit (ID cards ≤ 2 MB, finance receipts ≤ 10 MB):
   ```nginx
   client_max_body_size 12m;
   real_ip_header CF-Connecting-IP;
   set_real_ip_from 173.245.48.0/20;  set_real_ip_from 103.21.244.0/22;  set_real_ip_from 103.22.200.0/22;
   set_real_ip_from 103.31.4.0/22;    set_real_ip_from 141.101.64.0/18;  set_real_ip_from 108.162.192.0/18;
   set_real_ip_from 190.93.240.0/20;  set_real_ip_from 188.114.96.0/20;  set_real_ip_from 197.234.240.0/22;
   set_real_ip_from 198.41.128.0/17;  set_real_ip_from 162.158.0.0/15;   set_real_ip_from 104.16.0.0/13;
   set_real_ip_from 104.24.0.0/14;    set_real_ip_from 172.64.0.0/13;    set_real_ip_from 131.0.72.0/22;
   set_real_ip_from 2400:cb00::/32;   set_real_ip_from 2606:4700::/32;   set_real_ip_from 2803:f800::/32;
   set_real_ip_from 2405:b500::/32;   set_real_ip_from 2405:8100::/32;   set_real_ip_from 2a06:98c0::/29;
   set_real_ip_from 2c0f:f248::/32;
   ```
   `go.` location block. NPM's default location forwards `$request_uri` unchanged, so a plain `rewrite` would not work:
   ```nginx
   location / {
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_pass http://172.17.0.1:3003/go$request_uri;
   }
   ```

8. **DNS (last)**: in Cloudflare, point `@`, `www`, `go`, `finance` and `ledger` (all proxied) to `161.118.168.100`.

9. **Email (optional)**: add `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` to `/opt/krs/deploy/.env`, then
   `sudo docker compose -f /opt/krs/deploy/compose.yml up -d`. The host also runs a mailserver (Oracle Email Delivery
   relay) that KRS could use instead of Gmail; that is a separate change.

## Every update

1. Push to `claude/deploy-ready` (or merge to `main`) on GitHub.
2. Wait until the **Build website image** / **Build finance images** runs on GitHub are green.
3. On the server:
   ```bash
   sudo krs-pull-deploy
   ```
   It pulls the branch, installs changed ops files, then deploys the newest website and finance images. An image
   that is already running is skipped, so a run with nothing new restarts nothing. Each deploy waits for health
   checks and rolls back to the previous image by itself if the new one is unhealthy.

Other uses:

| Command | What it does |
|---|---|
| `sudo krs-pull-deploy --status` | What is running (image, commit) and container states |
| `sudo krs-pull-deploy --website sha-<full commit>` | Deploy (or go back to) one specific website build |
| `sudo krs-pull-deploy --finance skip` | Update the website only |
| `sudo krs-pull-deploy --ops-only` | Update scripts, timers and compose files only |

Rollback to the image that ran before the last deploy:
`sudo docker tag krs-website:prev krs-website:latest && sudo docker compose -f /opt/krs/deploy/compose.yml up -d`

## Rules that still apply

- Never run `docker build`, `npm install` or staging on the server; anything heavy happens on GitHub.
- All pulls go through `krs-heavy-guard`. It refuses to start without headroom (memory, load, IO, disk, CPU steal)
  and shares one lock with deploys, so only one heavy KRS operation runs at a time.
- Never touch other projects' containers, ports or volumes, `/etc/docker/daemon.json`, or NPM's other proxy hosts.
- Health: `sudo cat /var/lib/krs-health/status`, alerts: `journalctl -t krs-health`. The host-level values (load,
  memory, IO) include the other projects on this server.
- Backups: nightly `pg_dump` of all three databases to `/var/backups/krs` (keeps 7). There is no off-server copy yet,
  and the old server's loss shows why one is needed (Cloudflare R2 was the plan).

## Files

| In git | On the server |
|---|---|
| `ops/bin/*` | `/usr/local/sbin/` |
| `ops/systemd/*` | `/etc/systemd/system/` |
| `ops/deploy/compose.yml` | `/opt/krs/deploy/compose.yml` (website + PostgreSQL, secrets in `.env` beside it) |
| `ops/deploy/finance/compose.yml` | `/opt/krs/deploy/finance/compose.yml` (secrets in `official.env`, `unofficial.env`) |
| this file, step 7 | NPM proxy hosts (NPM database, `/home/ubuntu/nginx-proxy-manager/data`) |

Edit these in git, never on the server: the next `krs-pull-deploy` overwrites server copies with the git version.
Env files and `/opt/krs/creds` are never in git.
