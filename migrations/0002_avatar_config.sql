-- Migration number: 0002 	 组合式捏脸配置（JSON）
ALTER TABLE characters ADD COLUMN avatar_config TEXT NOT NULL DEFAULT '';
