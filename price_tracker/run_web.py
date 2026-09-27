"""启动 Web 演示的便捷入口（python run_web.py）."""
import os
from price_tracker.webapp import main

if __name__ == "__main__":
    os.environ.setdefault("PORT", "5000")
    main()
