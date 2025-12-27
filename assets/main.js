/* ==========================================================================

   Cityscootlab — Main JS (vanilla, lightweight)

   - GA4 Consent Mode v2 controller (default denied until consent)
   - Cookie banner + persistence (cookie + localStorage)
   - Burger menu & language switcher (accessible)
   - Copy-to-clipboard for coupon codes
   - Lite YouTube (no iframe until interaction) — ratio 16:9 conservé
   - Blog search / chip filters
   - Smart Lang Switch + FR auto-redirect (respect préférence utilisateur)
   - Product cards hydration from /isinwheelFR_IR.txt (if present)
   - IndexNow ping (safe, throttled)
   - Affiliate CTA hygiene (target/rel) + GA4 events

   ========================================================================== */


/* ---------- Small helpers ------------------------------------------------- */
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const $  = (sel, ctx = document) => ctx.querySelector(sel);

const safeGTAG = (...args) => {
  try { if (typeof window.gtag === "function") window.gtag(...args); } catch(_) {}
};

const setCookie = (name, value, days = 365) => {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
  } catch(_) {}
};
const getCookie = (name) => {
  try {
    const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[2]) : null;
  } catch(_) { return null; }
};

const GA_ID = "G-962GK50F4L";

const runWhenIdle = (cb, timeout = 1500) => {
  if (typeof window === "undefined") return;
  const exec = (deadline) => { try { cb(deadline); } catch(_) {} };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback((deadline) => exec(deadline), { timeout });
  } else {
    const shimDeadline = { timeRemaining: () => 0 };
    window.setTimeout(() => exec(shimDeadline), timeout);
  }
};

try {
  const store = window.__CSL = window.__CSL || {};
  store.$$ = store.$$ || $$;
  store.$ = store.$ || $;
  store.runWhenIdle = store.runWhenIdle || runWhenIdle;
} catch(_) {}


/* ---------- Year in footer ------------------------------------------------ */
(function setYear(){
  try {
    const y = String(new Date().getFullYear());
    $$("[data-year]").forEach(el => { el.textContent = y; });
  } catch(_) {}
})();


/* ---------- Consent Mode v2 ---------------------------------------------- */
(function consentController(){
  const banner = $("#consent-banner");
  if (!banner) return;

  const CHOICE_KEY = "csl_consent";       // cookie + localStorage mirror
  const CHOICE_MEM = "csl_consent_mem";
  const OPENERS    = $$("[data-open-consent]");
  const loadGA = (() => {
    let requested = false;
    return () => {
      if (requested) return;
      requested = true;
      if (document.querySelector("script[data-ga4]")) return;
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      s.setAttribute("data-ga4", GA_ID);
      document.head.appendChild(s);
    };
  })();

  const applyChoice = (choice) => {
    const granted = (choice === "granted");
    if (granted) loadGA();
    // Persist
    setCookie(CHOICE_KEY, choice, 365);
    try { localStorage.setItem(CHOICE_MEM, choice); } catch(_) {}
    // Update GA4 Consent Mode
    safeGTAG('consent', 'update', {
      'ad_storage': granted ? 'granted' : 'denied',
      'ad_user_data': granted ? 'granted' : 'denied',
      'ad_personalization': granted ? 'granted' : 'denied',
      'analytics_storage': granted ? 'granted' : 'denied'
    });
    // Hide banner
    banner.setAttribute("hidden", "");
  };

  const showBanner = () => { requestAnimationFrame(() => banner.removeAttribute("hidden")); };

  // Wire buttons
  $$("[data-consent]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-consent") === "grant" ? "granted" : "denied";
      applyChoice(val);
    }, {passive:true});
  });

  // Openers (footer links)
  OPENERS.forEach(op => op.addEventListener("click", () => showBanner(), {passive:true}));

  // Querystring opener
  try {
    if (new URLSearchParams(location.search).get("consent") === "open") {
      setTimeout(showBanner, 100);
    }
  } catch(_) {}

  // On load, read saved choice
  let choice = getCookie(CHOICE_KEY);
  try { choice = choice || localStorage.getItem(CHOICE_MEM); } catch(_) {}
  if (choice === "granted" || choice === "denied") { applyChoice(choice); }
  else { setTimeout(showBanner, 400); }
})();


