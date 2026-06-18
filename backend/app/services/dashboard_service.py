from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardSummary
from app.schemas.product import ProductResponse

LOW_STOCK_THRESHOLD = 10


def get_dashboard_summary(db: Session) -> DashboardSummary:
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    low_stock = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity_in_stock)
        .all()
    )
    return DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[ProductResponse.model_validate(p) for p in low_stock],
    )
