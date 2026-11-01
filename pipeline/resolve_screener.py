import sys,json
from core import resolve
if __name__=='__main__':
 url,tables,docs=resolve(sys.argv[1].upper());print(json.dumps({'url':url,'tables':tables,'documents':docs},indent=2))
