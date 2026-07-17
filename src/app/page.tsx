"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CharacterCard } from "@/components/character-card";
import type { Character } from "@/lib/types";
import { parseTags } from "@/lib/types";

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/characters");
    const data = (await res.json()) as { characters: Character[] };
    setCharacters(data.characters);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    characters.forEach((c) => parseTags(c.tags).forEach((t) => set.add(t)));
    return [...set];
  }, [characters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return characters.filter((c) => {
      const tags = parseTags(c.tags);
      if (activeTag && !tags.includes(activeTag)) return false;
      if (!q) return true;
      return [c.name, c.role, c.personality, c.appearance, c.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [characters, query, activeTag]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Users className="size-7 text-indigo-500" />
            人物库
          </h1>
          <p className="mt-1 text-muted-foreground">
            设定并存储你的故事人物，讲故事时一键复用
          </p>
        </div>
        <Button asChild data-testid="new-character">
          <Link href="/characters/new">
            <Plus className="size-4" />
            新建人物
          </Link>
        </Button>
      </header>

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索姓名、定位、标签…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="py-20 text-center text-muted-foreground">加载中…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <p className="text-4xl">🎭</p>
          <p className="mt-3 font-medium">
            {characters.length === 0 ? "还没有人物" : "没有匹配的人物"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {characters.length === 0
              ? "创建你的第一个故事人物，之后讲故事就能直接复用了"
              : "换个关键词或标签试试"}
          </p>
          {characters.length === 0 && (
            <Button asChild className="mt-5">
              <Link href="/characters/new">
                <Plus className="size-4" />
                新建人物
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="character-grid"
        >
          {filtered.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </main>
  );
}
