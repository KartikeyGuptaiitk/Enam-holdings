import json,re,time,hashlib,datetime,sys,os
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
HEAD={'User-Agent':'Mozilla/5.0','Accept':'*/*'}
def save(path,data):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
def get(url):
 key=hashlib.sha256(url.encode()).hexdigest();p=ROOT/'data/cache/http'/key
 if p.exists() and os.getenv('FORCE_REFRESH')!='1':return p.read_bytes()
 r=requests.get(url,headers=HEAD,timeout=22);r.raise_for_status();p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(r.content);time.sleep(.4);return r.content
RULES=[('results',r'financial result|quarterly result|audited.*result'),('M&A',r'acquisition|merger|demerger|joint venture'),('management_change',r'management|resign|appoint.*(director|chief)|cessation'),('litigation',r'litigation|penalty|fine|regulatory order|insolvency'),('fund_raise',r'fund rais|qip|rights issue|buyback|commercial paper'),('credit_rating',r'credit rating|rating'),('pledging',r'pledge|pledging'),('insider_trading',r'insider|personal.*trade|disclosure.*29'),('dividend',r'dividend'),('bonus_split',r'bonus|split'),('capex',r'capex|capacity expansion'),('earnings_call',r'con.*call|earnings call|transcript'),('investor_meetings',r'investor.*meet|analyst.*meet'),('postal_ballot',r'postal ballot'),('agm_egm',r'annual general|extraordinary|agm|egm'),('press_release',r'press release|order win|product launch')]
def classify(text):
 headline,*rest=text.split(' · ');body=rest[0] if rest else ''
 def has(p,t=text):return bool(re.search(p,t,re.I))
 if has(r'Schedule A of Regulation 8|code of.*insider') and not has(r'purchase|sale|sold|bought'):return 'unclassified'
 if has(r'newspaper publication|compliance certificate|trading window|Certificate under SEBI|ESOP|ESG Rating',headline+(' '+body if has('ESG Rating',body) else '')):return 'unclassified'
 if has(r'con.*call|earnings call|transcript',headline):
  if has(r'schedule of (investor )?meet|outcome of analyst',body):return 'investor_meetings'
  if has(r'presentation.*quarter',body):return 'results'
  return 'earnings_call'
 if has('dividend',headline):return 'dividend'
 if has('investor presentation',headline):return 'results'
 if has('retirement',headline):return 'management_change'
 if has('postal ballot',body) and has('shareholders meeting',headline):return 'postal_ballot'
 if has('non convertible|issue of securities'):return 'fund_raise'
 return next((c for c,p in RULES if re.search(p,text,re.I)),'unclassified')
def resolve(ticker):
 if not re.fullmatch(r'[A-Z0-9&-]{1,20}',ticker):raise ValueError('Invalid ticker')
 url=f'https://www.screener.in/company/{ticker}/consolidated/'
 try:soup=BeautifulSoup(get(url),'html.parser')
 except requests.HTTPError:url=url.replace('consolidated/','');soup=BeautifulSoup(get(url),'html.parser')
 tables={}
 for name in ['quarters','profit-loss','balance-sheet','cash-flow','ratios']:
  section=soup.select_one('#'+name)
  if section:
   rows=[[c.get_text(' ',strip=True) for c in tr.select('th,td')] for tr in section.select('table tr')]
   tables[name]=rows
 docs=[]
 for a in soup.select('#documents a'):
  label=a.get_text(' ',strip=True)
  if label=='Transcript' or label.startswith('Annual Report '):
   docs.append({'url':urljoin(url,a.get('href','')),'type':'transcript' if label=='Transcript' else 'annual_report','label':a.parent.get_text(' ',strip=True)[:100]})
 return url,tables,[d for d in docs if d['type']=='transcript'][:8]+[d for d in docs if d['type']=='annual_report'][:3]

