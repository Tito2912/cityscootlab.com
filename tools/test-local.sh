#!/usr/bin/env bash
# tools/test-local.sh v1.3 — serveur local + QA complète (Git Bash/Windows OK)
# - Détection Python robuste (python3 -> py -3 -> python), évite l’alias Microsoft Store.
# - QA HTML (GA4 + Consent v2, lang/hreflang, canonical, JSON-LD, CTA affiliés, images width/height, .com dans FR)
# - Vérifs netlify.toml (CSP + nonce + YouTube nocookie + GTM), robots/sitemaps, main.js (IndexNow + consent + langue)
# - Serveur local Python + checks HTTP + spot-checks contenus.
# Options :
#   --port N  | --no-open | --skip-serve | --only-serve | --strict | --debug

set -Euo pipefail

PORT=8080
OPEN_BROWSER=1
DO_SERVE=1
DO_FILE_QA=1
STRICT=0
DEBUG=0
HOST="127.0.0.1"
ORIGIN="http://${HOST}:${PORT}"

c_ok()    { printf "\033[32m%s\033[0m\n" "✔ $*"; }
c_warn()  { printf "\033[33m%s\033[0m\n" "▲ $*"; }
c_err()   { printf "\033[31m%s\033[0m\n" "✖ $*"; }
c_info()  { printf "\033[36m%s\033[0m\n" "ℹ $*"; }
die() { c_err "$*"; exit 1; }

open_browser() {
  local url="$1"
  [[ $OPEN_BROWSER -eq 1 ]] || return 0
  case "${OSTYPE:-}" in
    cygwin*|msys*|win32*) cmd.exe /c start "" "$url" >/dev/null 2>&1 || true ;;
    darwin*) open "$url" >/dev/null 2>&1 || true ;;
    *) xdg-open "$url" >/dev/null 2>&1 || true ;;
  esac
}

http_code() {
  local url="$1" code
  code="$(curl -sS -o /dev/null -w "%{http_code}" -I "$url" || true)"
  [[ -n "$code" && "$code" != "000" ]] || code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)"
  printf "%s" "$code"
}

# -------------------- Arguments --------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="${2:-}"; shift 2 ;;
    --no-open) OPEN_BROWSER=0; shift ;;
    --skip-serve) DO_SERVE=0; DO_FILE_QA=1; shift ;;
    --only-serve) DO_SERVE=1; DO_FILE_QA=0; shift ;;
    --strict) STRICT=1; shift ;;
    --debug) DEBUG=1; shift ;;
    -h|--help)
      echo "Usage: bash tools/test-local.sh [--port 8080] [--no-open] [--skip-serve] [--only-serve] [--strict] [--debug]"
      exit 0 ;;
    *) c_warn "Argument inconnu: $1"; shift ;;
  esac
done
ORIGIN="http://${HOST}:${PORT}"

# -------------------- Sélection Python robuste --------------------
declare -a PYCMD=()
try_python() {
  local -a cmd=("$@")
  [[ $DEBUG -eq 1 ]] && printf "DEBUG: test python cmd: %q " "${cmd[@]}" && echo
  if "${cmd[@]}" -c "import sys; sys.exit(0)" >/dev/null 2>&1; then
    PYCMD=("${cmd[@]}")
    return 0
  fi
  return 1
}
if try_python python3; then :
elif try_python py -3; then :
elif try_python python; then :
else
  c_err "Aucun interpréteur Python utilisable détecté.
- Installe Python depuis https://www.python.org/downloads/ (coche « Add python.exe to PATH »), OU
- Active le Python Launcher et utilise 'py -3'.
- Désactive l'alias Store : Paramètres Windows > Applications > Alias d’exécution des applications > désactiver « python » et « python3 »."
  exit 1
fi
[[ $DEBUG -eq 1 ]] && printf "DEBUG: PYCMD=%q " "${PYCMD[@]}" && echo
run_py_module() { "${PYCMD[@]}" -m "$@"; }
run_py_file()   { "${PYCMD[@]}" "$@"; }

