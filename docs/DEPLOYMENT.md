# ☁️ Deployment Guide

How the Forum API runs in production: **AWS EC2** + **PM2** (cluster mode) + **Nginx** (HTTPS and rate limiting), deployed by **GitHub Actions**.

> ← Back to the [README](../README.md)
>
> 📝 Commands and configs below use `api.example.com` as a placeholder. Replace it with your own domain.

## 📑 Contents

- [🗺️ How it fits together](#️-how-it-fits-together)
- [🖥️ Server setup](#️-server-setup-first-time-only)
- [🔐 Production environment variables](#-production-environment-variables)
- [⚙️ PM2](#️-pm2)
- [🛡️ Nginx](#️-nginx)
- [✅ Verify a deployment](#-verify-a-deployment)
- [🚦 Rate Limiting](#-rate-limiting)
- [🔄 CI/CD](#-cicd)

---


## 🗺️ How it fits together

```
🌍 Internet ──HTTPS──▶ 🛡️ Nginx (80/443) ──▶ 127.0.0.1:3000 ──▶ ⚙️ PM2 cluster (Node.js)
```

- 🔒 The app listens on `127.0.0.1:3000` only, so it is **not** reachable directly from the internet. Nginx is the only public entry point.
- 🧱 In the EC2 Security Group, open ports `80` and `443` (and `22` for SSH, ideally limited to your IP). Keep port `3000` **closed**.

## 🔐 Production environment variables

`NODE_ENV`, `HOST`, and `PORT` are set by PM2 in `ecosystem.config.cjs`, so the production `.env` only contains the database and token variables:

```env
# SSL with full certificate verification (recommended for production)
DATABASE_URL=postgresql://user:password@db-host:5432/forumapi?sslmode=verify-full

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

> 📌 Values from the process environment (PM2) always take priority over `.env`, because `dotenv` does not override existing variables.
>
> 🔣 If your database password contains special characters (`@`, `/`, `#`, `:`), URL-encode them (for example `@` becomes `%40`).
>
> 🔒 Restrict the file permission on the server: `chmod 600 .env`
>
> 🔐 `sslmode=verify-full` verifies both the certificate chain and the host name, so `db-host` must match the certificate. If your provider uses its own CA, download its root certificate and point to it with `&sslrootcert=/path/to/ca.pem`. Avoid `sslmode=no-verify` in production, because it encrypts the connection but does not check who is on the other end.

## 🖥️ Server setup (first time only)

Prerequisites on the EC2 instance: Ubuntu, Nginx, PostgreSQL (or a remote database), and Node.js managed with [nvm](https://github.com/nvm-sh/nvm).

```bash
# 1. Install Node.js 24 with nvm (install nvm first, see the link above)
nvm install 24
nvm alias default 24          # make Node 24 the default for new shells
node -v && npm -v

# 2. Install PM2 globally
npm install -g pm2

# 3. Clone the repo over HTTPS (public repo, no SSH key or passphrase needed)
git clone https://github.com/RissDevSec/forum-api.git ~/forum-api
cd ~/forum-api

# 4. Create the production .env (see Production environment variables above)
nano .env && chmod 600 .env

# 5. Install dependencies, run migrations, start the app
npm ci --no-audit --no-fund
npm run migrate up
pm2 startOrReload ecosystem.config.cjs --update-env

# 6. Start on boot (run the sudo command PM2 prints), then save the process list
pm2 startup systemd
pm2 save
```

> 🔑 `nvm` is only loaded by interactive shells. The CD job connects over non-interactive SSH, so the workflow loads it explicitly (see [CI/CD](#-cicd)). Without that, `npm` and `pm2` fail with `command not found`.
>
> 🌐 Use an HTTPS remote (`https://github.com/...`) on the server. If the repo becomes private, use a **Deploy Key without a passphrase**, because nobody can type a passphrase during an automated deploy.

## ⚙️ PM2

`ecosystem.config.cjs` runs the app in **cluster mode** with one instance per CPU core:

```js
module.exports = {
  apps: [
    {
      name: 'forum-api',
      script: 'src/app.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3000,
      },
    },
  ],
};
```

Useful commands:

```bash
pm2 startOrReload ecosystem.config.cjs --update-env   # 🔁 start or zero-downtime reload
pm2 save                                              # 💾 persist process list
pm2 startup systemd                                   # 🔌 start on boot (run once)
pm2 status                                            # 📋 list processes
pm2 logs forum-api                                    # 📜 view logs
```

> ⚠️ Use `--update-env` after changing the `env` block. A plain `pm2 restart` does not reload it.
>
> 🧠 Because the app runs in cluster mode, it must stay stateless: do not keep sessions or caches in process memory.
>
> 💾 `max_memory_restart: '300M'` is a per-instance safety limit: PM2 gracefully restarts an instance that grows past 300 MB (for example because of a memory leak) before the Linux OOM killer has to step in. A healthy instance of this API normally uses well under 100 MB. With 2 instances (a 2-core server) the worst case is about 600 MB, which fits a 1 GB server only if little else runs on it. On small servers, add a swap file as a safety net:
>
> ```bash
> sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

## 🛡️ Nginx

Shared proxy settings, saved once and reused by every `location`
(`/etc/nginx/snippets/forum-api-proxy.conf`):

```nginx
proxy_pass http://127.0.0.1:3000;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Site config (`/etc/nginx/sites-available/forum-api`):

```nginx
server {
    listen 80;
    server_name api.example.com www.api.example.com;

    client_max_body_size 1m;

    # 🔑 Login, refresh token, logout (strict)
    location /authentications {
        limit_req zone=api_auth burst=5 nodelay;
        include snippets/forum-api-proxy.conf;
    }

    # 📝 Register (strict, exact match)
    location = /users {
        limit_req zone=api_auth burst=5 nodelay;
        include snippets/forum-api-proxy.conf;
    }

    # 🌐 Everything else
    location / {
        limit_req zone=api_general burst=20 nodelay;
        limit_conn api_conn 20;
        include snippets/forum-api-proxy.conf;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

🔐 HTTPS is handled by Nginx (for example with Certbot, which adds the `listen 443 ssl` block automatically). Keep the `location` blocks above inside the HTTPS `server` block so the rate limits apply to real traffic.

## ✅ Verify a deployment

```bash
pm2 logs forum-api --lines 5 --nostream    # expect: server start at http://127.0.0.1:3000
ss -tlnp | grep 3000                       # must show 127.0.0.1:3000, not 0.0.0.0:3000
curl -i https://api.example.com/threads
```

To test the rate limiter, see [🚦 Rate Limiting](#-rate-limiting).

## 🚦 Rate Limiting

Rate limiting is done by **Nginx**, before requests reach Node.js, so abusive traffic never touches the app or the database. Define the zones once in `/etc/nginx/conf.d/rate-limit.conf` (this file is loaded in the `http` context):

```nginx
# 🌐 General API traffic: 10 requests/second per IP
limit_req_zone $binary_remote_addr zone=api_general:10m rate=10r/s;

# 🔑 Login & register: 5 requests/minute per IP (brute-force protection)
limit_req_zone $binary_remote_addr zone=api_auth:10m rate=5r/m;

# 🔌 Max simultaneous connections per IP
limit_conn_zone $binary_remote_addr zone=api_conn:10m;

# Respond with 429 Too Many Requests (default is 503)
limit_req_status 429;
limit_conn_status 429;
limit_req_log_level warn;
```

| Zone | Applies to | Limit | Burst |
|------|-----------|-------|:-----:|
| `api_general` | all endpoints except auth | 10 req/s per IP | 20 |
| `api_auth` | `POST /users`, `/authentications` | 5 req/min per IP | 5 |
| `api_conn` | all endpoints except auth | 20 concurrent connections per IP | - |

- `burst` lets short spikes through (for example a page loading several requests at once). Requests beyond rate + burst get `429`.
- `nodelay` serves burst requests immediately instead of queuing them.
- Tune these numbers to your real traffic. Users behind the same office or campus network share one IP address, so do not set the limits too low.
- If the site is behind a CDN or load balancer (Cloudflare, AWS ALB), Nginx sees the proxy's IP instead of the visitor's. Configure `real_ip_header` and `set_real_ip_from` first, otherwise all users share one limit.

Test it (some requests should return `429`):

```bash
for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.example.com/threads
done
```

Rejected requests are logged in `/var/log/nginx/error.log`.

## 🔄 CI/CD

This project uses **GitHub Actions** for automated testing and deployment to **AWS EC2**:

```
🔀 Pull Request ──▶ 🧪 CI: npm ci → migrate → test
        │
        ▼  (push to main, normally a merged PR)
🚀 CD: SSH to EC2 → git pull → npm ci → migrate → prune → pm2 startOrReload → pm2 save
        │
        ▼
🌐 Check: GitHub Actions requests the public URL
```

1. 🧪 On every **Pull Request** to `main`: install dependencies, run migrations, and run tests against a PostgreSQL service container.
2. 🚀 On every **push** to `main` (normally when a PR is merged): connect to EC2 over SSH and run the steps below. The script stops at the first failing command (`set -e`), so a failed `git pull` never leads to a migration or restart.

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"   # load Node.js & PM2

set -e
cd ~/forum-api
git pull origin main
npm ci --no-audit --no-fund
npm run migrate up
npm prune --omit=dev
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

After the deploy step, a second step makes GitHub Actions request the site from the outside, through the same path real users take (internet → HTTPS → Nginx → PM2 → app):

```yaml
- name: Check the site is up
  run: curl -fsS --retry 5 --retry-delay 3 --retry-all-errors "${{ secrets.SITE_URL }}/threads" > /dev/null
```

- `-f` makes `curl` fail on error responses such as `502 Bad Gateway`.
- `--retry 5 --retry-delay 3 --retry-all-errors` retries up to 5 times, so the app has a few seconds to become ready.
- This step only runs if the deploy step succeeded. If the site does not answer, the job turns red in the **Actions** tab.

**Required GitHub secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `SSH_HOST` | Public address of the EC2 instance |
| `SSH_PORT` | SSH port (usually `22`) |
| `SSH_USERNAME` | SSH user on the server |
| `SSH_KEY` | Private key used by GitHub Actions to log in |
| `SITE_URL` | Public URL of the API, without a trailing slash (for example `https://api.example.com`) |

> 📝 The `.env` file on the server is created once manually and is never overwritten by deployments.
>
> 🧯 If a deploy fails, fix the cause on the server (`git status`, `pm2 logs forum-api`), then re-run the failed job from the **Actions** tab.