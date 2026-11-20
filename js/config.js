// Sunucu bağlantısı: API_BASE boşsa tarayıcı içi MOCK mod çalışır (localStorage).
// Sunucuya bağlanırken örn. "https://api.siteniz.com/market/v1" yazın.
window.NEXUS_CONFIG = {
  API_BASE: "",
  CURRENCY: "NX",
  AUTH_TOKEN_KEY: "nexus_token" // gerçek modda localStorage'dan okunup Authorization: Bearer olarak gönderilir
};
