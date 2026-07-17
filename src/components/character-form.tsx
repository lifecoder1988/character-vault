"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AvatarRender } from "@/components/character-avatar";
import type { AvatarConfig } from "@/lib/avatar";
import {
  BEARD_OPTIONS,
  BODY_OPTIONS,
  DEFAULT_AVATAR,
  FACE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_OPTIONS,
  SKIN_OPTIONS,
  parseAvatarConfig,
  randomAvatarConfig,
} from "@/lib/avatar";
import type { Character, CharacterInput } from "@/lib/types";
import { parseTags } from "@/lib/types";
import {
  ROLE_OPTIONS,
  GENDER_OPTIONS,
  AGE_OPTIONS,
  APPEARANCE_OPTIONS,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  BACKSTORY_OPTIONS,
  TAG_OPTIONS,
  randomName,
  randomPick,
  randomPickMany,
} from "@/lib/presets";

const EMOJI_PRESETS = ["🧒", "👧", "👦", "🧙", "🦊", "🐰", "🐻", "🐉", "🤖", "👸", "🦸", "🧚"];
const COLOR_PRESETS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

/** 把已存储的文本按分隔符拆回：命中选项池的进 selected，其余归入 custom */
function splitField(value: string, sep: string, known: string[]) {
  const parts = value
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    selected: parts.filter((p) => known.includes(p)),
    custom: parts.filter((p) => !known.includes(p)).join(sep),
  };
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input hover:bg-accent"
      )}
    >
      {label}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onChange,
  single = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange(single ? [option] : [...selected, option]);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            active={selected.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
    </div>
  );
}

