import { uuidv7 } from "uuidv7";

const userModel = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            studentId: {
                type: DataTypes.CHAR(10),
                unique: true,
            },
            firstName: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING(64),
                allowNull: false,
                validate: {
                    len: [8, 64],
                },
            },
        },
        {
            tableName: "users",
            timestamps: false,
        }
    );

    User.associate = (models) => {
        User.hasMany(models.RefreshToken, {
            foreignKey: "ownerId",
            onDelete: "CASCADE",
        });

        User.hasMany(models.Event, {
            foreignKey: "creatorId",
            onDelete: "CASCADE",
        });
    };

    return User;
};

export default userModel;
