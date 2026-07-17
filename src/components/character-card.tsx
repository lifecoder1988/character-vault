"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CharacterAvatar } from "@/components/character-avatar";
import { buildStoryPrompt } from "@/lib/prompt";
import type { Character } from "@/lib/types";
import { parseTags } from "@/lib/types";

export function CharacterCard({ character }: { character: Character }) {
  const tags = parseTags(character.tags);

  const copyPrompt = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(buildStoryPrompt(character));
    toast.success(`已复制「${character.name}」的角色设定卡`);
  };

  return (
    <Link href={`/characters/${character.id}`} data-testid="character-card">
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <CharacterAvatar
              config={character.avatar_config}
              emoji={character.avatar_emoji}
              color={character.avatar_color}
              size={48}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{character.name}</span>
                {character.role && (
                  <Badge variant="secondary" className="shrink-0">
                    {character.role}
                  </Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {character.personality || character.appearance || "暂无简介"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={copyPrompt}
              title="复制角色设定卡"
              aria-label="复制角色设定卡"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
