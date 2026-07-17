import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "@/lib/db";
import { describeAvatar, parseAvatarConfig } from "@/lib/avatar";
import type { Character } from "@/lib/types";

export const runtime = "edge";

type Params = { params: Promise<{ id: string }> };

function buildPortraitPrompt(c: Character): string {
  const avatar = parseAvatarConfig(c.avatar_config);
  const look = [avatar ? describeAvatar(avatar) : "", c.appearance]
    .filter(Boolean)
    .join("、");
  const parts = [
    `儿童绘本插画风格的角色立绘：${c.name}`,
    c.role && `角色定位：${c.role}`,
    c.gender && `性别：${c.gender}`,
    c.age && `年龄：${c.age}`,
    look && `外貌：${look}`,
    c.personality && `性格气质：${c.personality}`,
    c.appearance_prompt && `画面参考：${c.appearance_prompt}`,
  ].filter(Boolean);
  parts.push(
    "全身立绘，正面站立，柔和的水彩质感，干净的浅色纯色背景，构图居中，高质量，无文字，无水印"
  );
  return parts.join("。");
}

/** 生成立绘：调 Zhipu 生图 → 存 R2 → 记录 portrait_key */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = await getDb();

  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .bind(id)
    .first<Character>();
  if (!character) {
    return Response.json({ error: "人物不存在" }, { status: 404 });
  }
  if (!env.ZHIPUAI_API_KEY) {
    return Response.json(
      { error: "服务端未配置 ZHIPUAI_API_KEY，无法生成立绘" },
      { status: 503 }
    );
  }

  const prompt = buildPortraitPrompt(character);
  // glm-image 质量最好但收费；余额不足/限流时自动降级到免费的 cogview-3-flash
  const attempts = [
    { model: "glm-image", size: "1088x1472" },
    { model: "cogview-3-flash", size: "1024x1024" },
  ];
  let genRes: Response | null = null;
  for (const attempt of attempts) {
    genRes = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ZHIPUAI_API_KEY}`,
        },
        body: JSON.stringify({ model: attempt.model, prompt, size: attempt.size }),
      }
    );
    if (genRes.ok) break;
    const detail = await genRes.text();
    console.error("zhipu error", attempt.model, genRes.status, detail.slice(0, 300));
  }
  if (!genRes || !genRes.ok) {
    return Response.json(
      { error: `生图服务暂不可用（${genRes?.status ?? "?"}），请稍后重试` },
      { status: 502 }
    );
  }
  const genData = (await genRes.json()) as { data?: { url?: string }[] };
  const imageUrl = genData.data?.[0]?.url;
  if (!imageUrl) {
    return Response.json({ error: "生图服务未返回图片" }, { status: 502 });
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok || !imgRes.body) {
    return Response.json({ error: "下载生成图片失败" }, { status: 502 });
  }
  const bytes = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") ?? "image/png";
  const key = `portraits/${id}-${crypto.randomUUID()}.png`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType } });

  const oldKey = character.portrait_key;
  await db
    .prepare("UPDATE characters SET portrait_key = ? WHERE id = ?")
    .bind(key, id)
    .run();
  if (oldKey) {
    await env.BUCKET.delete(oldKey).catch(() => {});
  }

  return Response.json({ portrait_key: key });
}

/** 读取立绘：从 R2 回源 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = await getDb();

  const character = await db
    .prepare("SELECT portrait_key FROM characters WHERE id = ?")
    .bind(id)
    .first<{ portrait_key: string }>();
  if (!character?.portrait_key) {
    return new Response("not found", { status: 404 });
  }
  const object = await env.BUCKET.get(character.portrait_key);
  if (!object) {
    return new Response("not found", { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
