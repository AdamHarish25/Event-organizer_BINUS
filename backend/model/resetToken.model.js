import { uuidv7 } from "uuidv7";

const resetTokenModel = (sequelize, DataTypes) => {
    const ResetToken = sequelize.define(
        "ResetToken",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "reset_tokens",
            timestamps: false,
        }
    );

    ResetToken.associate = (models) => {
        ResetToken.belongsTo(models.User, { foreignKey: "userId" });
    };

    return ResetToken;
};

export default resetTokenModel;
