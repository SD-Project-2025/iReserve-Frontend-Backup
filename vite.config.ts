import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api/v1": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    // Add the process.env polyfill
    define: {
      'process.env': JSON.stringify({
        ...env,
        NODE_ENV: mode,
      }),
    },
  };
});