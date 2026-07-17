-- Migration number: 0001 	 characters table
CREATE TABLE IF NOT EXISTS characters (
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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
