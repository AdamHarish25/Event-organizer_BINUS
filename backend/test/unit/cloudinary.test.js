import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import dns from "node:dns";
import https from "https";
import cloudinary, {
    configureNetworkStrategy,
    createUploadAgent,
    TIMEOUT,
    DNS_SERVERS,
} from "../../config/cloudinary.js";

vi.mock("node:dns", () => ({
    default: {
        setServers: vi.fn(),
    },
}));

describe("Cloudinary Configuration Unit Test", () => {
    let logSpy;
    let warnSpy;
    let dnsSpy;

    beforeEach(() => {
        vi.clearAllMocks();

        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        dnsSpy = dns.setServers;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Network Strategy (DNS Bypass)", () => {
        it("HARUS mengaktifkan Google DNS dan LOG pesan di mode 'development'", () => {
            configureNetworkStrategy("development");

            expect(dnsSpy).toHaveBeenCalledTimes(1);
            expect(dnsSpy).toHaveBeenCalledWith(DNS_SERVERS);

            expect(logSpy).toHaveBeenCalledWith(
                "Menggunakan Google DNS untuk bypass ISP.",
            );
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("HARUS TIDAK melakukan apa-apa di mode 'production'", () => {
            configureNetworkStrategy("production");

            expect(dnsSpy).not.toHaveBeenCalled();

            expect(logSpy).not.toHaveBeenCalled();
        });

        it("HARUS menangkap error (Graceful Failure) dan WARN jika set DNS gagal", () => {
            dnsSpy.mockImplementationOnce(() => {
                throw new Error("System blocked DNS change");
            });

            configureNetworkStrategy("development");

            expect(dnsSpy).toHaveBeenCalled();
            expect(logSpy).not.toHaveBeenCalled();

            expect(warnSpy).toHaveBeenCalledWith(
                "Gagal set DNS custom, lanjut dengan default.",
            );
        });
    });

    describe("HTTP Agent Configuration", () => {
        it("HARUS membuat HTTPS Agent dengan keepAlive dan timeout 1 menit", () => {
            const agent = createUploadAgent();

            expect(agent).toBeInstanceOf(https.Agent);
            expect(agent.options.keepAlive).toBe(true);
            expect(agent.options.timeout).toBe(TIMEOUT);
            expect(agent.options.scheduling).toBe("lifo");
        });
    });

    describe("Final Cloudinary Integration", () => {
        it("HARUS menerapkan konfigurasi timeout dan agent ke object Cloudinary", () => {
            const config = cloudinary.config();

            expect(config.timeout).toBe(TIMEOUT);
            expect(config.secure).toBe(true);

            expect(config.agent).toBeDefined();
            expect(config.agent.options.keepAlive).toBe(true);
        });
    });
});
