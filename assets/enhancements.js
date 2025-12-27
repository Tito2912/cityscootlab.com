/* ==========================================================================

   Cityscootlab – Progressive Enhancements (lazy loaded)

   Bundles non-critical UI sugar so the main bundle stays lightweight:
   - Copy-to-clipboard helpers
   - Lite YouTube embeds
   - Blog filters
   - Product card hydration
   - Affiliate CTA hygiene + GA4 events

   ========================================================================== */

(function(){
  if (typeof window === "undefined") return;

  const helpers = window.__CSL || {};
  const $$ = helpers.$$ || ((sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)));
  const $  = helpers.$  || ((sel, ctx = document) => ctx.querySelector(sel));
  const runIdle = helpers.runWhenIdle || ((cb) => {
    const shim = { timeRemaining: () => 0 };
    setTimeout(() => { try { cb(shim); } catch(_) {} }, 1);
  });

  const safeGTAG = (...args) => {
    try { if (typeof window.gtag === "function") window.gtag(...args); } catch(_) {}
  };

  /* ---------- Copy-to-clipboard (coupon etc.) ---------------------------- */
  runIdle(function copyButtons(){
    const buttons = $$("[data-copy]");
    if (!buttons.length) return;

    const fallbackCopy = (text) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch(_) { return false; }
    };

    buttons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy") || "";
        let ok = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text); ok = true;
          }
        } catch(_) {}
        if (!ok) ok = fallbackCopy(text);
        const msgId = btn.getAttribute("aria-describedby");
        const msgEl = msgId ? document.getElementById(msgId) : null;
        if (msgEl) { msgEl.textContent = "Copied!"; setTimeout(() => (msgEl.textContent = ""), 2000); }
        btn.classList.add("copied"); setTimeout(() => btn.classList.remove("copied"), 1200);
      }, {passive:true});
    });
  });


  /* ---------- Lite YouTube (progressive enhancement) --------------------- */
  runIdle(function liteYouTube(){
    const embeds = document.querySelectorAll(".lite-yt");
    if (!embeds.length) return;

    const injectPoster = (a) => {
      const ytid = a.getAttribute("data-ytid");
      if (!ytid || a.querySelector("img.lite-yt-poster")) return;
      const img = document.createElement("img");
      img.className = "lite-yt-poster";
      img.setAttribute("alt", "");
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      img.width = 1280; img.height = 720; // évite le CLS
      const thumb = a.getAttribute("data-thumb") || `https://i.ytimg.com/vi/${encodeURIComponent(ytid)}/hqdefault.jpg`;
      img.src = thumb;
      a.appendChild(img);
    };
    const toIframe = (a) => {
      const ytid = a.getAttribute("data-ytid"); if (!ytid) return;
      const iframe = document.createElement("iframe");
      iframe.setAttribute("title", "YouTube video player");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "origin-when-cross-origin");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytid)}?autoplay=1&rel=0&modestbranding=1`;
      a.classList.add("is-playing");
      a.innerHTML = "";           // supprime la miniature
      a.appendChild(iframe);      // conserve le ratio via CSS .lite-yt
    };
    embeds.forEach(a => {
      injectPoster(a);
      a.addEventListener("click", (e) => { e.preventDefault(); toIframe(a); });
      a.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toIframe(a); } });
      a.setAttribute("role", "button");
      a.setAttribute("tabindex", "0");
      if (!a.getAttribute("aria-label")) {
        const lang = (document.documentElement.lang || "").toLowerCase();
        a.setAttribute("aria-label", lang.startsWith("fr") ? "Lire la vidéo" : "Play video");
      }
    });
  });


  /* ---------- Blog: search & chips filter -------------------------------- */
  runIdle(function blogSearch(){
    const list = document.querySelector("[data-blog-list]");
    if (!list) return;
    const form = document.querySelector('[data-blog-search]');
    const chipsWrap = document.querySelector('.chips');

    const cards = () => Array.from(list.children).filter(el => el.matches('.post-card'));
    const applyFilters = (q = "", tag = "") => {
      const query = q.trim().toLowerCase();
      cards().forEach(card => {
        const text = card.textContent.toLowerCase();
        const tags = (card.getAttribute("data-tags") || "").toLowerCase().split(",");
        const okQ = !query || text.includes(query);
        const okT = !tag || tags.map(s => s.trim()).includes(tag);
        card.hidden = !(okQ && okT);
      });
    };
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (form.querySelector('input[type="search"]')?.value || "");
        applyFilters(q, "");
      });
    }
    if (chipsWrap) {
      chipsWrap.addEventListener("click", (e) => {
        const b = e.target.closest("[data-chip]"); if (!b) return;
        const tag = (b.getAttribute("data-chip") || "").toLowerCase();
        applyFilters("", tag);
      });
    }
  });


  /* ---------- Hydrate product cards from /isinwheelFR_IR.txt ------------- */
  (function hydrateProducts(){
    const cards = $$(".product[data-sku][data-src]");
    if (!cards.length) return;

    const startHydration = () => {
      if (startHydration._done) return;
      startHydration._done = true;

      runIdle(() => {
        const bySrc = new Map();
        cards.forEach(card => {
          const src = card.getAttribute("data-src");
          if (!src) return;
          if (!bySrc.has(src)) bySrc.set(src, []);
          bySrc.get(src).push(card);
        });

        const processQueue = (tasks, perTick) => new Promise(resolve => {
          const step = () => {
            const slice = tasks.splice(0, perTick);
            slice.forEach(fn => { try { fn(); } catch(_) {} });
            if (tasks.length) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(step);
        });

        const spawnWorker = () => {
          try {
            return new Worker("/assets/ir-worker.js");
          } catch(_) {
            return null;
          }
        };

        bySrc.forEach((cardList, src) => {
          fetch(src, { credentials: "omit" })
            .then(r => r.ok ? r.text() : "")
            .then(async (text) => {
              if (!text) return;
              const worker = spawnWorker();
              if (!worker) return;

              const db = await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                  try { worker.terminate(); } catch(_) {}
                  resolve(null);
                }, 4000);

                worker.onmessage = (ev) => {
                  clearTimeout(timeout);
                  try { worker.terminate(); } catch(_) {}
                  const data = ev.data;
                  resolve(data && data.ok ? data.db || null : null);
                };

                worker.postMessage({ text });
              });

              if (!db) return;

              const tasks = cardList.map(card => () => {
                const sku = card.getAttribute("data-sku");
                if (!sku) return;
                const rec = db[sku];
                if (!rec) return;

                try {
                  if (rec.name) {
                    const h3 = card.querySelector("h3");
                    if (h3) h3.textContent = rec.name;
                  }
                  if (rec.price) {
                    const priceEl = card.querySelector(".price");
                    if (priceEl) priceEl.textContent = rec.price;
                  }
                  if (rec.image) {
                    const img = card.querySelector("img");
                    if (img) img.src = rec.image;
                  }
                  if (rec.url) {
                    const cta = card.querySelector(".actions a.btn-cta") || card.querySelector(".actions a.btn");
                    if (cta) {
                      cta.href = rec.url;
                      ensureRelTarget(cta, true);
                    }
                  }
                  if (rec.coupon) {
                    const btn = card.querySelector("[data-copy]");
                    if (btn) btn.setAttribute("data-copy", rec.coupon);
                  }
                } catch(_) {}
              });

              await processQueue(tasks, 1);
            })
            .catch(() => {});
        });
      });
    };

    const attachOnce = (event, options) => {
      const handler = () => {
        window.removeEventListener(event, handler, options);
        startHydration();
      };
      window.addEventListener(event, handler, options);
    };

    attachOnce("scroll", { passive: true });
    attachOnce("click", { passive: true });
    attachOnce("touchstart", { passive: true });
  })();


  /* ---------- Affiliate CTA hygiene + GA4 events ------------------------- */
  const AFFILIATE_HOST_HINTS = ["isinwheel.com", "isinwheel.fr", "sjv.io", "amzn.to", "amazon."];
  const matchesAffiliateHint = (href = "") => {
    const h = String(href).toLowerCase();
    return AFFILIATE_HOST_HINTS.some(host => h.includes(host));
  };

  function isAffiliateDomain(u){
    try {
      const href = String(u || "");
      if (!matchesAffiliateHint(href)) return false;
      const h = new URL(href, location.origin).hostname.toLowerCase();
      return matchesAffiliateHint(h);
    } catch(_) { return false; }
  }
  function ensureRelTarget(a, force = false){
    try {
      if (!a || !(a instanceof Element)) return;
      const href = a.getAttribute("href") || "";
      if (!href || (!force && !matchesAffiliateHint(href))) return;
      if (!isAffiliateDomain(href)) return;
      a.setAttribute("target", "_blank");
      const rel = (a.getAttribute("rel") || "").toLowerCase().split(/\s+/).filter(Boolean);
      ["sponsored", "noopener", "noreferrer"].forEach(tok => { if (!rel.includes(tok)) rel.push(tok); });
      a.setAttribute("rel", rel.join(" "));
    } catch(_) {}
  }

  runIdle(function affiliateHygieneAndAnalytics(){
    const hasConsent = () => {
      const c = (document.cookie.match(/(?:^| )csl_consent=([^;]+)/) || [])[1] || "";
      const val = decodeURIComponent(c || "").toLowerCase();
      if (val === "granted") return true;
      try {
        const l = (localStorage.getItem("csl_consent_mem") || "").toLowerCase();
        return l === "granted";
      } catch(_) { return false; }
    };

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]"); if (!a) return;
      const href = a.getAttribute("href") || ""; if (!isAffiliateDomain(href)) return;
      ensureRelTarget(a, true);
      if (hasConsent()) {
        safeGTAG('event', 'select_content', {
          content_type: 'affiliate_cta',
          link_domain: (() => { try { return new URL(href, location.origin).hostname; } catch(_) { return ''; } })(),
          link_url: href.slice(0, 500),
          link_text: (a.textContent || '').trim().slice(0, 100),
          language: (document.documentElement.lang || '').toLowerCase()
        });
      }
    }, {capture: true, passive: true});
  });

})();
