/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  ZHIPUAI_API_KEY?: string;
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv;
    cf: unknown;
    ctx: ExecutionContext;
  };
}
