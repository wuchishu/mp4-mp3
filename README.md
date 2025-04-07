# mp4-mp3
# 伺服器部署說明

這個文檔提供如何將音訊轉換器部署到伺服器的詳細指南。

## 檔案結構

音訊轉換器應用程式由三個主要檔案組成：

1. `index.html` - 網頁結構和內容
2. `styles.css` - 樣式表
3. `script.js` - JavaScript 程式碼

確保這三個檔案放在相同目錄下，且名稱正確。

## 部署步驟

### 方法 1: 靜態網站託管 (最簡單)

這是最簡單的部署方式，適合大多數情況。

#### 使用 GitHub Pages

1. 在 GitHub 建立新的儲存庫
2. 上傳三個檔案 (`index.html`, `styles.css`, `script.js`) 到儲存庫
3. 前往儲存庫設定 (Settings) -> Pages
4. 在 "Source" 部分選擇 "main" 分支，然後點擊 "Save"
5. 幾分鐘後，您的應用將在 `https://[您的用戶名].github.io/[儲存庫名稱]` 上線

#### 使用 Netlify

1. 在 Netlify 註冊帳戶 (免費方案足夠)
2. 點擊 "New site from Git" 或直接拖放包含三個檔案的資料夾
3. 如果使用拖放方法，網站會立即部署
4. 您會獲得一個隨機網址，可在設定中更改為自訂網域

### 方法 2: 使用網頁伺服器

如果您已有伺服器或虛擬主機，可以使用以下方法：

#### Apache 伺服器

1. 將檔案上傳到伺服器的 web 根目錄 (通常是 `/var/www/html/` 或 cPanel 中的 `public_html`)
2. 確保檔案權限正確 (通常為 644)
3. 訪問您的域名或 IP 位址即可使用應用程式

#### Nginx 伺服器

1. 將檔案上傳到伺服器的指定目錄 (例如 `/var/www/converter/`)
2. 配置 Nginx 虛擬主機：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/converter;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

3. 重新載入 Nginx 配置: `sudo nginx -s reload`

### 方法 3: 使用 Node.js 伺服器

如果您想要更多控制或加入後端功能：

1. 建立一個基本的 Node.js 專案目錄
2. 將三個檔案放入 `public` 資料夾
3. 建立 `server.js` 檔案：

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 靜態檔案
app.use(express.static('public'));

// 啟動伺服器
app.listen(port, () => {
  console.log(`音訊轉換器運行在 http://localhost:${port}`);
});
```

4. 安裝依賴並啟動伺服器：

```bash
npm init -y
npm install express
node server.js
```

## 安全性考量

1. **HTTPS**：由於應用程式處理使用者文件，強烈建議使用 HTTPS。
   - GitHub Pages 和 Netlify 預設支援 HTTPS
   - 對於自己的伺服器，可使用 Let's Encrypt 免費獲取SSL證書

2. **CORS**：確保伺服器允許 CDN 資源存取：
   - 您的應用使用 JSZip 庫，需要允許它從 CDN 加載

## 瀏覽器相容性

確保伺服器配置正確的 MIME 類型，特別是對於音訊檔案：

```
audio/mpeg: .mp3
audio/wav: .wav
audio/ogg: .ogg
```

## 優化建議

1. **緩存設定**：對於靜態資源 (CSS/JS) 設置較長的緩存期：

```nginx
# Nginx 範例
location ~* \.(css|js)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
}
```

2. **壓縮**：啟用 Gzip 或 Brotli 壓縮以減少檔案大小：

```nginx
# Nginx 範例
gzip on;
gzip_types text/plain text/css application/javascript;
```

## 故障排除

1. **腳本無法載入**：檢查檔案路徑是否正確。確保 HTML 檔案中的路徑與伺服器目錄結構相符。

2. **MIME 類型錯誤**：如果遇到 MIME 類型警告，確保伺服器設定了正確的內容類型：

```nginx
# Nginx 範例
types {
    text/css css;
    application/javascript js;
}
```

3. **跨域問題**：如果應用程式嘗試與其他域通信，確保設置了適當的 CORS 頭：

```nginx
# Nginx 範例
add_header Access-Control-Allow-Origin *;
```

## 測試

部署後，請測試以下功能確保一切正常運作：

1. 上傳不同格式的視訊檔案
2. 轉換為不同的音訊格式 (MP3, WAV, OGG)
3. 下載單個檔案和批次下載
4. 在不同瀏覽器中測試 (Chrome, Firefox, Safari)

如有任何問題，請檢查瀏覽器控制台的錯誤訊息。
