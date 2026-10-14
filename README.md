# Physics Lab Discussion

## 1. 專案簡介

這是一個供物理實驗課使用的即時分組討論系統。GitHub Pages 提供靜態網頁，Firebase Authentication 處理教師、學生與展示頁身分，Firebase Realtime Database 同步題目、倒數狀態與各組回答。

教師使用控制台管理課堂，學生透過手機或電腦作答，大螢幕展示頁呈現全班討論成果。目前資料集中於單一 `labSession`，並非多個班級同時獨立運作的系統。

## 2. 專案檔案結構

```text
physics-lab-discussion/
├── teacher.html              # 教師控制台
├── index.html                # 大螢幕展示頁／網站首頁
├── student.html              # 學生作答頁
├── firebase-config.js        # 共用 Firebase 初始化設定
├── QR code for students.jpg  # 學生 QR code 圖片；使用前確認連結
├── .gitignore                # Git 忽略設定
└── README.md                 # 操作與維護文件
```

頁面使用 CDN 載入 Firebase SDK、Tailwind CSS 等資源；展示頁及教師 PDF 匯出使用 KaTeX，PDF 匯出另使用 html2canvas 與 jsPDF。工作區沒有 Database Rules 檔案，正式 Rules 需到 Firebase Console 核對與維護。

## 3. 系統主要功能

### 教師端：`teacher.html`

- Google 彈出視窗登入，以 `AUTHORIZED_TEACHER_UIDS` 檢查 Firebase UID 白名單。
- 建立新場次，顯示 Session ID、建立時間與各組 6 位數驗證碼；可複製全部驗證碼或重新產生。
- 接收本機大螢幕配對要求，顯示 Display UID 並授權展示頁。
- 設定課程標題、題目、組數（1–20）、討論時間（1–120 分鐘）及文字回答字元上限（1–5000，預設 500）。
- 發布題目並開始計時、暫停／繼續、提前結束／鎖定作答、清空題目與回答。
- 即時查看繳交組數及進度；下載全組回答 CSV 或 PDF。

CSV 包含場次、標題、題目、組別、文字、網址與送出時間，不包含繪圖。PDF 按組產生頁面，包含題目、文字、參考網址、繪圖（若有）、送出時間及 Session ID。

### 學生端：`student.html`

- 自動建立匿名登入身分，選擇組別並輸入本場次驗證碼。
- 文字作答、字元計數、填寫參考網址、使用 Canvas 繪圖及清除畫板。
- 載入本組既有答案；在可作答期間重新送出會覆蓋本組答案。
- 可更換組別，但須驗證新組別；更換不會刪除原組已送出的答案。
- 暫停、鎖定、倒數結束或組別驗證失效時，輸入與送出功能停用。

### 展示端：`index.html`

- 使用獨立的 Firebase App 建立展示用匿名身分，可與教師 Google 登入並存。
- 即時顯示課程標題、題目、倒數、繳交組數及各組回答卡片。
- 經本場次教師授權後，才啟動全組回答的讀取。
- 點擊卡片放大文字、網址與繪圖；可切換上一組／下一組，也支援左右方向鍵與 Esc 關閉。
- 透過 KaTeX 顯示題目及回答中的數學式。

## 4. Firebase 設定

### 共用設定與 Authentication

`firebase-config.js` 已包含專案設定，初始化並匯出 `app`、`auth`、`db`。維護時確認各頁使用同一個 Firebase 專案及正確的 Realtime Database URL；此文件不重複列出真實 API 金鑰、教師 UID 或組別驗證碼。

