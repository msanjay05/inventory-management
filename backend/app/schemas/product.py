from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=255)]
    sku: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[Decimal, Field(gt=0)]
    quantity_in_stock: Annotated[int, Field(ge=0)] = 0


class ProductUpdate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=255)] | None = None
    price: Annotated[Decimal, Field(gt=0)] | None = None


class ProductAddStock(BaseModel):
    quantity: Annotated[int, Field(gt=0)]


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int


class PaginatedProductResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
