"""数据可视化：基于 matplotlib 的静态图表生成.

图表方案：
  1. 价格分布直方图（按平台分色叠加）
  2. 平台价格对比柱状图（最低/均价/最高）
  3. 价格-销量散点图（性价比推荐商品高亮）
图表保存为 PNG，供 CLI 与 Web 复用。
"""

from __future__ import annotations

import os
from typing import List, Optional

import matplotlib
matplotlib.use("Agg")  # 无显示环境也能渲染
import matplotlib.pyplot as plt
from matplotlib import font_manager

from .models import Product

# 尝试使用中文字体，缺失时回退英文标签
_CN_FONTS = ["Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei",
             "PingFang SC", "SimHei", "Arial Unicode MS"]


def _pick_font() -> Optional[str]:
    available = {f.name for f in font_manager.fontManager.ttflist}
    for name in _CN_FONTS:
        if name in available:
            return name
    return None


_FONT = _pick_font()
if _FONT:
    plt.rcParams["font.sans-serif"] = [_FONT]
    plt.rcParams["axes.unicode_minus"] = False

_PLATFORM_COLORS = {
    "jd": "#E2231A",
    "taobao": "#FF6A00",
    "pdd": "#E22E2E",
}
_PLATFORM_LABELS_CN = {
    "jd": "京东",
    "taobao": "淘宝",
    "pdd": "拼多多",
}
_PLATFORM_LABELS_EN = {
    "jd": "JD",
    "taobao": "Taobao",
    "pdd": "PDD",
}

# 中英文字典：无中文字体时自动回退英文，避免图表出现方框
_STR = {
    "price": ("价格 (元)", "Price (CNY)"),
    "count": ("商品数量", "Count"),
    "price_dist_title": ("商品价格分布", "Price Distribution"),
    "min": ("最低价", "Min"),
    "avg": ("均价", "Avg"),
    "max": ("最高价", "Max"),
    "plat_cmp_title": ("各平台价格对比", "Platform Price Comparison"),
    "no_data": ("无数据", "No data"),
    "price_log": ("价格 (元, log)", "Price (CNY, log)"),
    "sales_log": ("销量 (log)", "Sales (log)"),
    "value_title": ("价格-销量分布与性价比推荐", "Price vs Sales & Value Picks"),
    "recommend": ("★推荐", "★Pick"),
}


def _t(key: str) -> str:
    cn, en = _STR[key]
    return cn if _FONT else en


def _label(platform: str) -> str:
    labels = _PLATFORM_LABELS_CN if _FONT else _PLATFORM_LABELS_EN
    return labels.get(platform, platform)


def plot_price_distribution(products: List[Product], out_path: str) -> str:
    """价格分布直方图，按平台分色."""
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=120)
    if not products:
        ax.text(0.5, 0.5, _t("no_data"), ha="center", va="center", transform=ax.transAxes)
        ax.axis("off")
    else:
        from collections import defaultdict
        grouped = defaultdict(list)
        for p in products:
            grouped[p.platform].append(p.price)
        for pf, prices in grouped.items():
            ax.hist(prices, bins=15, alpha=0.6, label=_label(pf),
                    color=_PLATFORM_COLORS.get(pf, "#888"))
        ax.set_xlabel(_t("price"))
        ax.set_ylabel(_t("count"))
        ax.set_title(_t("price_dist_title"))
        ax.legend()
        ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
    return out_path


def plot_platform_comparison(products: List[Product], out_path: str) -> str:
    """平台价格对比柱状图：最低/均价/最高."""
    from collections import defaultdict
    grouped = defaultdict(list)
    for p in products:
        grouped[p.platform].append(p.price)
    platforms = list(grouped.keys())
    mins = [min(grouped[pf]) for pf in platforms]
    avgs = [sum(grouped[pf]) / len(grouped[pf]) for pf in platforms]
    maxs = [max(grouped[pf]) for pf in platforms]

    import numpy as np
    x = np.arange(len(platforms))
    width = 0.25
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=120)
    ax.bar(x - width, mins, width, label=_t("min"), color="#4C9F70")
    ax.bar(x, avgs, width, label=_t("avg"), color="#F2B134")
    ax.bar(x + width, maxs, width, label=_t("max"), color="#E26D5C")
    ax.set_xticks(x)
    ax.set_xticklabels([_label(pf) for pf in platforms])
    ax.set_ylabel(_t("price"))
    ax.set_title(_t("plat_cmp_title"))
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
    return out_path


def plot_value_scatter(products: List[Product], scores: List[dict], out_path: str) -> str:
    """价格-销量散点图，性价比推荐商品高亮标注."""
    import numpy as np
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=120)
    if not products:
        ax.text(0.5, 0.5, _t("no_data"), ha="center", va="center", transform=ax.transAxes)
        ax.axis("off")
        fig.tight_layout()
        fig.savefig(out_path)
        plt.close(fig)
        return out_path

    # scores 顺序需与 products 对齐
    score_map = {id(it["product"]): it for it in scores}
    for p in products:
        item = score_map.get(id(p))
        rec = item["recommended"] if item else False
        color = "#2E86DE" if not rec else "#E1B12C"
        size = 60 if not rec else 180
        edge = "gold" if rec else "white"
        ax.scatter(p.price, p.sales, s=size, c=color, alpha=0.8,
                   edgecolors=edge, linewidths=1.5, zorder=3)
        if rec:
            ax.annotate(_t("recommend"), (p.price, p.sales),
                        textcoords="offset points", xytext=(6, 6),
                        fontsize=9, color="#E1B12C", fontweight="bold")

    ax.set_xscale("log")
    ax.set_yscale("symlog")
    ax.set_xlabel(_t("price_log"))
    ax.set_ylabel(_t("sales_log"))
    ax.set_title(_t("value_title"))
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
    return out_path


def render_all(products: List[Product], scores: List[dict], out_dir: str) -> dict:
    """一键生成全部图表，返回路径字典."""
    os.makedirs(out_dir, exist_ok=True)
    return {
        "distribution": plot_price_distribution(products, os.path.join(out_dir, "price_distribution.png")),
        "platform": plot_platform_comparison(products, os.path.join(out_dir, "platform_comparison.png")),
        "value": plot_value_scatter(products, scores, os.path.join(out_dir, "value_scatter.png")),
    }
