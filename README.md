# Task Manager: Full-Stack MVC App with Local CI/CD

A multi-user task manager. Users register, sign in, and manage their own tasks: create, list, filter, edit, and delete. The project runs a production-like setup on a laptop: containers, a reverse proxy, a CI pipeline, and Kubernetes.

## Architecture

```
Browser ──► Nginx reverse proxy (:8080)
              ├── /api/*  ──► Backend API (Express, 2 replicas in k8s) ──► PostgreSQL
              └── /*      ──► Frontend (React build served by Nginx)
```

| MVC layer | Location | Responsibility |
|---|---|---|
| **Model** | `backend/src/models` | SQL schema and data access, per-user scoping |
| **View** | `frontend/src` | React UI: pages, components |
| **Controller** | `backend/src/controllers`, `backend/src/routes` | Business logic, validation, HTTP routing |

A request flows: `routes/taskRoutes.js` → `middleware/validate.js` (Zod) → `controllers/taskController.js` → `models/taskModel.js` → PostgreSQL.

## Tech stack

Node.js 22, Express 5, PostgreSQL 16, React + Vite, Zod, JWT, pino, Jest, Vitest, Docker, docker compose, Nginx, GitHub Actions + act, Kind/Minikube.

## Project structure

```
task-manager/
├── .github/workflows/ci.yml        # CI pipeline (GitHub Actions / act)
├── backend/                        # REST API (Express)
│   ├── src/
│   │   ├── config/                 # env config, logger, DB pool
│   │   ├── models/                 # M: SQL data access
│   │   ├── controllers/            # C: business logic
│   │   ├── routes/                 # C: HTTP routing
│   │   ├── middleware/             # auth, validation, errors
│   │   ├── validators/             # Zod request schemas
│   │   ├── db/migrations/          # SQL schema
│   │   ├── utils/
│   │   ├── app.js                  # Express app factory
│   │   └── server.js               # entry point
│   ├── tests/{unit,integration}/
│   ├── Dockerfile
│   └── package.json
├── frontend/                       # V: React UI (Vite)
│   ├── src/{components,pages,services,context,hooks,utils,test}/
│   ├── nginx.conf                  # static file server config
│   ├── Dockerfile
│   └── package.json
├── nginx/                          # reverse proxy (single entry point)
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/                            # Kubernetes manifests (kustomize)
├── scripts/                        # smoke test, cluster scripts
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

Docker Desktop, Node.js 22 (20.19+ works), act, kubectl, Kind (or Minikube).

## Quick start (docker compose)

```bash
cp .env.example .env
docker compose up -d --build --wait
# open http://localhost:8080
sh scripts/smoke-test.sh          # end-to-end test
docker compose down               # stop (all data is removed)
```

## Local development

```bash
docker run -d --name taskdb-dev -e POSTGRES_USER=taskuser -e POSTGRES_PASSWORD=taskpass \
  -e POSTGRES_DB=taskdb -p 5432:5432 postgres:16-alpine
docker exec taskdb-dev createdb -U taskuser taskdb_test
cd backend && cp .env.example .env && npm install && npm run dev      # http://localhost:4000
cd frontend && npm install && npm run dev                              # http://localhost:5173
```

The Vite dev server proxies `/api` to `localhost:4000`, the same path layout Nginx uses in the containers.

## Testing

| What | Command |
|---|---|
| Backend unit tests | `cd backend && npm test` |
| Backend integration tests (real Postgres) | `cd backend && npm run test:integration` |
| Frontend tests | `cd frontend && npm test` |
| Lint / format | `npm run lint`, `npm run format:check` (each package) |
| End-to-end through the proxy | `sh scripts/smoke-test.sh http://localhost:8080` |

## CI/CD pipeline

`.github/workflows/ci.yml` runs on every push and pull request:

1. **backend**: lint, format check, unit tests with coverage, integration tests against a Postgres service container
2. **frontend**: lint, format check, tests, production build
3. **docker** (after 1 and 2 pass): build all images, start the stack with compose, run the smoke test through Nginx, show logs on failure, tear down

