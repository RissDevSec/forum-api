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
- [🚢 Deployment](#-deployment)
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

> 🏭 Production uses a smaller `.env` (database and token variables only). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#-production-environment-variables).

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
      "totalPage": 5
    }
  }
}
```

| Param | Default | Min | Max |
|-------|:-------:|:---:|:---:|
| `page` | `1` | `1` | - |
| `limit` | `10` | `10` | `50` |

Values outside the range are clamped automatically. Threads are sorted newest first.

## 🚢 Deployment

The API is deployed on **AWS EC2** with **PM2** (cluster mode) behind **Nginx** (HTTPS + rate limiting), and every push to `main` (normally a merged Pull Request) is deployed automatically by **GitHub Actions**.

- 🔄 **CI** (on every Pull Request): install, migrate, and run the tests against a PostgreSQL service container.
- 🚀 **CD** (on every push to `main`): SSH into the server, pull, migrate, reload PM2, then check that the site responds.

📖 Full guide (server setup, PM2, Nginx, rate limiting, SSL, troubleshooting): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📜 License

MIT © 2026 [RissDevSec](https://github.com/RissDevSec). See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ☕ and Node.js

</div>