from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.routers import (
    router_auth,
    router_customers,
    router_dashboard,
    router_orders,
    router_products,
)
from app.services import auth_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        auth_service.ensure_default_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Inventory Management API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_auth)
app.include_router(router_products)
app.include_router(router_customers)
app.include_router(router_orders)
app.include_router(router_dashboard)


@app.get("/health")
def health():
    return {"status": "ok"}
