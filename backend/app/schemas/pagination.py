import math
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


def build_paginated(items: list, total: int, page: int, page_size: int) -> dict:
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
