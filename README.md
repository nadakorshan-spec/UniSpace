# UniSpace — AI-Powered Student Life Management SaaS

**UniSpace** is a modern, student-focused productivity SaaS that brings courses, assignments, exams, the academic calendar, and an AI Study Planner together in one clean workspace.

> **Status:** MVP implemented and verified locally on **2026-11-18**. Live AI generation is the only feature that could not be exercised because `OPENAI_API_KEY` is not available in this environment. See [Known Limitations](#known-limitations--blockers).

---

## 1. SaaS Concept & Target Users

University students juggle several courses, overlapping deadlines, exam revisions, and part-time work. Generic to-do apps do not understand academic terms, course codes, priorities, or exam dates.

UniSpace solves this by providing:

- **One private workspace per student** — every course, task, exam and study plan is scoped to the signed-in user.
- **Academic-aware organisation** — courses with codes/colours/terms, tasks with type/priority/status/deadline, exams with dates and course links.
- **A real dashboard** — statistics are computed from the database, never hard-coded.
- **An AI Study Planner** — uses the student's actual workload to propose a revision timetable.

**Target users:** undergraduate and postgraduate students, study groups, and university productivity/lab demos.

---

## 2. Implemented Features

| # | Feature | Details |
|---|---|---|
| 1 | Authentication | Registration, login, logout, JWT access tokens, hashed refresh tokens in httpOnly cookies, `/auth/me` |
| 2 | PostgreSQL + Prisma | 7 models, initial migration, client generation, seed data, separate test database |
| 3 | User-specific authorization | Ownership checks on every resource; cross-user access returns `404`; no IDOR |
| 4 | Dashboard | Real counts, completion rate, priority/status breakdown, 7-day activity chart, upcoming deadlines and exams |
| 5 | Course management | Full CRUD, unique `(userId, code)`, colour coding, instructor, credits, term, task/exam counts |
| 6 | Task/assignment management | Full CRUD, deadlines, priority (`LOW`–`URGENT`), status (`TODO`/`IN_PROGRESS`/`COMPLETED`), filters, search |
| 7 | Exam management | Full CRUD, start/end timestamps, course association, exam type, location, notes |
| 8 | Academic calendar | Monthly grid merging task deadlines and exams, day detail panel, month navigation |
| 9 | AI Study Planner | Real OpenAI Chat Completions call with JSON-schema validation, persisted plans and sessions |
| 10 | Validation & security | Shared Zod schemas, 422 responses, Helmet, CORS allowlist, auth rate limiting, 1 MB body limits, bcryptjs |
| 11 | Tests | 14 Vitest/Supertest integration + security tests, 9 browser UI E2E checks, standalone smoke script |
| 12 | UI | Responsive lavender/purple/white design, sidebar navigation, toasts, modals, charts, mobile layout |

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Monorepo | npm workspaces, TypeScript strict mode |
| Frontend | React 18, Vite 6, Tailwind CSS v4, React Router 6, Axios, Recharts, lucide-react |
| Backend | Node.js 20+, Express 4, Helmet, CORS, cookie-parser, express-rate-limit |
| Database | PostgreSQL 17, Prisma ORM 6 |
| Validation | Zod 3 (shared between server and web) |
| Auth | jsonwebtoken, bcryptjs, SHA-256 hashed refresh tokens in httpOnly cookies |
| AI | `openai` SDK (`gpt-4o-mini` by default) |
| Testing | Vitest 3, Supertest 7, custom smoke script |
| UI evidence | Playwright Core driving local headless Edge/Chrome |

---

## 4. System Architecture

```text
Browser (React SPA — lavender/purple/white, responsive)
+----------------------------+
| Vite + React + TypeScript  |
| React Router protected UI  |
| Auth context + Axios       |
| (Bearer token + refresh)   |
+-------------+--------------+
              | REST / JSON (/api/v1), credentials for refresh cookie
              v
+----------------------------+
| Express + Node.js API      |
| Zod validation middleware  |
| JWT auth + ownership guards|
| Helmet / CORS / rate limit |
+------+------------+--------+
       | Prisma     | OpenAI SDK
       v            v
+----------------+  +----------------------+
| PostgreSQL 17  |  | OpenAI Study Planner |
| (all user data)|  | (real API call)      |
+----------------+  +----------------------+
```

**Monorepo layout:**

```text
UniSpace/
├── .env.example              # documented env template (no secrets)
├── .gitignore                # excludes .env, node_modules, build output, local DB data
├── docker-compose.yml        # optional local PostgreSQL for reviewers with Docker
├── implementation-plan.md    # 49 MVP tasks + 27 post-MVP tasks with real statuses
├── README.md                 # this file
├── package.json              # npm workspaces and root scripts
├── scripts/
│   └── capture-screenshots.mjs
├── screenshots/              # 8 PNG files (desktop + mobile)
└── packages/
    ├── shared/               # Zod schemas + shared types
    ├── server/               # Express API, Prisma schema/migration/seed, tests
    └── web/                  # React SPA
```

---

## 5. Installation & Local Run

### 5.1 Prerequisites

- Node.js **20+** (verified with Node 24.21.0)
- npm **10+** (verified with npm 11.19.0)
- PostgreSQL **14+** (verified with PostgreSQL 17)
- Git
- Optional: `OPENAI_API_KEY` for live AI planning

> **Windows / PowerShell note:** if `npm` is blocked by the execution policy, either run
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force` once per shell,
> or use `& "C:\Program Files\nodejs\npm.cmd" <args>` instead of `npm <args>`.

### 5.2 Install

```bash
git clone <YOUR_REPOSITORY_URL> UniSpace
cd UniSpace
npm install
```

If npm 11 reports unapproved install scripts, run:

```bash
npm install-scripts approve --all
npm rebuild
```

### 5.3 Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. Generate two independent secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. **Never commit `.env`.**

### 5.4 Database setup

Option A — **existing local PostgreSQL** (used for this submission):

```bash
# using psql / pgAdmin
CREATE DATABASE unispase;
CREATE DATABASE unispase_test;
```

Ensure `DATABASE_URL` and `TEST_DATABASE_URL` in `.env` point to these databases.

Option B — **Docker** (if available):

```bash
docker compose up -d
# create the test database too:
docker exec -it unispase-postgres psql -U postgres -c "CREATE DATABASE unispase_test;"
```

Then apply the migration and seed demo data:

```bash
npm run db:migrate
# If the migration already exists (as in this repo), use:
# npm exec -w @unispace/server -- prisma migrate deploy
npm run db:seed
```

### 5.5 Run the application

Terminal 1 — backend and frontend together:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:server   # backend  -> http://localhost:4000
npm run dev:web      # frontend -> http://localhost:5173 (or 5174 if 5173 is busy)
```

| Service | URL |
|---|---|
| Frontend | **http://localhost:5173** (Vite falls back to **http://localhost:5174** if 5173 is occupied) |
| Backend health | **http://localhost:4000/health** |
| API base | `/api/v1` on the actual frontend port (Vite proxy → port 4000) |

**Demo login:** `demo@unispase.test` / `StudyHard123`
(The seed script creates 4 courses, 8 tasks and 3 exams.)

### 5.6 Production-style run

```bash
npm run build
npm start            # serves the compiled API on PORT (default 4000)
```

The production API was verified on a temporary port: `/health` returned 200 and the demo login returned 200.

---

## 6. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `4000` | API port |
| `NODE_ENV` | No | `development` | Controls security headers and Prisma logging |
| `CORS_ORIGIN` | Production: **Yes** | `http://localhost:5173,http://localhost:5174` | Comma-separated trusted origins; in production only these are allowed (dev also permits local 5173/5174 automatically) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string used by Prisma |
| `TEST_DATABASE_URL` | Tests only | — | Isolated database for Vitest (see note below) |
| `JWT_ACCESS_SECRET` | **Yes** | — | Secret for 15-minute access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret for refresh cookie validation |
| `ACCESS_TOKEN_TTL` | No | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL` | No | `7d` | Refresh token lifetime |
| `OPENAI_API_KEY` | Live AI only | empty | Real OpenAI study-plan generation |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model used by the Study Planner |

**Testing note:** `packages/server/tests/setup.ts` copies `TEST_DATABASE_URL` into `DATABASE_URL` when running Vitest, so integration tests never touch demo data. The smoke script instead calls a running API on `http://localhost:4000` (override with `SMOKE_BASE_URL`).

---

## 7. Testing

```bash
npm run typecheck       # shared + server + web
npm run build           # production build
npm test                # integration + security tests (uses test DB)
npm run test:security   # security suite only
npm run test:ui         # browser E2E against running frontend on :5173 (or :5174 if occupied)
npm run test:smoke      # end-to-end against running API on :4000
```

`npm run test:ui` and `npm run screenshots` need a local Chromium-based browser (Edge or Chrome) and the dev servers running. They use Playwright Core without downloading browser binaries.

### Verified results (2026-11-18)

| Check | Command | Result |
|---|---|---|
| Install | `npm install` | **Passed** (383 packages; install scripts approved/rebuilt) |
| Typecheck | `npm run typecheck` | **Passed** |
| Build | `npm run build` | **Passed** (only Vite chunk-size advisory) |
| Integration + security | `npm test` | **14/14 passed** |
| Security only | `npm run test:security` | **7/7 passed** |
| Browser UI E2E | `npm run test:ui` | **9/9 passed** |
| Smoke | `npm run test:smoke` | **12 passed, 0 failed, 1 skipped** |
| Production API | `npm start` | **Passed** (health 200, login 200) |
| Live OpenAI call | `POST /api/v1/ai/study-plan` | **Not run** — `OPENAI_API_KEY` missing |

**Smoke details:** health, register, login, me, course/task/exam creation, task filters, task status patch, real dashboard stats, merged calendar, course deletion — all passed. The AI step was skipped with the documented `503 AI_NOT_CONFIGURED` response.

**Security details (7/7 passed):**
- Missing, malformed and tampered JWTs rejected
- IDOR prevention across courses, tasks and exams (read/update/delete → 404)
- Weak passwords rejected; duplicate emails return 409
- Malformed IDs and validation-bypass payloads return 422
- Untrusted CORS origins blocked
- User-supplied HTML stored as inert JSON data
- Login rate limiting returns 429

---

## 8. Screenshots

Evidence captured with headless Edge via `npm run screenshots` (requires the dev server and seeded data):

| File | View |
|---|---|
| `screenshots/01-login.png` | Sign-in page |
| `screenshots/02-dashboard.png` | Dashboard with real seeded statistics |
| `screenshots/03-courses.png` | Course management |
| `screenshots/04-tasks.png` | Task assignment management |
| `screenshots/05-exams.png` | Exam management |
| `screenshots/06-calendar.png` | Academic calendar |
| `screenshots/07-ai-planner.png` | AI Study Planner page |
| `screenshots/08-mobile-dashboard.png` | Responsive mobile layout (390×844) |

Regenerate with:

```bash
npm run screenshots
```

---

## 9. AI Integration Explanation

The Study Planner is a **real** integration, not a mock:

1. `POST /api/v1/ai/study-plan` validates input with Zod (`days`, `hoursPerDay`, optional `focusCourseId`, `notes`).
2. The server loads the signed-in user's **uncompleted tasks** and **future exams** from PostgreSQL, including course codes and priorities.
3. Those records are sent to the OpenAI Chat Completions API with a system prompt that enforces JSON output and tells the model to treat all user text as untrusted data.
4. The response is parsed and validated against a strict Zod schema (titles, ISO timestamps, session count, allowed `taskId` values).
5. The plan and its sessions are persisted in `StudyPlan` / `StudySession` and returned to the UI.

**Behaviour without a key:** the endpoint returns HTTP `503` with code `AI_NOT_CONFIGURED` and a clear message. No fake or hard-coded plan is ever substituted.

To enable live generation:

```bash
# in .env
OPENAI_API_KEY="sk-your-real-key"
```

Restart the API and generate a plan from the UI. Usage may incur OpenAI charges.

---

## 10. Security Notes

- Passwords hashed with bcryptjs (10 rounds); plaintext passwords are never persisted.
- Refresh tokens are stored only as SHA-256 hashes; the raw token is delivered in an httpOnly, same-site cookie.
- Ownership checks run before every read/update/delete; non-owned resources return `404` (no existence leak).
- Helmet security headers, CORS allowlist, auth route rate limiting, and 1 MB request-body limits.
- Zod validation is shared between client and server; invalid input returns `422` with field details.
- `.env`, secrets, `node_modules`, local database data and logs are gitignored.

---

## 11. Known Limitations & Blockers

| Item | Status |
|---|---|
| Live AI study-plan generation | **Blocked** — no `OPENAI_API_KEY` in this environment. Endpoint and UI are implemented; returns `503 AI_NOT_CONFIGURED`. |
| Frontend unit tests | Not configured; browser E2E (`npm run test:ui`, 9/9 passed) covers the critical user flows instead. |
| Docker | Docker is not installed here; local PostgreSQL 17 service was used. A `docker-compose.yml` is provided for reviewers. |
| Vite chunk-size warning | Non-blocking advisory from Recharts bundle size. |
| Post-MVP roadmap | PDF assistant, email reset, OAuth, roles, reminders, iCal sync, CI/CD, billing, i18n — see `implementation-plan.md` Section 6. |

---

## 12. Git & GitHub Submission

The repository is initialized. No remote is configured, no commits were made by the agent, and nothing was pushed.

Status before your publish step: untracked/modified source files only; `.env` and `node_modules` are ignored.

Publish only when you are ready and have authentication configured:

```bash
git add .
git commit -m "feat: complete UniSpace MVP for lab submission"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

If a remote already exists, replace the `remote add` line with:

```bash
git remote set-url origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
```

> Do not publish API keys, `.env`, database credentials, or `node_modules`. They are excluded by `.gitignore`; double-check with `git status` before committing.
