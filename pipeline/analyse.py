import sys,json
from core import ingest,save
from retrieval import build
if __name__=='__main__':
 ticker=sys.argv[1].upper()
 try:ingest(ticker,8);build(ticker)
 except Exception as e:save(f'data/research/{ticker}.json',{'ticker':ticker,'status':'not_available','tables':{},'chunks':[],'docs':[],'error':str(e)[:180]})
