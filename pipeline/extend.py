from core import ingest
def main():
 for t in ['INFY','WIPRO','HCLTECH']:
  try:ingest(t,8);print(t,'extended history saved',flush=True)
  except Exception as e:print(t,str(e),flush=True)
if __name__=='__main__':main()
