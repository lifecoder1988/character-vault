/** 人物创建的可选项池：让用户点选而不是打字 */

export const ROLE_OPTIONS = ["主角", "配角", "反派", "导师", "伙伴", "宠物", "路人"];

export const GENDER_OPTIONS = ["男", "女", "其他"];

export const AGE_OPTIONS = ["幼儿", "儿童", "少年", "青年", "中年", "老年", "古老存在"];

export const APPEARANCE_OPTIONS = [
  "高大",
  "矮小",
  "圆滚滚",
  "瘦削",
  "灵巧",
  "大眼睛",
  "有斑纹",
  "有翅膀",
  "有尾巴",
  "有独角",
  "戴眼镜",
  "戴围巾",
  "穿斗篷",
  "穿盔甲",
  "衣着朴素",
  "银白色",
  "橘色",
  "金色",
  "乌黑",
  "雪白",
  "蓝色",
];

export const PERSONALITY_OPTIONS = [
  "勇敢",
  "善良",
  "好奇",
  "机智",
  "冷静",
  "乐观",
  "温柔",
  "傲娇",
  "莽撞",
  "胆小",
  "固执",
  "天真",
  "高冷",
  "话痨",
  "慢性子",
  "嘴硬心软",
];

export const VOICE_OPTIONS = [
  "礼貌文雅",
  "大大咧咧",
  "言简意赅",
  "爱用反问",
  "满口成语",
  "结结巴巴",
  "奶声奶气",
  "老气横秋",
  "爱说冷笑话",
  "自带口头禅",
];

export const BACKSTORY_OPTIONS = [
  "平凡出身，怀揣大梦想",
  "王室后裔，流落民间",
  "孤儿，由师父抚养长大",
  "来自遥远的异世界",
  "背负着家族的使命",
  "失去记忆，寻找过去",
  "曾经的反派，改邪归正",
  "守护森林的古老存在",
  "第一次离开家去冒险",
  "有一个不能说的秘密",
];

export const TAG_OPTIONS = [
  "童话",
  "奇幻",
  "冒险",
  "科幻",
  "校园",
  "武侠",
  "动物",
  "森林",
  "海洋",
  "太空",
  "友情",
  "亲情",
  "成长",
  "龙",
  "机器人",
  "精灵",
];

const NAME_SPECIES = [
  "小狐狸",
  "小白兔",
  "小刺猬",
  "小浣熊",
  "月光龙",
  "云中鲸",
  "小机器人",
  "小女巫",
  "小骑士",
  "老槐树",
  "萤火虫",
  "小海豚",
];

const NAME_GIVEN = [
  "阿丸",
  "波波",
  "墨墨",
  "小汐",
  "咕噜",
  "岚岚",
  "阿枣",
  "星星",
  "闪闪",
  "豆豆",
  "阿澄",
  "小灯芯",
];

export function randomName(): string {
  return `${randomPick(NAME_SPECIES)}${randomPick(NAME_GIVEN)}`;
}

export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 随机取 min~max 个不重复选项 */
export function randomPickMany<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}
