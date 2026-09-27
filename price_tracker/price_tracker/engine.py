"""采集-分析编排引擎：CLI 与 Web 共用同一套业务逻辑."""

from __future__ import annotations

import csv
import io
import json
import os
from typing import Dict, List, Optional, Sequence

from . import pipeline, compare, recommend, visualize
from .models import Product


def run(
    keyword: str,
    platforms: Sequence[str] = ("jd", "taobao", "pdd"),
    limit_per_platform: int = 20,
    use_mock: bool = True,
    charts_dir: Optional[str] = None,
    cookies: Optional[dict] = None,
) -> Dict:
    """执行完整采集分析流程，返回结构化结果.

    返回结构：
      {
        "keyword", "platforms", "use_mock",
        "summary": {...},                  # pipeline.summarize
        "platform_comparison": [...],      # compare.compare_platforms
        "items": [{rank, platform, title, price, original_price,
                   discount_ratio, sales, shop_name, shop_rating,
                   url, value_score, recommended, price_score,
                   sales_score, shop_score, discount_score}],
        "charts": {distribution, platform, value}  # 路径，仅 charts_dir 提供时
      }
    """
    products: List[Product] = pipeline.run_pipeline(
        keyword, platforms, limit_per_platform, use_mock, cookies
    )
    scores = recommend.tag_recommendations(products)

    # 合并主表：商品字段 + 性价比评分
    score_by_id = {id(it["product"]): it for it in scores}
    items = []
    for idx, p in enumerate(products, 1):
        sc = score_by_id.get(id(p), {})
        items.append({
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
            "value_score": sc.get("value_score", 0),
            "recommended": sc.get("recommended", False),
            "price_score": sc.get("price_score", 0),
            "sales_score": sc.get("sales_score", 0),
            "shop_score": sc.get("shop_score", 0),
            "discount_score": sc.get("discount_score", 0),
        })

    result = {
        "keyword": keyword,
        "platforms": list(platforms),
        "use_mock": use_mock,
        "summary": pipeline.summarize(products),
        "platform_comparison": compare.compare_platforms(products),
        "items": items,
        "charts": None,
    }

    if charts_dir:
        try:
            result["charts"] = visualize.render_all(products, scores, charts_dir)
        except Exception as e:
            print(f"[warn] 图表生成失败: {e}")
            result["charts"] = None
    return result


def to_json(result: Dict, indent: int = 2) -> str:
    return json.dumps(result, ensure_ascii=False, indent=indent)


def to_csv(items: List[Dict]) -> str:
    if not items:
        return ""
    fields = ["rank", "platform", "title", "price", "original_price",
              "discount_ratio", "sales", "shop_name", "shop_rating",
              "value_score", "recommended", "url"]
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for it in items:
        writer.writerow(it)
    return buf.getvalue()
