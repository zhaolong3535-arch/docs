"""采集器子包：聚合各平台采集器."""

from .base import BaseCollector
from .jd import JDCollector
from .taobao import TaobaoCollector
from .pdd import PddCollector

PLATFORM_REGISTRY = {
    "jd": JDCollector,
    "taobao": TaobaoCollector,
    "pdd": PddCollector,
}


def get_collector(platform: str, **kwargs) -> BaseCollector:
    """根据平台名称获取采集器实例."""
    platform = platform.lower()
    if platform not in PLATFORM_REGISTRY:
        raise ValueError(f"不支持的平台: {platform}，支持: {list(PLATFORM_REGISTRY.keys())}")
    return PLATFORM_REGISTRY[platform](**kwargs)


__all__ = [
    "BaseCollector",
    "JDCollector",
    "TaobaoCollector",
    "PddCollector",
    "PLATFORM_REGISTRY",
    "get_collector",
]
