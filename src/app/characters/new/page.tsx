"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterForm } from "@/components/character-form";

export default function NewCharacterPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" />
          返回人物库
        </Link>
      </Button>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">捏一个新人物</h1>
      <p className="mb-6 text-muted-foreground">
        像游戏捏人一样：左边点选，右边实时成型
      </p>
      <CharacterForm />
    </main>
  );
}
