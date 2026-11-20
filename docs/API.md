# NEXUS MARKET API sözleşmesi (öneri)

Taban: `API_BASE` (örn. `/market/v1`). JSON, `Authorization: Bearer <token>`. Hata gövdesi: `{ "code": "ALREADY_OWNED", "message": "..." }`.
Fiyat, bakiye, sahiplik, stok ve etkinlik zamanı yalnızca sunucuda doğrulanır. Yanıtlardaki `Date` başlığı istemci geri sayımı için sunucu saatidir.

| Metot | Yol | Açıklama |
|---|---|---|
| GET | /catalog | `{categories[], events[{id,title,desc,starts_at,ends_at,status}]}` |
| GET | /products | Yayındaki ürünler: `id,name,desc,cat,type,acq[],price,inventory,version,owned_qty,stock_left` |
| GET | /products/:id | Tek ürün |
| GET | /me | `{balance, entitlements:{product_id:{qty,acquired_at,source,transaction_id}}, wishlist[]}` |
| GET | /me/ledger | Edinim geçmişi: `{id,at,type,product_id,name,amount,balance_after}` |
| POST | /me/wishlist/:id/toggle | Sahip olunan kalıcı ürün için `ALREADY_OWNED` |
| POST | /products/:id/purchase | Başlık `Idempotency-Key` zorunlu. Bakiye düşümü + ledger + entitlement **tek atomik işlem** |
| GET | /rewards | Ödüller, ilerleme, etkinlik penceresi |
| POST | /rewards/:id/claim | Koşul, tarih, hak sayısı ve tek sahiplik sunucuda doğrulanır |
| POST | /me/entitlements/:id/consume | `Idempotency-Key` zorunlu; adet atomik azalır, eksiye düşemez |

Hata kodları: `ALREADY_OWNED, INSUFFICIENT_BALANCE, SOLD_OUT, UNAVAILABLE, NOT_PURCHASABLE, ALREADY_CLAIMED, EVENT_NOT_ACTIVE, CONDITION_NOT_MET, NO_STOCK, NOT_FOUND`.

## Veri varlıkları
market_products, product_prices, product_assets, user_entitlements (UNIQUE user_id+product_id kalıcı ürünlerde), consumption_events (UNIQUE idempotency_key), wishlists, market_events, reward_claims, market_audit_logs. Market kendi bakiye/envanter tablosunu açmaz; mevcut ledger ve envanter servisleri kullanılır. Şema öneridir, mevcut uygulama modeline göre netleştirilir.

## Kabul testleri (şartname bölüm 21)
Kalıcı ürün ikinci kez satılmaz/verilmez; tüketilebilir adet doğru artar/azalır; başarısız satın almada bakiye değişmez; eş zamanlı/tekrar istek çift ücret oluşturmaz; ödül ve etkinlik hakları doğru çalışır; etkinlik bitince yeni kazanım durur, eskiler korunur; ürünler Collection'da doğru kaynakla görünür; 320 px'te yatay taşma yok.
