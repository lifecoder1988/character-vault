"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  const [saving, setSaving] = useState(false);

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
      appearance: [...appearance, appearanceCustom.trim()].filter(Boolean).join("、"),
      personality: personality.join("、"),
      voice: voice.join("、"),
      backstory: [...backstory, backstoryCustom.trim()].filter(Boolean).join("；"),
      appearance_prompt: appearancePrompt,
      tags: [...tags, ...parseTags(tagsCustom)].join(", "),
      avatar_emoji: avatarEmoji,
      avatar_color: avatarColor,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: `${avatarColor}22` }}
        >
          {avatarEmoji}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-lg hover:bg-accent",
                  avatarEmoji === emoji && "bg-accent ring-1 ring-ring"
                )}
                onClick={() => setAvatarEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`选择颜色 ${color}`}
                className={cn(
                  "size-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                  avatarColor === color && "ring-2 ring-ring ring-offset-2"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setAvatarColor(color)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">姓名 *</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="点右边骰子随机一个，或自己起名"
            data-testid="input-name"
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setName(randomName())}
            data-testid="random-name"
            title="随机生成姓名"
          >
            <Dices className="size-4" />
            随机
          </Button>
        </div>
      </div>

      <ChipGroup label="定位" options={ROLE_OPTIONS} selected={role} onChange={setRole} single />

      <div className="grid gap-6 sm:grid-cols-2">
        <ChipGroup
          label="性别"
          options={GENDER_OPTIONS}
          selected={gender}
          onChange={setGender}
          single
        />
        <ChipGroup label="年龄" options={AGE_OPTIONS} selected={age} onChange={setAge} single />
      </div>

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

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} data-testid="submit-character">
          {saving ? "保存中…" : character ? "保存修改" : "创建人物"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
