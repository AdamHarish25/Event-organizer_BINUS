import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";
import SuperAdmin from "../superadmin.js";
import sequelize from "../../config/dbconfg.js";

const SuperAdminRefreshToken = sequelize.define(
    "SuperAdminRefreshToken",
    {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            allowNull: false,
            unique: true,
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRevoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);

SuperAdmin.hasMany(SuperAdminRefreshToken, {
    foreignKey: "ownerId",
    as: "superAdminTokenData",
    onDelete: "CASCADE",
});
SuperAdminRefreshToken.belongsTo(SuperAdmin, { foreignKey: "ownerId" });

export default SuperAdminRefreshToken;
