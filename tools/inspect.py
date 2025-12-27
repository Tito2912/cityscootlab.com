from pathlib import Path
text = Path('fr/index.html').read_text(encoding='utf-8')
for snippet in ["Cityscootlab", "50", "d'achat", "Ã"]:
    idx = text.find(snippet)
    if idx != -1:
        print(repr(text[idx:idx+80]))