在 Firebase Console 的 Authentication 登入方式中，啟用 **Google**（教師）及 **Anonymous**（學生與大螢幕）。Google 登入操作可參考 [Firebase 官方文件](https://firebase.google.com/docs/auth/web/google-signin)。

新增教師時，取得該帳號的 Firebase UID，更新 `teacher.html` 的 `AUTHORIZED_TEACHER_UIDS`，並同步維護 Database Rules 中的教師授權條件。**前端白名單只控制介面，資料權限仍須由 Rules 保護。** 不要把 UID、私人授權名單或當堂驗證碼貼入 README。

### Authentication 授權網域

在 Authentication 的 Settings → Authorized domains 核對正式 GitHub Pages 主機名稱（例如 `YOUR_ACCOUNT.github.io`）或實際自訂網域；填寫網域，不包含 `https://` 或專案路徑。本機測試時也需核對使用的 `localhost` 或 `127.0.0.1`。

不要假設 `localhost` 已自動加入：Firebase 官方說明指出，2025-04-28 之後建立的專案不再預設加入它。出現 `auth/unauthorized-domain` 時，應檢查授權網域。[Firebase Authentication 疑難排解](https://firebase.google.com/docs/auth/faq-and-troubleshooting)

### Realtime Database Rules 權限設計

下表整理現有程式使用的路徑與所需權限；**工作區沒有 Rules 原始檔，也未核對雲端已部署的規則，因此不能據此宣稱正式 Rules 已通過驗證。** 維護者需在 Console 確認對應條件。

| 路徑 | 用途與權限設計 |
| --- | --- |
| `labSession/current` | 題目、Session ID、組數與計時狀態；各頁讀取，授權教師管理。 |
| `labSession/answers` | 教師與已獲本場次授權的展示 UID 讀取全組回答；學生只應讀寫已驗證組別的回答，寫入需檢查場次與可作答狀態。 |
| `labSession/private/groupCodes` | 教師管理驗證碼；學生驗證由 Rules 比對，不應開放學生讀取全部驗證碼。 |
| `labSession/private/members/{uid}` | 學生讀取自己的綁定；寫入需核對匿名身分、本人 UID、Session ID、組別及驗證碼。 |
| `labSession/private/displayMembers/{displayUid}` | 教師寫入展示授權；展示頁讀取自己的授權，並核對授權中的 Session ID 是否為目前場次。 |

**保留資料庫根目錄的 `.read: false`、`.write: false`，以及 `displayMembers` 中的 `$other/.validate: false`，不可為了操作成功而改成 `true`。** 根節點預設拒絕，再於指定子路徑按身分與場次授權；`$other` 驗證用來拒絕未明列的欄位。不要在較上層全面開放讀寫來繞過權限錯誤。規則語意可參考 [Realtime Database Rules 官方文件](https://firebase.google.com/docs/database/security/core-syntax)。

## 5. 本機開發與測試

使用 HTTP 伺服器開啟頁面，不要直接雙擊 HTML（`file://`）；Firebase SDK 與其他 CDN 資源需要網路。**目前程式沒有連接 Firebase Emulator，本機頁面也會操作 `firebase-config.js` 指向的資料庫。** 若使用正式設定，建立新場次或清空回答會影響正式資料，操作前先匯出。

### Python HTTP Server

在 VS Code 的 Terminal 執行（需已安裝 Python）：

```powershell
cd D:\physics-lab-discussion
python -m http.server 5500
```

若 Windows 只有 `py` 指令，可改用 `py -m http.server 5500`。以 Ctrl+C 停止伺服器。

```text
http://localhost:5500/teacher.html
http://localhost:5500/index.html
http://localhost:5500/student.html
```

### VS Code Live Server

1. 在 VS Code 開啟專案資料夾，安裝 Live Server 擴充功能（尚未安裝時）。
2. 在 `teacher.html` 按右鍵，選擇 **Open with Live Server**。
3. 依瀏覽器實際開啟的主機與埠號，在另一分頁開啟同路徑下的 `index.html`。

Live Server 可能使用 `127.0.0.1` 或不同埠號，以實際網址為準。**教師端與展示端的通訊協定、主機及埠號必須一致**：不可一頁用 `localhost`、另一頁用 `127.0.0.1`，也不可混用兩個伺服器的不同埠號。

測試學生頁時，使用另一個瀏覽器設定檔、無痕視窗或其他裝置；教師登入使用的環境已有 Google 身分，學生頁會提示身分衝突。教師端與展示端仍須放在彼此可互通的同一瀏覽器環境中。

最小測試：教師登入 → 建立場次 → 展示頁配對及授權 → 發布題目 → 學生驗證並送出 → 確認進度及展示卡片 → 測試更新答案、暫停／繼續、CSV／PDF 匯出。

## 6. GitHub Pages 正式部署

到既有 GitHub repository 的 **Settings → Pages** 查看正式網址與目前部署來源；維護時沿用既有設定，不要假設來源分支一定是 `main`。若從分支部署，這些檔案目前位於專案根目錄，需確認發布來源包含它們。部署設定可參考 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

工作區檔案無法確認實際正式網址，以下僅為格式範例，請替換成 Settings → Pages 顯示的網址：

```text
https://YOUR_ACCOUNT.github.io/YOUR_REPOSITORY/teacher.html
https://YOUR_ACCOUNT.github.io/YOUR_REPOSITORY/index.html
https://YOUR_ACCOUNT.github.io/YOUR_REPOSITORY/student.html
```

學生可使用正式 `student.html` 連結；使用現有 QR code 圖片前，先掃描確認指向目前正確網址。網站部署與 Firebase 設定、Rules 發布是不同工作，更新 GitHub Pages 不會同步變更 Console 設定。

若要使用 Git 提交或推送，**先確認目前 branch** 及 Pages 的來源。以下指令只檢查，不會提交或推送：

```powershell
cd D:\physics-lab-discussion
git branch --show-current
git status --short
git diff -- README.md
```

更新部署後重新整理三個頁面，確認登入、配對、繳交與匯出流程。

## 7. 正式上課操作流程

1. 教師開啟正式 `teacher.html`，使用授權 Google 帳號登入。
2. 設定本節課組數，按「建立新場次」，取得 Session ID 與組別驗證碼，將各組驗證碼提供給對應學生。建立場次會清空題目，題目請在建立完成後填入。
3. 在同一台電腦、相同網站來源及同一瀏覽器設定檔的另一分頁開啟 `index.html`。
4. 教師控制台收到本場次配對要求、顯示 Display UID 後，點擊「授權此大螢幕展示頁」。
5. 確認 `index.html` 顯示「大螢幕展示已授權。」。
6. 教師輸入課程標題、題目、討論時間與字元上限，按「發布題目並開始計時」。
7. 學生透過手機或其他裝置開啟正式 `student.html`，待匿名身分建立後，選擇組別並輸入當堂驗證碼，按「驗證並確認組別」。學生不需自行輸入 Session ID。
8. 學生填寫文字、參考網址或繪圖，按「送出 / 更新答案」並確認；成功時會顯示「答案已送出。」。
9. 教師查看繳交進度，展示頁即時顯示各組回答，可點擊放大並切換組別。
10. 討論結束後，教師可鎖定作答並匯出 CSV 或 PDF；清除資料前先保存需要的成果。

同一場次發布下一題會維持 Session ID、驗證碼與展示授權，**不會自動清除上一題回答**。若要收集下一題，先匯出，再按「清空題目與回答」，填入新題目並發布。

變更組數後，必須先按「重新產生全部驗證碼」再發布。此操作會使舊碼失效、清除學生綁定，學生需重新驗證；它不會清除既有回答，也不會重建場次或清除展示授權。

## 8. 大螢幕授權限制

**目前使用 BroadcastChannel 傳送本機配對要求，不支援兩台不同電腦之間的自動配對。**

`teacher.html` 與 `index.html` 必須在相同電腦、相同網站來源、可互通的瀏覽器儲存分區中開啟。一般操作請使用同一瀏覽器設定檔的兩個一般分頁；不同瀏覽器、不同設定檔或一般／無痕視窗之間不要假設可以互通。

「已送出本機配對要求」只表示展示頁嘗試傳送要求，不代表教師控制台已收到。教師授權後會將 Display UID 與本場次 Session ID 寫入 Firebase，展示頁以資料庫授權狀態確認是否可以讀取回答。

**學生端可使用其他電腦或手機**，透過 Firebase 寫入答案，不受本機配對限制。教師端與展示端也需要網路才能登入、讀取授權與同步資料。

## 9. 常見問題

以下為檢查順序，不代表每次錯誤都有相同原因。必要時按 F12 查看 Console 錯誤碼及 Network 資源載入狀態。

### 教師控制台沒有收到大螢幕配對要求

- 確認教師已登入授權帳號、已建立場次，兩頁位於同一電腦與同一瀏覽器設定檔，網址的通訊協定、主機及埠號相同。
- 確認展示頁已建立匿名身分、能讀取目前 Session ID，瀏覽器支援 BroadcastChannel。
- 教師控制台準備好後，重新整理 `index.html`。目前程式對同一 Display UID／Session ID 的要求在頁面執行期間只送出一次；若較早送出時教師端尚未準備好，不會自動持續重送。

### 展示頁能顯示題目，但看不到回答

- 題目與全組回答使用不同讀取路徑；先確認展示頁顯示「大螢幕展示已授權。」。
- 若未授權，完成本場次配對；若已授權但提示無法讀取回答，核對 `displayMembers/{displayUid}` 的 Session ID 與 Rules 對 `labSession/answers` 的讀取條件。
- 確認已有學生成功送出，資料庫中有對應組別答案。建立新場次或清空回答後，舊答案不會保留。

### 學生驗證碼無法通過

- 確認選擇正確組別，輸入教師目前場次提供的 6 位數驗證碼。
- 確認教師未建立新場次或重新產生驗證碼；兩者都會使舊碼失效。
- 確認學生顯示匿名裝置驗證完成；若有 Google 身分衝突，改用其他設定檔、無痕視窗或學生裝置。
- 若仍失敗，依 Console 錯誤核對本人 `members/{uid}` 的寫入與驗證規則。介面的驗證失敗訊息也可能涵蓋權限拒絕，不能只憑文字認定是輸入錯碼。

### 學生無法送出回答

- 確認組別已驗證、沒有停留在更換組別模式，教師已發布且未暫停／鎖定，倒數尚未結束。
- 確認文字沒有超過字元上限；新場次或重新產生驗證碼後，需重新驗證。
- 檢查網路與 Console 錯誤，再核對該組答案的 Rules 寫入條件。暫停時不只倒數停止，學生輸入與繳交也會凍結。

### 換新場次後需要重新授權

這是現有設計。建立新場次會替換 `private` 資料並清除原展示授權，舊 Session ID 的授權也不符合新場次。依新場次完成配對，必要時重新整理展示頁；學生同樣需使用新碼重新驗證。

### 數學 LaTeX 原始語法沒有正確顯示

- 展示頁題目／回答及教師 PDF 匯出支援 `$F=ma$`、`$$F=ma$$`、`\(F=ma\)`、`\[F=ma\]`，確認分隔符號成對、LaTeX 語法正確。
- 檢查 KaTeX 的 CSS、主程式與 auto-render CDN 是否成功載入，再重新整理。程式使用 `throwOnError: false`，錯誤語法不一定會拋出例外。
- 學生頁題目及文字輸入欄目前沒有 KaTeX 渲染；在這些位置看到原始語法不等於展示功能故障。

### 教師已登入，但資料讀寫失敗

教師身分通過前端白名單不代表 Rules 一定允許資料操作。核對 Firebase 專案、Rules 教師 UID 條件與實際錯誤碼。控制台仍有提及「開發階段」的權限提示文字，它不能用來判定正式資料庫狀態；不要因此將根目錄權限改為 `true`。

## 10. 安全性與資料管理

教師透過 Google 登入及 UID 白名單進入控制台；學生使用匿名 UID 與組別驗證碼建立本場次綁定；大螢幕必須經教師授權才能讀取全組回答。Realtime Database Rules 應採預設拒絕原則，實際資料存取必須在伺服器端按 UID、場次及組別限制。

學生答案按 `group-*` 儲存，同組再次送出會覆蓋；目前沒有逐次版本歷史或自動按題目封存。當堂驗證碼只提供給對應組別，不要將全部驗證碼放在公開網頁或文件中。

| 操作 | 現有資料影響 |
| --- | --- |
| 發布題目 | 更新題目與計時設定，保留場次、驗證碼、綁定、展示授權及既有回答。 |
| 清空題目與回答 | 清除題目及全組回答、鎖定作答；保留場次、驗證碼、學生綁定與展示授權。 |
| 重新產生全部驗證碼 | 更新組數與驗證碼、清除學生綁定；保留場次、既有回答及展示授權。 |
| 建立新場次 | 產生新 Session ID 與驗證碼，清除舊題目、回答、學生綁定及展示授權。 |

新學期使用前，先匯出需要保留的成果，核對教師白名單與 Rules、正式網址及 QR code，再設定組數並建立新場次。此流程重新準備課堂資料，不會刪除 Firebase Authentication 帳號。

**Firebase 匿名帳號自動清理與 Realtime Database 回答紀錄清除是不同機制。** 自動清理須符合 Firebase Authentication with Identity Platform 的條件並在 Console 啟用，可清理超過 30 天的匿名帳號；無法從目前前端檔案確認本專案是否啟用。[Firebase 匿名登入與自動清理說明](https://firebase.google.com/docs/auth/web/anonymous-auth)

目前程式沒有帳號刪除時同步清除答案的邏輯；不要把匿名帳號自動清理視為資料庫回答的保留期限或刪除機制。回答紀錄需依課程需求另行管理，清除前先匯出；需完整備份時，另在 Firebase Console 保存資料及 Rules。

## 11. 版本與維護紀錄

| 日期 | 維護內容 |
| --- | --- |
| 2026-10-14 | 依工作區中的教師端、展示端、學生端及 Firebase 設定整理 README；補充 GitHub Pages 操作、授權限制、FAQ、安全設定與新學期資料管理。此日期是文件整理日期，不代表所有功能於當天完成。 |

本文件依目前程式碼整理；雲端 Rules、Authentication Console 設定及實際 GitHub Pages 部署狀態需由維護者另外核對。
