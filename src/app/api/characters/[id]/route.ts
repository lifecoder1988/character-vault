import { getDb } from "@/lib/db";
import type { Character, CharacterInput } from "@/lib/types";

export const runtime = "edge";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .bind(id)
    .first<Character>();
  if (!character) {
    return Response.json({ error: "人物不存在" }, { status: 404 });
  }
  return Response.json({ character });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const body = (await request.json()) as Partial<CharacterInput>;
  const name = body.name?.trim();
  if (!name) {
    return Response.json({ error: "人物姓名不能为空" }, { status: 400 });
  }

  const existing = await db
    .prepare("SELECT id FROM characters WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) {
    return Response.json({ error: "人物不存在" }, { status: 404 });
  }

  await db
    .prepare(
      `UPDATE characters SET
       name = ?, role = ?, gender = ?, age = ?, appearance = ?, personality = ?,
       voice = ?, backstory = ?, appearance_prompt = ?, tags = ?,
       avatar_emoji = ?, avatar_color = ?, avatar_config = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      name,
      body.role ?? "",
      body.gender ?? "",
      body.age ?? "",
      body.appearance ?? "",
      body.personality ?? "",
      body.voice ?? "",
      body.backstory ?? "",
      body.appearance_prompt ?? "",
      body.tags ?? "",
      body.avatar_emoji || "🙂",
      body.avatar_color || "#6366f1",
      body.avatar_config ?? "",
      id
    )
    .run();

  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .bind(id)
    .first<Character>();
  return Response.json({ character });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.prepare("DELETE FROM characters WHERE id = ?").bind(id).run();
  return Response.json({ success: true });
}
