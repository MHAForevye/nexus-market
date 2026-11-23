/* Market kart yüzeyleri (skin). render.js bu sözleşmeyi bekler: FNXSkins.get(id) → { id, brand, chip, build(P, {animate, serial}) → { defs, under, over, edge } }.
   Yüzey takılıysa kullanıcının katmanlarının yerine çizilir; ad/logo rengi `brand` ile kilitlenir. Fiyat/sahiplik asıl olarak market ve sunucudadır;
   buradaki `price` yalnızca etiket içindir. 856×540 yatay kart. */
(function (root) {
  'use strict';
  var W = 856, H = 540;
  function stars(n, seed, col) { var s = '', r = seed; for (var i = 0; i < n; i++) { r = (r * 9301 + 49297) % 233280; var x = r / 233280 * W; r = (r * 9301 + 49297) % 233280; var y = r / 233280 * H; s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (0.6 + (i % 3) * 0.5) + '" fill="' + col + '" opacity="' + (0.35 + (i % 4) * 0.15) + '"/>'; } return s; }
  function lin(id, a, b, stops) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + a + '" y2="' + b + '">' + stops.map(function (c, i) { return '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>'; }).join('') + '</linearGradient>'; }
  function rad(id, c) { return '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".9"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>'; }
  var gloss = function (P) { return '<rect width="' + W + '" height="' + H + '" fill="url(#' + P + 'sg)"/>'; };
  var glossDef = function (P) { return '<linearGradient id="' + P + 'sg" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".16"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/></linearGradient>'; };
  var edge = function (c) { return '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="35" fill="none" stroke="' + c + '" stroke-width="2" pointer-events="none"/>'; };
  var rect = function (fill) { return '<rect width="' + W + '" height="' + H + '" fill="' + fill + '"/>'; };

  var LIST = [
    { id: 'neon', n: 'Neon Izgara', d: 'Parlayan siber ızgara ve nabız çizgisi', price: 1800, brand: '#F2F4F8', chip: 'silver',
      build: function (P, o) { var g = ''; for (var i = 0; i <= 14; i++) g += '<path d="M' + (428 + (i - 7) * 20) + ' 250L' + (428 + (i - 7) * 150) + ' 540" stroke="#2EE6FF" stroke-opacity=".35"/>'; for (var j = 0; j < 8; j++) g += '<path d="M0 ' + (270 + j * j * 5) + 'H856" stroke="#2EE6FF" stroke-opacity=".3"/>';
        return { defs: lin(P + 'a', 1, 1, ['#05060F', '#0B1030', '#1A0A33']) + rad(P + 'p', '#FF2BD6') + rad(P + 'c', '#18C8FF') + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<circle cx="660" cy="150" r="260" fill="url(#' + P + 'p)" opacity=".5"/><circle cx="220" cy="420" r="260" fill="url(#' + P + 'c)" opacity=".35"/><g fill="none" stroke-width="1">' + g + '</g><path d="M0 250H856" stroke="#FF2BD6" stroke-width="2.4">' + (o.animate ? '<animate attributeName="opacity" values=".4;1;.4" dur="3s" repeatCount="indefinite"/>' : '') + '</path>',
          over: gloss(P), edge: edge('rgba(46,230,255,.5)') }; } },
    { id: 'emerald', n: 'Zümrüt Saray', d: 'Yeşil zemin, altın ışınlar ve elmas', price: 2400, brand: '#F6E7B8', chip: 'gold',
      build: function (P) { var r = ''; for (var i = 0; i < 18; i++) { var a = (i / 18) * Math.PI; r += '<path d="M640 -40L' + (640 + Math.cos(a) * 900).toFixed(0) + ' ' + (-40 + Math.sin(a) * 900).toFixed(0) + '" stroke="#E2C275" stroke-opacity=".22" stroke-width=".8"/>'; }
        return { defs: lin(P + 'a', 1, 1, ['#031A14', '#0B5A43', '#052A20']) + rad(P + 'g', '#E2C275') + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<circle cx="640" cy="120" r="300" fill="url(#' + P + 'g)" opacity=".28"/>' + r + '<g fill="none" stroke="#E2C275" stroke-width="1.6"><path d="M730 250l55 70-55 70-55-70z"/><path d="M730 272l36 48-36 48-36-48z" stroke-opacity=".6"/></g>',
          over: gloss(P), edge: edge('rgba(226,194,117,.55)') }; } },
    { id: 'sunset', n: 'Gün Batımı', d: 'Mor-turuncu gökyüzü, güneş ve dalgalar', price: 2200, brand: '#FFF4E0', chip: 'rose',
      build: function (P, o) { return { defs: lin(P + 'a', 0.3, 1, ['#2B1055', '#D4507A', '#FFB36B']) + rad(P + 's', '#FFE9B0') + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<circle cx="640" cy="250" r="190" fill="url(#' + P + 's)"/><circle cx="640" cy="250" r="105" fill="#FFE9B0" opacity=".92"/><path d="M0 330C140 290 260 370 400 330S660 290 856 340V540H0z" fill="#1B0A3A" opacity=".82"/><path d="M0 400C160 370 300 440 460 400S700 370 856 410V540H0z" fill="#12062A">' + (o.animate ? '<animate attributeName="d" dur="7s" repeatCount="indefinite" values="M0 400C160 370 300 440 460 400S700 370 856 410V540H0z;M0 410C160 440 300 380 460 410S700 440 856 400V540H0z;M0 400C160 370 300 440 460 400S700 370 856 410V540H0z"/>' : '') + '</path>',
          over: gloss(P), edge: edge('rgba(255,255,255,.3)') }; } },
    { id: 'frost', n: 'Buz Kristali', d: 'Açık buz mavisi, cam kristaller', price: 2000, brand: '#14161B', chip: 'silver',
      build: function (P) { return { defs: lin(P + 'a', 1, 1, ['#EAF3FB', '#A9C9E6', '#DFEAF5']) + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<path d="M560 40L760 330 520 330z" fill="#fff" opacity=".45"/><path d="M700 200L840 460 600 460z" fill="#8FB2D6" opacity=".45"/><path d="M430 300l90 110-90 110-90-110z" fill="#fff" opacity=".4"/><path d="M560 40L640 330M700 200L720 460" stroke="#fff" stroke-opacity=".8"/>' + stars(60, 7, '#fff'),
          over: gloss(P), edge: edge('rgba(255,255,255,.7)') }; } },
    { id: 'crimson', n: 'Kızıl Gece', d: 'Siyah zemin, kızıl neon halka', price: 2600, brand: '#F2F4F8', chip: 'rose',
      build: function (P, o) { var d = ''; for (var i = 0; i < 14; i++) d += '<path d="M' + (420 + i * 34) + ' 0L' + (160 + i * 34) + ' 540" stroke="#FF3B30" stroke-opacity=".22"/>';
        return { defs: lin(P + 'a', 1, 1, ['#0A0305', '#2A0A10', '#0A0305']) + rad(P + 'r', '#FF3B30') + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<circle cx="620" cy="260" r="280" fill="url(#' + P + 'r)" opacity=".4"/>' + d + '<circle cx="620" cy="260" r="130" fill="none" stroke="#FF3B30" stroke-width="2.4">' + (o.animate ? '<animate attributeName="stroke-opacity" values=".4;1;.4" dur="2.6s" repeatCount="indefinite"/>' : '') + '</circle><circle cx="620" cy="260" r="90" fill="none" stroke="#fff" stroke-opacity=".3"/>',
          over: gloss(P), edge: edge('rgba(255,59,48,.5)') }; } },
    { id: 'cosmos', n: 'Kozmos', d: 'Gezegen, halka ve yıldız tozu (sınırlı seri)', price: 3200, brand: '#F2F4F8', chip: 'silver',
      build: function (P, o) { return { defs: lin(P + 'a', 1, 1, ['#02030A', '#0A0F2E', '#1A0B3D']) + rad(P + 'n', '#7C5CFF') + glossDef(P),
          under: rect('url(#' + P + 'a)') + '<circle cx="540" cy="230" r="330" fill="url(#' + P + 'n)" opacity=".4"/>' + '<g>' + stars(110, 3, '#fff') + (o.animate ? '<animate attributeName="opacity" values=".7;1;.7" dur="4s" repeatCount="indefinite"/>' : '') + '</g><circle cx="650" cy="250" r="95" fill="#C6A5FF"/><circle cx="615" cy="225" r="95" fill="#8F6BFF" opacity=".35"/><ellipse cx="650" cy="250" rx="190" ry="44" fill="none" stroke="#E6D9FF" stroke-width="3" transform="rotate(-18 650 250)" opacity=".85"/>' + (o.serial ? '<text x="830" y="40" text-anchor="end" font-size="15" letter-spacing="2" fill="#E6D9FF" opacity=".8">SERİ ' + o.serial + '</text>' : ''),
          over: gloss(P), edge: edge('rgba(198,165,255,.5)') }; } }
  ];
  var MAP = {}; LIST.forEach(function (s) { MAP[s.id] = s; });
  root.FNXSkins = { get: function (id) { return Object.prototype.hasOwnProperty.call(MAP, id) ? MAP[id] : null; }, list: LIST };
})(typeof window !== 'undefined' ? window : globalThis);
