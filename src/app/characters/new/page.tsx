"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterForm } from "@/components/character-form";

export default function NewCharacterPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" />
          返回人物库
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">新建人物</h1>
      <CharacterForm />
    </main>
  );
}
