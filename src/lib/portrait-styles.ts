/** 立绘画风预设：详情页可选，拼进生图 prompt */
export const PORTRAIT_STYLES = [
  { id: "watercolor", label: "绘本水彩", prompt: "柔和的水彩儿童绘本插画风格" },
  { id: "anime", label: "日系动漫", prompt: "日系动漫赛璐璐上色风格，干净线条，鲜明色彩" },
  { id: "ink", label: "国风水墨", prompt: "中国风水墨淡彩插画风格，留白意境" },
  { id: "pixel", label: "像素风", prompt: "16-bit 复古像素画风格" },
  { id: "c3d", label: "3D 卡通", prompt: "皮克斯风格的 3D 卡通渲染，柔和打光" },
  { id: "flat", label: "扁平插画", prompt: "扁平矢量插画风格，明快色块，几何造型" },
] as const;

export type PortraitStyleId = (typeof PORTRAIT_STYLES)[number]["id"];

export function stylePromptOf(id: string | undefined): string {
  return (
    PORTRAIT_STYLES.find((s) => s.id === id)?.prompt ?? PORTRAIT_STYLES[0].prompt
  );
}
