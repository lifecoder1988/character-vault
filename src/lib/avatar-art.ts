/** AI 插画部件的分层布局与运行时染色（canvas 逐像素 multiply） */

import type { AvatarConfig } from "./avatar";

/** 各部件实测主色（离线量出）：染色时按 target/base 逐通道缩放 */
export const PART_BASE: Record<string, string> = {
  face_round: "#dda486",
  face_oval: "#d9a17f",
  face_square: "#e09e7c",
  face_long: "#cfa189",
  hair_short: "#523939",
  hair_long: "#7b6b71",
  hair_twintail: "#836262",
  hair_bun: "#6a6774",
  hair_curly: "#61616a",
  hair_spiky: "#63656d",
  beard_mustache: "#535166",
  beard_goatee: "#656374",
  beard_full: "#565f6b",
  body_slim: "#e2e2e1",
  body_average: "#d8d9d7",
  body_strong: "#d9dada",
  body_round: "#e0e3e0",
};

/** 肤色目标要按"部件原生肤色→目标肤色"缩放，基准即部件主色 */
export const FACE_BASE = "#ffd2a6";
export const HAIR_BASE = "#9a9a9a";
export const BODY_BASE = "#ffffff";

export interface PartLayout {
  /** 相对容器边长的宽度比例 */
  w: number;
  /** 中心点位置（相对容器） */
  cx: number;
  cy: number;
}

/** 手工对位的分层布局（部件图都归一化在 512 正方形画布内、居中） */
export const ART_LAYOUT: {
  body: Record<string, PartLayout>;
  face: Record<string, PartLayout>;
  hair: Record<string, PartLayout>;
  beard: Record<string, PartLayout>;
} = {
  body: {
    slim: { w: 0.6, cx: 0.5, cy: 0.86 },
    average: { w: 0.68, cx: 0.5, cy: 0.86 },
    strong: { w: 0.78, cx: 0.5, cy: 0.86 },
    round: { w: 0.76, cx: 0.5, cy: 0.86 },
  },
  face: {
    round: { w: 0.5, cx: 0.5, cy: 0.42 },
    oval: { w: 0.48, cx: 0.5, cy: 0.42 },
    square: { w: 0.5, cx: 0.5, cy: 0.42 },
    long: { w: 0.46, cx: 0.5, cy: 0.42 },
  },
  hair: {
    short: { w: 0.66, cx: 0.5, cy: 0.31 },
    long: { w: 0.7, cx: 0.5, cy: 0.42 },
    twintail: { w: 0.84, cx: 0.5, cy: 0.38 },
    bun: { w: 0.6, cx: 0.5, cy: 0.28 },
    curly: { w: 0.68, cx: 0.5, cy: 0.3 },
    spiky: { w: 0.66, cx: 0.5, cy: 0.28 },
  },
  beard: {
    mustache: { w: 0.2, cx: 0.5, cy: 0.5 },
    goatee: { w: 0.13, cx: 0.5, cy: 0.575 },
    full: { w: 0.38, cx: 0.5, cy: 0.52 },
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const tintCache = new Map<string, Promise<string>>();

/** 加载部件底图并按 target/base 通道比例染色，返回 dataURL（带缓存） */
export function tintedPartUrl(
  part: string,
  base: string,
  target: string
): Promise<string> {
  const cacheKey = `${part}|${base}|${target}`;
  const hit = tintCache.get(cacheKey);
  if (hit) return hit;

  const promise = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas 2d context"));
      ctx.drawImage(img, 0, 0);
      if (base.toLowerCase() !== target.toLowerCase()) {
        const [br, bg, bb] = hexToRgb(base);
        const [tr, tg, tb] = hexToRgb(target);
        const ratio = [tr / (br || 1), tg / (bg || 1), tb / (bb || 1)];
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] === 0) continue;
          px[i] = Math.min(255, px[i] * ratio[0]);
          px[i + 1] = Math.min(255, px[i + 1] * ratio[1]);
          px[i + 2] = Math.min(255, px[i + 2] * ratio[2]);
        }
        ctx.putImageData(data, 0, 0);
      }
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`load failed: ${part}`));
    img.src = `/avatar-parts/${part}.png`;
  });
  tintCache.set(cacheKey, promise);
  promise.catch(() => tintCache.delete(cacheKey));
  return promise;
}

export interface ArtLayer {
  part: string;
  base: string;
  target: string;
  layout: PartLayout;
}

/** 按配置组装渲染层（自下而上） */
export function artLayers(config: AvatarConfig, clothColor: string): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const push = (part: string, fallbackBase: string, target: string, layout?: PartLayout) => {
    if (!layout) return;
    layers.push({ part, base: PART_BASE[part] ?? fallbackBase, target, layout });
  };
  push(`body_${config.body}`, BODY_BASE, clothColor, ART_LAYOUT.body[config.body]);
  push(`face_${config.face}`, FACE_BASE, config.skin, ART_LAYOUT.face[config.face]);
  if (config.beard !== "none") {
    push(
      `beard_${config.beard}`,
      HAIR_BASE,
      config.hairColor,
      ART_LAYOUT.beard[config.beard]
    );
  }
  if (config.hair !== "bald") {
    push(
      `hair_${config.hair}`,
      HAIR_BASE,
      config.hairColor,
      ART_LAYOUT.hair[config.hair]
    );
  }
  return layers;
}
