"""Deterministic standardized-results extraction. Monetary values are Rs crore."""
from core import ROOT,save
import json,sys
def extract(ticker):
 r=json.loads((ROOT/f'data/research/{ticker}.json').read_text(encoding='utf8'));table=r['tables'].get('quarters',[]);out={'ticker':ticker,'unit':'INR crore','confidence':'standardized_inputs_not_fully_reconciled','periods':table[0][1:] if table else [],'rows':{}}
 for row in table[1:]:
  if row[0].rstrip(' +') in ['Sales','Operating Profit','Profit before tax','Net Profit','Interest','Depreciation','Other Income']:
   out['rows'][row[0].rstrip(' +')]=[float(x.replace(',','')) if x.strip() else None for x in row[1:]]
 inputs=out['rows']
 if all(k in inputs for k in ['Profit before tax','Interest','Depreciation','Other Income']):out['rows']['EBITDA (derived)']=[p+i+d-o for p,i,d,o in zip(inputs['Profit before tax'],inputs['Interest'],inputs['Depreciation'],inputs['Other Income'])]
 save(f'data/analysis/{ticker}/results.json',out);return out
if __name__=='__main__':extract(sys.argv[1].upper())
