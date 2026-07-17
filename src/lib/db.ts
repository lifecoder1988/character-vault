import { getRequestContext } from "@cloudflare/next-on-pages";

const SCHEMA = `CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  appearance TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT '',
  voice TEXT NOT NULL DEFAULT '',
  backstory TEXT NOT NULL DEFAULT '',
  appearance_prompt TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT NOT NULL DEFAULT '🙂',
  avatar_color TEXT NOT NULL DEFAULT '#6366f1',
  avatar_config TEXT NOT NULL DEFAULT '',
  portrait_key TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export async function getDb(): Promise<D1Database> {
  const { env } = getRequestContext();
  await env.DB.prepare(SCHEMA).run();
  // 兼容旧表结构；列已存在时 ALTER 会抛错，忽略即可
  for (const column of ["avatar_config", "portrait_key"]) {
    try {
      await env.DB.prepare(
        `ALTER TABLE characters ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`
      ).run();
    } catch {
      // duplicate column — 已是最新结构
    }
  }
  return env.DB;
}
