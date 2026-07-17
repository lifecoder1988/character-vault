import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "@/lib/db";
import { describeAvatar, parseAvatarConfig } from "@/lib/avatar";
import { stylePromptOf } from "@/lib/portrait-styles";
import type { Character } from "@/lib/types";

export const runtime = "edge";

type Params = { params: Promise<{ id: string }> };

function buildPortraitPrompt(c: Character, stylePrompt: string): string {
  const avatar = parseAvatarConfig(c.avatar_config);
  const look = [avatar ? describeAvatar(avatar) : "", c.appearance]
    .filter(Boolean)
    .join("、");
  const parts = [
    `${stylePrompt}的角色立绘：${c.name}`,
    c.role && `角色定位：${c.role}`,
    c.gender && `性别：${c.gender}`,
    c.age && `年龄：${c.age}`,
    look && `外貌：${look}`,
    c.personality && `性格气质：${c.personality}`,
    c.appearance_prompt && `画面参考：${c.appearance_prompt}`,
  ].filter(Boolean);
  parts.push("全身立绘，正面站立，干净的浅色纯色背景，构图居中，高质量，无文字，无水印");
  return parts.join("。");
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** OpenAI 兼容生图服务（自建/代理），返回图片字节；失败返回 null */
async function tryOpenAI(
  env: CloudflareEnv,
  prompt: string
): Promise<ArrayBuffer | null> {
  if (!env.AI_BASE_URL || !env.AI_API_KEY) return null;
  try {
    const res = await fetch(`${env.AI_BASE_URL.replace(/\/$/, "")}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_IMAGE_MODEL || "gpt-image-2",
        prompt,
        size: "1024x1536",
      }),
    });
    if (!res.ok) {
      console.error("openai svc error", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const item = data.data?.[0];
    if (item?.b64_json) return base64ToBytes(item.b64_json).buffer as ArrayBuffer;
    if (item?.url) {
      const img = await fetch(item.url);
      if (img.ok) return await img.arrayBuffer();
    }
    return null;
  } catch (err) {
    console.error("openai svc unreachable", err);
    return null;
  }
}

/** Zhipu 生图，返回图片字节；失败返回 null */
async function tryZhipu(
  env: CloudflareEnv,
  prompt: string,
  model: string,
  size: string
): Promise<ArrayBuffer | null> {
  if (!env.ZHIPUAI_API_KEY) return null;
  try {
    const res = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ZHIPUAI_API_KEY}`,
        },
        body: JSON.stringify({ model, prompt, size }),
      }
    );
    if (!res.ok) {
      console.error("zhipu error", model, res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { data?: { url?: string }[] };
    const url = data.data?.[0]?.url;
    if (!url) return null;
    const img = await fetch(url);
    if (!img.ok) return null;
    return await img.arrayBuffer();
  } catch (err) {
    console.error("zhipu unreachable", err);
    return null;
  }
}

/** 生成立绘：自建 OpenAI 兼容服务 → Zhipu glm-image → 免费 cogview-3-flash，存 R2 */
export async function POST(request: Request, { params }: Params) {
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
  if (!env.ZHIPUAI_API_KEY && !(env.AI_BASE_URL && env.AI_API_KEY)) {
    return Response.json(
      { error: "服务端未配置任何生图服务，无法生成立绘" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { style?: string };
  const prompt = buildPortraitPrompt(character, stylePromptOf(body.style));

  // 主服务偶发繁忙（如并发生成）时先重试一次，再降级
  let provider = env.AI_IMAGE_MODEL || "gpt-image-2";
  let bytes = (await tryOpenAI(env, prompt)) ?? (await tryOpenAI(env, prompt));
  if (!bytes) {
    provider = "glm-image";
    bytes = await tryZhipu(env, prompt, "glm-image", "1088x1472");
  }
  if (!bytes) {
    provider = "cogview-3-flash";
    bytes = await tryZhipu(env, prompt, "cogview-3-flash", "1024x1024");
  }
  if (!bytes) {
    return Response.json(
      { error: "生图服务暂不可用，请稍后重试" },
      { status: 502 }
    );
  }
  console.log("portrait provider:", provider);
  const key = `portraits/${id}-${crypto.randomUUID()}.png`;
  try {
    // 用 Blob 传参：本地 dev 的 R2 代理对 ArrayBuffer 大参数会断言失败，Blob 走请求体直传
    await env.BUCKET.put(key, new Blob([bytes]), {
      httpMetadata: { contentType: "image/png" },
    });
  } catch (err) {
    console.error("r2 put failed:", err);
    return Response.json({ error: "存储立绘失败" }, { status: 500 });
  }

  const oldKey = character.portrait_key;
  await db
    .prepare("UPDATE characters SET portrait_key = ? WHERE id = ?")
    .bind(key, id)
    .run();
  if (oldKey) {
    await env.BUCKET.delete(oldKey).catch(() => {});
  }

  return Response.json({ portrait_key: key, provider });
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