/* ---------- Burger menu + SIMPLE language toggle ------------------------- */
(function navAndLang(){
  const toggle = $(".nav-toggle");
  const nav    = $("#site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
    // Close menu when a link is clicked (mobile)
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (toggle.offsetParent !== null) { // visible on mobile
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- SIMPLE FR/EN BUTTON (no dropdown) ---
  const langBtn = $("[data-langmenu]");
  if (langBtn) {
    // Label = EN or FR (no caret)
    try {
      const curr = (document.documentElement.lang || 'en').slice(0,2).toUpperCase();
      langBtn.textContent = curr;
      langBtn.setAttribute('aria-expanded','false'); // always false (no menu)
    } catch(_) {}

    // Click = toggle language directly
    langBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isFr = (document.documentElement.lang || "").toLowerCase().startsWith("fr");
      if (window.__langSwitch) {
        isFr ? window.__langSwitch.toEn() : window.__langSwitch.toFr();
      }
    }, {passive:false});
  }
})();


/* ---------- Copy, video & blog enhancements are lazy-loaded -------------- */


/* ---------- Smart Lang Switch + FR auto-redirect ------------------------- */
/* Rules:
   - EN lives at `/`, FR lives under `/fr/`.
   - First visit: auto-redirect to FR when the browser language is French.
   - Clicking a [data-lang-switch] link stores preference and swaps URLs while keeping query/hash.
   - Query overrides (?lang= / ?hl=) are supported then cleaned.
   - A session flag prevents redirect loops.
*/
(function langSwitchSmart(){
  var PREF_KEY = "csl_lang";
  var SESSION_FLAG = "csl_lang_redirect_v1";

  var EXCEPT_EN2FR = {
    "/legal-notice": "/fr/mentions-legales",
    "/legal-notice.html": "/fr/mentions-legales",
    "/privacy-policy": "/fr/politique-de-confidentialite",
    "/privacy-policy.html": "/fr/politique-de-confidentialite"
  };
  var EXCEPT_FR2EN = {
    "/fr/mentions-legales": "/legal-notice",
    "/fr/mentions-legales.html": "/legal-notice",
    "/fr/politique-de-confidentialite": "/privacy-policy",
    "/fr/politique-de-confidentialite.html": "/privacy-policy"
  };

  function setPref(lang){
    setCookie(PREF_KEY, lang, 180);
    try { localStorage.setItem(PREF_KEY, lang); } catch(_) {}
  }
  function getPref(){
    var v = (getCookie(PREF_KEY) || "").toLowerCase();
    try { v = v || (localStorage.getItem(PREF_KEY) || "").toLowerCase(); } catch(_) {}
    return (v === "en" || v === "fr") ? v : "";
  }

  function toFrPath(pathname){
    if (EXCEPT_EN2FR[pathname]) return EXCEPT_EN2FR[pathname];
    if (pathname === "/" || pathname === "/index.html") return "/fr/";
    if (pathname.indexOf("/fr/") === 0) return pathname;
    return ("/fr" + pathname).replace(/\/{2,}/g, "/");
  }
  function toEnPath(pathname){
    if (pathname === "/en" || pathname.indexOf("/en/") === 0) {
      pathname = pathname.replace(/^\/en(\/|$)/, "/") || "/";
    }
    if (EXCEPT_FR2EN[pathname]) return EXCEPT_FR2EN[pathname];
    if (pathname.indexOf("/fr/") === 0) {
      var stripped = pathname.replace(/^\/fr(\/|$)/, "/");
      if (stripped === "/index.html") return "/";
      return stripped || "/";
    }
    if (pathname === "/fr" || pathname === "/fr/index.html") return "/";
    return pathname || "/";
  }

  function buildLangUrl(lang, pathname, search, hash){
    var targetPath = (lang === "fr" ? toFrPath(pathname) : toEnPath(pathname));
    var prefix = (lang === "en") ? "/en" : "";
    var basePath = (targetPath === "/" ? "/" : targetPath);
    var fullPath = (prefix ? (prefix + basePath) : basePath).replace(/\/{2,}/g, "/");
    var query = search || "";
    var frag = hash || "";
    return fullPath + query + frag;
  }

  function go(lang){
    var loc = window.location;
    var nextURL = buildLangUrl(lang, loc.pathname, loc.search, loc.hash);
    setPref(lang);
    try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch(_) {}
    if (nextURL !== (loc.pathname + loc.search + loc.hash)) {
      window.location.href = nextURL;
    }
  }

  (function applyQueryOverride(){
    try {
      var url = new URL(window.location.href);
      var qLang = (url.searchParams.get("lang") || url.searchParams.get("hl") || "").toLowerCase();
      if (qLang === "en" || qLang === "fr") {
        setPref(qLang);
        try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch(_) {}
        url.searchParams.delete("lang");
        url.searchParams.delete("hl");
        var search = url.searchParams.toString();
        var nextSearch = search ? ("?" + search) : "";
        var nextUrl = buildLangUrl(qLang, url.pathname, nextSearch, url.hash || "");
        window.location.replace(nextUrl);
      }
    } catch(_) {}
  })();

  (function autoRedirect(){
    try {
      var pathname = location.pathname || "/";
      var hasSessionRedirect = sessionStorage.getItem(SESSION_FLAG) === "1";
      if (hasSessionRedirect) return;

      var pref = getPref();
      if (pref === "en") return;
      if (pref === "fr") {
        if (pathname.indexOf("/fr/") !== 0 && pathname !== "/fr" && pathname !== "/fr/index.html") {
          sessionStorage.setItem(SESSION_FLAG, "1");
          var loc = window.location;
          var target = toFrPath(pathname) + (loc.search || "") + (loc.hash || "");
          if (target !== (loc.pathname + loc.search + loc.hash)) {
            return window.location.replace(target);
          }
        }
        return;
      }

      var langs = navigator.languages || [navigator.language || ""];
      var isFR = langs.some(function(l){ return /^fr(\b|-|_)/i.test(String(l || "")); });
      var onFR = (pathname.indexOf("/fr/") === 0 || pathname === "/fr" || pathname === "/fr/index.html");
      if (isFR && !onFR) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        var l = window.location;
        var t = toFrPath(pathname) + (l.search || "") + (l.hash || "");
        if (t !== (l.pathname + l.search + l.hash)) {
          window.location.replace(t);
        }
      }
    } catch(_) {}
  })();

  function bindSwitchLinks(){
    $$( '[data-lang-switch]' ).forEach(function(a){
      a.addEventListener('click', function(e){
        var lang = (a.getAttribute('data-lang-switch') || '').toLowerCase();
        if (lang === 'en' || lang === 'fr') {
          e.preventDefault();
          go(lang);
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSwitchLinks);
  } else {
    bindSwitchLinks();
  }

  (function normalizeEnPrettyUrl(){
    try {
      var path = location.pathname || "/";
      if (path === "/en" || path.indexOf("/en/") === 0) {
        var canonical = toEnPath(path);
        var desired = canonical + (location.search || "") + (location.hash || "");
        if (desired !== (location.pathname + location.search + location.hash)) {
          history.replaceState(null, "", desired);
        }
      }
    } catch(_) {}
  })();

  // Expose helpers for the simple toggle
  window.__langSwitch = { toEn: function(){ go("en"); }, toFr: function(){ go("fr"); } };
})();

/* ---------- Hydration, product & affiliate enhancements are lazy-loaded --- */
(function lazyLoadEnhancements(){
  if (typeof document === "undefined") return;
  let requested = false;
  const ensure = () => {
    if (requested) return;
    requested = true;
    if (document.querySelector('script[data-enhancements]')) return;
    const s = document.createElement("script");
    s.defer = true;
    s.src = "/assets/enhancements.min.js";
    s.setAttribute("data-enhancements", "true");
    document.head.appendChild(s);
  };
  runWhenIdle(ensure, 1200);
  try {
    ["pointerdown", "keydown", "scroll"].forEach(evt => {
      window.addEventListener(evt, ensure, { once: true, passive: true });
    });
  } catch(_) {}
})();

/* ---------- Progressive enhancement done --------------------------------- */
