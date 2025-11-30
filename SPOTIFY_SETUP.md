# Spotify Import Setup

Spotify playlist import özelliğini kullanmak için:

## 1. Spotify Developer Hesabı Oluşturun
1. https://developer.spotify.com/dashboard adresine gidin
2. "Create app" butonuna tıklayın
3. Uygulama adı: "Flowy Music Player" veya istediğiniz bir isim
4. App description: "Music streaming app"
5. Redirect URI: `http://localhost:3000` (gerekli değil ama ekleyin)
6. "Web API" seçeneğini işaretleyin
7. Terms of Service'i kabul edin ve kaydedin

## 2. Credentials Alın
1. Dashboard'dan oluşturduğunuz app'e tıklayın
2. "Settings" butonuna tıklayın
3. **Client ID** ve **Client Secret** değerlerini kopyalayın

## 3. .env.local Dosyasını Güncelleyin
`.env.local` dosyasındaki şu satırları güncelleyin:
```
SPOTIFY_CLIENT_ID=buraya_client_id_yapistirin
SPOTIFY_CLIENT_SECRET=buraya_client_secret_yapistirin
```

## 4. Sunucuyu Yeniden Başlatın
```bash
# Ctrl+C ile mevcut sunucuyu durdurun
npm run dev
```

## 5. Test Edin
1. Uygulamada "Import" butonuna tıklayın
2. "Spotify Import" sekmesine geçin
3. Public bir Spotify playlist URL'si girin
4. "Start Import" butonuna tıklayın

**Not**: Sadece **public** playlist'ler import edilebilir. Private playlist'ler için kullanıcı girişi gerekir (şu anda desteklenmiyor).
