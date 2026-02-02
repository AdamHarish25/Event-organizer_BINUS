import { uuidv7 } from "uuidv7";
import { Op } from "sequelize";

const OTPModel = (sequelize, DataTypes) => {
    const Otp = sequelize.define(
        "Otp",
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
                onDelete: "CASCADE",
            },
            code: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            attempt: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            verifiedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            revokedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "otps",
            timestamps: true,
            indexes: [
                {
                    name: "otp_user_latest_idx",
                    fields: ["userId", "createdAt"],
                },
                {
                    name: "otp_expires_at_idx",
                    fields: ["expiresAt"],
                },
            ],
            scopes: {
                valid: {
                    where: {
                        verifiedAt: null,
                        revokedAt: null,
                        expiresAt: {
                            [Op.gt]: new Date(),
                        },
                    },
                },
            },
        },
    );

    Otp.associate = (models) => {
        Otp.belongsTo(models.User, { foreignKey: "userId" });
    };

    return Otp;
};

export default OTPModel;
