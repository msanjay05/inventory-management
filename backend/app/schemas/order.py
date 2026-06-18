from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: Annotated[int, Field(gt=0)]


class OrderCreate(BaseModel):
    customer_id: int
    items: Annotated[list[OrderItemCreate], Field(min_length=1)]


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product_name: str | None = None


class OrderListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    customer_name: str | None = None


class OrderResponse(OrderListResponse):
    items: list[OrderItemResponse] = []


class PaginatedOrderResponse(BaseModel):
    items: list[OrderListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
