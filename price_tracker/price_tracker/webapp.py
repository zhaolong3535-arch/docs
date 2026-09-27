"""Flask 演示网页后端.

路由：
  GET  /              渲染单页前端
  GET  /api/sample    返回初始化示例（sample_data + sample_result）
  POST /api/search    现场运行采集分析流水线，返回结果 JSON
  GET  /api/health    健康检查
"""

from __future__ import annotations

import json
import os
from typing import List

from flask import Flask, jsonify, render_template, request, send_from_directory

from . import engine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
app.config["JSON_AS_ASCII"] = False

_PLATFORMS = ("jd", "taobao", "pdd")


def _load_json(path: str):
    full = os.path.join(BASE_DIR, path)
    if not os.path.exists(full):
        return None
    with open(full, encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/sample")
def sample():
    """初始化示例：原始采集数据 + 处理后结果."""
    data = _load_json("sample_data.json")
    result = _load_json("sample_result.json")
    if data is None or result is None:
        # 兜底：现场生成
        from .gen_samples import generate
        generate(BASE_DIR)
        data = _load_json("sample_data.json")
        result = _load_json("sample_result.json")
    return jsonify({"sample_data": data, "sample_result": result})


@app.route("/api/search", methods=["POST"])
def search():
    """现场运行脚本：根据关键词采集分析."""
    payload = request.get_json(silent=True) or {}
    keyword = (payload.get("keyword") or "").strip()
    if not keyword:
        return jsonify({"error": "keyword 不能为空"}), 400

    platforms = payload.get("platforms") or list(_PLATFORMS)
    if isinstance(platforms, str):
        platforms = [p.strip() for p in platforms.split(",") if p.strip()]
    platforms = [p for p in platforms if p in _PLATFORMS] or list(_PLATFORMS)

    try:
        limit = int(payload.get("limit", 10))
    except (TypeError, ValueError):
        limit = 10
    limit = max(1, min(limit, 40))

    use_mock = bool(payload.get("mock", True))
    try:
        result = engine.run(
            keyword=keyword,
            platforms=platforms,
            limit_per_platform=limit,
            use_mock=use_mock,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"运行失败: {e}"}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


def main():
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    main()
