import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    proxy: { "/api": "http://localhost:4000" },
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === "demo" || process.env.VITE_DEMO === "true"
      ? [
          {
            name: "private-demo-indexing",
            transformIndexHtml(html) {
              return html.replace(
                "</head>",
                '<meta name="robots" content="noindex, nofollow"/></head>',
              );
            },
            generateBundle() {
              this.emitFile({
                type: "asset",
                fileName: "robots.txt",
                source: "User-agent: *\nDisallow: /\n",
              });
            },
          },
        ]
      : []),
  ],
}));
