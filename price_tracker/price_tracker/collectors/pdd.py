"""拼多多采集器.

真实抓取入口：移动端搜索 https://mobile.yangkeduo.com/proxy/api/search
请求需 anti_content 签名，无签名时返回风控；默认回退仿真。
"""

from __future__ import annotations

import json
import re
from typing import List

from .base import BaseCollector, clean_title
from ..models import Product


class PddCollector(BaseCollector):
    platform = "pdd"
    SEARCH_URL = "https://mobile.yangkeduo.com/proxy/api/search"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        real = self._fetch_real(keyword, limit)
        if real:
            return real[:limit]
        return self._mock_search(keyword, limit)

    def _fetch_real(self, keyword: str, limit: int):
        if self.use_mock:
            return None
        try:
            params = {"keyword": keyword, "page": 1, "size": limit}
            resp = self._request(self.SEARCH_URL, params=params)
            if not resp:
                return None
            return self._parse_search(resp.text)
        except Exception:
            return None

    def _parse_search(self, text: str) -> List[Product]:
        products: List[Product] = []
        try:
            data = json.loads(text)
        except Exception:
            return products
        items = data.get("items") or data.get("data", {}).get("items") or []
        for it in items:
            goods = it.get("goods", it)
            nid = str(goods.get("goods_id") or "")
            title = clean_title(goods.get("goods_name") or "")
            price = float(goods.get("normal_price", 0)) / 100.0  # 分转元
            sales = int(goods.get("sales_tip") or goods.get("cnt") or 0)
            shop = goods.get("mall_name", "")
            rating = float(goods.get("shop_rating") or 0)
            url = goods.get("share_url") or f"https://mobile.yangkeduo.com/goods.html?goods_id={nid}"
            products.append(Product(
                platform=self.platform,
                product_id=nid,
                title=title,
                price=round(price, 2),
                sales=sales,
                shop_name=shop,
                shop_rating=round(max(0.0, min(5.0, rating)), 2),
                url=url,
                image_url=goods.get("thumb_url", ""),
            ))
        return products

    def _build_url(self, pid: str) -> str:
        return f"https://mobile.yangkeduo.com/goods.html?goods_id={pid}"
