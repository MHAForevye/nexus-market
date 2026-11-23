// Sunucu bağlantısı: API_BASE boşsa tarayıcı içi MOCK mod çalışır (localStorage).
// Sunucuya bağlanırken örn. "https://api.siteniz.com/market/v1" yazın.
window.NEXUS_CONFIG = {
  API_BASE: "",
  CURRENCY: "FN",
  // Kart editörü (banka) adresi; satın alınan yüzeyler orada 'Kartım' sayfasında takılır. Sonunda / olmasın.
  BANK_URL: "https://mhaforevye.github.io/forevye_nexus_bank",
  AUTH_TOKEN_KEY: "nexus_token" // gerçek modda localStorage'dan okunup Authorization: Bearer olarak gönderilir
};