Run it locally with [act](https://nektosact.com): `act push` (or `act -j docker` for one job). `.actrc` pins the runner image.

## Kubernetes

```bash
./scripts/k8s-kind-up.sh          # creates the cluster, builds and loads images, deploys
# open http://localhost:8081
sh scripts/smoke-test.sh http://localhost:8081
./scripts/k8s-kind-down.sh
```

Manifests in `k8s/` use kustomize: Postgres (emptyDir), backend (2 replicas, readiness and liveness probes), frontend (2 replicas), Nginx proxy (NodePort 30080 mapped to localhost:8081). All pods run as non-root with read-only root file systems.

Useful demo commands:

```bash
kubectl -n task-manager get pods -o wide
kubectl -n task-manager logs -l app=backend -f --prefix          # logs from both replicas
kubectl -n task-manager delete pod -l app=backend --wait=false   # self-healing
kubectl -n task-manager scale deployment/backend --replicas=3    # scaling
```

Minikube alternative:

```bash
minikube start
for s in backend frontend; do docker build -t task-manager-$s:local $s; done
docker build -t task-manager-proxy:local nginx
minikube image load task-manager-backend:local task-manager-frontend:local task-manager-proxy:local
kubectl apply -k k8s
minikube service proxy -n task-manager --url
```

## Logging

- **Backend:** structured JSON logs (pino) with a request id on every line. Passwords and auth headers are redacted.
- **Frontend:** a logger module writes to the browser console and sends events and errors to `POST /api/logs`. They appear in the backend log stream with `source: "frontend"`.
- **Nginx:** JSON access logs. `request_id` matches the backend `reqId`, so one request can be traced end to end.

View logs with `docker compose logs -f backend proxy` or `kubectl -n task-manager logs -l app=backend -f`.

## API

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/api/health` | no | | 200 liveness |
| GET | `/api/ready` | no | | 200 when the DB is reachable, otherwise 503 |
| POST | `/api/auth/register` | no | `{username, email, password}` | 201 `{user, token}` |
| POST | `/api/auth/login` | no | `{email, password}` | 200 `{user, token}` |
| GET | `/api/auth/me` | yes | | 200 `{user}` |
| GET | `/api/tasks?status=todo` | yes | | 200 `{tasks}` |
| POST | `/api/tasks` | yes | `{title, description?, status?, priority?, dueDate?}` | 201 `{task}` |
| GET | `/api/tasks/:id` | yes | | 200 `{task}` |
| PATCH | `/api/tasks/:id` | yes | any task field | 200 `{task}` |
| DELETE | `/api/tasks/:id` | yes | | 204 |
| POST | `/api/logs` | no | `{level, message, context?}` | 202 |

Errors always have this shape: `{ "error": { "message": "...", "details": [{ "field", "message" }] } }`.

## Design decisions and assumptions

- **Stateless containers (non-persistent design):** images contain only code, and configuration comes from environment variables. Postgres runs on tmpfs in compose and on emptyDir in Kubernetes, so data is removed when the stack stops. This is deliberate for a demo environment. A real deployment would use a managed database or a PersistentVolume.
- **JWT auth:** stateless, so backend replicas need no shared session store.
- **Per-user isolation in the model layer:** every task query filters on `user_id`. Other users' tasks return 404, which does not reveal that they exist.
- **Migrations on startup:** idempotent SQL with a Postgres advisory lock, so several replicas can start at once safely.
- **Single entry point:** Nginx routes `/api` and `/`, so the browser makes same-origin calls and no CORS is needed in production.
- **Security basics:** non-root containers, read-only root file systems, helmet headers, bcrypt password hashing, input validation with Zod, parameterized SQL.
- **Secrets:** `.env` and `k8s/secret.yaml` hold demo values only.
- **Out of scope:** HTTPS, rate limiting, refresh tokens, pagination, roles and admin users. These are listed as future improvements.

## Coding standards

ESLint (recommended rules, plus React Hooks rules in the frontend) + Prettier (shared `.prettierrc`) + EditorConfig. Both are enforced in CI. Line endings are normalised to LF via `.gitattributes`. Commits follow [Conventional Commits](https://www.conventionalcommits.org).

## Future improvements

HTTPS via cert-manager, rate limiting on auth endpoints, a refresh-token flow, pagination, Prometheus metrics, a Helm chart, and a persistent volume for Postgres.
