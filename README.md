# FOREVYE NEXUS · NEXUS MARKET

Sanal bakiye ile çalışan dijital ürün mağazası arayüzü. Derleme gerektirmeyen saf HTML/CSS/JS; GitHub Pages veya Cloudflare Pages ile doğrudan yayınlanır.

## Çalıştırma
```
python3 -m http.server 8080   # sonra http://localhost:8080
```
(`data/products.json` fetch ile okunduğu için dosyayı çift tıklayıp açmak yerine bir yerel sunucu kullanın.)

## Yayın (GitHub)
1. Bu klasörü repoya push edin.
2. GitHub: Settings → Pages → Branch `main` / root. Cloudflare Pages için build komutu boş, çıktı dizini `/`.

## Modlar
- **Mock (varsayılan):** `js/config.js` içinde `API_BASE` boş. Bakiye, sahiplik, ledger ve idempotency tarayıcıda (localStorage) taklit edilir. Yalnızca prototip içindir; güvenilir değildir.
- **Gerçek:** `API_BASE` değerine sunucu adresini yazın. UI aynı kalır, `js/api.js` istekleri `docs/API.md` sözleşmesine göre gönderir.

## Kart tasarımları (FN)
Para birimi FN. `data/products.json` içindeki **Hazır kart tasarımları** kategorisi 6 yüzey satar (Neon Izgara, Zümrüt Saray, Gün Batımı, Buz Kristali, Kızıl Gece, Kozmos). Ürün kartları `js/card/*` (bankayla aynı dosyalar: `rules.js`, `render.js`, `skins.js`, `wallet.js`) ile çizilir. Satın alınan yüzey ortak FN cüzdanına yazılır ve bankada **Kartım → Kart yüzeylerim** bölümünden takılır. `config.js` → `BANK_URL` bankanın adresi olmalı.

## Yapı
```
index.html        hash tabanlı sayfa iskeleti
css/style.css     antrasit/gümüş tema, 320px uyumlu
js/config.js      API adresi ve ayarlar
js/api.js         mock backend + gerçek API adaptörü
js/app.js         sayfalar ve bileşenler
data/products.json örnek katalog, etkinlik, ödüller
docs/API.md       endpoint sözleşmesi, veri varlıkları, kabul testleri
```

## Şartname karşılığı
Sayfalar: Market Home, Browse, Product Detail, Events, Rewards, My Collection, Wishlist, Purchase History. Kalıcı/tüketilebilir/paket ayrımı, "Zaten sende", onay ekranları, süreli etkinlik, sunucu saati, skeleton, klavye/ekran okuyucu desteği dahildir.

## Sonraki adımlar
- Admin Studio Market modülü ve gerçek backend (Aşama 6) bu repoda yoktur; `docs/API.md` sözleşmesine göre ayrı geliştirilir.
- Kimlik doğrulama: gerçek modda token `localStorage["nexus_token"]` üzerinden `Authorization: Bearer` ile gönderilir.
- Gerçek para, ödeme kartı veya banka verisi bu projede bulunmaz.
