(function () {
  const $ = (s) => document.querySelector(s), C = window.NEXUS_CONFIG, A = window.API, app = $("#app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { permanent: "Kalıcı", consumable: "Tüketilebilir", bundle: "Paket" }, SRC = { Purchase: "Satın alma", Reward: "Ödül", Event: "Etkinlik" };
  const fmtDate = (t) => new Date(t).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  let CAT = [], ME = { balance: 0, entitlements: {}, wishlist: [] }, PRODUCTS = [], EVENTS = [], state = { q: "", cat: "all", sort: "new" };

  function skinArt(p) { const d = { orientation: "landscape", layers: [{ id: "bg", type: "background", visible: true, locked: true, properties: { mode: "solid", colors: ["#000000"], angle: 0, finish: "matte", texture: "none" } }], userDisplayName: "PLAYER NAME", chipStyle: "gold" };
    return window.FNXRender.cardSvg(d, { last4: "0000", cardToken: "NXC-DEMO-0000", skin: p.skin, skinSerial: "" }, { prefix: "m" + p.skin + Math.random().toString(36).slice(2, 5) }).replace('class="card-svg"', 'class="art skin"'); }
  function art(p) { if (p.skin) return skinArt(p); // ürün görseli yoksa kimliğe dayalı geometrik yer tutucu
    let h = 0; for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const n = 4 + (h % 4), shapes = [];
    for (let i = 0; i < n; i++) { const r = 18 + i * 14 + (h >> i) % 6, o = (0.9 - i * 0.14).toFixed(2);
      shapes.push(p.cat === "badges" || p.cat === "avatars" ? `<circle cx="100" cy="75" r="${r}" fill="none" stroke="#c4c8ce" stroke-opacity="${o}"/>`
        : `<rect x="${100 - r * 1.3}" y="${75 - r}" width="${r * 2.6}" height="${r * 2}" fill="none" stroke="#c4c8ce" stroke-opacity="${o}" transform="rotate(${(h % 25) - 12 + i * 4} 100 75)"/>`); }
    return `<svg class="art" viewBox="0 0 200 150" role="img" aria-label="${esc(p.name)} görseli">${shapes.join("")}<path d="M0 0h200v150H0z" fill="none"/></svg>`;
  }
  function toast(m, err) { const t = $("#toast"); t.textContent = m; t.className = "toast show" + (err ? " err" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = "toast"), 3200); }
  function confirmBox(html, okLabel) {
    return new Promise((res) => { const m = $("#modal"); m.hidden = false;
      m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true">${html}<div class="acts"><button class="btn ghost" data-x="0">Vazgeç</button><button class="btn" data-x="1">${okLabel}</button></div></div>`;
      const done = (v) => { m.hidden = true; m.innerHTML = ""; res(v); };
      m.onclick = (e) => { const x = e.target.dataset.x; if (x) done(x === "1"); else if (e.target === m) done(false); };
      m.querySelector("[data-x='1']").focus(); });
  }
  const refreshMe = async () => { ME = await A.me(); $("#bal").innerHTML = `${ME.balance} ${C.CURRENCY} <small>bakiye</small>`; };
  const skeleton = (n = 6) => `<div class="grid">${'<div class="sk"></div>'.repeat(n)}</div>`;
  const owned = (p) => p.type === "permanent" && ME.entitlements[p.id];

  function action(p) {
    if (owned(p)) return p.skin ? `<span class="tag">Zaten sende</span> <a class="btn" href="${esc(C.BANK_URL)}/">Banka editöründe kullan</a>` : `<span class="tag">Zaten sende</span>`;
    if (p.stock_left === 0) return `<span class="tag">Stok tükendi</span>`;
    if (p.acq.includes("Purchase")) return `<button class="btn" data-buy="${p.id}">Satın al</button>`;
    return `<a class="btn ghost" href="#/rewards">${p.acq.includes("Event") ? "Etkinliğe git" : "Ödülü al"}</a>`;
  }
  function priceTag(p) { return p.acq.includes("Purchase") ? `<span class="price">${p.price} ${C.CURRENCY}</span>` : `<span class="price free">${p.acq.includes("Event") ? "Etkinlik" : "Ödül"}</span>`; }
  function card(p) {
    const wl = ME.wishlist.includes(p.id), n = ME.entitlements[p.id]?.qty || 0;
    return `<article class="card"><a href="#/p/${p.id}" aria-label="${esc(p.name)} detayı">${art(p)}</a>
      <button class="heart" data-wish="${p.id}" aria-pressed="${wl}" aria-label="İstek listesi: ${esc(p.name)}">${wl ? "♥" : "♡"}</button>
      <div class="body"><div class="row"><h3>${esc(p.name)}</h3>${p.isNew ? '<span class="tag hl">Yeni</span>' : ""}</div>
      <p>${esc(p.desc)}</p><div class="row"><span class="tag">${p.cat === "functions" ? "Fonksiyonel" : "Premium kart yüzeyi"}${p.type === "consumable" && n ? " · " + n + " adet" : ""}</span>${priceTag(p)}</div>
      ${p.stock_left != null ? `<div class="stockline"><span>Sınırlı seri</span><b>${p.stock_left} / ${p.stock_total} kaldı</b></div>` : ""}
      <div class="card-actions"><a class="btn ghost" href="#/p/${p.id}">Detayları gör</a>${owned(p) ? (p.skin ? `<a class="btn" href="${esc(C.BANK_URL)}/">Kartına tak</a>` : '<span class="tag">Koleksiyonunda</span>') : (p.stock_left === 0 ? '<span class="tag">Tükendi</span>' : (p.acq.includes("Purchase") ? `<button class="btn" data-buy="${p.id}">Satın al</button>` : ''))}</div></div></article>`;
  }
  const catName = (id) => (CAT.find((c) => c.id === id) || {}).name || id;

  const pages = {
    async home() {
      const designs = PRODUCTS.filter((p) => p.cat === "designs" && p.skin);
      const functions = PRODUCTS.filter((p) => p.cat === "functions");
      const feat = designs.find((p) => p.isNew) || designs[0] || PRODUCTS[0];
      const act = EVENTS.filter((e) => e.status === "active");
      const featured = designs.filter((p) => p.isNew).slice(0, 4);
      const limited = designs.filter((p) => p.stock_left != null).slice(0, 6);
      return `<section class="hero"><div class="hero-copy"><span class="eyebrow">FOREVYE NEXUS · DIGITAL ATELIER</span><h1>Kartın, koleksiyonun, imzan.</h1>
        <p class="lead">Sıradan kart yüzeylerinden fazlası. Mücevher işçiliğinde SVG tasarımlar, numaralı özel edisyonlar ve gerçek hesap avantajları tek vitrinde.</p>
        <div class="hero-stats"><span><b>${designs.length}</b><small>özel tasarım</small></span><span><b>${designs.filter(p => p.stock_left != null).length}</b><small>sınırlı seri</small></span><span><b>01</b><small>ortak koleksiyon</small></span></div>
        <div class="hero-actions"><a class="btn" href="#/browse">Koleksiyonu keşfet</a><a class="btn ghost" href="#/collection">Koleksiyonum</a></div></div>
        ${feat ? `<a class="hero-art" href="#/p/${feat.id}" aria-label="${esc(feat.name)} koleksiyonunu keşfet"><span class="hero-art-label">ÖNE ÇIKAN TASARIM</span>${art(feat)}<strong>${esc(feat.name)}</strong><small>${esc(feat.tagline || feat.desc)}</small></a>` : ""}</section>
        <section class="catalog-intro"><div><span class="eyebrow">THE COLLECTION</span><h2>Bir tasarımdan fazlası.</h2><p class="lead">Her yüzeyin kendi karakteri, üretim adedi ve koleksiyon değeri var. Satın aldığın tasarımlar hesabına kalıcı olarak eklenir; banka kart editöründe kullanırsın.</p></div><a class="text-link" href="#/browse">Tüm tasarımları gör ↗</a></section>
        <div class="grid featured-grid">${(featured.length ? featured : designs.slice(0,4)).map(card).join("")}</div>
        ${act.length ? `<h2>Etkinlik vitrini</h2><div class="list">${act.map(evItem).join("")}</div>` : ""}
        <section class="collection-banner"><div><span class="eyebrow">LIMITED OBJECTS</span><h2>Az üretildi. Sana özel.</h2><p>Numaralı seriler stok bitince yeniden üretilmez. Kalan adetleri ürün kartlarından takip et.</p></div><a class="btn" href="#/browse">Sınırlı serileri incele</a></section>
        <h2>Son koleksiyonlar</h2><div class="grid">${limited.map(card).join("")}</div>
        <h2>Fonksiyonel kartlar</h2><p class="lead">Sadece görünüş değil: transfer limitleri, borsa avantajları ve ek kart hakları sunan ürünler.</p><div class="grid">${functions.map(card).join("")}</div>`;
    },
    async browse() {
      let l = PRODUCTS.filter((p) => (state.cat === "all" || p.cat === state.cat) && (p.name + p.desc).toLowerCase().includes(state.q.toLowerCase()));
      const s = { new: (a, b) => (b.isNew || 0) - (a.isNew || 0), asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name, "tr") }[state.sort]; l = l.slice().sort(s);
      return `<h1>Keşfet</h1><div class="bar"><input id="q" type="search" placeholder="Ürün ara" value="${esc(state.q)}" aria-label="Ürün ara">
        <select id="sort" aria-label="Sırala"><option value="new">Yeniler önce</option><option value="asc">Fiyat: düşükten yükseğe</option><option value="desc">Fiyat: yüksekten düşüğe</option><option value="name">Ada göre</option></select></div>
        <div class="chips">${[{ id: "all", name: "Tümü" }, ...CAT].map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${c.name}</button>`).join("")}</div>
        ${l.length ? `<div class="grid">${l.map(card).join("")}</div>` : `<div class="empty">Sonuç yok. Aramayı veya filtreyi değiştir.</div>`}`;
    },
    async product(id) {
      const p = PRODUCTS.find((x) => x.id === id); if (!p) return `<div class="empty">Ürün bulunamadı. <a href="#/browse">Ürünlere dön</a></div>`;
      const n = ME.entitlements[p.id]?.qty || 0, wl = ME.wishlist.includes(p.id);
      return `<p><a href="#/browse">‹ Ürünlere dön</a></p><div class="detail"><div>${art(p)}</div><div>
        <div class="row" style="justify-content:flex-start"><span class="tag">${catName(p.cat)}</span><span class="tag">${TYPE[p.type]}</span></div>
        <h1>${esc(p.name)}</h1><p class="lead">${esc(p.desc)}</p>
        <dl><dt>Edinme</dt><dd>Satın alma</dd><dt>Fiyat</dt><dd>${p.price.toLocaleString("tr-TR")} ${C.CURRENCY}</dd>
        <dt>Durum</dt><dd>${owned(p) ? "Zaten sende" : "Sahip değilsin"}</dd>
        ${p.stock_left != null ? `<dt>Sınırlı stok</dt><dd>${p.stock_left} / ${p.stock_total} adet kaldı</dd>` : ""}
        ${ME.entitlements[p.id]?.serial ? `<dt>Satın alma numarası</dt><dd>${esc(ME.entitlements[p.id].serial)}</dd>` : ""}
        <dt>Seviye</dt><dd>${({common:"Standart",rare:"Nadir",epic:"Destansı",legendary:"Efsanevi",mythic:"Mitik"})[p.rarity] || p.rarity || "Özel"}</dd><dt>Kullanım</dt><dd>${esc(p.usage)}</dd></dl>
        <div class="row" style="justify-content:flex-start">${action(p)}<button class="btn ghost" data-wish="${p.id}" aria-pressed="${wl}">${wl ? "Listeden çıkar" : "İstek listesine ekle"}</button></div></div></div>`;
    },
    async events() { const g = (s) => EVENTS.filter((e) => e.status === s);
      return `<h1>Etkinlikler</h1>${[["active", "Aktif"], ["upcoming", "Yaklaşan"], ["ended", "Tamamlanan"]].map(([s, t]) => `<h2>${t}</h2><div class="list">${g(s).map(evItem).join("") || '<div class="empty">Etkinlik yok.</div>'}</div>`).join("")}`; },
    async rewards() { const R = await A.rewards();
      return `<h1>Ödüller</h1><p class="lead">Görevleri tamamla, ürünleri ücretsiz kazan. Koşullar sunucuda doğrulanır.</p><div class="list">${R.map((r) => {
        const ready = r.progress >= r.goal && !r.claimed && r.window === "active", pct = Math.min(100, (r.progress / r.goal) * 100);
        return `<div class="item"><div><h3>${esc(r.title)}</h3><span class="tag">${esc(r.product.name)}${r.qty > 1 ? " ×" + r.qty : ""}</span> ${r.eventId ? '<span class="tag">Etkinlik</span>' : ""}
        <div class="meter"><i style="width:${pct}%"></i></div><small>${Math.min(r.progress, r.goal)} / ${r.goal}${r.window === "upcoming" ? " · Etkinlik henüz başlamadı" : r.window === "ended" ? " · Etkinlik bitti" : ""}</small></div>
        <div class="row">${A.mode === "mock" && !r.claimed && r.progress < r.goal ? `<button class="btn ghost" data-adv="${r.id}">Görev ilerlet (demo)</button>` : ""}
        ${r.claimed ? '<span class="tag">Alındı</span>' : `<button class="btn" data-claim="${r.id}" ${ready ? "" : "disabled"}>Ödülü al</button>`}</div></div>`; }).join("")}</div>`; },
    async collection() {
      const list = PRODUCTS.filter((p) => ME.entitlements[p.id]);
      const sec = (t, arr) => `<h2>${t}</h2>${arr.length ? `<div class="grid">${arr.map(colCard).join("")}</div>` : '<div class="empty">Henüz ürün yok. <a href="#/browse">Ürünlere göz at</a></div>'}`;
      return `<h1>Koleksiyonum</h1>${sec("Kalıcı ürünler", list.filter((p) => p.type === "permanent"))}${sec("Tüketilebilir ürünler", list.filter((p) => p.type === "consumable"))}`;
    },
    async wishlist() { const l = PRODUCTS.filter((p) => ME.wishlist.includes(p.id));
      return `<h1>İstek listesi</h1><p class="lead">Kaydettiğin ürünler sahiplik anlamına gelmez.</p>${l.length ? `<div class="grid">${l.map(card).join("")}</div>` : '<div class="empty">Listen boş. Ürün kartındaki kalbe dokunarak ekle.</div>'}`; },
    async history() { const L = await A.ledger();
      return `<h1>Edinim geçmişi</h1>${L.length ? `<div class="list">${L.map((t) => `<div class="item"><div><h3>${esc(t.name)}</h3><small>${SRC[t.type]} · ${fmtDate(t.at)} · ${esc(t.id)}</small></div><div><b>${t.amount ? t.amount + " " + C.CURRENCY : "Ücretsiz"}</b>${t.balance_after != null ? `<br><small>Kalan: ${t.balance_after} ${C.CURRENCY}</small>` : ""}</div></div>`).join("")}</div>` : '<div class="empty">Henüz işlem yok.</div>'}
        ${A.mode === "mock" ? '<p class="note">Demo modu: veriler bu tarayıcıda tutulur. <button class="btn ghost" data-reset>Demoyu sıfırla</button></p>' : ""}`; }
  };
  function evItem(e) {
    const st = { active: "Aktif", upcoming: "Yaklaşan", ended: "Tamamlandı", cancelled: "İptal edildi" }[e.status];
    return `<div class="item"><div><h3>${esc(e.title)} <span class="tag ${e.status === "active" ? "hl" : ""}">${st}</span></h3><small>${esc(e.desc)}</small><br><small>${fmtDate(e.starts_at)} – ${fmtDate(e.ends_at)}${e.status === "active" ? " · Kalan: " + Math.max(0, Math.ceil((e.ends_at - A.serverNow()) / 36e5)) + " saat (sunucu saati)" : ""}</small></div>${e.status === "active" ? '<a class="btn" href="#/rewards">Görevlere git</a>' : ""}</div>`;
  }
  function colCard(p) { const e = ME.entitlements[p.id];
    return `<article class="card"><a href="#/p/${p.id}">${art(p)}</a><div class="body"><h3>${esc(p.name)}</h3><span class="tag">${catName(p.cat)}</span>
      <small>${SRC[e.source]} · ${fmtDate(e.acquired_at)}${e.serial ? " · Seri " + esc(e.serial) : ""}</small><div class="row"><b>Sahipsin</b>${p.skin ? `<a class="btn ghost" href="${esc(C.BANK_URL)}/">Banka editöründe kullan</a>` : ""}</div></div></article>`; }

  async function buy(id) {
    const p = PRODUCTS.find((x) => x.id === id), after = ME.balance - p.price;
    const ok = await confirmBox(`<h3>Satın alma onayı</h3><div class="row"><span>${esc(p.name)}</span><b>${p.price} ${C.CURRENCY}</b></div><div class="row"><span>Kalan bakiye</span><b>${after} ${C.CURRENCY}</b></div>${after < 0 ? '<p class="lead">Bakiyen yetersiz.</p>' : ""}`, "Satın al");
    if (!ok) return;
    try { await A.purchase(id, A.uid("idem")); toast("Satın alındı"); await reload(); } catch (e) { toast(e.message, true); await verify(); }
  }
  async function verify() { await refreshMe(); } // belirsiz ağ hatasında bakiye/sahiplik sunucudan yeniden okunur
  async function reload() { await refreshMe(); PRODUCTS = await A.products(); await render(); }
  async function render() {
    const [r, a] = location.hash.replace(/^#\//, "").split("/");
    document.querySelectorAll("nav a").forEach((n) => n.classList.toggle("on", n.getAttribute("href") === "#/" + (r || "")));
    const key = r === "p" ? "product" : r || "home"; if (!pages[key]) return (app.innerHTML = '<div class="empty">Sayfa bulunamadı.</div>');
    try { app.innerHTML = await pages[key](a); const so = $("#sort"); if (so) so.value = state.sort; } catch (e) { app.innerHTML = `<div class="empty">Yüklenemedi: ${esc(e.message)} <button class="btn ghost" onclick="location.reload()">Yeniden dene</button></div>`; }
  }
  document.addEventListener("click", async (e) => { const t = e.target.closest("button,[data-cat]"); if (!t) return; const d = t.dataset;
    try {
      if (d.buy) await buy(d.buy);
      else if (d.wish) { await A.wishlistToggle(d.wish); await refreshMe(); await render(); }
      else if (d.cat) { state.cat = d.cat; await render(); }
      else if (d.claim) { await A.claim(d.claim); toast("Ödül alındı"); await reload(); }
      else if (d.adv) { await A.advance(d.adv); await render(); }
      else if (d.use) { if (await confirmBox("<h3>Ürünü kullan</h3><p>1 adet harcanacak.</p>", "Kullan")) { await A.consume(d.use, A.uid("idem")); toast("Kullanıldı"); await reload(); } }
      else if (t.hasAttribute("data-reset")) { await A.reset(); await reload(); toast("Demo sıfırlandı"); }
    } catch (err) { toast(err.message, true); await refreshMe(); }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "q") { state.q = e.target.value; render().then(() => { const q = $("#q"); q.focus(); q.setSelectionRange(99, 99); }); } });
  document.addEventListener("change", (e) => { if (e.target.id === "sort") { state.sort = e.target.value; render().then(() => ($("#sort").value = state.sort)); } });
  window.addEventListener("hashchange", async () => { app.innerHTML = skeleton(); await refreshMe(); await render(); app.focus(); scrollTo(0, 0); });
  (async function init() {
    app.innerHTML = skeleton();
    try {
      const session = await A.boot();
      if (!session.authenticated) {
        app.innerHTML = `<section class="empty market-gate"><h1>Nexus hesabınla devam et</h1><p>Market'e yalnızca Nexus üzerinden açılan güvenli, tek kullanımlık biletle erişebilirsin.</p><a class="btn" href="${esc(C.NEXUS_APP_URL || "https://forevye-nexus.forevyenexus.workers.dev")}">Nexus'a dön ve giriş yap</a></section>`;
        return;
      }
      const c = await A.catalog(); CAT = c.categories; EVENTS = c.events; PRODUCTS = await A.products(); await refreshMe();
      if (session.productId) location.hash = "#/p/" + encodeURIComponent(session.productId);
      await render();
    } catch (e) { app.innerHTML = `<div class="empty">Market yüklenemedi: ${esc(e.message)} <p><a href="${esc(C.NEXUS_APP_URL || "https://forevye-nexus.forevyenexus.workers.dev")}">Nexus'a dön</a></p></div>`; }
  })();
})();
