interface CloudflareEnv {
  DB: D1Database;
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv;
    cf: unknown;
    ctx: ExecutionContext;
  };
}
