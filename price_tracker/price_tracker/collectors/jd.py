"""京东采集器.

真实抓取入口：移动端搜索页 https://so.m.jd.com/ware/search.action
返回 JSON-like 数据，需配合登录 cookie；缺省时回退仿真。
"""

from __future__ import annotations

import json
import re
from typing import List

from .base import BaseCollector, clean_title
from ..models import Product


class JDCollector(BaseCollector):
    platform = "jd"
    SEARCH_URL = "https://so.m.jd.com/ware/search.action"
    DESKTOP_SEARCH_URL = "https://search.jd.com/Search"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        # 1) 尝试真实抓取（需登录态/风控通过）
        real = self._fetch_real(keyword, limit)
        if real:
            return real[:limit]
        # 2) 回退仿真
        return self._mock_search(keyword, limit)

    def _fetch_real(self, keyword: str, limit: int):
        if self.use_mock:
            return None
        try:
            params = {"keyword": keyword, "page": 1, "pagesize": limit}
            resp = self._request(self.SEARCH_URL, params=params)
            if not resp:
                return None
            # 京东移动端返回 mix JSON，尝试提取 wareList
            data = self._parse_search(resp.text)
            return data
        except Exception:
            return None

    def _parse_search(self, html: str) -> List[Product]:
        products: List[Product] = []
        # 京东搜索页商品常嵌在 <li sku="..."> 或 window.pageData 中
        for m in re.finditer(r'sku="(\d+)"', html):
            pid = m.group(1)
            products.append(Product(
                platform=self.platform,
                product_id=pid,
                title=f"京东商品{pid}",
                price=0.0,
                url=f"https://item.jd.com/{pid}.html",
            ))
        # 进一步解析价格/标题需 window 上下文，此处仅做骨架
        return products

    def _build_url(self, pid: str) -> str:
        # 仿真链接使用真实京东详情页 URL 形式
        return f"https://item.m.jd.com/product/{pid}.html"
