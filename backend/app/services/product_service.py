from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductAddStock, ProductCreate, ProductUpdate
from app.services.stock_log_service import (
    CHANGE_INITIAL_STOCK,
    CHANGE_MANUAL_ADD,
    apply_stock_change,
    get_stock_logs,
)


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(
        name=data.name,
        sku=data.sku,
        price=data.price,
        quantity_in_stock=0,
    )
    db.add(product)
    try:
        db.flush()
        if data.quantity_in_stock > 0:
            apply_stock_change(db, product, CHANGE_INITIAL_STOCK, data.quantity_in_stock)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product SKU already exists")
    db.refresh(product)
    return product


from app.schemas.pagination import build_paginated
from app.utils.pagination import paginate_query


def get_products(
    db: Session,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    query = db.query(Product)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.sku.ilike(term),
            )
        )
    query = query.order_by(Product.id)
    items, total, _ = paginate_query(query, page, page_size)
    return build_paginated(items, total, page, page_size)


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def add_stock(db: Session, product_id: int, data: ProductAddStock) -> Product:
    product = (
        db.query(Product).filter(Product.id == product_id).with_for_update().first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    apply_stock_change(db, product, CHANGE_MANUAL_ADD, data.quantity)
    db.commit()
    db.refresh(product)
    return product


def list_stock_logs(db: Session, product_id: int):
    get_product(db, product_id)
    return get_stock_logs(db, product_id)


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product that is referenced in existing orders",
        )