# -------------------- Fichiers requis --------------------
need() { command -v "$1" >/dev/null 2>&1 || die "Manquant : $1"; }
need curl

REQUIRED_FILES=(
  "index.html" "legal-notice.html" "privacy-policy.html" "blog.html" "blog-1.html"
  "fr/index.html" "fr/mentions-legales.html" "fr/politique-de-confidentialite.html" "fr/blog.html" "fr/blog-1.html"
  "assets/styles.css" "assets/main.js" "assets/styles.min.css" "assets/main.min.js"
  "sitemap.xml" "sitemaps/sitemap-en.xml" "sitemaps/sitemap-fr.xml"
  "robots.txt" "netlify.toml" "_redirects" "fc1887717a84459fabe3f4984e2669d7.txt"
)

FAIL=0
WARN=0

c_info "Vérification des fichiers requis…"
missing=0
for f in "${REQUIRED_FILES[@]}"; do
  if [[ -f "$f" ]]; then printf " - %s\n" "$f"; else c_err "Manquant : $f"; missing=1; fi
done
[[ $missing -eq 0 ]] && c_ok "Tous les fichiers requis sont présents." || { c_warn "Des fichiers manquent."; ((WARN++)); }

if [[ -f "fc1887717a84459fabe3f4984e2669d7.txt" ]]; then
  if grep -qx "fc1887717a84459fabe3f4984e2669d7" "fc1887717a84459fabe3f4984e2669d7.txt"; then
    c_ok "IndexNow key : contenu OK."
  else c_err "IndexNow key : contenu inattendu (1 ligne exacte attendue)."; ((FAIL++)); fi
else c_err "IndexNow key : fichier absent."; ((FAIL++)); fi

