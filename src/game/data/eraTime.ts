// 恆紀年:與壽元同一套「1 小時真實時間 = 1 年」比例前進的全服世界時間,每 100 年為一紀。
// 純函式時間——恆紀年只會單調前進,不需要輪詢或寫回資料庫,直接由牆上時鐘算出即可。
// 玩家角色創建(含轉世重修)當下的恆紀年會存進存檔的 bornEra 欄位,代表「這一世修仙之旅」的起點。

// 遊戲世界「恆紀元年」起點,可調整(調整後所有玩家看到的恆紀年會一併平移)。
export const WORLD_EPOCH = new Date("2026-01-01T00:00:00Z");

const MS_PER_YEAR = 3600000; // 與壽元相同比例:1 小時真實時間 = 1 年

// 目前的恆紀年總年數(由創世紀元起算,單調遞增,不因任何遊戲內事件改變)
export function currentEraYears(): number {
  return Math.floor((Date.now() - WORLD_EPOCH.getTime()) / MS_PER_YEAR) + 1;
}

export interface EraLabel {
  era: number; // 第幾紀(每 100 年一紀)
  year: number; // 該紀內的第幾年(1~100)
}

// 每 100 年為一紀:第 1~100 年為恆紀 1紀,第 101~200 年為恆紀 2紀……
export function formatEra(totalYears: number): EraLabel {
  const t = Math.max(1, Math.floor(totalYears));
  return {
    era: Math.floor((t - 1) / 100) + 1,
    year: ((t - 1) % 100) + 1,
  };
}

// 顯示用字串,如「恆紀 3紀 42年」
export function eraLabelText(totalYears: number): string {
  const { era, year } = formatEra(totalYears);
  return `恆紀 ${era}紀 ${year}年`;
}
