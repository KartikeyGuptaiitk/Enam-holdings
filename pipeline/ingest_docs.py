import sys
from core import ingest
from retrieval import build
if __name__=='__main__':
 ticker=sys.argv[1].upper();ingest(ticker,8);build(ticker)
