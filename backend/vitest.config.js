import { defineConfig } from "vitest/config";
import { TEN_SECONDS } from "./constant/time.constant";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        testTimeout: TEN_SECONDS,
        restoreMocks: true,
        fileParallelism: false,
        maxConcurrency: 1,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
        globalSetup: ["./test/setup/globalSetup.js"],
        setupFiles: ["./test/setup/testSetup.js"],
    },
});
