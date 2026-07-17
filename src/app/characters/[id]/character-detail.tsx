"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CharacterAvatar } from "@/components/character-avatar";
import { buildStoryPrompt } from "@/lib/prompt";
import { buildPortraitPrompt } from "@/lib/portrait-prompt";
import { describeAvatar, parseAvatarConfig } from "@/lib/avatar";
import { PORTRAIT_STYLES, stylePromptOf } from "@/lib/portrait-styles";
import type { Character } from "@/lib/types";
import { parseTags } from "@/lib/types";

function Section({ title, content }: { title: string; content: string }) {
  if (!content.trim()) return null;
  return (
    <div>
      <h2 className="mb-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [portraitStyle, setPortraitStyle] = useState<string>("watercolor");

  useEffect(() => {
    const saved = window.localStorage.getItem("portrait-style");
    if (saved && PORTRAIT_STYLES.some((s) => s.id === saved)) {
      setPortraitStyle(saved);
    }
  }, []);

  const changeStyle = (value: string) => {
    setPortraitStyle(value);
    window.localStorage.setItem("portrait-style", value);
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/characters/${id}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = (await res.json()) as { character: Character };
    setCharacter(data.character);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const copyPrompt = async () => {
    if (!character) return;
    await navigator.clipboard.writeText(buildStoryPrompt(character));
    toast.success(`已复制「${character.name}」的角色设定卡，粘贴给 AI 即可开始讲故事`);
  };

  const generatePortrait = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/characters/${id}/portrait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: portraitStyle }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "生成失败");
      }
      const data = (await res.json()) as { provider?: string };
      toast.success(
        data.provider ? `立绘生成完成（${data.provider}）` : "立绘生成完成！"
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/characters/${id}`, { method: "DELETE" });
    toast.success("人物已删除");
    router.push("/");
    router.refresh();
  };

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 text-center">
        <p className="text-4xl">🫥</p>
        <p className="mt-3 font-medium">人物不存在或已被删除</p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/">返回人物库</Link>
        </Button>
      </main>
    );
  }

  if (!character) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 text-center text-muted-foreground">
        加载中…
      </main>
    );
  }

  const tags = parseTags(character.tags);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" />
          返回人物库
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <CharacterAvatar
            config={character.avatar_config}
            emoji={character.avatar_emoji}
            color={character.avatar_color}
            size={72}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="character-name">
              {character.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {character.role && <Badge variant="secondary">{character.role}</Badge>}
              {character.gender && <Badge variant="outline">{character.gender}</Badge>}
              {character.age && <Badge variant="outline">{character.age}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyPrompt} data-testid="copy-prompt">
            <Copy className="size-4" />
            复制角色卡
          </Button>
          <Button asChild variant="outline">
            <Link href={`/characters/${character.id}/edit`} data-testid="edit-character">
              <Pencil className="size-4" />
              编辑
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="删除人物" data-testid="delete-character">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除「{character.name}」？</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后无法恢复，该人物的所有设定都会丢失。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete">
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          {character.portrait_key ? (
            <Image
              src={`/api/characters/${character.id}/portrait?v=${encodeURIComponent(character.portrait_key)}`}
              alt={`${character.name} 的立绘`}
              width={420}
              height={568}
              className="max-h-[560px] w-auto rounded-xl border shadow-sm"
              data-testid="portrait-image"
              unoptimized
            />
          ) : (
            <div className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed py-10 text-center">
              <p className="text-3xl">🖼️</p>
              <p className="text-sm text-muted-foreground">
                还没有立绘，用 AI 按人物设定画一张吧
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Select value={portraitStyle} onValueChange={changeStyle}>
              <SelectTrigger className="w-[130px]" data-testid="portrait-style">
                <SelectValue placeholder="画风" />
              </SelectTrigger>
              <SelectContent>
                {PORTRAIT_STYLES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={character.portrait_key ? "outline" : "default"}
              onClick={generatePortrait}
              disabled={generating}
              data-testid="generate-portrait"
            >
              <Sparkles className="size-4" />
              {generating
                ? "AI 绘制中，约需 1 分钟…"
                : character.portrait_key
                  ? "重新生成立绘"
                  : "生成 AI 立绘"}
            </Button>
          </div>
          <details className="w-full rounded-lg border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              查看完整生图 prompt
            </summary>
            <p
              className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed"
              data-testid="portrait-prompt"
            >
              {buildPortraitPrompt(character, stylePromptOf(portraitStyle))}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  buildPortraitPrompt(character, stylePromptOf(portraitStyle))
                );
                toast.success("已复制生图 prompt");
              }}
            >
              <Copy className="size-4" />
              复制 prompt
            </Button>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <Section
            title="外貌描述"
            content={(() => {
              const cfg = parseAvatarConfig(character.avatar_config);
              return [cfg ? describeAvatar(cfg) : "", character.appearance]
                .filter(Boolean)
                .join("、");
            })()}
          />
          <Section title="性格特点" content={character.personality} />
          <Section title="说话风格 / 口头禅" content={character.voice} />
          <Section title="背景故事" content={character.backstory} />
          <Section title="出图提示词" content={character.appearance_prompt} />
          {tags.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">标签</h2>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {!character.appearance &&
            !character.personality &&
            !character.voice &&
            !character.backstory &&
            !character.appearance_prompt &&
            tags.length === 0 && (
              <p className="text-muted-foreground">还没有填写设定，点击「编辑」完善人物吧。</p>
            )}
        </CardContent>
      </Card>
    </main>
  );
}
