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
Para birimi FN'dir ve gerçek katalog/sahiplik Nexus Worker üzerinden gelir. Kart çizimleri `js/card/*` içindeki ortak kurallarla yapılır. **Fonksiyonel kart** satın alındığında Worker gerçek bir banka kartı oluşturur, satın alınan yüzeyi otomatik takar ve Market doğrudan `NEXUS_APP_URL/#/cards/<kart-id>` adresindeki tam banka arayüzüne yönlendirir. Daha önce satın alınmış fakat karta dönüştürülmemiş fonksiyonel ürünler de banka kart listesi açıldığında otomatik teslim edilir. Yalnızca tasarım/yüzey ürünleri yeni kart oluşturmaz; sahip olunan yüzey olarak banka ekranında kullanılabilir.

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
- Kimlik doğrulama: gerçek modda Nexus tek kullanımlık giriş bileti Market jetonuna çevrilir; jeton yalnızca `/api/shop/*` uçlarında kullanılır.
- Gerçek para, ödeme kartı veya banka verisi bu projede bulunmaz.
