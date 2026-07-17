"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Trash2 } from "lucide-react";
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
import { buildStoryPrompt } from "@/lib/prompt";
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

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [notFound, setNotFound] = useState(false);

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
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-3xl"
            style={{ backgroundColor: `${character.avatar_color}22` }}
          >
            {character.avatar_emoji || "🙂"}
          </div>
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

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <Section title="外貌描述" content={character.appearance} />
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
