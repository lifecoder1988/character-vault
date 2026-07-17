import { describeAvatar, parseAvatarConfig } from "./avatar";
import type { Character } from "./types";

/** 组装立绘生图 prompt：客户端展示与服务端生成共用同一逻辑 */
export function buildPortraitPrompt(c: Character, stylePrompt: string): string {
  const avatar = parseAvatarConfig(c.avatar_config);
  const look = [avatar ? describeAvatar(avatar) : "", c.appearance]
    .filter(Boolean)
    .join("、");
  const parts = [
    `${stylePrompt}的角色立绘：${c.name}`,
    c.role && `角色定位：${c.role}`,
    c.gender && `性别：${c.gender}`,
    c.age && `年龄：${c.age}`,
    look && `外貌：${look}`,
    c.personality && `性格气质：${c.personality}`,
    c.appearance_prompt && `画面参考：${c.appearance_prompt}`,
  ].filter(Boolean);
  parts.push("全身立绘，正面站立，干净的浅色纯色背景，构图居中，高质量，无文字，无水印");
  return parts.join("。");
}
