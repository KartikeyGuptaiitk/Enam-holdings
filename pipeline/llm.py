"""Provider-pluggable, cached, schema-validated extraction. No model arithmetic."""
import os,json,hashlib,time
from typing import Type
from pydantic import BaseModel
import requests
from core import ROOT,save
GROUNDING='Use ONLY the provided CONTEXT from annual reports, earnings-call transcripts and Screener standardized financials. Answer only from provided context; cite doc + page and a supporting quote <=25 words. Otherwise output not_disclosed. No company knowledge from memory. Output strictly valid JSON matching the schema. Do not do arithmetic.'
def call(task,context,schema:Type[BaseModel],strong=False):
 provider=os.getenv('LLM_PROVIDER','gemini');model=os.getenv('LLM_STRONG_MODEL' if strong else 'LLM_CHEAP_MODEL','gemini-2.5-flash');key=os.getenv('LLM_API_KEY')
 prompt=json.dumps({'instruction':GROUNDING,'task':task,'context':context,'schema':schema.model_json_schema()});digest=hashlib.sha256((provider+model+prompt).encode()).hexdigest();path=ROOT/f'data/cache/llm/{digest}.json'
 if path.exists():return schema.model_validate_json(path.read_text(encoding='utf8'))
 if not key:return None
 headers={'Content-Type':'application/json'}
 for attempt in range(2):
  if provider=='gemini':
   url=f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent';headers['x-goog-api-key']=key;body={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'responseMimeType':'application/json'}}
  elif provider=='anthropic':
   url='https://api.anthropic.com/v1/messages';headers.update({'x-api-key':key,'anthropic-version':'2023-06-01'});body={'model':model,'max_tokens':2048,'messages':[{'role':'user','content':prompt}]}
  else:
   base={'groq':'https://api.groq.com/openai/v1','openrouter':'https://openrouter.ai/api/v1','openai':'https://api.openai.com/v1'}[provider];url=base+'/chat/completions';headers['Authorization']='Bearer '+key;body={'model':model,'messages':[{'role':'user','content':prompt}],'response_format':{'type':'json_object'}}
  r=requests.post(url,headers=headers,json=body,timeout=45);r.raise_for_status();raw=r.json();text=raw['candidates'][0]['content']['parts'][0]['text'] if provider=='gemini' else raw['content'][0]['text'] if provider=='anthropic' else raw['choices'][0]['message']['content']
  try:
   value=schema.model_validate_json(text);save(f'data/cache/llm/{digest}.json',value.model_dump());return value
  except ValueError:
   if attempt:raise
   prompt+='\nPrevious response failed schema validation. Return the exact schema.'
