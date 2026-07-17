/** 组合式形象（捏脸）配置：脸型 / 肤色 / 发型 / 发色 / 胡子 / 身材 */

export interface AvatarConfig {
  face: string;
  skin: string;
  hair: string;
  hairColor: string;
  beard: string;
  body: string;
  /** 形象性别：影响身材部件与胡子可用性 */
  gender: "m" | "f";
  /** 渲染画风：AI 插画部件 or 矢量简笔（旧数据默认 svg） */
  style: "svg" | "art";
}

export const FACE_OPTIONS = [
  { id: "round", label: "圆脸" },
  { id: "oval", label: "瓜子脸" },
  { id: "square", label: "方脸" },
  { id: "long", label: "长脸" },
];

export const SKIN_OPTIONS = [
  { id: "#ffe3c8", label: "白皙" },
  { id: "#ffd2a6", label: "浅麦" },
  { id: "#eab676", label: "小麦" },
  { id: "#cd8f52", label: "蜜糖" },
  { id: "#a86c3a", label: "古铜" },
  { id: "#7a4a26", label: "深棕" },
];

export const HAIR_OPTIONS = [
  { id: "short", label: "短发" },
  { id: "long", label: "长发" },
  { id: "twintail", label: "双马尾" },
  { id: "bun", label: "丸子头" },
  { id: "curly", label: "卷发" },
  { id: "spiky", label: "刺猬头" },
  { id: "bald", label: "光头" },
];

export const HAIR_COLOR_OPTIONS = [
  { id: "#2c222b", label: "乌黑" },
  { id: "#5a3825", label: "深棕" },
  { id: "#a55728", label: "栗色" },
  { id: "#d9a441", label: "金色" },
  { id: "#cfcfd6", label: "银白" },
  { id: "#4a7dd9", label: "蓝色" },
  { id: "#e0669b", label: "粉色" },
  { id: "#3ba07c", label: "青绿" },
];

export const BEARD_OPTIONS = [
  { id: "none", label: "无胡子" },
  { id: "mustache", label: "八字胡" },
  { id: "goatee", label: "山羊胡" },
  { id: "full", label: "络腮胡" },
];

export const BODY_OPTIONS = [
  { id: "slim", label: "瘦削" },
  { id: "average", label: "标准" },
  { id: "strong", label: "健壮" },
  { id: "round", label: "圆润" },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  face: "round",
  skin: "#ffd2a6",
  hair: "short",
  hairColor: "#2c222b",
  beard: "none",
  body: "average",
  gender: "m",
  style: "art",
};

export function parseAvatarConfig(raw: string): AvatarConfig | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AvatarConfig>;
    if (!parsed || typeof parsed !== "object") return null;
    // 旧数据没有 style 字段：保持矢量渲染，避免形象突变
    return { ...DEFAULT_AVATAR, style: "svg", ...parsed };
  } catch {
    return null;
  }
}

function labelOf(options: { id: string; label: string }[], id: string): string {
  return options.find((o) => o.id === id)?.label ?? "";
}

/** 把形象配置转成中文描述，用于角色设定卡 */
export function describeAvatar(config: AvatarConfig): string {
  const parts = [
    labelOf(FACE_OPTIONS, config.face),
    labelOf(SKIN_OPTIONS, config.skin) && `${labelOf(SKIN_OPTIONS, config.skin)}肤色`,
    config.hair === "bald"
      ? "光头"
      : labelOf(HAIR_OPTIONS, config.hair) &&
        `${labelOf(HAIR_COLOR_OPTIONS, config.hairColor)}${labelOf(HAIR_OPTIONS, config.hair)}`,
    config.beard !== "none" && labelOf(BEARD_OPTIONS, config.beard),
    labelOf(BODY_OPTIONS, config.body) && `${labelOf(BODY_OPTIONS, config.body)}身材`,
  ];
  return parts.filter(Boolean).join("、");
}

export function randomAvatarConfig(style: AvatarConfig["style"] = "art"): AvatarConfig {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const gender = Math.random() < 0.5 ? "m" : "f";
  return {
    face: pick(FACE_OPTIONS).id,
    skin: pick(SKIN_OPTIONS).id,
    hair: pick(HAIR_OPTIONS).id,
    hairColor: pick(HAIR_COLOR_OPTIONS).id,
    // 女性形象不随机出胡子
    beard: gender === "f" || Math.random() < 0.75 ? "none" : pick(BEARD_OPTIONS).id,
    body: pick(BODY_OPTIONS).id,
    gender,
    style,
  };
}
