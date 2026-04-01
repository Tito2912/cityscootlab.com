# SEO audit (objectif : augmenter le CTR) — cityscootlab.com

Date : 2026-04-01

## 1) Constat (CTR)

D’après la capture Google Search Console (période “3 mois”, mise à jour ~5 h avant la capture) :
- Clics : 15
- Impressions : 1,27 k
- CTR moyen : 1,2 %
- Position moyenne : 16,6

Le CTR est mécaniquement faible à ~position 16 (page 2). L’objectif est donc :
1) **Maximiser le CTR** sur les requêtes déjà visibles (positions 8–20).
2) **Réduire les “frictions SERP”** qui poussent Google à réécrire le snippet (titres trop longs / dupliqués, signaux de langue incohérents, favicon manquante, URL non normalisées).

## 2) Correctifs livrés (CTR / snippet)

### A. Langue HTML correcte par version (/fr, /de, /es)
- Mise en place de layouts racine séparés avec `<html lang="…">` côté serveur :
  - `app/(en)/layout.tsx`
  - `app/(fr)/layout.tsx`
  - `app/(de)/layout.tsx`
  - `app/(es)/layout.tsx`

Impact CTR : meilleure compréhension de la langue, moins de snippet incohérent, moins de réécritures.

### B. Favicon au bon endroit (et Apple touch icon)
- Ajout :
  - `public/favicon.ico`
  - `public/favicon.png`
  - `public/apple-touch-icon.png`

Impact CTR : la favicon est souvent affichée en SERP mobile → améliore la reconnaissance visuelle.

### C. Titres : réduction des titres trop longs + suppression du suffixe systématique
- Template de titre : `'%s'` (au lieu d’un suffixe automatique).
- Raccourcissement / nettoyage de titres (suppression “| cityscootlab.com” / “— Cityscootlab”, harmonisation par langue).

Impact CTR : titres moins tronqués, promesses plus lisibles, moins de réécritures.

### D. Données structurées “site” (WebSite + Organization)
- Ajout de `components/SiteJsonLd.tsx` injecté dans les layouts.

Impact CTR : renforce la compréhension “entité/site”, aide potentiellement à la cohérence du “site name” et à certains enrichissements.

### E. Normalisation d’URL (home locales) + IndexNow
- Redirections Netlify ajoutées :
  - `/fr` → `/fr/`, `/fr.html` → `/fr/`
  - `/de` → `/de/`, `/de.html` → `/de/`
  - `/es` → `/es/`, `/es.html` → `/es/`
- Script IndexNow : la home `fr.html` est désormais soumise comme `/fr/` (cohérence).

Impact CTR : URL affichées plus propres + consolidation des signaux (canonical/URL).

## 3) Recos “GSC-first” (à faire en priorité)

### A. Trouver les pages à fort potentiel CTR
Dans GSC → Performances → Pages :
1) Filtre “Impressions” décroissant
2) Ouvrir chaque page → onglet “Requêtes”
3) Prioriser :
   - Impressions élevées
   - Position 8–20
   - CTR < moyenne du site

### B. Réécrire les titres (règles simples)
Objectif : ~45–60 caractères (ou ~520–580px), mot-clé au début, bénéfice concret.
Patterns efficaces :
- “Code ISW50 (2026) : -50€ dès 500€ + exclusions”
- “Avis S9 Pro (2026) : pour quels trajets ? + défauts”
- “isinwheel GT2 (2026) : puissance en côte… mais lourd”

### C. Réécrire les meta descriptions
1 phrase = bénéfice + preuve (test/mesures) + “ce que vous saurez”.
Éviter le blabla (“meilleur”, “incroyable”). Mettre un élément tangible (prix, autonomie, pente, poids, garantie).

## 4) Mesure (important)

Après déploiement :
- Attendre 7–14 jours (Google recrawl + prise en compte snippet).
- Comparer dans GSC :
  - CTR / impressions sur les pages modifiées
  - CTR par pays (FR/DE/US) si les pages locales sont ciblées
- Exporter “Pages + Requêtes” pour tracer l’évolution.

