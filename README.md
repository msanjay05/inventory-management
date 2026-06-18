# Inventory & Order Management System

Full-stack inventory and order management application with a FastAPI backend, React frontend, and PostgreSQL database.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **Frontend:** React (JavaScript), Vite, React Router, Axios
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose

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
| Password | `admin123` |


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
