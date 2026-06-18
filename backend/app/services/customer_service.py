from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate
from app.schemas.pagination import build_paginated
from app.utils.pagination import paginate_query
from app.utils.phone import PhoneValidationError, normalize_phone


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    try:
        phone = normalize_phone(data.country_code, data.phone_number)
    except PhoneValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    customer = Customer(
        full_name=data.full_name,
        email=data.email,
        phone=phone,
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        err_msg = str(exc.orig)
        if "uq_customers_phone" in err_msg:
            raise HTTPException(status_code=409, detail="Phone number already exists") from exc
        raise HTTPException(status_code=409, detail="Customer email already exists") from exc
    db.refresh(customer)
    return customer


def get_customers(
    db: Session,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    query = db.query(Customer)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.email.ilike(term),
                Customer.phone.ilike(term),
                Customer.full_name.ilike(term),
            )
        )
    query = query.order_by(Customer.id)
    items, total, _ = paginate_query(query, page, page_size)
    return build_paginated(items, total, page, page_size)


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    try:
        db.delete(customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer that has existing orders",
        )
