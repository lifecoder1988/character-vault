"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Character, CharacterInput } from "@/lib/types";

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

const EMPTY: CharacterInput = {
  name: "",
  role: "",
  gender: "",
  age: "",
  appearance: "",
  personality: "",
  voice: "",
  backstory: "",
  appearance_prompt: "",
  tags: "",
  avatar_emoji: "🧒",
  avatar_color: "#6366f1",
};

export function CharacterForm({ character }: { character?: Character }) {
  const router = useRouter();
  const [form, setForm] = useState<CharacterInput>(
    character
      ? {
          name: character.name,
          role: character.role,
          gender: character.gender,
          age: character.age,
          appearance: character.appearance,
          personality: character.personality,
          voice: character.voice,
          backstory: character.backstory,
          appearance_prompt: character.appearance_prompt,
          tags: character.tags,
          avatar_emoji: character.avatar_emoji,
          avatar_color: character.avatar_color,
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof CharacterInput) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("请填写人物姓名");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        character ? `/api/characters/${character.id}` : "/api/characters",
        {
          method: character ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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
          style={{ backgroundColor: `${form.avatar_color}22` }}
        >
          {form.avatar_emoji || "🙂"}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-lg hover:bg-accent",
                  form.avatar_emoji === emoji && "bg-accent ring-1 ring-ring"
                )}
                onClick={() => set("avatar_emoji")(emoji)}
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
                  form.avatar_color === color && "ring-2 ring-ring ring-offset-2"
                )}
                style={{ backgroundColor: color }}
                onClick={() => set("avatar_color")(color)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">姓名 *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="例如：小狐狸阿丸"
            data-testid="input-name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">定位</Label>
          <Input
            id="role"
            value={form.role}
            onChange={(e) => set("role")(e.target.value)}
            placeholder="主角 / 配角 / 反派 / 导师…"
            data-testid="input-role"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">性别</Label>
          <Input
            id="gender"
            value={form.gender}
            onChange={(e) => set("gender")(e.target.value)}
            placeholder="男 / 女 / 其他"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="age">年龄</Label>
          <Input
            id="age"
            value={form.age}
            onChange={(e) => set("age")(e.target.value)}
            placeholder="例如：7岁 / 少年 / 上千岁"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="appearance">外貌描述</Label>
        <Textarea
          id="appearance"
          value={form.appearance}
          onChange={(e) => set("appearance")(e.target.value)}
          placeholder="毛色、衣着、体型、标志性特征……讲故事和配图时保持一致的关键"
          rows={3}
          data-testid="input-appearance"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="personality">性格特点</Label>
        <Textarea
          id="personality"
          value={form.personality}
          onChange={(e) => set("personality")(e.target.value)}
          placeholder="勇敢但莽撞、好奇心强、嘴硬心软……"
          rows={3}
          data-testid="input-personality"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="voice">说话风格 / 口头禅</Label>
        <Textarea
          id="voice"
          value={form.voice}
          onChange={(e) => set("voice")(e.target.value)}
          placeholder="例如：句尾总带着「哇呜」；喜欢用反问句"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="backstory">背景故事</Label>
        <Textarea
          id="backstory"
          value={form.backstory}
          onChange={(e) => set("backstory")(e.target.value)}
          placeholder="出身、经历、动机、与其他人物的关系……"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="appearance_prompt">出图提示词（可选）</Label>
        <Textarea
          id="appearance_prompt"
          value={form.appearance_prompt}
          onChange={(e) => set("appearance_prompt")(e.target.value)}
          placeholder="用于 AI 绘图保持形象一致，如：a small orange fox with a white-tipped tail, wearing a blue scarf, watercolor style"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tags">标签（逗号分隔）</Label>
        <Input
          id="tags"
          value={form.tags}
          onChange={(e) => set("tags")(e.target.value)}
          placeholder="童话, 动物, 森林"
          data-testid="input-tags"
        />
      </div>

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
