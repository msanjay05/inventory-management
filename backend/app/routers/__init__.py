from app.routers.auth import router as router_auth
from app.routers.customers import router as router_customers
from app.routers.dashboard import router as router_dashboard
from app.routers.orders import router as router_orders
from app.routers.products import router as router_products

__all__ = ["router_auth", "router_customers", "router_dashboard", "router_orders", "router_products"]
