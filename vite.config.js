import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env.vite file
  const envVitePath = path.resolve(process.cwd(), '.env.vite');
  
  if (fs.existsSync(envVitePath)) {
    const envViteContent = fs.readFileSync(envVitePath, 'utf-8');
    envViteContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && key.startsWith('VITE_')) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    });
  }

  return {
    build: {
      outDir: "dist/static",
    },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      src: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: false,
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
  ],
};
});
