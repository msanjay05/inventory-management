from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.schemas.product import (
    PaginatedProductResponse,
    ProductAddStock,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.schemas.stock_log import StockLogResponse
from app.services import product_service

router = APIRouter(
    prefix="/products",
    tags=["products"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, data)


@router.get("", response_model=PaginatedProductResponse)
def list_products(
    search: str | None = Query(default=None, min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return product_service.get_products(db, search=search, page=page, page_size=page_size)


@router.get("/{product_id}/stock-logs", response_model=list[StockLogResponse])
def list_stock_logs(product_id: int, db: Session = Depends(get_db)):
    return product_service.list_stock_logs(db, product_id)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return product_service.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    return product_service.update_product(db, product_id, data)


@router.post("/{product_id}/add-stock", response_model=ProductResponse)
def add_stock(product_id: int, data: ProductAddStock, db: Session = Depends(get_db)):
    return product_service.add_stock(db, product_id, data)


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product_service.delete_product(db, product_id)
