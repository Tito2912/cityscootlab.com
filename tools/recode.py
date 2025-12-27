from pathlib import Path
from ftfy import fix_text
root = Path('.')
for path in root.rglob('*'):
    if not path.is_file() or path.suffix.lower() not in {'.html','.js','.css','.txt','.xml'}:
        continue
    data = path.read_bytes()
    for enc in ('utf-8','cp1252','latin-1'):
        try:
            text = data.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    fixed = fix_text(text)
    if fixed != text or enc != 'utf-8':
        path.write_text(fixed, encoding='utf-8')
