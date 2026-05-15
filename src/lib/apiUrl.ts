/**
 * 生产：可设 VITE_API_PROXY_URL 指向独立转发服务；否则走与 BASE 同源的 …/api/deepseek/chat/completions（由 Nginx 反代）。
 */
export function deepseekChatCompletionsUrl(): string {
  const proxyOrigin = import.meta.env.VITE_API_PROXY_URL?.trim();
  if (proxyOrigin) {
    const root = proxyOrigin.replace(/\/+$/, "");
    return `${root}/api/deepseek/chat/completions`;
  }

  const raw = import.meta.env.BASE_URL ?? "/";
  const base = raw.endsWith("/") && raw.length > 1 ? raw.slice(0, -1) : raw.replace(/\/$/, "");
  return `${base}/api/deepseek/chat/completions`;
}
