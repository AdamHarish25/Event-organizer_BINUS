import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        testTimeout: 10000,
        restoreMocks: true,
        fileParallelism: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
        globalSetup: ["./test/setup/globalSetup.js"],
        setupFiles: ["./test/setup/testSetup.js"],
    },
});
