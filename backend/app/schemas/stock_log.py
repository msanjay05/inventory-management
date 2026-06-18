from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductResponse


class StockLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    change_type: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    order_id: int | None
    created_at: datetime
