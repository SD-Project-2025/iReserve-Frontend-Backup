import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',  // Default is 'dist'
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  server: {
    port : 3000,
    proxy: {
      "/api/v1": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
