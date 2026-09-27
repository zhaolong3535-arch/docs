"""商品数据模型与字段定义."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional


@dataclass
class Product:
    """标准化后的商品记录.

    所有平台采集器输出统一映射为该结构，便于后续清洗与对比。
    """

    platform: str                 # jd / taobao / pdd
    product_id: str               # 平台内唯一商品标识
    title: str                    # 商品名称
    price: float                  # 当前售价（元）
    original_price: Optional[float] = None  # 划线原价
    sales: int = 0                # 销量（件/月）
    shop_name: str = ""           # 店铺名称
    shop_rating: float = 0.0      # 店铺评分 0-5
    url: str = ""                 # 商品详情链接
    image_url: str = ""           # 主图链接
    fetched_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def discount_ratio(self) -> float:
        """折扣力度，0-1，越大表示优惠越多."""
        if self.original_price and self.original_price > 0 and self.price < self.original_price:
            return round(1 - self.price / self.original_price, 3)
        return 0.0
