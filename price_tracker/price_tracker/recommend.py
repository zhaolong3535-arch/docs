"""性价比推荐：综合价格分位、销量、店铺评分、折扣给出评分与标注."""

from __future__ import annotations

import statistics
from typing import Dict, List

from .models import Product


def score_value(products: List[Product]) -> List[Dict]:
    """为每个商品计算性价比评分（0-100）并标注推荐.

    评分模型（线性加权）：
      - 价格越低得分越高（价格分位反向归一化）  权重 0.5
      - 销量越高得分越高（log 归一化）           权重 0.25
      - 店铺评分越高得分越高                      权重 0.15
      - 折扣力度越大得分越高                      权重 0.10
    取评分 Top 3 标注为「性价比推荐」。
    """
    if not products:
        return []

    prices = [p.price for p in products]
    p_min, p_max = min(prices), max(prices)
    sales = [p.sales for p in products]
    s_max = max(sales) or 1
    import math
    log_sales = [math.log1p(s) for s in sales]
    ls_min, ls_max = min(log_sales), max(log_sales)

    scored = []
    for i, p in enumerate(products):
        # 价格分：越低越好 → 反向归一化
        price_score = 1 - (p.price - p_min) / (p_max - p_min) if p_max > p_min else 1.0
        # 销量分：log 归一化
        ls = log_sales[i]
        sales_score = (ls - ls_min) / (ls_max - ls_min) if ls_max > ls_min else 1.0
        # 店铺评分
        shop_score = p.shop_rating / 5.0
        # 折扣力度
        discount = p.discount_ratio  # 0-1

        total = (
            price_score * 0.50
            + sales_score * 0.25
            + shop_score * 0.15
            + discount * 0.10
        )
        score = round(max(0.0, min(1.0, total)) * 100, 1)
        scored.append({
            "product": p,
            "value_score": score,
            "price_score": round(price_score * 100, 1),
            "sales_score": round(sales_score * 100, 1),
            "shop_score": round(shop_score * 100, 1),
            "discount_score": round(discount * 100, 1),
        })

    # 推荐 Top 3
    ranked = sorted(scored, key=lambda x: x["value_score"], reverse=True)
    recommend_ids = set()
    for item in ranked[:3]:
        item["recommended"] = True
        recommend_ids.add(id(item))
    for item in ranked[3:]:
        item["recommended"] = False
    # 按 price asc 恢复顺序，便于和主表对齐
    id_to_item = {id(it): it for it in scored}
    ordered = [id_to_item[i] for i in (id(it) for it in scored)]
    return ordered


def tag_recommendations(products: List[Product]) -> List[Dict]:
    """返回带推荐标注的商品列表（保持价格升序）."""
    return score_value(products)
