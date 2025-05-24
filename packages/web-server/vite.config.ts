import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Enable Fast Refresh in development
      fastRefresh: mode === "development",
      // Optimize JSX in production
      jsxRuntime: "automatic",
    }),
  ],
  root: "src/client",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
    // Production optimizations
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: mode === "development",
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          d3: ["d3"],
        },
      },
    },
    // Build performance
    target: "esnext",
    reportCompressedSize: false,
  },
  server: {
    port: 3001,
    host: true,
    // Faster builds in development
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // Add health check logging
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("🔴 API Proxy Error:", err.message);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("🔄 API Request:", req.method, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/client"),
    },
  },
  // Dependency optimization
  optimizeDeps: {
    include: ["react", "react-dom", "d3"],
    exclude: [],
  },
  // Better error overlay
  define: {
    __DEV__: mode === "development",
  },
}));
