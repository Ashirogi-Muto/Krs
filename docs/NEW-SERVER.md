# New server: setup and deploys (pull-only)

Since 3 Oct 2026 the server never builds or stages anything. GitHub Actions builds the images and pushes them to
GHCR. The server only pulls finished code and images, then restarts what changed, with one command:
`sudo krs-pull-deploy`. Databases started fresh on this server; all passwords are new.

## First-time setup (once)

Run as a sudo user on Ubuntu 24.04. Replace nothing in the commands except where it says so.

1. **Packages and firewall**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx git curl openssl
   sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
   ```

2. **Read-only access to GitHub** (two keys, both read-only; nothing on this server can push)
   - Code: create a deploy key and add the printed public key on GitHub → repo **krs** → Settings → Deploy keys →
     Add (leave "Allow write access" **off**):
     ```bash
     sudo mkdir -p -m 700 /opt/krs/creds
     sudo ssh-keygen -t ed25519 -N '' -C krs-server -f /opt/krs/creds/repo-deploy-key
     sudo cat /opt/krs/creds/repo-deploy-key.pub
     ```
   - Images: on GitHub → Settings → Developer settings → Tokens (classic), create a token with only
     **read:packages**, then paste it when this command waits (it is not shown):
     ```bash
     sudo sh -c 'umask 077; cat > /opt/krs/creds/ghcr-read.txt'    # paste, Enter, then Ctrl-D
     ```
   - Revoke every token and key that was on the old server.

3. **Get the code** (main instead of claude/deploy-ready once that is the live branch)
   ```bash
   sudo git clone -b claude/deploy-ready -c core.sshCommand="ssh -i /opt/krs/creds/repo-deploy-key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
     git@github.com:Ashirogi-Muto/krs.git /opt/krs/repo
   sudo mkdir -p /opt/krs/deploy && echo 'BRANCH=claude/deploy-ready' | sudo tee /opt/krs/deploy/deploy.conf
   ```

4. **First deploy**
   ```bash
   sudo /opt/krs/repo/ops/bin/krs-pull-deploy --init
   ```
   This installs the ops scripts and timers (health check every minute, nightly backup, gentle TRIM), creates
   `/opt/krs/deploy/.env` and `/opt/krs/deploy/finance/{official,unofficial}.env` with new random secrets (mode 600),
   creates the databases, then pulls and starts the newest website and finance images.

5. **Create the CMS owner account before the site is public.** On a fresh database the first person to open
   `/admin` becomes Super Admin, so do it now through an SSH tunnel, before DNS points here:
   ```bash
   ssh -L 3003:127.0.0.1:3003 <you>@<server>      # then open http://127.0.0.1:3003/admin in your browser
   ```

6. **Finance accounts**: set the passwords (12+ characters) in the two finance env files, then apply:
   ```bash
   sudo nano /opt/krs/deploy/finance/official.env      # ACCOUNT_*_PASSWORD lines
   sudo nano /opt/krs/deploy/finance/unofficial.env
   sudo krs-finance-reload all
   ```

7. **HTTPS and DNS**: in Cloudflare → SSL/TLS → Origin Server, create a certificate for `kalamroboticssociety.com`
   and `*.kalamroboticssociety.com`, save it on the server as `/etc/ssl/cloudflare/origin.pem` and
   `/etc/ssl/cloudflare/origin.key` (key mode 600), then run `sudo krs-pull-deploy --ops-only` (installs the nginx
   site after `nginx -t`). Finally point the DNS records (`@`, `www`, `go`, `finance`, `ledger`, proxied) to the new IP.

8. **Email (optional)**: add `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` to `/opt/krs/deploy/.env`, then
   `sudo docker compose -f /opt/krs/deploy/compose.yml up -d`.

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
| `sudo krs-pull-deploy --ops-only` | Update scripts, timers, compose and nginx files only |

Rollback to the image that ran before the last deploy:
`sudo docker tag krs-website:prev krs-website:latest && sudo docker compose -f /opt/krs/deploy/compose.yml up -d`

## Rules that still apply

- Never run `docker build`, `npm install` or staging on the server; anything heavy happens on GitHub.
- All pulls go through `krs-heavy-guard`, which refuses to start without headroom (memory, load, IO, disk) and
  shares one lock with deploys and TRIM, so only one heavy thing runs at a time.
- Health: `sudo cat /var/lib/krs-health/status`, alerts: `journalctl -t krs-health`.
- Backups: nightly to `/var/backups/krs` (keeps 7). There is no off-server copy yet; set one up (Cloudflare R2 was
  the plan).

## Files

| In git | On the server |
|---|---|
| `ops/bin/*` | `/usr/local/sbin/` |
| `ops/systemd/*` | `/etc/systemd/system/` |
| `ops/deploy/compose.yml` | `/opt/krs/deploy/compose.yml` (website + PostgreSQL, secrets in `.env` beside it) |
| `ops/deploy/finance/compose.yml` | `/opt/krs/deploy/finance/compose.yml` (secrets in `official.env`, `unofficial.env`) |
| `ops/nginx/krs.conf` | `/etc/nginx/sites-available/krs` |

Edit these in git, never on the server: the next `krs-pull-deploy` overwrites server copies with the git version.
Env files and `/opt/krs/creds` are never in git.
