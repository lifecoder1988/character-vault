import { describeAvatar, parseAvatarConfig } from "./avatar";
import type { Character } from "./types";
import { parseTags } from "./types";

/** 生成可直接粘贴给 AI 的"角色设定卡"，讲故事 / 做绘本时保持人物一致 */
export function buildStoryPrompt(c: Character): string {
  const lines: string[] = [`## 角色设定：${c.name}`];
  const field = (label: string, value: string) => {
    if (value.trim()) lines.push(`- **${label}**：${value.trim()}`);
  };
  field("定位", c.role);
  field("性别", c.gender);
  field("年龄", c.age);
  const avatar = parseAvatarConfig(c.avatar_config);
  const look = [avatar ? describeAvatar(avatar) : "", c.appearance]
    .filter(Boolean)
    .join("、");
  field("外貌", look);
  field("性格", c.personality);
  field("说话风格", c.voice);
  field("背景故事", c.backstory);
  const tags = parseTags(c.tags);
  if (tags.length) lines.push(`- **标签**：${tags.join("、")}`);
  if (c.appearance_prompt.trim()) {
    lines.push(`- **出图提示词**：${c.appearance_prompt.trim()}`);
  }
  lines.push("");
  lines.push("> 请在接下来的故事中使用该角色，并始终保持其外貌、性格与说话风格一致。");
  return lines.join("\n");
}
