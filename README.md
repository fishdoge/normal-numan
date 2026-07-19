# 凡人修仙傳 · 文字修仙遊戲

以《凡人修仙傳》為藍本的文字修仙遊戲。Next.js 15 + Tailwind + Zustand,中文傳統風格(暗色宣紙質感、燙金點綴、Noto Serif TC)。

## 啟動

```bash
npm install
npm run dev     # http://localhost:3003
```

存檔自動保存在瀏覽器 localStorage(`fanren-save`)。

## 玩法

- 靈石:交易貨幣。擊殺妖獸、售賣材料獲得;坊市購物、煉器消耗。
- 仙靈力:施展仙法的能量,打坐或丹藥回復。
- 境界:煉氣一~十三層 → 築基 → 結丹 → 元嬰。修為足夠後嘗試突破,有成功率,失敗損失修為。
- 五行:金木水火土。金克木、木克土、土克水、水克火、火克金,相剋傷害 ×1.5。
- 門派:黃楓谷(木)、掩月宗(水)、巨劍門(金)、化刀塢(火)、天闕堡(土),各有入門仙法與加成。
- 探索:六大秘境(彩霞山 → 禁獸山古洞),採集材料/仙草,獵殺妖獸,偶得仙法秘笈。
- 煉器:收集材料 + 靈石煉製法器(青索劍、寒冰錐、火靈旗……直至青竹蜂雲劍)。
- 仙法秘笈:儲物袋內「參悟」即可習得,高階功法需相應境界。

## 結構

```
src/game/types.ts        核心型別 + 五行相剋表
src/game/data/realms.ts  境界數值(煉氣→元嬰)
src/game/data/sects.ts   五大門派
src/game/data/techniques.ts 仙法
src/game/data/items.ts   材料/仙草/丹藥/秘笈/法器
src/game/data/world.ts   妖獸/秘境/煉器配方
src/game/store.ts        Zustand 遊戲邏輯(戰鬥/採集/突破/煉器/坊市)+ localStorage 存檔
src/components/          UI(角色創建/狀態/戰鬥/行動頁籤/見聞錄)
```
# normal-human
