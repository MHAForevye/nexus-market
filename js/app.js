(function () {
  const $ = (s) => document.querySelector(s), C = window.NEXUS_CONFIG, A = window.API, app = $("#app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { permanent: "Kalıcı", consumable: "Tüketilebilir", bundle: "Paket" }, SRC = { Purchase: "Satın alma", Reward: "Ödül", Event: "Etkinlik" };
  const fmtDate = (t) => new Date(t).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  let CAT = [], ME = { balance: 0, entitlements: {}, wishlist: [] }, PRODUCTS = [], EVENTS = [], state = { q: "", cat: "all", collection: "", sort: "new" };
  const ORIGINAL_COLLECTION_NAMES = {
    "cars-piston-cup":"Apex Velocity", "adventure-time":"Mythic Frontier", "the-amazing-world-of-gumball":"Chroma Playground",
    "gaming-legends":"Pixel Realms", "executive-materials":"Material Atelier", "luxury-craft":"Atelier Noir",
    "precision-engineering":"Mechanical Poetry", "finance-heritage":"The Ledger Society", "modern-surface-lab":"Surface Futures",
    "football-supporters-turkiye":"Stadium Nights · TR", "football-supporters-international":"World Terraces",
    "basketball-supporters-turkiye":"Courtside · TR", "basketball-supporters-international":"Global Courts",
    "anatolian-turkish-rug-motifs":"Anatolian Geometries"
  };
  const is280 = (p) => /^nx(?:250|280)_\d{3}$/.test(String(p?.id || ""));
  const productTitle = (p) => is280(p) ? `Nexus Collectible ${p.id.slice(-3)}` : p.name;
  const productDescription = (p) => is280(p) ? "FOREVYE NEXUS için hazırlanmış özgün geometrik sanat, katmanlı materyal dokusu ve sınırlı seri kart yüzeyi." : p.desc;
  const RARITY_LABEL = { common: "Standart", rare: "Nadir", epic: "Destansı", legendary: "Efsanevi", mythic: "Mitik" };
  const rarityClass = (p) => RARITY_LABEL[p.rarity] ? p.rarity : "common";
  const rarityLabel = (p) => RARITY_LABEL[p.rarity] || "Özel";
  const collectionTitle = (p) => ORIGINAL_COLLECTION_NAMES[p.cat] || p.collection || "NEXUS Originals";
  const COLLECTION_ART = [
    ["cars-piston-cup", "Apex Velocity"], ["adventure-time", "Mythic Frontier"],
    ["the-amazing-world-of-gumball", "Chroma Playground"], ["gaming-legends", "Pixel Realms"],
    ["executive-materials", "Material Atelier"], ["luxury-craft", "Atelier Noir"],
    ["precision-engineering", "Mechanical Poetry"], ["finance-heritage", "The Ledger Society"],
    ["modern-surface-lab", "Surface Futures"], ["football-supporters-turkiye", "Stadium Nights · TR"],
    ["football-supporters-international", "World Terraces"], ["basketball-supporters-turkiye", "Courtside · TR"],
    ["basketball-supporters-international", "Global Courts"], ["anatolian-turkish-rug-motifs", "Anatolian Geometries"]
  ];

  const fmtFN = (minor) => (Number(minor || 0) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function communityArt(card, suffix) {
    try {
      const svg = window.FNXRender.cardSvg(card.design, { last4: '0000', cardToken: 'NXC-DEMO-0000' }, { prefix: 'cm' + String(suffix).replace(/[^a-z0-9]/gi, '').slice(0, 16) });
      return svg.replace('class="card-svg"', 'class="art community-art"');
    } catch (_) { return '<div class="art community-art-fallback" aria-label="Kart önizlemesi"></div>'; }
  }
  function skinArt(p) { const d = { orientation: p.orientation === "portrait" ? "portrait" : "landscape", layers: [{ id: "bg", type: "background", visible: true, locked: true, properties: { mode: "solid", colors: ["#000000"], angle: 0, finish: "matte", texture: "none" } }], userDisplayName: "PLAYER NAME", chipStyle: "gold" };
    return window.FNXRender.cardSvg(d, { last4: "0000", cardToken: "NXC-DEMO-0000", skin: p.skin, skinSerial: "" }, { prefix: "m" + p.skin + Math.random().toString(36).slice(2, 5) }).replace('class="card-svg"', 'class="art skin ' + rarityClass(p) + '-art" data-card-id="' + esc(p.id) + '" data-orientation="' + (p.orientation === "portrait" ? "portrait" : "landscape") + '"'); }
  function cardReverse(p) {
    const rarity = ({common:"STANDARD",rare:"RARE",epic:"EPIC",legendary:"LEGENDARY",mythic:"MYTHIC"})[p.rarity] || "NEXUS EDITION";
    let h = 0; for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const emblem = ["✧","◇","✦","⬡","✺"][h % 5];
    return `<div class="nx-card-reverse" data-orientation="${p.orientation === "portrait" ? "portrait" : "landscape"}" role="img" aria-label="${esc(productTitle(p))} kartının arka yüzü"><div class="nx-reverse-frame"><span>FOREVYE NEXUS</span><i>${emblem}</i><b>${esc(rarity)}</b><strong>${String(h).padStart(8,"0").slice(0,8)}</strong><small>ORIGINAL DIGITAL COLLECTIBLE · ${p.orientation === "portrait" ? "PORTRAIT" : "LANDSCAPE"}</small></div></div>`;
  }
  function art(p) { if (is280(p) && p.skin) return `<img class="art skin ${rarityClass(p)}-art" data-card-id="${esc(p.id)}" data-orientation="${p.orientation === "portrait" ? "portrait" : "landscape"}" src="assets/cards/${esc(p.id)}.svg" alt="${esc(productTitle(p))} özgün kart sanat eseri" loading="lazy">`; if (p.skin) return skinArt(p); // ürün görseli yoksa kimliğe dayalı geometrik yer tutucu
    let h = 0; for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const n = 4 + (h % 4), shapes = [];
    for (let i = 0; i < n; i++) { const r = 18 + i * 14 + (h >> i) % 6, o = (0.9 - i * 0.14).toFixed(2);
      shapes.push(p.cat === "badges" || p.cat === "avatars" ? `<circle cx="100" cy="75" r="${r}" fill="none" stroke="#c4c8ce" stroke-opacity="${o}"/>`
        : `<rect x="${100 - r * 1.3}" y="${75 - r}" width="${r * 2.6}" height="${r * 2}" fill="none" stroke="#c4c8ce" stroke-opacity="${o}" transform="rotate(${(h % 25) - 12 + i * 4} 100 75)"/>`); }
    return `<svg class="art" viewBox="0 0 200 150" role="img" aria-label="${esc(productTitle(p))} görseli">${shapes.join("")}<path d="M0 0h200v150H0z" fill="none"/></svg>`;
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
  const skeleton = () => `<section class="market-loading" role="status"><span class="loader" aria-hidden="true"></span><b>Koleksiyon hazırlanıyor</b><small>Market sunucusundan tasarımlar ve hesap bilgileri alınıyor…</small></section>`;
  const owned = (p) => p.type === "permanent" && ME.entitlements[p.id];
  const bankAppUrl = () => String(C.NEXUS_APP_URL || "https://forevye-nexus.forevyenexus.workers.dev").replace(/\/+$/, "");
  const bankCardsUrl = (id) => bankAppUrl() + "/#/cards" + (id ? "/" + encodeURIComponent(id) : "");
  const deliveredCardFor = (p) => (ME.cards || []).find((c) => c.skin && c.skin.product_id === p.id);
  const bankLinkFor = (p, label) => `<a class="btn" href="${esc(bankCardsUrl(deliveredCardFor(p)?.id))}">${label}</a>`;

  function action(p) {
    if (owned(p)) return p.skin ? `<span class="tag">Zaten sende</span> ${bankLinkFor(p, "Bankadaki kartı aç")}` : `<span class="tag">Zaten sende</span>`;
    if (p.stock_left === 0) return `<span class="tag">Stok tükendi</span>`;
    if (p.acq.includes("Purchase")) return `<button class="btn" data-buy="${p.id}">Satın al</button>`;
    return `<a class="btn ghost" href="#/rewards">${p.acq.includes("Event") ? "Etkinliğe git" : "Ödülü al"}</a>`;
  }
  function assetNote(p) {
    if (p.collection_type === 'character') return 'Özgün tema yorumu · Resmî karakter görseli kullanılmaz';
    if (p.collection_type === 'club_crest') return 'Taraftar kültüründen esinlenen özgün tasarım · Resmî arma içermez';
    if (p.collection_type === 'turkish_rug_motif') return 'Çağdaş geometrik yorum · Doğrulanmamış tarihsel anlam iddiası içermez';
    return '';
  }
  function collectionShowcase() {
    return `<section class="collection-showcase"><div class="catalog-intro"><div><span class="eyebrow">14 ORIGINAL WORLDS</span><h2>Koleksiyon evrenleri.</h2><p class="lead">Her seri kendi renk, geometri ve materyal diline sahip. Tüm görseller özgün tasarım yorumlarıdır.</p></div><a class="text-link" href="#/browse">280 ürünü keşfet ↗</a></div><div class="collection-tiles">${COLLECTION_ART.map(([id, title]) => {
      const count = PRODUCTS.filter(p => p.cat === id).length;
      return `<a class="collection-tile" href="#/browse?collection=${encodeURIComponent(id)}"><img src="assets/collections/${id}.svg" alt="${esc(title)} koleksiyon görseli" loading="lazy"><span><b>${esc(title)}</b><small>${count} tasarım · Koleksiyonu keşfet ↗</small></span></a>`;
    }).join("")}</div></section>`;
  }
  function priceTag(p) { return p.acq.includes("Purchase") ? `<span class="price">${p.price} ${C.CURRENCY}</span>` : `<span class="price free">${p.acq.includes("Event") ? "Etkinlik" : "Ödül"}</span>`; }
  function card(p) {
    const wl = ME.wishlist.includes(p.id), n = ME.entitlements[p.id]?.qty || 0;
    return `<article class="card ${is280(p) ? 'rarity-' + rarityClass(p) : ''}" data-rarity="${esc(rarityClass(p))}"><a href="#/p/${p.id}" aria-label="${esc(productTitle(p))} detayı">${art(p)}</a>
      <button class="heart" data-wish="${p.id}" aria-pressed="${wl}" aria-label="İstek listesi: ${esc(productTitle(p))}">${wl ? "♥" : "♡"}</button>
      <div class="body"><div class="row"><h3>${esc(productTitle(p))}</h3>${p.isNew ? '<span class="tag hl">Yeni</span>' : ""}</div>
      <p>${esc(productDescription(p))}</p>${assetNote(p) ? `<small class="asset-note">${esc(assetNote(p))}</small>` : ""}<div class="row"><span class="tag">${esc(is280(p) ? collectionTitle(p) : (p.collection || (p.cat === "functions" ? "Fonksiyonel" : "Premium kart yüzeyi")))}${p.orientation ? " · " + (p.orientation === "portrait" ? "Dikey" : "Yatay") : ""}</span>${priceTag(p)}</div>
      ${p.stock_left != null ? `<div class="stockline"><span>Sınırlı seri</span><b>${p.stock_left} / ${p.stock_total} kaldı</b></div>` : ""}
      <div class="card-actions"><a class="btn ghost" href="#/p/${p.id}">Detayları gör</a>${owned(p) ? (p.skin ? bankLinkFor(p, "Bankadaki kartı aç") : '<span class="tag">Koleksiyonunda</span>') : (p.stock_left === 0 ? '<span class="tag">Tükendi</span>' : (p.acq.includes("Purchase") ? `<button class="btn" data-buy="${p.id}">Satın al</button>` : ''))}</div></div></article>`;
  }
  const catName = (id) => ORIGINAL_COLLECTION_NAMES[id] || (CAT.find((c) => c.id === id) || {}).name || id;

  const pages = {
    async home() {
      const designs = PRODUCTS.filter((p) => p.skin && p.cat !== "functions");
      const functions = PRODUCTS.filter((p) => p.cat === "functions");
      const feat = designs.find((p) => p.isNew) || designs[0] || PRODUCTS[0];
      const act = EVENTS.filter((e) => e.status === "active");
      const featured = designs.filter((p) => p.isNew).slice(0, 4);
      const limited = designs.filter((p) => p.stock_left != null).slice(0, 6);
      return `<section class="hero"><div class="hero-copy"><span class="eyebrow">FOREVYE NEXUS · DIGITAL ATELIER</span><h1>Kartın, koleksiyonun, imzan.</h1>
        <p class="lead">Sıradan kart yüzeylerinden fazlası. Mücevher işçiliğinde SVG tasarımlar, numaralı özel edisyonlar ve gerçek hesap avantajları tek vitrinde.</p>
        <div class="hero-stats"><span><b>${designs.length}</b><small>özel tasarım</small></span><span><b>${designs.filter(p => p.stock_left != null).length}</b><small>sınırlı seri</small></span><span><b>01</b><small>ortak koleksiyon</small></span></div>
        <div class="hero-actions"><a class="btn" href="#/browse">Koleksiyonu keşfet</a><a class="btn ghost" href="#/collection">Koleksiyonum</a></div></div>
        ${feat ? `<a class="hero-art" href="#/p/${feat.id}" aria-label="${esc(productTitle(feat))} koleksiyonunu keşfet"><span class="hero-art-label">ÖNE ÇIKAN TASARIM</span>${art(feat)}<strong>${esc(productTitle(feat))}</strong><small>${esc(productDescription(feat))}</small></a>` : ""}</section>
        <section class="catalog-intro"><div><span class="eyebrow">THE COLLECTION</span><h2>Bir tasarımdan fazlası.</h2><p class="lead">Her yüzeyin kendi karakteri, üretim adedi ve koleksiyon değeri var. Fonksiyonel kart satın alımları doğrudan banka kartlarına eklenir; kart tasarlama ekranına girip çıkman gerekmez.</p></div><a class="text-link" href="#/browse">Tüm tasarımları gör ↗</a></section>
        <div class="grid featured-grid">${(featured.length ? featured : designs.slice(0,4)).map(card).join("")}</div>
        ${collectionShowcase()}
        ${act.length ? `<h2>Etkinlik vitrini</h2><div class="list">${act.map(evItem).join("")}</div>` : ""}
        <section class="collection-banner"><div><span class="eyebrow">LIMITED OBJECTS</span><h2>Az üretildi. Sana özel.</h2><p>Numaralı seriler stok bitince yeniden üretilmez. Kalan adetleri ürün kartlarından takip et.</p></div><a class="btn" href="#/browse">Sınırlı serileri incele</a></section>
        <h2>Son koleksiyonlar</h2><div class="grid">${limited.map(card).join("")}</div>
        <h2>Fonksiyonel kartlar</h2><p class="lead">Sadece görünüş değil: transfer limitleri, borsa avantajları ve ek kart hakları sunan ürünler.</p><div class="grid">${functions.map(card).join("")}</div>`;
    },
    async browse() {
      let l = PRODUCTS.filter((p) => (state.cat === "all" || p.cat === state.cat) && (!state.collection || p.cat === state.collection) && (productTitle(p) + productDescription(p)).toLowerCase().includes(state.q.toLowerCase()));
      const s = { new: (a, b) => (b.isNew || 0) - (a.isNew || 0), asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name, "tr") }[state.sort]; l = l.slice().sort(s);
      const selectedCollection = COLLECTION_ART.find(([id]) => id === state.collection);
      return `<h1>Keşfet</h1>${selectedCollection ? `<div class="active-collection"><span>${esc(selectedCollection[1])} koleksiyonu</span><button class="btn ghost" data-clear-collection>Filtreyi kaldır</button></div>` : ""}<div class="bar"><input id="q" type="search" placeholder="Ürün ara" value="${esc(state.q)}" aria-label="Ürün ara">
        <select id="sort" aria-label="Sırala"><option value="new">Yeniler önce</option><option value="asc">Fiyat: düşükten yükseğe</option><option value="desc">Fiyat: yüksekten düşüğe</option><option value="name">Ada göre</option></select></div>
        <div class="chips">${[{ id: "all", name: "Tümü" }, ...CAT].map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${ORIGINAL_COLLECTION_NAMES[c.id] || c.name}</button>`).join("")}</div>
        ${l.length ? `<div class="grid">${l.map(card).join("")}</div>` : `<div class="empty">Sonuç yok. Aramayı veya filtreyi değiştir.</div>`}`;
    },
    async product(id) {
      const p = PRODUCTS.find((x) => x.id === id); if (!p) return `<div class="empty">Ürün bulunamadı. <a href="#/browse">Ürünlere dön</a></div>`;
      const n = ME.entitlements[p.id]?.qty || 0, wl = ME.wishlist.includes(p.id);
      return `<p><a href="#/browse">‹ Ürünlere dön</a></p><div class="detail"><div class="detail-visual rarity-${rarityClass(p)}"><div class="nx-flip-stage rarity-${rarityClass(p)}" data-flipped="false"><div class="nx-flip-inner"><div class="nx-flip-front">${art(p)}</div><div class="nx-flip-back">${cardReverse(p)}</div></div></div><button class="btn ghost nx-flip-toggle" type="button" data-flip aria-pressed="false">Kartı çevir ↻</button>${p.rarity === "legendary" ? '<button class="btn nx-reveal-trigger" type="button" data-reveal="legendary">Efsanevi açılışı başlat ✦</button>' : ''}<small class="nx-visual-hint">Ön / arka yüz · Dokunarak çevir${p.rarity === "mythic" ? ' · Mitik holografik yüzey' : ''}</small></div><div>
        <div class="row" style="justify-content:flex-start"><span class="tag">${catName(p.cat)}</span><span class="tag">${TYPE[p.type]}</span></div>
        <h1>${esc(productTitle(p))}</h1><p class="lead">${esc(productDescription(p))}</p>
        <dl><dt>Edinme</dt><dd>Satın alma</dd><dt>Fiyat</dt><dd>${p.price.toLocaleString("tr-TR")} ${C.CURRENCY}</dd>
        <dt>Durum</dt><dd>${owned(p) ? "Zaten sende" : "Sahip değilsin"}</dd>${p.collection ? `<dt>Koleksiyon</dt><dd>${esc(collectionTitle(p))}</dd><dt>Yön</dt><dd>${p.orientation === "portrait" ? "Dikey" : "Yatay"}</dd>` : ""}
        ${p.stock_left != null ? `<dt>Sınırlı stok</dt><dd>${p.stock_left} / ${p.stock_total} adet kaldı</dd>` : ""}
        ${ME.entitlements[p.id]?.serial ? `<dt>Satın alma numarası</dt><dd>${esc(ME.entitlements[p.id].serial)}</dd>` : ""}
        <dt>Seviye</dt><dd>${rarityLabel(p)}</dd><dt>Kullanım</dt><dd>${esc(p.usage)}</dd>${assetNote(p) ? `<dt>Görsel durumu</dt><dd>${esc(assetNote(p))}</dd>` : ""}</dl>
        <div class="row" style="justify-content:flex-start">${action(p)}<button class="btn ghost" data-wish="${p.id}" aria-pressed="${wl}">${wl ? "Listeden çıkar" : "İstek listesine ekle"}</button></div></div></div>`;
    },
    async events() { const g = (s) => EVENTS.filter((e) => e.status === s);
      return `<h1>Etkinlikler</h1>${[["active", "Aktif"], ["upcoming", "Yaklaşan"], ["ended", "Tamamlanan"]].map(([s, t]) => `<h2>${t}</h2><div class="list">${g(s).map(evItem).join("") || '<div class="empty">Etkinlik yok.</div>'}</div>`).join("")}`; },
    async rewards() { const R = await A.rewards();
      return `<h1>Ödüller</h1><p class="lead">Görevleri tamamla, ürünleri ücretsiz kazan. Koşullar sunucuda doğrulanır.</p><div class="list">${R.map((r) => {
        const ready = r.progress >= r.goal && !r.claimed && r.window === "active", pct = Math.min(100, (r.progress / r.goal) * 100);
        return `<div class="item"><div><h3>${esc(r.title)}</h3><span class="tag">${esc(productTitle(r.product))}${r.qty > 1 ? " ×" + r.qty : ""}</span> ${r.eventId ? '<span class="tag">Etkinlik</span>' : ""}
        <div class="meter"><i style="width:${pct}%"></i></div><small>${Math.min(r.progress, r.goal)} / ${r.goal}${r.window === "upcoming" ? " · Etkinlik henüz başlamadı" : r.window === "ended" ? " · Etkinlik bitti" : ""}</small></div>
        <div class="row">${A.mode === "mock" && !r.claimed && r.progress < r.goal ? `<button class="btn ghost" data-adv="${r.id}">Görev ilerlet (demo)</button>` : ""}
        ${r.claimed ? '<span class="tag">Alındı</span>' : `<button class="btn" data-claim="${r.id}" ${ready ? "" : "disabled"}>Ödülü al</button>`}</div></div>`; }).join("")}</div>`; },
    async collection() {
      const all = PRODUCTS.filter(is280), owned280 = all.filter((p) => ME.entitlements[p.id]);
      const pct = all.length ? Math.round(owned280.length / all.length * 100) : 0;
      const groups = [...new Set(all.map((p) => p.cat))].map((id) => {
        const items = all.filter((p) => p.cat === id), have = items.filter((p) => ME.entitlements[p.id]).length;
        return `<div class="nx-progress-row"><div><b>${esc(collectionTitle(items[0]))}</b><small>${have} / ${items.length}</small></div><div class="nx-progress-track"><i style="width:${items.length ? have / items.length * 100 : 0}%"></i></div></div>`;
      }).join("");
      const gallery = all.map((p) => {
        const have = !!ME.entitlements[p.id];
        return `<article class="nx-gallery-card ${have ? 'is-owned' : 'is-locked'} rarity-${rarityClass(p)}"><a href="#/p/${p.id}" aria-label="${esc(productTitle(p))} kart detayları">${art(p)}<span class="nx-gallery-state">${have ? '✓ Koleksiyonunda' : 'Kilitli'}</span></a><div><b>${esc(productTitle(p))}</b><small>${esc(collectionTitle(p))} · ${rarityLabel(p)}</small></div></article>`;
      }).join("");
      return `<section class="nx-collection-head"><span class="eyebrow">THE 280 MASTER GALLERY</span><h1>Koleksiyon arşivin.</h1><p class="lead">280 özgün kartı keşfet, sahip olduklarını sergile ve her serideki ilerlemeni takip et.</p><div class="nx-completion"><div class="nx-completion-number"><strong>${owned280.length}</strong><span>/ ${all.length} kart</span></div><div class="nx-completion-copy"><b>%${pct} tamamlandı</b><small>${all.length - owned280.length} kart keşfedilmeyi bekliyor</small><div class="nx-progress-track"><i style="width:${pct}%"></i></div></div></div></section><section class="nx-collection-progress"><h2>Seri ilerlemesi</h2><div class="nx-progress-list">${groups}</div></section><section class="nx-gallery"><div class="catalog-intro"><div><span class="eyebrow">CURATED ARCHIVE</span><h2>280 kartlık galeri</h2><p class="lead">Kilitli kartlar önizlenebilir; sahip olduğun kartlar galeri üzerinde işaretlenir.</p></div><a class="text-link" href="#/browse">Market'e dön ↗</a></div><div class="nx-gallery-grid">${gallery}</div></section><section class="nx-owned-extra"><h2>Diğer sahip oldukların</h2>${PRODUCTS.filter((p) => ME.entitlements[p.id] && !is280(p)).length ? `<div class="grid">${PRODUCTS.filter((p) => ME.entitlements[p.id] && !is280(p)).map(colCard).join("")}</div>` : '<p class="empty">280 kart dışındaki ürünlerin burada görünecek.</p>'}</section>`;
    },
    async community() {
      const r = await A.communityListings();
      const listings = r.items || [];
      return `<section class="community-head"><span class="eyebrow">NEXUS COMMUNITY EXCHANGE</span><h1>Topluluk pazarı.</h1><p class="lead">Kullanıcıların kendi kart editörlerinde ücretsiz araçlarla oluşturduğu özgün tasarımları keşfet ve satın al. Kart, satın alımda doğrudan senin hesabına aktarılır.</p><div class="community-fee"><b>%30 platform komisyonu</b><span>Satışta fiyatın %30’u platform payı, %70’i satıcının FN bakiyesine aktarılır. Alıcı ilan fiyatını öder.</span></div></section>
      ${listings.length ? `<div class="community-grid">${listings.map((x) => `<article class="community-card"><div class="community-card-art">${communityArt(x.card, x.id)}</div><div class="community-card-body"><span class="tag">Kullanıcı tasarımı</span><h3>${esc(x.title)}</h3><p>${esc(x.description || 'Özgün topluluk kart tasarımı.')}</p><div class="community-seller">@${esc(x.seller.username)} · ${fmtDate(x.created_at)}</div><div class="community-buy-row"><b>${fmtFN(x.price_minor)} FN</b><button class="btn" data-community-buy="${esc(x.id)}">Satın al</button></div></div></article>`).join('')}</div>` : '<div class="empty">Henüz topluluk ilanı yok. Kendi kartını satışa çıkararak ilk ilanı sen oluşturabilirsin.</div>'}
      <p class="note">Topluluk satışları oyun içi FN ile gerçekleşir; gerçek para ödemesi veya banka işlemi değildir.</p>`;
    },
    async sell() {
      const r = await A.communityMine(), cards = r.cards || [], listings = r.listings || [];
      const eligible = cards.filter((c) => c.can_sell);
      return `<section class="community-head"><span class="eyebrow">YOUR CREATOR DESK</span><h1>Kartını satışa çıkar.</h1><p class="lead">Kendi oluşturduğun ve ücretli Market yüzeyi takılı olmayan kartları listeleyebilirsin. Satışta %30 komisyon kesilir; kalan %70 FN anında hesabına geçer.</p></section>
      ${listings.length ? `<section class="community-owned-listings"><h2>İlanların</h2>${listings.map((x) => `<div class="item"><div><b>${esc(x.title)}</b><small>${fmtFN(x.price_minor)} FN · Tahmini net: ${fmtFN(x.seller_proceeds_minor)} FN · ${x.status === 'active' ? 'Satışta' : x.status}</small></div>${x.status === 'active' ? `<button class="btn ghost" data-community-cancel="${esc(x.id)}">İlanı geri çek</button>` : ''}</div>`).join('')}</section>` : ''}
      <h2>Satışa uygun kartların</h2><p class="note">Kartın varsayılan olmamalı ve bakiyesi 0 FN olmalı. Satışa çıkarmadan önce başka kartı varsayılan seç.</p>
      ${eligible.length ? `<div class="community-sell-grid">${eligible.map((c) => `<article class="community-sell-card" data-market-sell-card="${esc(c.id)}"><div class="community-card-art">${communityArt(c, c.id)}</div><div class="community-card-body"><h3>${esc(c.display_name || c.label || 'Adsız kart')}</h3><small>Özgün kart · ${c.status === 'active' ? 'Aktif' : 'Devre dışı'}</small><label class="field"><span>İlan başlığı</span><input data-title maxlength="60" value="${esc(c.display_name || c.label || 'Özgün kart')}"></label><label class="field"><span>Kısa açıklama</span><textarea data-description maxlength="260" rows="2" placeholder="Tasarımın hakkında kısa bilgi"></textarea></label><label class="field"><span>Satış fiyatı (FN)</span><input data-price type="number" min="0.01" step="0.01" placeholder="Örn. 250"></label><p class="community-net" data-net-preview>Komisyon ve net tutar fiyat girince hesaplanır.</p><button class="btn" data-community-list="${esc(c.id)}">Topluluk pazarında yayınla</button></div></article>`).join('')}</div>` : '<div class="empty">Şu anda satışa uygun kartın yok. Kart oluştur, ücretli yüzey takma, bakiyesini sıfırla ve varsayılan kart olmaktan çıkar.</div>'}
      ${cards.some((c) => c.market_listing) ? `<h2>Satışta olan kartların</h2><div class="list">${cards.filter(c => c.market_listing).map(c => `<div class="item"><div><b>${esc(c.market_listing.title)}</b><small>${fmtFN(c.market_listing.price_minor)} FN · İlan yayında</small></div><span class="tag">Satışta</span></div>`).join('')}</div>` : ''}`;
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
    return `<article class="card"><a href="#/p/${p.id}">${art(p)}</a><div class="body"><h3>${esc(productTitle(p))}</h3><span class="tag">${catName(p.cat)}</span>
      <small>${SRC[e.source]} · ${fmtDate(e.acquired_at)}${e.serial ? " · Seri " + esc(e.serial) : ""}</small><div class="row"><b>Sahipsin</b>${p.skin ? bankLinkFor(p, "Bankadaki kartı aç") : ""}</div></div></article>`; }

  function purchaseDialog(p) {
    return new Promise((resolve) => {
      const m = $("#modal"), cards = (ME.cards || []).filter((c) => c.status === "active");
      const fmt = (v) => Number(v || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const opts = [`<option value="">Ana cüzdan · ${fmt(ME.balance)} ${C.CURRENCY}</option>`, ...cards.map((c) => `<option value="${esc(c.id)}">${esc(c.label || c.display_name || "Sanal kart")} · ${fmt(Number(c.balance || 0) / 100)} ${C.CURRENCY}${c.is_default ? " · Varsayılan" : ""}</option>`)].join("");
      m.hidden = false;
      m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><h3>Satın alma onayı</h3>
        <div class="row"><span>${esc(productTitle(p))}</span><b>${fmt(p.price)} ${C.CURRENCY}</b></div>
        <label class="field"><span>Ödeme kaynağı</span><select id="purchase-source">${opts}</select></label>
        <p id="purchase-source-info" class="note"></p>
        <div class="acts"><button class="btn ghost" data-x="0">Vazgeç</button><button class="btn" data-x="1">Satın al</button></div></div>`;
      const select = m.querySelector("#purchase-source"), info = m.querySelector("#purchase-source-info"), submit = m.querySelector("[data-x='1']");
      const chosenBalance = () => select.value ? Number(cards.find((c) => c.id === select.value)?.balance || 0) / 100 : Number(ME.balance || 0);
      const update = () => {
        const available = chosenBalance(), missing = Math.max(0, p.price - available);
        info.textContent = missing ? `Yetersiz bakiye · ${fmt(missing)} ${C.CURRENCY} daha gerekli.` : `Ödeme sonrası kalan: ${fmt(available - p.price)} ${C.CURRENCY}`;
        info.className = missing ? "note err" : "note";
        submit.disabled = missing > 0;
      };
      const done = (value) => { m.hidden = true; m.innerHTML = ""; resolve(value); };
      select.addEventListener("change", update);
      m.onclick = (e) => {
        const x = e.target.dataset.x;
        if (x === "0") done(false);
        else if (x === "1" && !submit.disabled) done({ cardId: select.value || null });
        else if (e.target === m) done(false);
      };
      update(); submit.focus();
    });
  }
  async function buy(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const choice = await purchaseDialog(p);
    if (!choice) return;
    try {
      const result = await A.purchase(id, A.uid("idem"), choice.cardId);
      if (p.skin) {
        const deliveredId = result.delivery?.card?.id || deliveredCardFor(p)?.id || "";
        toast("Kartın bankaya eklendi. Banka kartın açılıyor…");
        location.assign(bankCardsUrl(deliveredId));
        return;
      }
      toast(result.payment?.method === "card" ? `Satın alındı · ${result.payment.card_label || "Seçilen kart"} kartından ödendi` : "Satın alındı");
      await reload();
    } catch (e) { toast(e.message, true); await verify(); }
  }
  async function verify() { await refreshMe(); } // belirsiz ağ hatasında bakiye/sahiplik sunucudan yeniden okunur
  async function reload() { await refreshMe(); PRODUCTS = await A.products(); await render(); }
  async function render() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [path, query = ""] = hash.split("?");
    const [r, a] = path.split("/");
    const params = new URLSearchParams(query);
    state.collection = r === "browse" ? (params.get("collection") || "") : "";
    document.querySelectorAll("nav a").forEach((n) => n.classList.toggle("on", n.getAttribute("href") === "#/" + (r || "")));
    const key = r === "p" ? "product" : r || "home"; if (!pages[key]) return (app.innerHTML = '<div class="empty">Sayfa bulunamadı.</div>');
    try { app.innerHTML = await pages[key](a); const so = $("#sort"); if (so) so.value = state.sort; } catch (e) { app.innerHTML = `<div class="empty">Yüklenemedi: ${esc(e.message)} <button class="btn ghost" onclick="location.reload()">Yeniden dene</button></div>`; }
  }
  document.addEventListener("click", async (e) => { const t = e.target.closest("button,[data-cat]"); if (!t) return; const d = t.dataset;
    try {
      if (d.flip !== undefined) {
        const stage = t.closest(".detail-visual")?.querySelector(".nx-flip-stage");
        if (stage) { const flipped = stage.dataset.flipped !== "true"; stage.dataset.flipped = String(flipped); t.setAttribute("aria-pressed", String(flipped)); t.textContent = flipped ? "Ön yüze dön ↻" : "Kartı çevir ↻"; }
      }
      else if (d.reveal === "legendary") {
        const p = PRODUCTS.find((x) => x.id === location.hash.split("/").pop());
        if (p && p.rarity === "legendary") {
          const m = $("#modal"); m.hidden = false;
          m.innerHTML = `<div class="nx-reveal-scene" role="dialog" aria-modal="true" aria-label="Efsanevi kart açılışı"><div class="nx-reveal-orbit"></div><span class="eyebrow">FOREVYE NEXUS · LEGENDARY</span><div class="nx-reveal-card">${art(p)}</div><h2>${esc(productTitle(p))}</h2><p>Efsanevi koleksiyonun bir parçası.</p><button class="btn" data-close-reveal>Galeriye dön</button></div>`;
        }
      }
      else if (t.hasAttribute("data-close-reveal")) { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }
      else if (d.communityBuy) {
        if (await confirmBox('<h3>Topluluk kartını satın al</h3><p>Kart doğrudan hesabına aktarılır. Ödeme ana FN cüzdanından yapılır. Satıcıya fiyatın %70’i aktarılır.</p>', 'Satın al')) {
          const result = await A.communityBuy(d.communityBuy, A.uid('cm-buy'));
          toast(result.replayed ? 'Satın alma zaten tamamlanmış.' : 'Kart satın alındı ve hesabına aktarıldı.');
          await reload();
        }
      }
      else if (d.communityList) {
        const cardBox = t.closest('[data-market-sell-card]');
        const title = cardBox.querySelector('[data-title]').value.trim();
        const description = cardBox.querySelector('[data-description]').value.trim();
        const price = cardBox.querySelector('[data-price]').value;
        if (!title || !price) { toast('İlan başlığını ve FN fiyatını gir.', true); return; }
        const fee = Math.floor(Math.round(Number(price) * 100) * 0.30), net = Math.round(Number(price) * 100) - fee;
        if (!await confirmBox(`<h3>İlanı yayınla</h3><p>İlan fiyatı: <b>${fmtFN(Math.round(Number(price) * 100))} FN</b></p><p>Komisyon (%30): ${fmtFN(fee)} FN</p><p>Satış sonrası sana aktarılacak: <b>${fmtFN(net)} FN</b></p>`, 'Yayınla')) return;
        await A.communityList(d.communityList, title, description, price);
        toast('Kartın topluluk pazarında yayınlandı.'); await reload();
      }
      else if (d.communityCancel) {
        if (await confirmBox('<h3>İlanı geri çek</h3><p>Kartın tekrar yalnızca senin kullanımına açılacak.</p>', 'İlanı geri çek')) {
          await A.communityCancel(d.communityCancel); toast('İlan geri çekildi.'); await reload();
        }
      }
      else if (d.buy) await buy(d.buy);
      else if (d.wish) { await A.wishlistToggle(d.wish); await refreshMe(); await render(); }
      else if (d.cat) { state.cat = d.cat; await render(); }
      else if (t.hasAttribute("data-clear-collection")) { state.collection = ""; location.hash = "#/browse"; await render(); }
      else if (d.claim) { await A.claim(d.claim); toast("Ödül alındı"); await reload(); }
      else if (d.adv) { await A.advance(d.adv); await render(); }
      else if (d.use) { if (await confirmBox("<h3>Ürünü kullan</h3><p>1 adet harcanacak.</p>", "Kullan")) { await A.consume(d.use, A.uid("idem")); toast("Kullanıldı"); await reload(); } }
      else if (t.hasAttribute("data-reset")) { await A.reset(); await reload(); toast("Demo sıfırlandı"); }
    } catch (err) { toast(err.message, true); await refreshMe(); }
  });
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (finePointer && !reduceMotion) {
    app.addEventListener("pointermove", (e) => { const el = e.target.closest(".card"); if (!el) return; const r = el.getBoundingClientRect(), x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height; el.style.setProperty("--nx-ry", `${(x-.5)*7}deg`); el.style.setProperty("--nx-rx", `${(.5-y)*6}deg`); el.style.setProperty("--nx-glare-x", `${x*100}%`); el.style.setProperty("--nx-glare-y", `${y*100}%`); el.classList.add("nx-tilting"); });
    app.addEventListener("pointerout", (e) => { const el=e.target.closest(".card"); if(el && !el.contains(e.relatedTarget)){ el.classList.remove("nx-tilting"); ["--nx-ry","--nx-rx","--nx-glare-x","--nx-glare-y"].forEach(k=>el.style.removeProperty(k)); } });
  }
  document.addEventListener("input", (e) => {
    if (e.target.id === "q") { state.q = e.target.value; render().then(() => { const q = $("#q"); q.focus(); q.setSelectionRange(99, 99); }); }
    const sellCard = e.target.closest('[data-market-sell-card]');
    if (sellCard && e.target.matches('[data-price]')) {
      const value = Math.max(0, Math.round(Number(e.target.value || 0) * 100));
      const fee = Math.floor(value * 0.30), net = value - fee;
      sellCard.querySelector('[data-net-preview]').textContent = value ? `%30 komisyon: ${fmtFN(fee)} FN · Sana kalacak: ${fmtFN(net)} FN` : 'Komisyon ve net tutar fiyat girince hesaplanır.';
    }
  });
  document.addEventListener("change", (e) => { if (e.target.id === "sort") { state.sort = e.target.value; render().then(() => ($("#sort").value = state.sort)); } });
  let authenticated = false;
  const nexusLoginUrl = () => C.NEXUS_LOGIN_URL || ((C.NEXUS_APP_URL || "https://forevye-nexus.forevyenexus.workers.dev").replace(/\/$/, "") + "/#/shop-launch");
  function showLoginGate() {
    authenticated = false;
    $("#nav").hidden = true; $("#bal").hidden = true;
    app.innerHTML = `<section class="market-login">
      <div class="market-login-brand"><span class="mark" aria-hidden="true"></span><b>FOREVYE NEXUS</b><i>Market</i></div>
      <span class="eyebrow">GÜVENLİ HESAP GİRİŞİ</span>
      <h1>Koleksiyonuna giriş yap.</h1>
      <p>Market hesabın FOREVYE NEXUS hesabınla ortaktır. FOREVYE ID veya Nexus e-posta/şifre girişini kullan; oturum açınca otomatik olarak bu mağazaya geri dönersin.</p>
      <a class="btn market-login-button" href="${esc(nexusLoginUrl())}">Giriş yap / Hesap oluştur <span aria-hidden="true">↗</span></a>
      <small>Şifren bu Market sitesinde istenmez. Güvenli giriş Nexus hesabında tamamlanır.</small>
    </section>`;
  }
  function showLoadError(e) {
    const code = e && e.code ? ` <small class="error-code">${esc(e.code)}</small>` : "";
    app.innerHTML = `<section class="market-error"><span class="eyebrow">BAĞLANTI SORUNU</span><h1>Market şu an açılamadı.</h1><p>${esc(e && e.message || "Bilinmeyen bağlantı hatası.")}</p>${code}<div class="market-error-actions"><button class="btn" data-retry-market>Yeniden dene</button><a class="btn ghost" href="${esc(nexusLoginUrl())}">Hesabını yeniden bağla</a></div></section>`;
  }
  async function startMarket() {
    app.innerHTML = skeleton();
    try {
      const session = await A.boot();
      if (!session.authenticated) { showLoginGate(); return; }
      authenticated = true; $("#nav").hidden = false; $("#bal").hidden = false;
      const c = await A.catalog(); CAT = c.categories; EVENTS = c.events; PRODUCTS = await A.products(); await refreshMe();
      if (session.productId) location.hash = "#/p/" + encodeURIComponent(session.productId);
      await render();
    } catch (e) { showLoadError(e); }
  }
  window.addEventListener("hashchange", async () => {
    if (!authenticated) return;
    app.innerHTML = skeleton();
    try { await refreshMe(); await render(); app.focus(); scrollTo(0, 0); }
    catch (e) { showLoadError(e); }
  });
  document.addEventListener("click", async (e) => {
    const backBank = e.target.closest("#bank-return");
    if (backBank) { e.preventDefault(); try { const r = await A.bankReturn(); location.assign(r.url); } catch (err) { toast(err.message, true); } return; }
    const retry = e.target.closest("[data-retry-market]");
    if (retry) startMarket();
  });
  startMarket();
})();
