# 🚀 Quick Start Guide

## Localhost'ta Çalıştırma (En Hızlı Yol)

### 1. Backend'i Başlatın

```bash
cd backend
npm install  # İlk seferinde
npm start
```

Backend şu adreste çalışacak: `http://localhost:4000`

### 2. Frontend'i Açın

Herhangi bir HTTP server ile frontend'i serve edin:

```bash
# Python kullanarak (önerilen)
python3 -m http.server 5500

# VEYA Node.js http-server kullanarak
npx http-server -p 5500

# VEYA VS Code Live Server extension kullanın
```

### 3. Tarayıcıda Açın

```
http://localhost:5500/login.html
```

**Default Credentials:**
- Email: `admin@behavioural-hub.com`
- Password: `Admin123!`

---

## GitHub Pages İçin Production Deployment

GitHub Pages sadece static dosyalar serve eder. Backend'i ayrı deploy etmeniz gerekiyor.

### Seçenek 1: Render.com (ÜCRETSİZ, Önerilen)

1. [Render.com](https://render.com)'a kaydolun
2. "New Web Service" oluşturun
3. GitHub repo'nuzu bağlayın
4. Ayarlar:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

5. Environment Variables ekleyin:
   ```
   NODE_ENV=production
   JWT_SECRET=<güçlü-bir-secret-oluşturun>
   DATABASE_PATH=./behavioural_hub.db
   ```

6. Deploy edin ve URL'i alın (örn: `https://your-app.onrender.com`)

7. `config.js` dosyasında production URL'i güncelleyin:
   ```javascript
   const PRODUCTION_API_URL = 'https://your-app.onrender.com/api';
   ```

8. GitHub'a push edin - GitHub Pages otomatik güncellenecek!

### Seçenek 2: Railway.app (ÜCRETSİZ)

1. [Railway.app](https://railway.app)'e kaydolun
2. "New Project" → "Deploy from GitHub repo"
3. Backend klasörünü seçin
4. Environment variables ekleyin
5. Deploy URL'i alın ve `config.js`'de güncelleyin

### Seçenek 3: Heroku (Ücretli ama kolay)

```bash
heroku create behavioural-hub-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
git subtree push --prefix backend heroku main
```

---

## CORS Hatası Alıyorsanız

Backend `.env` dosyasında `ALLOWED_ORIGINS`'i güncelleyin:

```env
ALLOWED_ORIGINS=http://localhost:5500,https://melis-sutci.github.io
```

---

## Sorun Giderme

### "Network error" alıyorum
- ✅ Backend çalışıyor mu kontrol edin: `http://localhost:4000/health`
- ✅ CORS ayarlarını kontrol edin
- ✅ API URL'lerinin doğru olduğunu kontrol edin

### Login yapamıyorum
- ✅ Backend logs'a bakın
- ✅ Database'in doğru initialize edildiğini kontrol edin
- ✅ Default credentials'ı kullanın: `admin@behavioural-hub.com` / `Admin123!`

### GitHub Pages'te çalışmıyor
- ✅ Backend'i production'a deploy ettiniz mi?
- ✅ `config.js`'de production URL doğru mu?
- ✅ Backend CORS'ta GitHub Pages URL'i var mı?

---

## Hızlı Komutlar

```bash
# Backend'i başlat
cd backend && npm start

# Frontend'i serve et
python3 -m http.server 5500

# Backend'i test et
curl http://localhost:4000/health

# Login endpoint'i test et
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@behavioural-hub.com","password":"Admin123!"}'
```

---

## ✅ Başarılı Kurulum Göstergeleri

1. ✅ Backend `http://localhost:4000` üzerinde çalışıyor
2. ✅ Frontend `http://localhost:5500` üzerinde açılıyor
3. ✅ Login sayfasında hata yok
4. ✅ Admin credentials ile giriş yapabiliyorsunuz
5. ✅ Ana sayfaya yönlendiriliyor

---

**İhtiyacınız olursa yardımcı olabilirim! 🚀**
