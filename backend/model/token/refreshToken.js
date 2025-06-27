import { uuidv7 } from "uuidv7";

const refreshTokenModel = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define(
        "RefreshToken",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            ownerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isRevoked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            device: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: "refresh_tokens",
            timestamps: false,
        }
    );

    RefreshToken.associate = (models) => {
        RefreshToken.belongsTo(models.User, {
            foreignKey: "ownerId",
            onDelete: "CASCADE",
        });
    };

    return RefreshToken;
};

export default refreshTokenModel;
