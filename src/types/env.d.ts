/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  ZHIPUAI_API_KEY?: string;
  /** OpenAI 兼容生图服务（优先于 Zhipu） */
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_IMAGE_MODEL?: string;
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv;
    cf: unknown;
    ctx: ExecutionContext;
  };
}
