import { itemDefByDisplayName, isXuantianArtifact } from "@/game/data/items";
import { isXianItem, XIAN_ITEM_COLOR } from "@/game/types";

// 伺服器端組好的敘事文字(見聞錄、戰利品/突破/獵殺結果彈窗)常內嵌「【道具名稱】」token,
// 這裡反查對應道具,達真仙品級或玄天仙器者標色,其餘原樣顯示。全站共用同一份規則(見 types.ts 的 isXianItem)。
export function renderLootLine(line: string) {
  const parts = line.split(/(【[^】]+】)/g);
  return parts.map((part, i) => {
    const m = /^【([^】]+)】$/.exec(part);
    if (!m) return <span key={i}>{part}</span>;
    const item = itemDefByDisplayName(m[1]);
    const cls = item
      ? isXuantianArtifact(item.id)
        ? "text-xuantian"
        : isXianItem(item)
          ? XIAN_ITEM_COLOR
          : ""
      : "";
    return (
      <span key={i} className={cls || undefined}>
        {part}
      </span>
    );
  });
}
