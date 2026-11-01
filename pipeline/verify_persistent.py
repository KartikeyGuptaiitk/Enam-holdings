from core import get,ROOT,save
import json,pymupdf
rows=json.loads((ROOT/'data/announcements/PERSISTENT.json').read_text(encoding='utf8'));f=next(x for x in rows if x['headline']=='Outcome of Board Meeting');doc=pymupdf.open(stream=get(f['attachment_url']),filetype='pdf');pages=[{'doc_id':f['id'],'page':i+1,'period':f['ts_iso'][:10],'text':' '.join(p.get_text().split()),'url':f['attachment_url']} for i,p in enumerate(doc)];saved=json.loads((ROOT/'data/filing-passages.json').read_text(encoding='utf8'));saved[f['id']]=pages;save('data/filing-passages.json',saved);print(f['id'],len(pages))
for p in pages:
 if '46,639' in p['text'] or '4,663' in p['text']:print(p['page'],p['text'][:6500])
