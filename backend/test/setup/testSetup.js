import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { sequelize } from "../../config/dbconfig.js";

beforeAll(async () => {
    try {
        await sequelize.authenticate();
    } catch (err) {
        console.error("Unable to connect database:", err);
    }
});

beforeEach(async () => {
    await sequelize.transaction(async (t) => {
        const options = { raw: true, transaction: t };

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", options);

        const [tables] = await sequelize.query("SHOW TABLES", options);
        const tableNames = tables
            .map((obj) => Object.values(obj)[0])
            .filter((name) => name !== "SequelizeMeta");

        await Promise.all(
            tableNames.map((name) =>
                sequelize.query(`DELETE FROM \`${name}\``, options),
            ),
        );

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", options);
    });
});

afterEach(async () => {});

afterAll(async () => {
    await sequelize.close();
});
