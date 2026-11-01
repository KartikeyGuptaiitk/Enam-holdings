from flask import Flask, request, render_template
from functools import lru_cache
from datetime import datetime, timedelta
import requests, re, pymupdf
from bs4 import BeautifulSoup

app = Flask(__name__)
portfolio = "RELIANCE TCS INFY HDFCBANK ITC LT MARUTI SUNPHARMA TITAN CIPLA BEL TRENT ASTRAL VOLTAS PIIND".split()
headers = {"User-Agent": "Mozilla/5.0", "Accept": "*/*"}

def filings(symbol, days):
    base = "https://www.nseindia.com"
    with requests.Session() as s:
        s.headers.update(headers)
        s.get(base, timeout=8)
        today = datetime.now()
        response = s.get(base + "/api/corporate-announcements", params=dict(index="equities", symbol=symbol, from_date=(today-timedelta(days=days)).strftime("%d-%m-%Y"), to_date=today.strftime("%d-%m-%Y")), timeout=12)
        response.raise_for_status()
        rows = response.json()
        if not isinstance(rows, list):
            raise ValueError("Unexpected exchange response")
        return sorted([(str(r.get("desc","")), r.get("attchmntFile",""), r.get("an_dt","")) for r in rows], key=lambda row: not re.search("result|acquisition|resignation|litigation", row[0], re.I))

def market(symbol, threshold, multiple):
    url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol + ".NS"
    resp = requests.get(url, params={"range":"3mo","interval":"1d"},headers=headers,timeout=10)
    resp.raise_for_status()
    result = resp.json()["chart"]["result"][0]
    quote = result["indicators"]["quote"][0]
    import time
    bars = [(c,v) for t,c,v in zip(result["timestamp"],quote["close"],quote["volume"]) if c is not None and v is not None and t+22500 <= time.time()]
    avg = sum(v for _,v in bars[-21:-1])/len(bars[-21:-1])
    change = 100*(bars[-1][0]/bars[-2][0]-1)
    ratio = bars[-1][1]/avg
    return f"{change:+.2f}% close · {ratio:.2f}× recent volume" + (" · Alert" if abs(change)>=threshold or ratio>=multiple else " · Within thresholds")

@lru_cache(maxsize=64)
def research(symbol):
    url = f"https://www.screener.in/company/{symbol}/consolidated/"
    page = requests.get(url,headers=headers,timeout=10)
    if page.status_code == 404:
        page = requests.get(url.replace("consolidated/",""),headers=headers,timeout=10)
    page.raise_for_status()
    soup = BeautifulSoup(page.text,"html.parser")
    from urllib.parse import urljoin
    docs = []
    for selector, label in [(".concalls a","Transcript"),(".annual-reports a","Annual report")]:
        for a in soup.select(selector):
            if label=="Transcript" and "transcript" not in a.get_text(strip=True).lower(): continue
            link = urljoin(page.url,a.get("href",""))
            if not link.startswith("https://"): continue
            excerpt = "Open the source to review the disclosure."
            try:
                pdf = requests.get(link,headers=headers,timeout=12)
                pdf.raise_for_status()
                with pymupdf.open(stream=pdf.content,filetype="pdf") as document:
                    for i,p in enumerate(document):
                        sentences = re.split(r"(?<=[.!?])\s+", " ".join(p.get_text().split()))
                        match = next((s for s in sentences if 65<len(s)<550 and re.search(r"\b(expect|guidance|margin|revenue growth)\b",s,re.I)),None)
                        if match:
                            excerpt = f"Page {i+1} · {match}"
                            break
            except Exception: pass
            docs.append((label,link,excerpt))
            break
    return docs

@app.route("/")
def home():
    symbol = request.args.get("symbol",portfolio[0]).strip().upper()
    mode = request.args.get("mode","")
    rows, status, docs = [], "", []
    if not re.fullmatch(r"[A-Z0-9&-]{1,20}",symbol): status = "Enter a valid NSE symbol."
    elif mode=="research":
        try:
            docs = research(symbol)
            if not docs: status = "No primary documents found for this ticker."
        except Exception: status = "Company documents could not be retrieved."
    elif mode=="digest":
        try: rows = filings(symbol,max(1,min(90,int(request.args.get("days",7)))))
        except Exception: status = "Exchange filings unavailable. "
        else:
            if not rows: status = "No filings in this window. "
        try: status += market(symbol,float(request.args.get("move",3)),float(request.args.get("volume",2)))
        except Exception: status += "End-of-day prices unavailable."
    return render_template("index.html",**locals(),portfolio=portfolio)

from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from time import monotonic

digest_lock = Lock()
digest_cache = {}


def portfolio_digest(days, move, volume):
    key = (days, move, volume)
    with digest_lock:
        cached = digest_cache.get(key)
        if cached and monotonic() - cached[0] < 300:
            return cached[1]

        def check(symbol):
            signals, routine, gaps = [], [], []
            try:
                for title, url, date in filings(symbol, days):
                    material = re.search(r"result|acquisition|resignation|litigation|default|merger|fraud|downgrade", title, re.I)
                    item = (symbol, title, url or "", date)
                    (signals if material else routine).append(item)
            except Exception:
                gaps.append(symbol + " filings")
            try:
                observation = market(symbol, move, volume)
                if observation.endswith(" · Alert"):
                    signals.append((symbol, observation, "", "Latest completed session"))
            except Exception:
                gaps.append(symbol + " prices")
            return signals, routine, gaps

        grouped = [[], [], []]
        with ThreadPoolExecutor(max_workers=6) as pool:
            for result in pool.map(check, portfolio):
                for dest, items in zip(grouped, result):
                    dest.extend(items)
        digest_cache[key] = monotonic(), grouped
        if len(digest_cache) > 16:
            del digest_cache[next(iter(digest_cache))]
        return grouped


@app.get("/portfolio")
def overview():
    try:
        days = int(request.args.get("days", 1))
        move = float(request.args.get("move", 3))
        volume = float(request.args.get("volume", 2))
        if not (1 <= days <= 90 and 0 < move <= 100 and 0 < volume <= 100):
            raise ValueError()
    except ValueError:
        return "Choose 1–90 calendar days and thresholds above zero through 100.", 400
    from pathlib import Path
    import json
    as_of = None
    snapshot = Path(__file__).with_name("data") / "briefing.json"
    default_rules = (days, move, volume) == (1, 3, 2)
    if default_rules and snapshot.is_file() and request.args.get("live") != "1":
        saved = json.loads(snapshot.read_text(encoding="utf-8"))
        as_of = saved["as_of"]
        signals, routine, gaps = saved["groups"]
    else:
        signals, routine, gaps = portfolio_digest(days, move, volume)
    return render_template("portfolio.html", **locals())

if __name__=="__main__": app.run()


