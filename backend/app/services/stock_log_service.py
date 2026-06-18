from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_log import StockLog

CHANGE_ORDER_PLACED = "order_placed"
CHANGE_ORDER_CANCELLED = "order_cancelled"
CHANGE_MANUAL_ADD = "manual_add"
CHANGE_INITIAL_STOCK = "initial_stock"


def apply_stock_change(
    db: Session,
    product: Product,
    change_type: str,
    quantity_change: int,
    order_id: int | None = None,
) -> StockLog:
    quantity_before = product.quantity_in_stock
    quantity_after = quantity_before + quantity_change

    log = StockLog(
        product_id=product.id,
        change_type=change_type,
        quantity_change=quantity_change,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        order_id=order_id,
    )
    product.quantity_in_stock = quantity_after
    db.add(log)
    return log


def get_stock_logs(db: Session, product_id: int) -> list[StockLog]:
    return (
        db.query(StockLog)
        .filter(StockLog.product_id == product_id)
        .order_by(StockLog.created_at.desc())
        .all()
    )
