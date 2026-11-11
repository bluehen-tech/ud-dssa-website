import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      // Builder Path lessons are markdown files imported as strings (see the webpack rule in next.config.js).
      name: "markdown-as-string",
      transform(code, id) {
        if (!id.endsWith(".md")) return null;
        return { code: `export default ${JSON.stringify(code)};`, map: null };
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
