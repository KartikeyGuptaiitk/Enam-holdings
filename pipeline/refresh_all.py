from core import main
if __name__=='__main__':
 main()
 from extend import main as extend_all
 extend_all()
 from financials import financials
 from retrieval import build
 from core import ROOT
 import json
 for row in json.loads((ROOT/'config/portfolio.json').read_text(encoding='utf8')):financials(row['ticker'])
 for ticker in ['INFY','WIPRO','HCLTECH']:
  try:build(ticker)
  except Exception as e:print(ticker, str(e))
