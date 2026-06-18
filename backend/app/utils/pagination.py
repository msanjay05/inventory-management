import math


def paginate_query(query, page: int, page_size: int):
    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return items, total, total_pages
