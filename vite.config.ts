import path from "node:path";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default defineConfig(({ mode }) => {
  const monorepoRoot = path.resolve(process.cwd(), "..");
  const env = { ...loadEnv(mode, monorepoRoot, ""), ...loadEnv(mode, process.cwd(), "") };
  const apiKey = env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || "";
  const base = env.VITE_BASE || "/";
  const raw = base.replace(/\/+$/, "") || "/";
  const baseNorm = raw === "" ? "/" : raw;
  const apiPathPrefix = baseNorm === "/" ? "/api/deepseek" : `${baseNorm}/api/deepseek`;

  const deepseekProxy: ProxyOptions = {
    target: "https://api.deepseek.com",
    changeOrigin: true,
    rewrite: (pathStr: string) => "/v1" + pathStr.replace(new RegExp("^" + escapeRegex(apiPathPrefix)), ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        if (apiKey) {
          proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
        }
      });
    },
  };

  return {
    base,
    plugins: [react()],
    server: {
      port: 5175,
      strictPort: true,
      proxy: {
        [apiPathPrefix]: deepseekProxy,
      },
    },
    preview: {
      port: 5175,
      strictPort: true,
      proxy: {
        [apiPathPrefix]: deepseekProxy,
      },
    },
  };
});
