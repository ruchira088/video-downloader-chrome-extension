import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Handlers are tested against real DOM fixtures, so every suite gets a document.
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
})
