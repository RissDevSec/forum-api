<div align="center">

# 💬 Forum API

**A RESTful forum backend built with Node.js & Express, designed with Clean Architecture.**

Threads • Comments • Replies • Likes • JWT Authentication

![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-cluster-2B037A?logo=pm2&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

🌐 **Live:** [mean-points-pick-hungrily.st.a.dcdg.xyz](https://mean-points-pick-hungrily.st.a.dcdg.xyz)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🧰 Tech Stack](#-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📡 API Endpoints](#-api-endpoints)
- [🚀 Getting Started](#-getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [📄 Pagination](#-pagination)
- [☁️ Deployment](#️-deployment-aws-ec2--pm2--nginx)
- [🚦 Rate Limiting](#-rate-limiting)
- [🔄 CI/CD](#-cicd)
- [📜 License](#-license)

---

## ✨ Features

- 🔑 Register & login with JWT authentication (access + refresh token)
- 🧵 Create, read, and list threads with **pagination**
- 💭 Add & soft-delete comments
- ↩️ Add & soft-delete replies
- ❤️ Like / unlike comments
- 🏛️ Clean Architecture (Domain → Application → Infrastructure)
- 🧪 Unit & integration tests with coverage report
- 🤖 CI/CD pipeline with GitHub Actions
- ⚡ Production deployment with PM2 cluster mode behind Nginx
- 🚦 Rate limiting at the Nginx layer (stricter on login & register)

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| 🟢 Runtime | Node.js (ESM) |
| 🚂 Framework | Express.js v5 |
| 🐘 Database | PostgreSQL (via `DATABASE_URL`, SSL supported) |
| 🔐 Auth | JWT (Access & Refresh Token) |
| 🧪 Testing | Vitest + Supertest |
| 🧱 Migration | node-pg-migrate |
| ⚙️ Process manager | PM2 (cluster mode) |
| 🛡️ Reverse proxy | Nginx (HTTPS + rate limiting) |
| 🤖 CI/CD | GitHub Actions → AWS EC2 |

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
src/
├── Domains/          # 🧩 Business entities & repository interfaces
├── Applications/     # 🧠 Use cases (business logic)
├── Infrastructures/  # 🔌 DB, external services, framework config
└── Interfaces/       # 🌐 HTTP handlers & routes
```

## 📡 API Endpoints

### 🔑 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/users` | ❌ | Register user |
| `POST` | `/authentications` | ❌ | Login |
| `PUT` | `/authentications` | ❌ | Refresh token |
| `DELETE` | `/authentications` | ❌ | Logout |

### 🧵 Threads

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/threads?page=1&limit=10` | ❌ | List threads (paginated) |
| `GET` | `/threads/:threadId` | ❌ | Get thread detail |
| `POST` | `/threads` | ✅ | Create thread |

### 💭 Comments

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/threads/:threadId/comments` | ✅ | Add comment |
| `DELETE` | `/threads/:threadId/comments/:commentId` | ✅ | Delete comment |

### ↩️ Replies

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/threads/:threadId/comments/:commentId/replies` | ✅ | Add reply |
| `DELETE` | `/threads/:threadId/comments/:commentId/replies/:replyId` | ✅ | Delete reply |

### ❤️ Likes

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `PUT` | `/threads/:threadId/comments/:commentId/likes` | ✅ | Toggle like comment |

## 🚀 Getting Started

### 📋 Prerequisites

- 🟢 Node.js 24 (the version used in CI; recent dependencies require a modern Node.js)
- 🐘 PostgreSQL

### 📦 Installation

```bash
# Clone the repo
git clone https://github.com/RissDevSec/forum-api.git
cd forum-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env          # for development & production
cp .env.example .env.test     # for testing

# Fill in your DATABASE_URL and JWT secrets
# Make sure the database name in .env.test is different from .env
# NODE_ENV is not required in .env.test — automatically set by Vitest
```

### 🗄️ Database Setup

```bash
# Run migrations
npm run migrate up

# For test database
npm run migrate:test up
```

### ▶️ Running the App

```bash
# 🛠️ Development (auto-restart with node --watch)
npm run start:dev

# 🏭 Production (single process, without PM2)
npm start
```

> 💡 `node --watch` restarts when imported JS files change. Changes to `.env` are not detected, so restart manually after editing it.

## 🔐 Environment Variables

This project uses separate environment files. They are listed in `.gitignore`; only `.env.example` is committed.

### 🛠️ `.env` (development)

```env
# HTTP SERVER
NODE_ENV=development
# HOST=127.0.0.1   # optional, default 127.0.0.1
# PORT=3000        # optional, default 3000

# POSTGRES
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/forumapi

# TOKENIZE
ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

### 🏭 `.env` (production, on the server)

`NODE_ENV`, `HOST`, and `PORT` are set by PM2 in `ecosystem.config.cjs`, so the production `.env` only contains the database and token variables:

```env
# Add ?sslmode=require when the database requires SSL
# (use ?sslmode=no-verify if the server uses a self-signed certificate)
DATABASE_URL=postgresql://user:password@db-host:5432/forumapi?sslmode=require

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

> 📌 Values from the process environment (PM2) always take priority over `.env`, because `dotenv` does not override existing variables.
>
> 🔣 If your database password contains special characters (`@`, `/`, `#`, `:`), URL-encode them (for example `@` becomes `%40`).
>
> 🔒 Restrict the file permission on the server: `chmod 600 .env`

### 🧪 `.env.test` (testing)

```env
# NODE_ENV is not required — automatically set to "test" by Vitest

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/forumapi_test

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

### 🎲 Generate random secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Testing

```bash
npm test                # ✅ Run all tests
npm run test:watch      # 👀 Watch mode
npm run test:coverage   # 📊 With coverage
npm run lint            # 🧹 Lint
```

## 📄 Pagination

The `GET /threads` endpoint supports pagination via query parameters:

```
GET /threads?page=1&limit=10
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "threads": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

| Param | Default | Max |
|-------|:-------:|:---:|
| `page` | `1` | - |
| `limit` | `10` | `50` |

## ☁️ Deployment (AWS EC2 + PM2 + Nginx)

### 🗺️ How it fits together

```
🌍 Internet ──HTTPS──▶ 🛡️ Nginx (80/443) ──▶ 127.0.0.1:3000 ──▶ ⚙️ PM2 cluster (Node.js)
```

- 🔒 The app listens on `127.0.0.1:3000` only, so it is **not** reachable directly from the internet. Nginx is the only public entry point.
- 🧱 In the EC2 Security Group, open ports `80` and `443` (and `22` for SSH, ideally limited to your IP). Keep port `3000` **closed**.

### ⚙️ PM2

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
      max_memory_restart: '500M',
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

### 🛡️ Nginx

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
    server_name mean-points-pick-hungrily.st.a.dcdg.xyz www.mean-points-pick-hungrily.st.a.dcdg.xyz;

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

### ✅ Verify a deployment

```bash
pm2 logs forum-api --lines 5 --nostream    # expect: server start at http://127.0.0.1:3000
ss -tlnp | grep 3000                       # must show 127.0.0.1:3000, not 0.0.0.0:3000
curl -i https://mean-points-pick-hungrily.st.a.dcdg.xyz/threads
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
  curl -s -o /dev/null -w "%{http_code}\n" https://mean-points-pick-hungrily.st.a.dcdg.xyz/threads
done
```

Rejected requests are logged in `/var/log/nginx/error.log`.

## 🔄 CI/CD

This project uses **GitHub Actions** for automated testing and deployment to **AWS EC2**:

```
🔀 Pull Request ──▶ 🧪 CI: npm ci → migrate → test
        │
        ▼  (merged to main)
🚀 CD: SSH to EC2 → git pull → npm ci → migrate → prune → pm2 startOrReload → pm2 save
```

1. 🧪 On every **Pull Request** to `main`: install dependencies, run migrations, and run tests against a Pos<div align="center">

# 💬 Forum API

**A RESTful forum backend built with Node.js & Express, designed with Clean Architecture.**

Threads • Comments • Replies • Likes • JWT Authentication

![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-cluster-2B037A?logo=pm2&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

🌐 **Live:** [mean-points-pick-hungrily.st.a.dcdg.xyz](https://mean-points-pick-hungrily.st.a.dcdg.xyz)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🧰 Tech Stack](#-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📡 API Endpoints](#-api-endpoints)
- [🚀 Getting Started](#-getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [📄 Pagination](#-pagination)
- [☁️ Deployment](#️-deployment-aws-ec2--pm2--nginx)
- [🚦 Rate Limiting](#-rate-limiting)
- [🔄 CI/CD](#-cicd)
- [📜 License](#-license)

---

## ✨ Features

- 🔑 Register & login with JWT authentication (access + refresh token)
- 🧵 Create, read, and list threads with **pagination**
- 💭 Add & soft-delete comments
- ↩️ Add & soft-delete replies
- ❤️ Like / unlike comments
- 🏛️ Clean Architecture (Domain → Application → Infrastructure)
- 🧪 Unit & integration tests with coverage report
- 🤖 CI/CD pipeline with GitHub Actions
- ⚡ Production deployment with PM2 cluster mode behind Nginx
- 🚦 Rate limiting at the Nginx layer (stricter on login & register)

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| 🟢 Runtime | Node.js (ESM) |
| 🚂 Framework | Express.js v5 |
| 🐘 Database | PostgreSQL (via `DATABASE_URL`, SSL supported) |
| 🔐 Auth | JWT (Access & Refresh Token) |
| 🧪 Testing | Vitest + Supertest |
| 🧱 Migration | node-pg-migrate |
| ⚙️ Process manager | PM2 (cluster mode) |
| 🛡️ Reverse proxy | Nginx (HTTPS + rate limiting) |
| 🤖 CI/CD | GitHub Actions → AWS EC2 |

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
src/
├── Domains/          # 🧩 Business entities & repository interfaces
├── Applications/     # 🧠 Use cases (business logic)
├── Infrastructures/  # 🔌 DB, external services, framework config
└── Interfaces/       # 🌐 HTTP handlers & routes
```

## 📡 API Endpoints

### 🔑 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/users` | ❌ | Register user |
| `POST` | `/authentications` | ❌ | Login |
| `PUT` | `/authentications` | ❌ | Refresh token |
| `DELETE` | `/authentications` | ❌ | Logout |

### 🧵 Threads

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/threads?page=1&limit=10` | ❌ | List threads (paginated) |
| `GET` | `/threads/:threadId` | ❌ | Get thread detail |
| `POST` | `/threads` | ✅ | Create thread |

### 💭 Comments

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/threads/:threadId/comments` | ✅ | Add comment |
| `DELETE` | `/threads/:threadId/comments/:commentId` | ✅ | Delete comment |

### ↩️ Replies

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/threads/:threadId/comments/:commentId/replies` | ✅ | Add reply |
| `DELETE` | `/threads/:threadId/comments/:commentId/replies/:replyId` | ✅ | Delete reply |

### ❤️ Likes

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `PUT` | `/threads/:threadId/comments/:commentId/likes` | ✅ | Toggle like comment |

## 🚀 Getting Started

### 📋 Prerequisites

- 🟢 Node.js 24 (the version used in CI; recent dependencies require a modern Node.js)
- 🐘 PostgreSQL

### 📦 Installation

```bash
# Clone the repo
git clone https://github.com/RissDevSec/forum-api.git
cd forum-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env          # for development & production
cp .env.example .env.test     # for testing

# Fill in your DATABASE_URL and JWT secrets
# Make sure the database name in .env.test is different from .env
# NODE_ENV is not required in .env.test — automatically set by Vitest
```

### 🗄️ Database Setup

```bash
# Run migrations
npm run migrate up

# For test database
npm run migrate:test up
```

### ▶️ Running the App

```bash
# 🛠️ Development (auto-restart with node --watch)
npm run start:dev

# 🏭 Production (single process, without PM2)
npm start
```

> 💡 `node --watch` restarts when imported JS files change. Changes to `.env` are not detected, so restart manually after editing it.

## 🔐 Environment Variables

This project uses separate environment files. They are listed in `.gitignore`; only `.env.example` is committed.

### 🛠️ `.env` (development)

```env
# HTTP SERVER
NODE_ENV=development
# HOST=127.0.0.1   # optional, default 127.0.0.1
# PORT=3000        # optional, default 3000

# POSTGRES
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/forumapi

# TOKENIZE
ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

### 🏭 `.env` (production, on the server)

`NODE_ENV`, `HOST`, and `PORT` are set by PM2 in `ecosystem.config.cjs`, so the production `.env` only contains the database and token variables:

```env
# Add ?sslmode=require when the database requires SSL
# (use ?sslmode=no-verify if the server uses a self-signed certificate)
DATABASE_URL=postgresql://user:password@db-host:5432/forumapi?sslmode=require

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

> 📌 Values from the process environment (PM2) always take priority over `.env`, because `dotenv` does not override existing variables.
>
> 🔣 If your database password contains special characters (`@`, `/`, `#`, `:`), URL-encode them (for example `@` becomes `%40`).
>
> 🔒 Restrict the file permission on the server: `chmod 600 .env`

### 🧪 `.env.test` (testing)

```env
# NODE_ENV is not required — automatically set to "test" by Vitest

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/forumapi_test

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
ACCESS_TOKEN_AGE=3000
```

### 🎲 Generate random secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Testing

```bash
npm test                # ✅ Run all tests
npm run test:watch      # 👀 Watch mode
npm run test:coverage   # 📊 With coverage
npm run lint            # 🧹 Lint
```

## 📄 Pagination

The `GET /threads` endpoint supports pagination via query parameters:

```
GET /threads?page=1&limit=10
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "threads": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

| Param | Default | Max |
|-------|:-------:|:---:|
| `page` | `1` | - |
| `limit` | `10` | `50` |

## ☁️ Deployment (AWS EC2 + PM2 + Nginx)

### 🗺️ How it fits together

```
🌍 Internet ──HTTPS──▶ 🛡️ Nginx (80/443) ──▶ 127.0.0.1:3000 ──▶ ⚙️ PM2 cluster (Node.js)
```

- 🔒 The app listens on `127.0.0.1:3000` only, so it is **not** reachable directly from the internet. Nginx is the only public entry point.
- 🧱 In the EC2 Security Group, open ports `80` and `443` (and `22` for SSH, ideally limited to your IP). Keep port `3000` **closed**.

### ⚙️ PM2

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
      max_memory_restart: '500M',
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

### 🛡️ Nginx

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
    server_name mean-points-pick-hungrily.st.a.dcdg.xyz www.mean-points-pick-hungrily.st.a.dcdg.xyz;

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

### ✅ Verify a deployment

```bash
pm2 logs forum-api --lines 5 --nostream    # expect: server start at http://127.0.0.1:3000
ss -tlnp | grep 3000                       # must show 127.0.0.1:3000, not 0.0.0.0:3000
curl -i https://mean-points-pick-hungrily.st.a.dcdg.xyz/threads
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
  curl -s -o /dev/null -w "%{http_code}\n" https://mean-points-pick-hungrily.st.a.dcdg.xyz/threads
done
```

Rejected requests are logged in `/var/log/nginx/error.log`.

## 🔄 CI/CD

This project uses **GitHub Actions** for automated testing and deployment to **AWS EC2**:

```
🔀 Pull Request ──▶ 🧪 CI: npm ci → migrate → test
        │
        ▼  (merged to main)
🚀 CD: SSH to EC2 → git pull → npm ci → migrate → prune → pm2 startOrReload → pm2 save
```

1. 🧪 On every **Pull Request** to `main`: install dependencies, run migrations, and run tests against a PostgreSQL service container.
2. 🚀 On PR **merged** to `main`: SSH into EC2, then:
   - `git pull`
   - `npm ci`
   - `npm run migrate up`
   - `npm prune --omit=dev`
   - `pm2 startOrReload ecosystem.config.cjs --update-env`
   - `pm2 save`

> 📝 The `.env` file on the server is created once manually and is never overwritten by deployments.

## 📜 License

MIT © 2026 [RissDevSec](https://github.com/RissDevSec). See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ☕ and Node.js

</div>tgreSQL service container.
2. 🚀 On PR **merged** to `main`: SSH into EC2, then:
   - `git pull`
   - `npm ci`
   - `npm run migrate up`
   - `npm prune --omit=dev`
   - `pm2 startOrReload ecosystem.config.cjs --update-env`
   - `pm2 save`

> 📝 The `.env` file on the server is created once manually and is never overwritten by deployments.

## 📜 License

MIT © 2026 [RissDevSec](https://github.com/RissDevSec). See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ☕ and Node.js

</div>