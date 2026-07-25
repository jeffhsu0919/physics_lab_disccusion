# Physics Lab Discussion

這是一個使用靜態網頁與 Firebase Realtime Database 建立的物理實驗討論專案。

## 檔案結構

```text
physics-lab-discussion/
├── index.html
├── teacher.html
├── student.html
├── firebase-config.js
└── README.md
```

## 頁面用途

- `index.html`：大螢幕展示頁 / 主頁面
- `teacher.html`：老師控制台
- `student.html`：學生作答頁
- `firebase-config.js`：Firebase 初始化與 Realtime Database 共用設定

## Firebase 設定

請到 Firebase Console 建立專案與 Realtime Database，然後將 `firebase-config.js` 內的 placeholder 換成你的實際設定：

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 本機預覽

因為 `firebase-config.js` 使用 ES module CDN import，建議用本機伺服器開啟，不要直接雙擊 HTML。

可在 VS Code terminal 執行：

```powershell
cd D:\physics-lab-discussion
python -m http.server 5500
```

然後用瀏覽器開啟：

```text
http://localhost:5500/index.html
http://localhost:5500/teacher.html
http://localhost:5500/student.html
```
