from pathlib import Path
text = Path('fr/index_fixed.html').read_text(encoding='utf-8')
idx = text.index('Cityscootlab : ')
for offset in range(20):
    ch = text[idx + offset]
    print(offset, repr(ch), ord(ch))
