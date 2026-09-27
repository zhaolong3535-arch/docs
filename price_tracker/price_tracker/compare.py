"""横向对比：跨平台价格、销量、店铺评分维度对比."""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from .models import Product


def compare_platforms(products: List[Product]) -> List[Dict]:
    """按平台横向对比：最低价/均价/最高价/平均销量/平均店铺评分.

    Returns:
        [{"platform", "count", "price_min", "price_avg", "price_max",
          "sales_avg", "shop_rating_avg", "best_value_count"}]
    """
    grouped: Dict[str, List[Product]] = defaultdict(list)
    for p in products:
        grouped[p.platform].append(p)

    rows = []
    for pf, items in grouped.items():
        prices = [p.price for p in items]
        sales = [p.sales for p in items]
        ratings = [p.shop_rating for p in items]
        rows.append({
            "platform": pf,
            "count": len(items),
            "price_min": round(min(prices), 2),
            "price_avg": round(sum(prices) / len(prices), 2),
            "price_max": round(max(prices), 2),
            "sales_avg": round(sum(sales) / len(sales)) if sales else 0,
            "shop_rating_avg": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        })
    # 按均价升序，便于一眼看出哪个平台更便宜
    rows.sort(key=lambda r: r["price_avg"])
    return rows


def build_comparison_table(products: List[Product]) -> List[Dict]:
    """生成商品级横向对比表：保留关键字段，便于前端渲染/导出."""
    table = []
    for idx, p in enumerate(products, 1):
        table.append({
            "rank": idx,
            "platform": p.platform,
            "title": p.title,
            "price": p.price,
            "original_price": p.original_price,
            "discount_ratio": p.discount_ratio,
            "sales": p.sales,
            "shop_name": p.shop_name,
            "shop_rating": p.shop_rating,
            "url": p.url,
        })
    return table
