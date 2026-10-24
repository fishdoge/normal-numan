# 玩家數據後臺

登入遊戲後開啟 `/admin`,或使用遊戲頁首的「數據後臺」。後臺沿用遊戲登入帳號與 session。只有 `users.is_admin = true` 可以讀取頁面內容及 `/api/admin/players`、`/api/admin/players/:id`。管理員權限每次請求由資料庫確認,撤銷後立即生效。

## 設定管理員

在專案根目錄執行,沿用 `.env.local` / `.env` 的 `DATABASE_URL`:

```sh
node scripts/set-admin.mjs indigofeather --dry-run
node scripts/set-admin.mjs indigofeather
node scripts/set-admin.mjs indigofeather --revoke
```

必須是已註冊且完全相符的遊戲登入帳號。此專案沒有獨立 email 欄位。腳本只更動指定帳號的權限,不建立新帳號。一般註冊預設沒有管理員權限,登入及存檔 API 不接受客戶端指定管理員身分。

## 資料定義

- 遊玩時間:帳號層級 `player_activity.play_seconds`,不隨轉世刪除。遊戲在前景、有焦點且最近兩分鐘內有操作時,每 30 秒送出心跳。伺服器計算相鄰心跳的間隔,超過 65 秒不回補,多個頁籤不重複加總。關閉或切走頁面盡力送出停止訊號;網路中斷可能少記最後一段。歷史無法回推,尚未開始記錄與零秒分開顯示,並提供起算日。未創角及死亡畫面不計時。此數字為有效遊玩時間估計,不作為防作弊或計費依據。
- 打怪數:目前角色 `saves.data.kills` 的合計與各怪物明細。沿用現有引擎口徑,浮屠塔與天劫不在此紀錄內,轉世後重計,不是帳號終身擊殺數。
- 道具:正數數量的 `inventory`,已裝備物品仍在背包內,不重複加總。六個裝備欄、滕符背包與符陣、交易掛賣另有明細。未知的舊版 ID 保留顯示,不回寫或清除存檔。
- 法術:`learned` 去重後列出,含基礎招式;等級讀取 `techLevels`(舊存檔缺值為 1),額外副本讀取 `techCopies`。
- 等級:`realmIdx` 對照目前版本境界表,另列目前修為 `exp`。
- 靈石:隨身 `stones` + 靈石袋 `pouchStones` + 交易待入帳 `pending_stones`,統一以下品靈石列示。金額以十進位字串傳輸,避免 BIGINT 被瀏覽器捨入。掛賣物品未售出的標價不列入資產。

後臺以唯讀交易直接查詢所需欄位,不呼叫會結算、遷移或寫回角色資料的遊戲讀檔 API。新增的結構為 `users.is_admin` 與 `player_activity`,由既有 `ensureSchema()` 在首次請求時建立;不更改 `saves.data` 的格式。頁面不供搜尋引擎收錄,查詢 API 使用 private/no-store。
