-- Migration number: 0003 	 AI 立绘存储键
ALTER TABLE characters ADD COLUMN portrait_key TEXT NOT NULL DEFAULT '';
