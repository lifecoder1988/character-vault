import { getDb } from "@/lib/db";
import type { Character, CharacterInput } from "@/lib/types";

export const runtime = "edge";

export async function GET(request: Request) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";

  let sql = "SELECT * FROM characters";
  const conditions: string[] = [];
  const binds: string[] = [];
  if (q) {
    conditions.push("(name LIKE ? OR role LIKE ? OR tags LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (tag) {
    conditions.push("tags LIKE ?");
    binds.push(`%${tag}%`);
  }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY updated_at DESC, id DESC";

  const { results } = await db.prepare(sql).bind(...binds).all<Character>();
  return Response.json({ characters: results });
}

export async function POST(request: Request) {
  const db = await getDb();
  const body = (await request.json()) as Partial<CharacterInput>;
  const name = body.name?.trim();
  if (!name) {
    return Response.json({ error: "人物姓名不能为空" }, { status: 400 });
  }

  const info = await db
    .prepare(
      `INSERT INTO characters
       (name, role, gender, age, appearance, personality, voice, backstory, appearance_prompt, tags, avatar_emoji, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      body.avatar_color || "#6366f1"
    )
    .run();

  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .bind(info.meta.last_row_id)
    .first<Character>();
  return Response.json({ character }, { status: 201 });
}