def ingest(ticker,limit=4):
 import pymupdf
 url,tables,docs=resolve(ticker);chunks=[];used=[]
 selected=docs[:limit] if limit<8 else docs
 for n,d in enumerate(selected):
  try:
   content=get(d['url']);doc=pymupdf.open(stream=content,filetype='pdf');docid=f'{ticker}-{n+1}';pages=[]
   for i,page in enumerate(doc):
    text=' '.join(page.get_text().split());pages.append({'doc_id':docid,'doc_type':d['type'],'period':d['label'],'page':i+1,'text':text,'url':d['url']})
   chunks+=pages;used.append({**d,'id':docid,'pages':len(pages)})
  except Exception as e:print(ticker,'document unavailable',str(e)[:70],flush=True)
 save(f'data/docs/{ticker}.json',chunks)
 result={'ticker':ticker,'source_url':url,'tables':tables,'docs':used,'chunks':chunks,'status':'available' if tables else 'not_available'}
 save(f'data/research/{ticker}.json',result);return result

def prices(ticker):
 import yfinance as yf
 frame=yf.Ticker(ticker+'.NS').history(period='6mo',auto_adjust=True)
 rows=[]
 for i,(date,r) in enumerate(frame.iterrows()):
  prev=rows[-1]['close'] if rows else None;v=[x['volume'] for x in rows[-20:]]
  rows.append({'date':date.strftime('%Y-%m-%d'),'open':float(r.Open),'high':float(r.High),'low':float(r.Low),'close':float(r.Close),'volume':int(r.Volume),'pct_change':(float(r.Close)/prev-1)*100 if prev else 0,'vol_ratio':float(r.Volume)/(sum(v)/len(v)) if v and sum(v)>0 else 0})
 if rows:save(f'data/prices/{ticker}.json',rows)
 return rows

def announcements(ticker):
 session=requests.Session();session.headers.update({**HEAD,'Referer':'https://www.nseindia.com/'})
 session.get('https://www.nseindia.com',timeout=15)
 now=datetime.datetime.now();r=session.get('https://www.nseindia.com/api/corporate-announcements',params={'index':'equities','symbol':ticker,'from_date':(now-datetime.timedelta(days=30)).strftime('%d-%m-%Y'),'to_date':now.strftime('%d-%m-%Y')},timeout=20);r.raise_for_status();rows=[]
 for x in r.json():
  title=x.get('desc','');body=x.get('attchmntText','');stamp=x.get('an_dt') or x.get('sort_date');dt=None
  for fmt in ['%d-%b-%Y %H:%M:%S','%Y-%m-%d %H:%M:%S','%d-%m-%Y %H:%M:%S']:
   try:dt=datetime.datetime.strptime(stamp,fmt).replace(tzinfo=datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat();break
   except (ValueError,TypeError):pass
  if not dt:continue
  rows.append({'id':hashlib.sha256((ticker+str(stamp)+title).encode()).hexdigest()[:14],'ticker':ticker,'ts_iso':dt,'headline':title,'body':body,'attachment_url':x.get('attchmntFile',''),'source':'NSE','category':classify(title+' · '+body)})
 save(f'data/announcements/{ticker}.json',rows);return rows

def main():
 import concurrent.futures
 portfolio=json.loads((ROOT/'config/portfolio.json').read_text());tickers=[x['ticker'] for x in portfolio]
 def task(t):
  for label,fn in [('prices',prices),('announcements',announcements)]:
   try:print(t,label,len(fn(t)),flush=True)
   except Exception as e:print(t,label,'unavailable',str(e)[:80],flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(task,tickers))
 for t in ['INFY','TCS','PERSISTENT','PIDILITIND','TRENT','APOLLOHOSP','DEEPAKNTR','WIPRO','HCLTECH']:
  try:ingest(t,4);print(t,'research saved',flush=True)
  except Exception as e:save(f'data/research/{t}.json',{'ticker':t,'status':'not_available','error':str(e)[:160],'tables':{},'chunks':[],'docs':[]})
if __name__=='__main__':main()
