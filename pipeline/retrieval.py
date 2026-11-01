"""Primary-only retrieval. Pages are split into overlapping word chunks, retaining PDF page refs."""
import re,json
from pathlib import Path
from rank_bm25 import BM25Okapi
from core import ROOT,save
QUERIES={'narrative':'guidance expect target revenue margin full year constant currency','guidance':'guidance outlook revised expect target','cash':'cash flows operating activities profit receivables capital expenditure','snapshot':'revenue profit earnings consolidated financial statements'}
def chunks_for(ticker):
 pages=json.loads((ROOT/f'data/docs/{ticker}.json').read_text(encoding='utf8'));chunks=[]
 for page in pages:
  words=page['text'].split()
  for start in range(0,len(words),180):
   chunks.append({**page,'text':' '.join(words[start:start+240]),'offset':start})
 return chunks

def retrieve(ticker,query,k=8):
 chunks=chunks_for(ticker)
 if not chunks:return []
 tokens=lambda text:re.findall(r'[a-z0-9]+',text.lower())
 index=BM25Okapi([tokens(c['text']) for c in chunks]);scores=index.get_scores(tokens(query));order=sorted(range(len(chunks)),key=lambda i:scores[i],reverse=True)
 return [chunks[i] for i in order[:k] if scores[i]>0]
def build(ticker):
 chunks=chunks_for(ticker);save(f'data/index/{ticker}.json',{'ticker':ticker,'method':'BM25','chunk_words':240,'overlap_words':60,'chunks':chunks})
 for module,query in QUERIES.items():save(f'data/analysis/{ticker}/{module}-context.json',retrieve(ticker,query))
if __name__=='__main__':
 import sys
 build(sys.argv[1].upper())
