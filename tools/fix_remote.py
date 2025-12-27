import requests
from ftfy import fix_text
url = 'https://amazing-cocada-867e0f.netlify.app/fr/'
text = requests.get(url, timeout=10).text
fixed = fix_text(text)
print('Cityscootlab' in fixed)
print(fixed.split('\n')[7])
