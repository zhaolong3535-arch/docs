"""数据流水线：采集聚合 → 清洗 → 去重 → 标准化 → 排序."""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Sequence

from .models import Product
from .collectors import get_collector


# ------------------------------------------------------------------
# 1. 采集聚合
# ------------------------------------------------------------------
def collect(
    keyword: str,
    platforms: Sequence[str] = ("jd", "taobao", "pdd"),
    limit_per_platform: int = 20,
    use_mock: bool = True,
    cookies: Optional[dict] = None,
) -> List[Product]:
    """从多个平台采集商品，合并返回原始 Product 列表."""
    all_items: List[Product] = []
    for pf in platforms:
        try:
            collector = get_collector(pf, use_mock=use_mock, cookies=cookies)
            items = collector.search(keyword, limit=limit_per_platform)
            all_items.extend(items)
        except Exception as e:  # 单平台失败不中断整体
            print(f"[warn] 平台 {pf} 采集失败: {e}")
    return all_items


# ------------------------------------------------------------------
# 2. 清洗
# ------------------------------------------------------------------
def _normalize_title(title: str) -> str:
    """标题标准化：去除空白与标点，便于去重比对."""
    title = re.sub(r"\s+", "", title)
    title = re.sub(r"[【】\[\]（）()·\-|/]", "", title)
    return title.lower()


def clean(products: Iterable[Product]) -> List[Product]:
    """清洗：剔除无标题/无价格/价格非法的记录，规整字段."""
    cleaned: List[Product] = []
    for p in products:
        # 必填字段校验
        if not p.title or p.price is None or p.price <= 0:
            continue
        # 数值规整
        p.price = round(float(p.price), 2)
        if p.original_price is not None:
            p.original_price = round(float(p.original_price), 2)
            if p.original_price <= p.price:
                p.original_price = None
        p.sales = max(0, int(p.sales or 0))
        p.shop_rating = round(max(0.0, min(5.0, float(p.shop_rating or 0.0))), 2)
        if not p.url:
            p.url = ""
        cleaned.append(p)
    return cleaned


# ------------------------------------------------------------------
# 3. 去重
# ------------------------------------------------------------------
def deduplicate(products: Iterable[Product]) -> List[Product]:
    """去重：同平台同商品 ID 去重；标题相似且价格接近也视为重复."""
    seen_ids = set()
    seen_titles = {}  # norm_title -> (price, index)
    result: List[Product] = []
    for p in products:
        key_id = (p.platform, p.product_id)
        if p.product_id and key_id in seen_ids:
            continue
        norm = _normalize_title(p.title)
        # 标题+价格接近视为重复：同标题价格差异 < 5%
        dup = False
        if norm in seen_titles:
            ref_price, _ = seen_titles[norm]
            if ref_price > 0 and abs(p.price - ref_price) / ref_price < 0.05:
                dup = True
        if dup:
            continue
        seen_ids.add(key_id)
        seen_titles[norm] = (p.price, len(result))
        result.append(p)
    return result


# ------------------------------------------------------------------
# 4. 排序
# ------------------------------------------------------------------
def sort_by_price(products: Iterable[Product], ascending: bool = True) -> List[Product]:
    """按价格排序，默认从低到高."""
    return sorted(products, key=lambda p: p.price, reverse=not ascending)


# ------------------------------------------------------------------
# 5. 一站式流水线
# ------------------------------------------------------------------
def run_pipeline(
    keyword: str,
    platforms: Sequence[str] = ("jd", "taobao", "pdd"),
    limit_per_platform: int = 20,
    use_mock: bool = True,
    cookies: Optional[dict] = None,
) -> List[Product]:
    """采集 → 清洗 → 去重 → 按价格升序排序，返回最终结果列表."""
    raw = collect(keyword, platforms, limit_per_platform, use_mock, cookies)
    cleaned = clean(raw)
    deduped = deduplicate(cleaned)
    return sort_by_price(deduped, ascending=True)


def summarize(products: List[Product]) -> Dict:
    """生成采集统计摘要."""
    by_platform: Dict[str, dict] = defaultdict(lambda: {"count": 0, "prices": []})
    for p in products:
        by_platform[p.platform]["count"] += 1
        by_platform[p.platform]["prices"].append(p.price)
    stats = {}
    for pf, d in by_platform.items():
        ps = d["prices"]
        stats[pf] = {
            "count": d["count"],
            "min": round(min(ps), 2) if ps else 0,
            "max": round(max(ps), 2) if ps else 0,
            "avg": round(sum(ps) / len(ps), 2) if ps else 0,
        }
    return {
        "total": len(products),
        "platforms": stats,
        "price_min": round(min((p.price for p in products), default=0), 2),
        "price_max": round(max((p.price for p in products), default=0), 2),
        "price_avg": round(sum(p.price for p in products) / len(products), 2) if products else 0,
    }
