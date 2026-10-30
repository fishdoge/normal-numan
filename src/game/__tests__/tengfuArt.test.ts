// 滕符外觀(5.1 版):每張滕符都要有自己的圖騰,且彼此不重複;同一張每次產生的 SVG 必須相同(伺服器與瀏覽器渲染一致)
import { describe, it, expect } from "vitest";
import { TENGFU } from "../data/tengfu";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TENGFU_CELL, hasTengfuArt, tengfuSvg } from "../../components/tengfuArt";
import { TENGFU_IMAGE_IDS, tengfuImageSrc } from "../../components/tengfuImages";

describe("滕符外觀", () => {
  it("每一張滕符都有專屬的外觀", () => {
    expect(TENGFU.filter((d) => !hasTengfuArt(d.id)).map((d) => d.id)).toEqual([]);
  });

  it("49 張的 SVG 彼此都不同", () => {
    const strip = (svg: string) => svg.replace(/tf[bncme]-[a-z0-9_]+/gi, "");
    const set = new Set(TENGFU.map((d) => strip(tengfuSvg(d))));
    expect(set.size).toBe(TENGFU.length);
  });

  it("viewBox 依形狀決定,符頭金屬箍的鉚釘數等於品階", () => {
    for (const d of TENGFU) {
      const svg = tengfuSvg(d);
      expect(svg, d.id).toContain(`viewBox="0 0 ${d.w * TENGFU_CELL} ${d.h * TENGFU_CELL}"`);
      expect(svg, d.id).not.toContain("NaN");
      expect(svg.match(/class="tf-rivet"/g)?.length, d.id).toBe(d.tier);
      expect(svg, d.id).toContain(d.w * d.h === 1 ? `>${d.name[0]}</text>` : d.name.slice(-1));
    }
  });

  it("寫實圖清單裡的滕符都存在,圖檔也都在 public/images/tengfu", () => {
    const ids = new Set(TENGFU.map((d) => d.id));
    for (const id of TENGFU_IMAGE_IDS) {
      expect(ids.has(id), id).toBe(true);
      expect(existsSync(join(process.cwd(), "public", tengfuImageSrc(id)!)), id).toBe(true);
    }
  });
});
