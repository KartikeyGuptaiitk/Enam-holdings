import json,concurrent.futures
from core import ROOT,resolve,save,get
import pymupdf

def financials(t):
 try:
  path=ROOT/f'data/research/{t}.json'
  if path.exists():return
  url,tables,docs=resolve(t);save(f'data/research/{t}.json',{'ticker':t,'status':'available','source_url':url,'tables':tables,'docs':[],'chunks':[]});print(t,'tables saved',flush=True)
 except Exception as e:print(t,str(e)[:100],flush=True)
if __name__=='__main__':
 tickers=[p['ticker'] for p in json.loads((ROOT/'config/portfolio.json').read_text())]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(financials,tickers))
 filings=[]
 for t in tickers:
  filings+=json.loads((ROOT/f'data/announcements/{t}.json').read_text())
 selected=[x for t in ['INFY','TCS','PERSISTENT'] for x in next(([a] for a in filings if a['ticker']==t and a['category']=='results'),[]) ]
 selected += [x for x in filings if x['ticker']=='HDFCBANK' and x['category']=='management_change'][:2]
 out={}
 for f in selected:
  try:
   doc=pymupdf.open(stream=get(f['attachment_url']),filetype='pdf');pages=[{'doc_id':f['id'],'page':i+1,'period':f['ts_iso'][:10],'text':' '.join(p.get_text().split()),'url':f['attachment_url']} for i,p in enumerate(doc)]
   out[f['id']]=pages;print(f['ticker'],f['headline'],len(pages),'pages',flush=True)
  except Exception as e:print(str(e)[:100],flush=True)
 save('data/filing-passages.json',out)
