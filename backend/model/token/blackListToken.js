import { uuidv7 } from "uuidv7";

const blacklistedTokenModel = (sequelize, DataTypes) => {
    const BlacklistedToken = sequelize.define(
        "BlacklistedToken",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            reason: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: "blacklisted_tokens",
            timestamps: true,
            indexes: [
                {
                    fields: ["expiresAt"],
                    name: "expires_at_idx",
                },
            ],
        }
    );

    BlacklistedToken.associate = (models) => {
        BlacklistedToken.belongsTo(models.User, {
            foreignKey: "userId",
            onDelete: "CASCADE",
        });
    };

    return BlacklistedToken;
};

export default blacklistedTokenModel;
