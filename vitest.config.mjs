import { defineConfig } from "vitest/config";

export default defineConfig( {
  test: {
    environment: "node",
    include:     [ "test/**/*.test.mjs", ],
    setupFiles:  [ "test/setup/unit.mjs", ],
  },
} );