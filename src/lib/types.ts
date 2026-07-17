export interface Character {
  id: number;
  name: string;
  role: string;
  gender: string;
  age: string;
  appearance: string;
  personality: string;
  voice: string;
  backstory: string;
  appearance_prompt: string;
  tags: string;
  avatar_emoji: string;
  avatar_color: string;
  avatar_config: string;
  created_at: string;
  updated_at: string;
}

export type CharacterInput = Omit<Character, "id" | "created_at" | "updated_at">;

export function parseTags(tags: string): string[] {
  return tags
    .split(/[,，、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
