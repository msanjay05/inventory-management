from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemResponse, OrderListResponse, OrderResponse
from app.schemas.pagination import build_paginated
from app.services.customer_service import get_customer
from app.services.stock_log_service import CHANGE_ORDER_CANCELLED, CHANGE_ORDER_PLACED, apply_stock_change
from app.utils.pagination import paginate_query


def _build_order_list_response(order: Order) -> OrderListResponse:
    return OrderListResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        status=order.status,
        customer_name=order.customer.full_name if order.customer else None,
    )


def _build_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=item.line_total,
            product_name=item.product.name if item.product else None,
        )
        for item in order.items
    ]
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        status=order.status,
        items=items,
        customer_name=order.customer.full_name if order.customer else None,
    )


def create_order(db: Session, data: OrderCreate) -> Order:
    get_customer(db, data.customer_id)

    try:
        total_amount = Decimal("0")
        order_items: list[OrderItem] = []
        products_to_update: list[tuple[Product, int]] = []

        for item_data in data.items:
            product = (
                db.query(Product)
                .filter(Product.id == item_data.product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item_data.product_id} not found",
                )
            if product.quantity_in_stock < item_data.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product '{product.name}'. "
                    f"Available: {product.quantity_in_stock}, requested: {item_data.quantity}",
                )

            line_total = product.price * item_data.quantity
            total_amount += line_total
            products_to_update.append((product, item_data.quantity))

            order_items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=item_data.quantity,
                    unit_price=product.price,
                    line_total=line_total,
                )
            )

        order = Order(
            customer_id=data.customer_id,
            total_amount=total_amount,
            status="completed",
            items=order_items,
        )
        db.add(order)
        db.flush()

        for product, quantity in products_to_update:
            apply_stock_change(db, product, CHANGE_ORDER_PLACED, -quantity, order_id=order.id)

        db.commit()
    except HTTPException:
        db.rollback()
        raise

    db.refresh(order)
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order.id)
        .first()
    )
    return order


def get_orders(db: Session, page: int = 1, page_size: int = 10) -> dict:
    query = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .order_by(Order.id.desc())
    )
    items, total, _ = paginate_query(query, page, page_size)
    return build_paginated(items, total, page, page_size)


def get_order(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def delete_order(db: Session, order_id: int) -> None:
    order = get_order(db, order_id)
    for item in order.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )
        if product:
            apply_stock_change(
                db, product, CHANGE_ORDER_CANCELLED, item.quantity, order_id=order.id
            )
    db.delete(order)
    db.commit()


def build_order_response(order: Order) -> OrderResponse:
    return _build_order_response(order)


def build_order_list_response(order: Order) -> OrderListResponse:
    return _build_order_list_response(order)
