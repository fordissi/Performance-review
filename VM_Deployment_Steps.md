# VM 部署更新指南 (VM Deployment Guide)

本文件說明如何將本地端的修改同步至雲端主機 (VM) 並套用更新。

## 1. 連線至 VM
開啟終端機 (Terminal) 或 PowerShell，使用 SSH 連線至您的主機：
```bash
ssh <username>@35.185.175.249
```
*(請將 `<username>` 替換為您的主機帳號)*

## 2. 進入專案目錄
移動到存放專案程式碼的資料夾：
```bash
cd /home/performX
```
*(請確認實際路徑，通常可能在 `~/Performance-review` 或 `/var/www/...`)*

## 3. 拉取最新程式碼 (Git Pull)
這是一步將 GitHub 上的新程式碼下載到 VM 的關鍵指令：
```bash
git pull origin main
```
- 若顯示 `Already up to date`，代表目前已是最新狀態。
- 若有衝突 (Conflict)，則需先解決衝突 (較少見，除非 VM 上有未同步的修改)。

## 4. 資料遷移 (本次更新必要)
由於本次更新修改了資料結構 (`managerId` -> `managerIds`)，**必須** 執行以下指令來轉換現有的資料，否則主管會看不到員工：
```bash
node scripts/migrate_managers.js
```
*(成功後會顯示 Successfully migrated X records)*

## 5. 更新套件與建置 (重要)
由於本次更新包含前端邏輯與資料結構的修改，強烈建議執行以下步驟以確保生效：

### 安裝新依賴 (若有新增 Package)
```bash
npm install
```

### 重新編譯前端 (Build)
我們使用 Vite 進行開發，必須重新編譯才能讓瀏覽器讀取到最新的 React 程式碼：
```bash
npm run build
```

## 5. 重啟後端服務
最後，重新啟動後端伺服器以確保所有 API 與資料庫連線重置：

若您使用 `pm2` 管理流程：
```bash
pm2 restart all
```

或是直接執行 (開發模式)：
```bash
node server.js
```

---
**檢查更新是否成功**：
1. 開啟瀏覽器進入網站。
2. 按 `Ctrl + F5` (或 `Cmd + Shift + R`) 強制重新整理，確保載入最新的 JavaScript 檔案。
3. 嘗試以主管身份登入，檢查是否能看到多位主管的相關功能。
