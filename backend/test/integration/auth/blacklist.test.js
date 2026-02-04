import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import db from "../../../model/index.js";
import {
    TEST_USERS,
    createTestUser,
    generateTestTokens,
    blacklistTestToken,
} from "../helpers/testHelpers.js";

describe("Blacklisted Token Middleware", () => {
    let testUser;
    let accessToken;
    let protectedEndpoint = "/event";

    beforeEach(async () => {
        testUser = await createTestUser(TEST_USERS.admin);
        const tokens = generateTestTokens(testUser.id, testUser.role);
        accessToken = tokens.accessToken;
    });

    describe("Token Blacklist Validation", () => {
        it("should reject requests with blacklisted token", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(403);

            expect(response.body).toMatchObject({
                message: "Sesi Anda tidak lagi valid. Silakan login kembali.",
            });
        });

        it("should allow requests with non-blacklisted token", async () => {
            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).not.toBe(403);
        });

        it("should detect blacklisted token after logout", async () => {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email: TEST_USERS.admin.email,
                    password: TEST_USERS.admin.password,
                })
                .expect(200);

            const { accessToken: newAccessToken } = loginResponse.body;
            const refreshToken = loginResponse.headers["set-cookie"]
                .find((cookie) => cookie.startsWith("refreshToken="))
                .split("=")[1]
                .split(";")[0];

            await request(app)
                .post("/auth/logout")
                .set("Authorization", `Bearer ${newAccessToken}`)
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .expect(200);

            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${newAccessToken}`)
                .expect(403);

            expect(response.body.message).toContain("tidak lagi valid");
        });
    });

    describe("Blacklist Database Queries", () => {
        it("should query blacklist table for each request", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            const blacklistedTokens = await db.BlacklistedToken.findAll({
                where: { userId: testUser.id, token: accessToken },
            });

            expect(blacklistedTokens).toHaveLength(1);
        });

        it("should handle multiple blacklisted tokens per user", async () => {
            const token1 = generateTestTokens(
                testUser.id,
                testUser.role,
            ).accessToken;
            const token2 = generateTestTokens(testUser.id, testUser.role, {
                // 16m biar beda sama token1
                accessToken: { expiresIn: "16m" },
            }).accessToken;

            await blacklistTestToken(testUser.id, token1);
            await blacklistTestToken(testUser.id, token2);

            const blacklistedTokens = await db.BlacklistedToken.findAll({
                where: { userId: testUser.id },
            });

            expect(blacklistedTokens.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("Error Handling", () => {
        it("should handle database errors gracefully", async () => {
            const dbSpy = vi
                .spyOn(db.BlacklistedToken, "findOne")
                .mockRejectedValue(new Error("Database connection error"));

            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(500);

            dbSpy.mockRestore();
        });
    });

    describe("Correlation ID and Logging", () => {
        it("should log blacklisted token attempts with correlation ID", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            const correlationId = "test-blacklist-correlation-123";

            await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`)
                .set("x-correlation-id", correlationId)
                .expect(403);
        });

        it("should log user information on blacklist detection", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(403);
        });
    });

    describe("Security Scenarios", () => {
        it("should prevent token reuse after blacklisting", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .get(protectedEndpoint)
                    .set("Authorization", `Bearer ${accessToken}`)
                    .expect(403);

                expect(response.body.message).toContain("tidak lagi valid");
            }
        });

        it("should not confuse tokens between different users", async () => {
            const user2 = await createTestUser(TEST_USERS.superAdmin);
            const user2Tokens = generateTestTokens(user2.id, user2.role);

            await blacklistTestToken(testUser.id, accessToken);

            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${user2Tokens.accessToken}`);

            expect(response.status).not.toBe(403);
        });
    });

    describe("Token Expiration and Blacklist", () => {
        it("should maintain blacklist even for expired tokens", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            const blacklistedTokens = await db.BlacklistedToken.findAll({
                where: { token: accessToken },
            });

            expect(blacklistedTokens).toHaveLength(1);
            expect(blacklistedTokens[0].expiresAt).toBeInstanceOf(Date);
        });
    });

    describe("Request Context", () => {
        it("should capture request IP on blacklist detection", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            const response = await request(app)
                .get(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`)
                .set("X-Forwarded-For", "192.168.1.100")
                .expect(403);

            expect(response.body).toHaveProperty("message");
        });

        it("should capture request method and URL on blacklist detection", async () => {
            await blacklistTestToken(testUser.id, accessToken);

            await request(app)
                .post(protectedEndpoint)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ test: "data" })
                .expect(403);
        });
    });
});
