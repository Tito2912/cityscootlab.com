from pathlib import Path
from ftfy import fix_text

root = Path(__file__).resolve().parents[1]
for path in root.rglob('*'):
    if path.suffix.lower() not in {'.html', '.js', '.css'}:
        continue
    text = path.read_text(encoding='utf-8')
    fixed = fix_text(text)
    if fixed != text:
        path.write_text(fixed, encoding='utf-8')