/** 图片式选项网格：每个选项渲染一个应用了该选项的迷你小人 */
function AvatarOptionGrid({
  label,
  options,
  current,
  clothColor,
  selectedId,
  onSelect,
  patch,
}: {
  label: string;
  options: { id: string; label: string }[];
  current: AvatarConfig;
  clothColor: string;
  selectedId: string;
  onSelect: (id: string) => void;
  patch: (id: string) => Partial<AvatarConfig>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={selectedId === option.id}
            title={option.label}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border p-1.5 transition-colors hover:bg-accent",
              selectedId === option.id
                ? "border-primary bg-accent ring-1 ring-primary"
                : "border-input"
            )}
          >
            <AvatarRender
              config={{ ...current, ...patch(option.id) }}
              clothColor={clothColor}
              size={44}
            />
            <span className="text-[10px] text-muted-foreground">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SwatchGroup({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={selectedId === option.id}
            title={option.label}
            className={cn(
              "size-7 rounded-full border border-black/10 transition-transform hover:scale-110",
              selectedId === option.id && "ring-2 ring-ring ring-offset-2"
            )}
            style={{ backgroundColor: option.id }}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewSection({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export function CharacterForm({ character }: { character?: Character }) {
  const router = useRouter();

  const appearanceInit = splitField(character?.appearance ?? "", "、", APPEARANCE_OPTIONS);
  const personalityInit = splitField(character?.personality ?? "", "、", PERSONALITY_OPTIONS);
  const voiceInit = splitField(character?.voice ?? "", "、", VOICE_OPTIONS);
  const backstoryInit = splitField(character?.backstory ?? "", "；", BACKSTORY_OPTIONS);
  const tagsInit = (() => {
    const all = parseTags(character?.tags ?? "");
    return {
      selected: all.filter((t) => TAG_OPTIONS.includes(t)),
      custom: all.filter((t) => !TAG_OPTIONS.includes(t)).join(", "),
    };
  })();

  const [name, setName] = useState(character?.name ?? "");
  const [role, setRole] = useState<string[]>(character?.role ? [character.role] : []);
  const [gender, setGender] = useState<string[]>(character?.gender ? [character.gender] : []);
  const [age, setAge] = useState<string[]>(character?.age ? [character.age] : []);
  const [appearance, setAppearance] = useState<string[]>(appearanceInit.selected);
  const [appearanceCustom, setAppearanceCustom] = useState(appearanceInit.custom);
  const [personality, setPersonality] = useState<string[]>(personalityInit.selected);
  const [voice, setVoice] = useState<string[]>(voiceInit.selected);
  const [backstory, setBackstory] = useState<string[]>(backstoryInit.selected);
  const [backstoryCustom, setBackstoryCustom] = useState(backstoryInit.custom);
  const [tags, setTags] = useState<string[]>(tagsInit.selected);
  const [tagsCustom, setTagsCustom] = useState(tagsInit.custom);
  const [appearancePrompt, setAppearancePrompt] = useState(
    character?.appearance_prompt ?? ""
  );
  const [avatarEmoji, setAvatarEmoji] = useState(character?.avatar_emoji || "🧒");
  const [avatarColor, setAvatarColor] = useState(character?.avatar_color || "#6366f1");
  const [avatar, setAvatar] = useState<AvatarConfig>(
    () => parseAvatarConfig(character?.avatar_config ?? "") ?? DEFAULT_AVATAR
  );
  const [saving, setSaving] = useState(false);

  const patchAvatar = (patch: Partial<AvatarConfig>) =>
    setAvatar((a) => ({ ...a, ...patch }));

  const composed = useMemo(
    () => ({
      appearance: [...appearance, appearanceCustom.trim()].filter(Boolean).join("、"),
      personality: personality.join("、"),
      voice: voice.join("、"),
      backstory: [...backstory, backstoryCustom.trim()].filter(Boolean).join("；"),
      tags: [...tags, ...parseTags(tagsCustom)],
    }),
    [appearance, appearanceCustom, personality, voice, backstory, backstoryCustom, tags, tagsCustom]
  );

  const randomizeAll = () => {
    setName(randomName());
    setAvatarEmoji(randomPick(EMOJI_PRESETS));
    setAvatarColor(randomPick(COLOR_PRESETS));
    setAvatar(randomAvatarConfig());
    setRole([randomPick(ROLE_OPTIONS)]);
    setGender([randomPick(GENDER_OPTIONS)]);
    setAge([randomPick(AGE_OPTIONS)]);
    setAppearance(randomPickMany(APPEARANCE_OPTIONS, 2, 4));
    setAppearanceCustom("");
    setPersonality(randomPickMany(PERSONALITY_OPTIONS, 2, 3));
    setVoice(randomPickMany(VOICE_OPTIONS, 1, 1));
    setBackstory(randomPickMany(BACKSTORY_OPTIONS, 1, 2));
    setBackstoryCustom("");
    setTags(randomPickMany(TAG_OPTIONS, 2, 3));
    setTagsCustom("");
    toast("🎲 捏好了一个，随时微调");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("请填写或随机生成一个姓名");
      return;
    }
    const payload: CharacterInput = {
      name: name.trim(),
      role: role[0] ?? "",
      gender: gender[0] ?? "",
      age: age[0] ?? "",
      appearance: composed.appearance,
      personality: composed.personality,
      voice: composed.voice,
      backstory: composed.backstory,
      appearance_prompt: appearancePrompt,
      tags: composed.tags.join(", "),
      avatar_emoji: avatarEmoji,
      avatar_color: avatarColor,
      avatar_config: JSON.stringify(avatar),
    };
    setSaving(true);
    try {
      const res = await fetch(
        character ? `/api/characters/${character.id}` : "/api/characters",
        {
          method: character ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "保存失败");
      }
      const data = (await res.json()) as { character: Character };
      toast.success(character ? "人物已更新" : "人物已创建");
      router.push(`/characters/${data.character.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* 左侧：捏人控制台 */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={randomizeAll}
              data-testid="randomize-all"
            >
              <Sparkles className="size-4" />
              随机捏一个
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">姓名 *</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="点骰子随机，或自己起名"
                data-testid="input-name"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setName(randomName())}
                data-testid="random-name"
                title="随机生成姓名"
                aria-label="随机生成姓名"
              >
                <Dices className="size-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="look">
            <TabsList className="w-full">
              <TabsTrigger value="look" className="flex-1">
                形象
              </TabsTrigger>
              <TabsTrigger value="traits" className="flex-1">
                特质
              </TabsTrigger>
              <TabsTrigger value="story" className="flex-1">
                背景
              </TabsTrigger>
            </TabsList>

            <TabsContent value="look" className="mt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>画风</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "art", label: "AI 插画" },
                      { id: "svg", label: "矢量简笔" },
                    ] as const
                  ).map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      active={avatar.style === option.id}
                      onClick={() => patchAvatar({ style: option.id })}
                    />
                  ))}
                </div>
              </div>
              <AvatarOptionGrid
                label="脸型"
                options={FACE_OPTIONS}
                current={avatar}
                clothColor={avatarColor}
                selectedId={avatar.face}
                onSelect={(id) => patchAvatar({ face: id })}
                patch={(id) => ({ face: id })}
              />
              <SwatchGroup
                label="肤色"
                options={SKIN_OPTIONS}
                selectedId={avatar.skin}
                onSelect={(id) => patchAvatar({ skin: id })}
              />
              <AvatarOptionGrid
                label="发型"
                options={HAIR_OPTIONS}
                current={avatar}
                clothColor={avatarColor}
                selectedId={avatar.hair}
                onSelect={(id) => patchAvatar({ hair: id })}
                patch={(id) => ({ hair: id })}
              />
              <SwatchGroup
                label="发色"
                options={HAIR_COLOR_OPTIONS}
                selectedId={avatar.hairColor}
                onSelect={(id) => patchAvatar({ hairColor: id })}
              />
              <AvatarOptionGrid
                label="胡子"
                options={BEARD_OPTIONS}
                current={avatar}
                clothColor={avatarColor}
                selectedId={avatar.beard}
                onSelect={(id) => patchAvatar({ beard: id })}
                patch={(id) => ({ beard: id })}
              />
              <AvatarOptionGrid
                label="身材"
                options={BODY_OPTIONS}
                current={avatar}
                clothColor={avatarColor}
                selectedId={avatar.body}
                onSelect={(id) => patchAvatar({ body: id })}
                patch={(id) => ({ body: id })}
              />
              <SwatchGroup
                label="服装 / 主题色"
                options={COLOR_PRESETS.map((c) => ({ id: c, label: `颜色 ${c}` }))}
                selectedId={avatarColor}
                onSelect={setAvatarColor}
              />
              <div className="flex flex-col gap-2">
                <ChipGroup
                  label="外貌特征（可多选）"
                  options={APPEARANCE_OPTIONS}
                  selected={appearance}
                  onChange={setAppearance}
                />
                <Input
                  value={appearanceCustom}
                  onChange={(e) => setAppearanceCustom(e.target.value)}
                  placeholder="其他外貌补充（可选）"
                  data-testid="input-appearance-custom"
                />
              </div>
            </TabsContent>

            <TabsContent value="traits" className="mt-4 flex flex-col gap-5">
              <ChipGroup
                label="定位"
                options={ROLE_OPTIONS}
                selected={role}
                onChange={setRole}
                single
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <ChipGroup
                  label="性别"
                  options={GENDER_OPTIONS}
                  selected={gender}
                  onChange={setGender}
                  single
                />
                <ChipGroup
                  label="年龄"
                  options={AGE_OPTIONS}
                  selected={age}
                  onChange={setAge}
                  single
                />
              </div>
              <ChipGroup
                label="性格（可多选）"
                options={PERSONALITY_OPTIONS}
                selected={personality}
                onChange={setPersonality}
              />
              <ChipGroup
                label="说话风格（可多选）"
                options={VOICE_OPTIONS}
                selected={voice}
                onChange={setVoice}
              />
            </TabsContent>

            <TabsContent value="story" className="mt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <ChipGroup
                  label="背景故事（可多选组合）"
                  options={BACKSTORY_OPTIONS}
                  selected={backstory}
                  onChange={setBackstory}
                />
                <Textarea
                  value={backstoryCustom}
                  onChange={(e) => setBackstoryCustom(e.target.value)}
                  placeholder="其他背景补充（可选）"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <ChipGroup
                  label="标签（可多选）"
                  options={TAG_OPTIONS}
                  selected={tags}
                  onChange={setTags}
                />
                <Input
                  value={tagsCustom}
                  onChange={(e) => setTagsCustom(e.target.value)}
                  placeholder="其他标签，逗号分隔（可选）"
                  data-testid="input-tags-custom"
                />
              </div>
              <details className="rounded-lg border px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">
                  出图提示词（可选，用于 AI 绘图保持形象一致）
                </summary>
                <Textarea
                  className="mt-3"
                  value={appearancePrompt}
                  onChange={(e) => setAppearancePrompt(e.target.value)}
                  placeholder="如：a small orange fox with a white-tipped tail, wearing a blue scarf, watercolor style"
                  rows={3}
                />
              </details>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧：实时预览 */}
        <aside className="h-fit lg:sticky lg:top-6">
          <Card data-testid="preview-card">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className="flex size-28 items-center justify-center overflow-hidden rounded-full ring-4"
                  style={
                    {
                      backgroundColor: `${avatarColor}22`,
                      "--tw-ring-color": `${avatarColor}55`,
                    } as React.CSSProperties
                  }
                  data-testid="preview-avatar"
                >
                  <AvatarRender config={avatar} clothColor={avatarColor} size={104} />
                </div>
                <p className="text-lg font-semibold" data-testid="preview-name">
                  {name.trim() || "未命名人物"}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {role[0] && <Badge variant="secondary">{role[0]}</Badge>}
                  {gender[0] && <Badge variant="outline">{gender[0]}</Badge>}
                  {age[0] && <Badge variant="outline">{age[0]}</Badge>}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <PreviewSection title="外貌" text={composed.appearance} />
                <PreviewSection title="性格" text={composed.personality} />
                <PreviewSection title="说话风格" text={composed.voice} />
                <PreviewSection title="背景" text={composed.backstory} />
                {composed.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {composed.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {!composed.appearance &&
                  !composed.personality &&
                  !composed.backstory &&
                  composed.tags.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      左边点一点，人物就在这里成型 ✨
                    </p>
                  )}
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={saving} data-testid="submit-character">
                  {saving ? "保存中…" : character ? "保存修改" : "就是 TA 了，创建！"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
}
