from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.schemas.order import OrderCreate, OrderResponse, PaginatedOrderResponse
from app.services import order_service

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    order = order_service.create_order(db, data)
    return order_service.build_order_response(order)


@router.get("", response_model=PaginatedOrderResponse)
def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = order_service.get_orders(db, page=page, page_size=page_size)
    result["items"] = [order_service.build_order_list_response(o) for o in result["items"]]
    return result


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = order_service.get_order(db, order_id)
    return order_service.build_order_response(order)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order_service.delete_order(db, order_id)
