"""命令行工具入口.

用法示例：
  python -m price_tracker.cli 蓝牙耳机
  python -m price_tracker.cli 蓝牙耳机 -p jd pdd --limit 15 --csv out.csv
  python -m price_tracker.cli 手机 --charts ./charts --top 5
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import List

from . import engine

PLATFORM_CHOICES = ["jd", "taobao", "pdd"]


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="price_tracker",
        description="电商商品价格自动化采集与对比工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("keyword", help="搜索关键词，如 '蓝牙耳机'")
    p.add_argument("-p", "--platforms", nargs="+", default=PLATFORM_CHOICES,
                   choices=PLATFORM_CHOICES + [["*"]],  # allow all
                   metavar="PLATFORM", help="采集平台，默认全部 jd/taobao/pdd")
    p.add_argument("-l", "--limit", type=int, default=20,
                   help="每个平台采集数量上限，默认 20")
    p.add_argument("--real", action="store_true",
                   help="尝试真实抓取（需登录态/签名，沙箱内多半失败会回退仿真）")
    p.add_argument("--json", dest="json_path", metavar="PATH",
                   help="结果写入 JSON 文件")
    p.add_argument("--csv", dest="csv_path", metavar="PATH",
                   help="商品表写入 CSV 文件")
    p.add_argument("--charts", dest="charts_dir", metavar="DIR",
                   help="生成图表到该目录（PNG）")
    p.add_argument("--top", type=int, default=0,
                   help="仅展示性价比最高的前 N 条推荐（0=全部）")
    p.add_argument("--no-table", action="store_true", help="不在终端打印商品表")
    return p


def _print_summary(result: dict) -> None:
    s = result["summary"]
    print("\n=== 采集摘要 ===")
    print(f"关键词: {result['keyword']}  | 数据来源: {'仿真' if result['use_mock'] else '真实+仿真回退'}")
    print(f"总商品数: {s['total']}  价格区间: {s['price_min']}~{s['price_max']} 元  均价: {s['price_avg']} 元")
    print("\n--- 平台横向对比 ---")
    print(f"{'平台':<10}{'数量':>6}{'最低价':>10}{'均价':>10}{'最高价':>10}{'均销量':>10}{'均店铺分':>10}")
    for row in result["platform_comparison"]:
        print(f"{row['platform']:<10}{row['count']:>6}{row['price_min']:>10.2f}"
              f"{row['price_avg']:>10.2f}{row['price_max']:>10.2f}"
              f"{row['sales_avg']:>10.0f}{row['shop_rating_avg']:>10.2f}")


def _print_table(items: List[dict], top: int) -> None:
    show = items[:top] if top > 0 else items
    print("\n=== 商品列表（按价格升序） ===")
    header = f"{'排名':<5}{'平台':<9}{'价格':>9}{'原价':>9}{'折扣':>7}{'销量':>9}{'店铺分':>7}{'性价比':>7}{'推荐':<5}标题"
    print(header)
    print("-" * len(header.encode('gbk', errors='ignore') if False else header) if False else "-" * 100)
    for it in show:
        rec = "★" if it["recommended"] else ""
        orig = f"{it['original_price']:.0f}" if it["original_price"] else "-"
        print(f"{it['rank']:<5}{it['platform']:<9}{it['price']:>9.2f}{orig:>9}"
              f"{it['discount_ratio']*100:>6.0f}%{it['sales']:>9}"
              f"{it['shop_rating']:>7.2f}{it['value_score']:>7.1f}{rec:<5}"
              f"{it['title'][:40]}")
    print(f"\n共 {len(show)} 条 / 总 {len(items)} 条")


def main(argv=None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    platforms = args.platforms
    # argparse 对 nargs+ 的 choices 限制，这里允许 "all" 形式
    if platforms in (["*"],):
        platforms = PLATFORM_CHOICES

    use_mock = not args.real  # 默认仿真，--real 关闭（真实失败仍回退）

    result = engine.run(
        keyword=args.keyword,
        platforms=platforms,
        limit_per_platform=args.limit,
        use_mock=use_mock,
        charts_dir=args.charts_dir,
    )

    _print_summary(result)
    if not args.no_table:
        _print_table(result["items"], args.top)

    if args.json_path:
        with open(args.json_path, "w", encoding="utf-8") as f:
            f.write(engine.to_json(result))
        print(f"\nJSON 已写入: {os.path.abspath(args.json_path)}")
    if args.csv_path:
        with open(args.csv_path, "w", encoding="utf-8-sig", newline="") as f:
            f.write(engine.to_csv(result["items"]))
        print(f"CSV 已写入: {os.path.abspath(args.csv_path)}")
    if args.charts_dir and result.get("charts"):
        print(f"图表已生成: {os.path.abspath(args.charts_dir)}")
        for name, path in result["charts"].items():
            print(f"  - {name}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
