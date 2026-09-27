"""生成 Web 演示初始所需的示例数据与示例结果.

运行后会在项目根目录产出 sample_data.json（采集原始数据）与
sample_result.json（流水线处理后的完整结果），供网页首次加载时展示。
"""

from __future__ import annotations

import json
import os

from . import engine, pipeline

SAMPLE_KEYWORD = "蓝牙耳机"
SAMPLE_PLATFORMS = ("jd", "taobao", "pdd")
SAMPLE_LIMIT = 8


def generate(base_dir: str) -> None:
    # 1) 原始采集数据（未清洗，展示采集器输出形态）
    raw = pipeline.collect(SAMPLE_KEYWORD, SAMPLE_PLATFORMS, SAMPLE_LIMIT, use_mock=True)
    sample_data = {
        "keyword": SAMPLE_KEYWORD,
        "description": "采集器原始输出示例（未清洗去重，展示采集阶段形态）",
        "raw_count": len(raw),
        "products": [p.to_dict() for p in raw],
    }
    data_path = os.path.join(base_dir, "sample_data.json")
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(sample_data, f, ensure_ascii=False, indent=2)

    # 2) 完整结果示例（清洗去重排序 + 对比 + 推荐）
    result = engine.run(SAMPLE_KEYWORD, SAMPLE_PLATFORMS, SAMPLE_LIMIT, use_mock=True)
    result_path = os.path.join(base_dir, "sample_result.json")
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"sample_data  -> {data_path} ({len(raw)} 条)")
    print(f"sample_result-> {result_path} ({len(result['items'])} 条)")


if __name__ == "__main__":
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    generate(here)
