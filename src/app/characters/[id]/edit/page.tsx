"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterForm } from "@/components/character-form";
import type { Character } from "@/lib/types";

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>();
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href={`/characters/${id}`}>
          <ArrowLeft className="size-4" />
          返回详情
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">编辑人物</h1>
      {notFound ? (
        <p className="text-muted-foreground">人物不存在或已被删除。</p>
      ) : character ? (
        <CharacterForm character={character} />
      ) : (
        <p className="text-muted-foreground">加载中…</p>
      )}
    </main>
  );
}
