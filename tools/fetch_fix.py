import requests
from ftfy import fix_text
html = requests.get('https://amazing-cocada-867e0f.netlify.app/fr/index.html', timeout=10).text
fixed = fix_text(html)
print('SÃ©' in html)
print('Sé' in fixed)
open('fr/index_fixed.html','w',encoding='utf-8').write(fixed)
