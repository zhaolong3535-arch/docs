"""采集器基类：定义统一接口、共享 HTTP 会话与仿真回退.

设计说明：
- 真实电商搜索接口普遍需要登录态/签名/风控 token，在无浏览器登录态的
  沙箱环境内直接请求成功率极低，故采集器统一采用「先尝试真实抓取 →
  失败/被风控时回退到基于关键词的仿真数据」的策略。
- 仿真数据由关键词做种子生成，保证同一关键词多次运行结果稳定可比，
  便于演示清洗、去重、排序、对比、推荐、可视化等下游流水线。
- 真实抓取代码保留为可扩展点：补全登录 cookie/签名后即可启用。
"""

from __future__ import annotations

import hashlib
import random
import re
import time
from typing import List, Optional

import requests

from ..models import Product


# 模拟常见品牌/店铺词表，使仿真商品标题更贴近真实搜索结果
_BRANDS = [
    "小米", "华为", "荣耀", "OPPO", "vivo", "苹果", "三星", "联想", "戴尔",
    "美的", "海尔", "格力", "索尼", "佳能", "尼康", "飞利浦", "松下", "安克",
    "倍思", "绿联", "公牛", "得力", "晨光", "罗技", "雷蛇", "机械师", "雷神",
]

_SHOP_SUFFIX = ["旗舰店", "自营店", "官方旗舰店", "专卖店", "专营店", "授权店"]

_TITLE_ADJECTIVES = [
    "2024新款", "升级版", "Pro", "Max", "尊享版", "青春版", "旗舰款",
    "大容量", "高配", "套装", "礼盒装", "国行", "原装正品",
]


class BaseCollector:
    """所有平台采集器的抽象基类."""

    platform: str = "base"

    def __init__(
        self,
        timeout: int = 8,
        retries: int = 1,
        use_mock: bool = True,
        cookies: Optional[dict] = None,
    ):
        self.timeout = timeout
        self.retries = retries
        self.use_mock = use_mock
        self.cookies = cookies or {}
        self.session = self._build_session()

    # ------------------------------------------------------------------
    # 公共接口
    # ------------------------------------------------------------------
    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        """按关键词搜索商品，返回 Product 列表."""
        raise NotImplementedError

    # ------------------------------------------------------------------
    # HTTP 工具
    # ------------------------------------------------------------------
    def _build_session(self) -> requests.Session:
        s = requests.Session()
        s.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 "
                "Mobile/15E148 Safari/604.1"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        })
        if self.cookies:
            s.cookies.update(self.cookies)
        return s

    def _request(self, url: str, **kwargs) -> Optional[requests.Response]:
        """带重试的请求封装；任何异常或被风控均返回 None."""
        kwargs.setdefault("timeout", self.timeout)
        for attempt in range(self.retries + 1):
            try:
                resp = self.session.get(url, **kwargs)
                if resp.status_code == 200 and not _looks_like_captcha(resp):
                    return resp
            except requests.RequestException:
                pass
            time.sleep(0.4 * (attempt + 1))
        return None

    # ------------------------------------------------------------------
    # 仿真数据生成（回退方案）
    # ------------------------------------------------------------------
    def _seed(self, keyword: str) -> int:
        """由关键词生成稳定种子，保证结果可复现."""
        h = hashlib.md5((self.platform + "|" + keyword).encode("utf-8")).hexdigest()
        return int(h[:8], 16)

    def _mock_search(self, keyword: str, limit: int) -> List[Product]:
        """生成仿真商品列表，结构、字段分布贴近真实搜索结果."""
        rng = random.Random(self._seed(keyword))
        products: List[Product] = []
        for i in range(limit):
            brand = rng.choice(_BRANDS)
            adj = rng.choice(_TITLE_ADJECTIVES)
            spec = self._spec_text(keyword, rng)
            title = f"{brand} {keyword} {adj} {spec}".strip()

            # 价格分布：以品类典型价位为中心做正态扰动
            base_price = self._typical_price(keyword)
            price = round(max(9.9, rng.gauss(base_price, base_price * 0.35)), 1)
            # 一部分商品有划线原价
            original_price = None
            if rng.random() < 0.55:
                original_price = round(price * rng.uniform(1.15, 1.8), 1)

            sales = rng.randint(0, 50000)
            shop_rating = round(rng.uniform(4.4, 4.99), 2)
            shop_name = f"{brand}{rng.choice(_SHOP_SUFFIX)}"

            pid = f"{self.platform}{rng.randint(10**8, 10**9 - 1)}"
            products.append(Product(
                platform=self.platform,
                product_id=pid,
                title=title,
                price=price,
                original_price=original_price,
                sales=sales,
                shop_name=shop_name,
                shop_rating=shop_rating,
                url=self._build_url(pid),
                image_url="",
            ))
        return products

    # 子类可重写以下方法以贴合各平台特征
    def _typical_price(self, keyword: str) -> float:
        """根据关键词推断典型价位（元）."""
        k = keyword.lower()
        if any(w in keyword for w in ["手机", "笔记本", "电脑", "相机", "平板", "电视"]):
            return 4500.0
        if any(w in keyword for w in ["耳机", "音箱", "键盘", "鼠标", "显示器", "路由"]):
            return 350.0
        if any(w in keyword for w in ["纸巾", "牙膏", "毛巾", "洗衣", "零食", "抽纸"]):
            return 35.0
        if any(w in keyword for w in ["鞋", "包", "衣", "裤", "裙"]):
            return 220.0
        return 150.0

    def _spec_text(self, keyword: str, rng: random.Random) -> str:
        """生成规格描述文本."""
        if any(w in keyword for w in ["手机", "平板", "电脑"]):
            return f"{rng.choice(['8GB+256GB', '12GB+512GB', '16GB+1TB'])} {rng.choice(['黑', '白', '蓝'])}"
        if "耳机" in keyword:
            return f"{rng.choice(['蓝牙5.3', '主动降噪', '头戴式'])}"
        return rng.choice(["标准装", "家庭装", "便携装"])

    def _build_url(self, pid: str) -> str:
        """子类重写：拼装平台商品详情链接."""
        return f"https://example.com/{self.platform}/item/{pid}"


def _looks_like_captcha(resp: requests.Response) -> bool:
    """粗略判断响应是否命中风控/验证码页面."""
    try:
        text = resp.text[:2000].lower()
    except Exception:
        return False
    markers = ["验证", "captcha", "滑动", "安全验证", "访问受限", "请输入", "slider"]
    return any(m in text for m in markers)


# 商品标题清洗工具函数（供各采集器解析后调用）
def clean_title(raw: str) -> str:
    """去除商品标题中的表情、多余空白与宣传噪音."""
    if not raw:
        return ""
    # 去除 emoji 与特殊符号
    raw = re.sub(r"[\U0001F000-\U0001FAFF\U00002700-\U000027BF]", "", raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw.strip(" -|·【】[]()（）")
