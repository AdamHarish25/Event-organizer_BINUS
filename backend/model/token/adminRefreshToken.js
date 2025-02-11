import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";
import Admin from "../admin.js";
import sequelize from "../../config/dbconfg.js";

const AdminRefreshToken = sequelize.define(
    "AdminRefreshToken",
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

Admin.hasMany(AdminRefreshToken, {
    foreignKey: "ownerId",
    as: "adminTokenData",
    onDelete: "CASCADE",
});
AdminRefreshToken.belongsTo(Admin, { foreignKey: "ownerId" });

export default AdminRefreshToken;
