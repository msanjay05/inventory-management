# Inventory & Order Management System

Full-stack inventory and order management application with a FastAPI backend, React frontend, and PostgreSQL database.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **Frontend:** React (JavaScript), Vite, React Router, Axios
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose
- **Deployment:** Railway

## Features

- Product management (CRUD)
- Customer management (create, list, view, delete)
- Order management with automatic stock deduction and total calculation
- Dashboard with summary stats and low-stock alerts
- Admin authentication (JWT)

## Default Admin Login

On first startup, a default admin is created if one does not exist. Set `DEFAULT_ADMIN_PASSWORD` in the backend environment.

| Field    | Value                 |
|----------|-----------------------|
| Email    | `admin@inventory.com` |
| Password | Value of `DEFAULT_ADMIN_PASSWORD` |


## Local Development

### Prerequisites

- Docker and Docker Compose

### Environment setup

Copy the backend environment template and adjust values if needed:

```bash
cp backend/.env.example backend/.env
```

For Docker Compose, `backend/.env` uses `db` as the database host. For running the backend locally without Docker, set `DATABASE_URL` to use `localhost`.

### Run with Docker Compose

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |

### Stop

```bash
docker compose down
```

To remove database data:

```bash
docker compose down -v
```

## API Endpoints

| Resource  | Endpoints |
|-----------|-----------|
| Auth      | `POST /auth/login` |
| Products  | `POST/GET/GET{id}/PUT/DELETE /products` |
| Customers | `POST/GET/GET{id}/DELETE /customers` |
| Orders    | `POST/GET/GET{id}/DELETE /orders` |
| Dashboard | `GET /dashboard/summary` |

## Railway Deployment

### 1. Create Railway Project

1. Sign up at [railway.app](https://railway.app)
2. Create a new project
3. Add a **PostgreSQL** plugin and note the `DATABASE_URL`

### 2. Deploy Backend

1. Add a new service from your GitHub repo
2. Set **Root Directory** to `backend`
3. Set environment variables:
   - `DATABASE_URL` — from the PostgreSQL plugin (Railway provides this automatically when you link the database)
   - `CORS_ORIGINS` — your frontend Railway URL (e.g. `https://your-frontend.up.railway.app`)
   - `JWT_SECRET_KEY` — a strong random secret for signing JWT tokens
   - `JWT_ALGORITHM` — `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` — e.g. `480`
   - `DEFAULT_ADMIN_EMAIL` — e.g. `admin@inventory.com`
   - `DEFAULT_ADMIN_NAME` — e.g. `Admin`
   - `DEFAULT_ADMIN_PASSWORD` — password for the initial admin account
4. Railway builds from `backend/Dockerfile` (or uses `railway.toml`)
5. Migrations run automatically on startup via `entrypoint.sh`
6. Note the generated backend URL for the frontend build

### 3. Deploy Frontend

1. Add another service from the same repo
2. Set **Root Directory** to `frontend`
3. Set **Dockerfile target** to `production` (or configure Railway to use the production stage)
4. Set build-time variable:
   - `VITE_API_URL` — your backend Railway URL (e.g. `https://your-backend.up.railway.app`)
5. Railway builds the Nginx production image from `frontend/Dockerfile`

### 4. Link Services

- In the backend service, reference the PostgreSQL plugin's `DATABASE_URL`
- Ensure `CORS_ORIGINS` on the backend includes the exact frontend URL (no trailing slash)
- Redeploy frontend after backend URL is known so `VITE_API_URL` is correct at build time

### 5. Verify

- Backend: visit `https://<backend-url>/docs`
- Frontend: visit your frontend URL
- Create a product, customer, and order to confirm end-to-end flow

## Environment Variables

| Variable       | Service  | Description |
|----------------|----------|-------------|
| `POSTGRES_DB` | docker (root `.env`) | PostgreSQL database name |
| `POSTGRES_USER` | docker (root `.env`) | PostgreSQL username |
| `POSTGRES_PASSWORD` | docker (root `.env`) | PostgreSQL password |
| `DATABASE_URL` | backend  | PostgreSQL connection string |
| `CORS_ORIGINS` | backend  | Comma-separated allowed frontend origins |
| `JWT_SECRET_KEY` | backend  | Secret key for signing JWT tokens |
| `JWT_ALGORITHM` | backend | JWT signing algorithm (e.g. `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | JWT access token lifetime in minutes |
| `DEFAULT_ADMIN_EMAIL` | backend | Email for the default admin seeded on first startup |
| `DEFAULT_ADMIN_NAME` | backend | Display name for the default admin |
| `DEFAULT_ADMIN_PASSWORD` | backend | Password for the default admin seeded on first startup |
| `VITE_API_URL` | frontend | Backend API URL (build-time) |

## Business Rules

- Product SKU must be unique
- Customer email must be unique
- Customer phone number must be unique (validated with `phonenumbers`, stored as `+91-7544008412`)
- Product quantity cannot be negative
- Orders require sufficient inventory
- Creating an order reduces stock automatically
- Order total is calculated by the backend
- Cancelling an order restores stock
