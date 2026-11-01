"""Refresh the offline reference briefing using the existing live digest."""
import json
from datetime import datetime, timezone
from pathlib import Path

from app import portfolio_digest

if __name__ == "__main__":
    groups = portfolio_digest(1, 3, 2)
    if groups[2]:
        raise SystemExit("Incomplete refresh. Keeping previous snapshot: " + ", ".join(groups[2]))
    path = Path(__file__).with_name("data") / "briefing.json"
    path.parent.mkdir(exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps({"as_of": datetime.now(timezone.utc).isoformat(timespec="minutes"), "groups": groups}, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)
