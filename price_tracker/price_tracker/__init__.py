"""电商商品价格自动化采集与对比工具.

提供关键词搜索采集、数据清洗去重、按价格排序、横向对比、
价格趋势图表与性价比推荐标注能力，并提供 CLI 与 Web 演示两种入口。
"""

from .models import Product  # noqa: F401

__version__ = "1.0.0"
__all__ = ["Product", "__version__"]
