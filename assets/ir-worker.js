// assets/ir-worker.js
// Parse /isinwheelFR_IR.txt off the main thread to avoid TBT
self.onmessage = (ev) => {
  const text = ev.data && ev.data.text || "";
  try {
    const db = parseIR(text);
    self.postMessage({ ok: true, db });
  } catch (e) {
    self.postMessage({ ok: false, error: String(e) });
  }
};

function parseIR(text){
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = Object.create(null);
  const put = (sku, data) => { if (sku) out[sku] = Object.assign(out[sku] || {}, data); };
  const kvRegex = /(\bsku|price|url|image|img|name|coupon)\s*[:=]\s*([^|,]+)\s*/ig;

  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    if (/^\s*\{/.test(line)) {
      try { const obj = JSON.parse(line); if (obj && obj.sku) { put(String(obj.sku), obj); continue; } } catch(_) {}
    }
    let m, data = {};
    while ((m = kvRegex.exec(line)) !== null) {
      const k = m[1].toLowerCase(); let v = (m[2] || "").trim();
      data[k === "img" ? "image" : k] = v;
    }
    if (Object.keys(data).length && data.sku) { put(String(data.sku), data); continue; }
    const parts = line.split("|").map(s => s.trim());
    if (parts.length >= 2) { const [sku, price, url, image] = parts; put(sku, {sku, price, url, image}); }
  }
  return out;
}