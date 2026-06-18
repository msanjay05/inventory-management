from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    full_name: Annotated[str, Field(min_length=1, max_length=255)]
    email: EmailStr
    country_code: Annotated[str, Field(min_length=2, max_length=5, pattern=r"^\+?\d{1,4}$")]
    phone_number: Annotated[str, Field(min_length=1, max_length=20)]


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str


class PaginatedCustomerResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
