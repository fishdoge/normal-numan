// 滕符寫實圖(5.1 版):古青銅印器 × 修仙的 AI 繪圖,已去背並依格數比例(每格 96px)排版,
// 檔案在 public/images/tengfu/<id>.webp。不在清單內的滕符沿用 tengfuArt.ts 的 SVG 符面。
export const TENGFU_IMAGE_IDS: ReadonlySet<string> = new Set([
  "tf_canfu",
  "tf_chaoxi",
  "tf_dimai",
  "tf_foguang",
  "tf_hanshui",
  "tf_houtu",
  "tf_huanyang",
  "tf_huodan",
  "tf_jingang",
  "tf_juqi",
  "tf_kugu",
  "tf_leizhu",
  "tf_luoxing",
  "tf_moyan",
  "tf_qingmu",
  "tf_qingshen",
  "tf_ruijin",
  "tf_tianlei",
  "tf_xingchen",
  "tf_xuanmen",
  "tf_xuesha",
  "tf_xunhai",
  "tf_zhenhai",
]);

export const tengfuImageSrc = (id: string) => (TENGFU_IMAGE_IDS.has(id) ? `/images/tengfu/${id}.webp` : null);
