"""淘宝采集器.

真实抓取入口：https://s.taobao.com/search?q=...
页面为 CSR，数据在 window.g_page_config / __INIT_DATA__ 中；
无登录 cookie 时仅返回风控页，故默认回退仿真。
"""

from __future__ import annotations

import json
import re
from typing import List

from .base import BaseCollector, clean_title
from ..models import Product


class TaobaoCollector(BaseCollector):
    platform = "taobao"
    SEARCH_URL = "https://s.taobao.com/search"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        real = self._fetch_real(keyword, limit)
        if real:
            return real[:limit]
        return self._mock_search(keyword, limit)

    def _fetch_real(self, keyword: str, limit: int):
        if self.use_mock:
            return None
        try:
            params = {"q": keyword, "s": 0}
            resp = self._request(self.SEARCH_URL, params=params)
            if not resp:
                return None
            return self._parse_search(resp.text)
        except Exception:
            return None

    def _parse_search(self, html: str) -> List[Product]:
        products: List[Product] = []
        # 尝试从内嵌 JSON 提取 auction 数据
        m = re.search(r" auctionList\s*[:=]\s*(\[.*?\]);", html, re.S)
        if not m:
            # 兼容 g_page_config
            m = re.search(r"g_page_config\s*=\s*(\{.*?\});", html, re.S)
            if m:
                try:
                    cfg = json.loads(m.group(1))
                    items = cfg.get("mods", {}).get("itemlist", {}).get("data", {}).get("auctions", [])
                    for it in items:
                        products.append(self._map_auction(it))
                except Exception:
                    pass
            return products
        try:
            auctions = json.loads(m.group(1))
            for it in auctions:
                products.append(self._map_auction(it))
        except Exception:
            pass
        return products

    def _map_auction(self, it: dict) -> Product:
        nid = str(it.get("nid") or it.get("item_id") or "")
        title = clean_title(it.get("raw_title") or it.get("title") or "")
        price = float(it.get("view_price") or it.get("price") or 0)
        sales_text = it.get("view_sales") or it.get("sales") or "0"
        sales = int(re.sub(r"\D", "", str(sales_text)) or 0)
        shop = it.get("nick") or it.get("shop_name") or ""
        rating = float(it.get("shopcard", {}).get("shopRating") or 0) / 20.0  # 0-100 -> 0-5
        url = it.get("detail_url") or f"https://item.taobao.com/item.htm?id={nid}"
        return Product(
            platform=self.platform,
            product_id=nid,
            title=title,
            price=price,
            sales=sales,
            shop_name=shop,
            shop_rating=round(max(0.0, min(5.0, rating)), 2),
            url=url,
            image_url=it.get("pic_url", ""),
        )

    def _build_url(self, pid: str) -> str:
        return f"https://item.taobao.com/item.htm?id={pid}"