# -------------------- QA FICHIERS (analyseur Python) --------------------
if [[ $DO_FILE_QA -eq 1 ]]; then
  c_info "Analyse qualité des *.html (SEO/tech)…"

  shopt -s nullglob
  if shopt -s globstar 2>/dev/null; then HTML_FILES=( **/*.html ); else HTML_FILES=(); fi
  if [[ ${#HTML_FILES[@]} -eq 0 ]]; then mapfile -t HTML_FILES < <(find . -type f -name "*.html" | sed 's|^\./||'); fi
  if [[ ${#HTML_FILES[@]} -eq 0 ]]; then c_err "Aucun fichier HTML trouvé pour l'analyse."; ((FAIL++)); fi
  [[ $DEBUG -eq 1 ]] && printf "DEBUG: HTML_FILES=%s\n" "${#HTML_FILES[@]}"

  TMPDIR="$(mktemp -d 2>/dev/null || mktemp -d -t csltmp)"
  ANALYZER="${TMPDIR}/analyzer.py"
  cat > "$ANALYZER" <<'PY'
import sys, re, os
if len(sys.argv) < 2:
    print("PYERR::no input file"); sys.exit(2)
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
        data = fh.read()
except Exception as e:
    print("PYERR::" + str(e)); sys.exit(2)

issues, warns = [], []

# 1) GA4 + Consent Mode default denied
if 'G-962GK50F4L' not in data:
    issues.append('GA4 ID manquant (G-962GK50F4L)')
if not re.search(r"gtag\(\s*['\"]consent['\"]\s*,\s*['\"]default['\"]", data):
    issues.append("Consent Mode v2 'default denied' manquant")

# 2) <html lang> + détection FR/EN robuste (chemin + canonical + lang)
m = re.search(r"<html[^>]*\blang=['\"]([^'\"]+)['\"]", data, re.I)
lang = (m.group(1).lower() if m else '')

p = path.lower().replace('\\', '/')
is_fr_file = (p.startswith('fr/') or '/fr/' in p)

mcanon = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', data, re.I)
if mcanon:
    href = mcanon.group(1).lower()
    if '/fr/' in href:
        is_fr_file = True
    elif href.startswith('https://cityscootlab.com/') and '/fr/' not in href:
        if not p.startswith('fr/') and '/fr/' not in p:
            is_fr_file = False

if lang.startswith('fr'):
    is_fr_file = True

if is_fr_file:
    if lang != 'fr':
        issues.append(f'lang attendu "fr" (trouvé "{lang or "absent"}")')
else:
    if lang != 'en':
        issues.append(f'lang attendu "en" (trouvé "{lang or "absent"}")')

# 3) hreflang alternates minimal
if is_fr_file:
    if 'hreflang="fr-FR"' not in data: issues.append('hreflang fr-FR manquant')
    if 'hreflang="en"' not in data: warns.append('hreflang en manquant (recommandé)')
else:
    if 'hreflang="x-default"' not in data: issues.append('hreflang x-default manquant')
    if 'hreflang="fr-FR"' not in data:     warns.append('hreflang fr-FR manquant (recommandé)')

# 4) canonical
if not re.search(r'<link[^>]+rel=["\']canonical["\']', data, re.I):
    warns.append('canonical manquant')

# 5) JSON-LD
if 'application/ld+json' not in data:
    warns.append('JSON-LD (schema.org) manquant')

# 6) Liens affiliés (target/_blank + rel)
aff_pat = re.compile(r'<a\b([^>]+)>', re.I)
for m in aff_pat.finditer(data):
    attrs = m.group(1)
    hrefm = re.search(r'href=["\']([^"\']+)["\']', attrs, re.I)
    if not hrefm: continue
    href = hrefm.group(1)
    if re.search(r'isinwheel|amzn\.to|amazon\.', href, re.I):
        targetm = re.search(r'target=["\']([^"\']+)["\']', attrs, re.I)
        relm    = re.search(r'rel=["\']([^"\']+)["\']', attrs, re.I)
        if not targetm or targetm.group(1) != '_blank':
            issues.append(f'CTA affilié sans target="_blank": {href[:100]}')
        rel_tokens = set((relm.group(1).lower().split()) if relm else [])
        required_tokens = {'sponsored','noopener','noreferrer'}
        if not rel_tokens.issuperset(required_tokens):
            issues.append(f'CTA affilié rel manquant/incomplet: {href[:100]}')

# 7) <img> width/height
for im in re.finditer(r'<img\b([^>]+)>', data, re.I):
    attrs = im.group(1)
    w = re.search(r'\bwidth\s*=\s*["\']\d+["\']', attrs)
    h = re.search(r'\bheight\s*=\s*["\']\d+["\']', attrs)
    if not (w and h): warns.append('img sans width/height explicites')

# 8) Pas de .com en CTA sur pages FR
if is_fr_file and re.search(r'href=["\']https?://[^"\']*isinwheel\.com', data, re.I):
    issues.append('Lien .com détecté dans page FR (CTA) — éviter de mélanger .fr et .com')

if issues:
    print("ISSUES::" + "||".join(issues))
elif warns:
    print("WARN::" + "||".join(warns))
else:
    print("OK")
sys.exit(0)
PY

  TOTAL_HTML=0
  for f in "${HTML_FILES[@]}"; do
    ((TOTAL_HTML++))
    set +e
    OUT="$(run_py_file "$ANALYZER" "$f" 2>&1)"
    RC=$?
    set -e
    if [[ $RC -ne 0 ]]; then
      c_err "$f"
      [[ $DEBUG -eq 1 ]] && printf "DEBUG[python]: %s\n" "$OUT"
      echo "    - Échec d'analyse Python (code $RC)."
      ((FAIL++))
      continue
    fi
    case "$OUT" in
      OK) c_ok "$f" ;;
      ISSUES::*)
        c_err "$f"
        IFS='||' read -r -a arr <<<"${OUT#ISSUES::}"
        for i in "${arr[@]}"; do printf "    - %s\n" "$i"; done
        ((FAIL++))
        ;;
      WARN::*)
        c_warn "$f"
        IFS='||' read -r -a arr <<<"${OUT#WARN::}"
        for w in "${arr[@]}"; do printf "    - %s\n" "$w"; done
        ((WARN++))
        ;;
      PYERR::*)
        c_err "$f"
        printf "    - Lecture fichier : %s\n" "${OUT#PYERR::}"
        ((FAIL++))
        ;;
      *)
        c_warn "$f (analyse inattendue)"
        [[ $DEBUG -eq 1 ]] && printf "DEBUG[out]: %s\n" "$OUT"
        ((WARN++))
        ;;
    esac
  done

  # netlify.toml (CSP)
  if [[ -f netlify.toml ]]; then
    if grep -q "Content-Security-Policy" netlify.toml; then
      grep -q "nonce-csl-nonce-2025" netlify.toml && c_ok "CSP : nonce présent" || { c_err "CSP : nonce manquant"; ((FAIL++)); }
      grep -q "www.youtube-nocookie.com" netlify.toml && c_ok "CSP : YouTube nocookie autorisé" || { c_err "CSP : YT nocookie manquant"; ((FAIL++)); }
      grep -q "www.googletagmanager.com" netlify.toml && c_ok "CSP : GTM autorisé" || { c_err "CSP : GTM manquant"; ((FAIL++)); }
    else c_warn "netlify.toml : en-tête CSP non trouvé"; ((WARN++)); fi
  else c_err "netlify.toml manquant"; ((FAIL++)); fi

  # robots & sitemaps
  if [[ -f robots.txt ]]; then
    grep -q "Sitemap:" robots.txt && c_ok "robots.txt : références sitemaps" || { c_warn "robots.txt : pas de Sitemap"; ((WARN++)); }
  else c_err "robots.txt manquant"; ((FAIL++)); fi

  if [[ -f sitemaps/sitemap-en.xml ]]; then
    grep -q "https://cityscootlab.com/" sitemaps/sitemap-en.xml && c_ok "sitemap-en.xml : URLs domaine OK" || { c_err "sitemap-en.xml : URLs incorrectes"; ((FAIL++)); }
  else c_err "sitemaps/sitemap-en.xml manquant"; ((FAIL++)); fi

  if [[ -f sitemaps/sitemap-fr.xml ]]; then
    grep -q "https://cityscootlab.com/fr/" sitemaps/sitemap-fr.xml && c_ok "sitemap-fr.xml : URLs FR OK" || { c_err "sitemap-fr.xml : URLs incorrectes"; ((FAIL++)); }
  else c_err "sitemaps/sitemap-fr.xml manquant"; ((FAIL++)); fi

  # JS main
  if [[ -f assets/main.js ]]; then
    if command -v node >/dev/null 2>&1; then
      node --check assets/main.js >/dev/null 2>&1 && c_ok "main.js : syntaxe OK (node --check)" || { c_err "main.js : erreur de syntaxe (node --check)"; ((FAIL++)); }
    else c_warn "Node non installé — saut du check syntaxe JS"; ((WARN++)); fi
    grep -q "fc1887717a84459fabe3f4984e2669d7" assets/main.js && c_ok "main.js : IndexNow key présente" || { c_warn "main.js : IndexNow key non trouvée"; ((WARN++)); }
    grep -q "csl_lang" assets/main.js && c_ok "main.js : cookie langue géré" || { c_warn "main.js : cookie langue non détecté"; ((WARN++)); }
    grep -q "csl_consent" assets/main.js && c_ok "main.js : persistance consentement" || { c_warn "main.js : clé consentement non détectée"; ((WARN++)); }
  else c_err "assets/main.js manquant"; ((FAIL++)); fi
fi

# -------------------- SERVEUR + CHECKS HTTP --------------------
SRV_PID=""
if [[ $DO_SERVE -eq 1 ]]; then
  c_info "Démarrage du serveur local sur ${ORIGIN} …"
  run_py_module http.server "$PORT" --bind "$HOST" >/dev/null 2>&1 &
  SRV_PID=$!
  trap '[[ -n "$SRV_PID" ]] && kill "$SRV_PID" >/dev/null 2>&1 || true' EXIT

  for i in {1..30}; do code="$(http_code "${ORIGIN}/")"; [[ "$code" == "200" ]] && break; sleep 0.2; done
  [[ "$code" == "200" ]] || { c_err "Serveur non démarré correctement sur ${ORIGIN}."; ((FAIL++)); }

  c_ok "Serveur opérationnel."
  open_browser "${ORIGIN}/"

  URLS=(
    "/" "/fr/" "/blog" "/fr/blog" "/blog-1" "/fr/blog-1"
    "/legal-notice" "/privacy-policy" "/fr/mentions-legales" "/fr/politique-de-confidentialite"
    "/sitemap.xml" "/sitemaps/sitemap-en.xml" "/sitemaps/sitemap-fr.xml" "/robots.txt" "/fc1887717a84459fabe3f4984e2669d7.txt"
  )
  c_info "Vérification HTTP des URLs clés…"
  bad=0
  for u in "${URLS[@]}"; do
    code="$(http_code "${ORIGIN}${u}")"
    [[ "$code" == "200" ]] && printf " - %-42s %s\n" "$u" "200 OK" || { printf " - %-42s %s\n" "$u" "$code"; bad=1; }
  done
  [[ $bad -eq 0 ]] && c_ok "Toutes les URLs clés répondent 200." || { c_err "Certaines URLs ne répondent pas 200."; ((FAIL++)); }

  c_info "Spot-check contenu (GA4/Consent + hreflang)…"
  body_en="$(curl -sS "${ORIGIN}/" || true)"
  body_fr="$(curl -sS "${ORIGIN}/fr/" || true)"
  if echo "$body_en" | grep -q "G-962GK50F4L" && echo "$body_en" | grep -q "consent', 'default"; then c_ok "EN home : GA4 + Consent détectés"; else c_err "EN home : GA4/Consent manquants"; ((FAIL++)); fi
  if echo "$body_fr" | grep -q "G-962GK50F4L" && echo "$body_fr" | grep -q "consent', 'default"; then c_ok "FR home : GA4 + Consent détectés"; else c_err "FR home : GA4/Consent manquants"; ((FAIL++)); fi
  if echo "$body_en" | grep -q 'hreflang="x-default"' && echo "$body_en" | grep -q 'hreflang="fr-FR"'; then c_ok "EN home : hreflang OK"; else c_warn "EN home : hreflang incomplet"; ((WARN++)); fi
  if echo "$body_fr" | grep -q 'hreflang="fr-FR"' && echo "$body_fr" | grep -q 'hreflang="en"'; then c_ok "FR home : hreflang OK"; else c_warn "FR home : hreflang incomplet"; ((WARN++)); fi
fi

echo
if [[ $STRICT -eq 1 && $WARN -gt 0 ]]; then
  c_warn "Mode strict : ${WARN} avertissement(s) comptés comme erreurs."
  FAIL=$((FAIL + WARN))
fi

if (( FAIL == 0 )); then
  c_ok "Tests terminés ✅ — tout est OK pour l’indexation et le référencement."
  c_info "Commandes utiles :"
  echo "  - Ouvrir EN : ${ORIGIN}/"
  echo "  - Ouvrir FR : ${ORIGIN}/fr/"
  [[ -n "${SRV_PID}" ]] && echo "  - Stopper serveur : kill ${SRV_PID}"
  exit 0
else
  c_err "Tests terminés ❌ — ${FAIL} erreur(s)${STRICT:+ (mode strict)}."
  echo "Relance en mode verbeux : bash tools/test-local.sh --debug --strict"
  exit 1
fi
