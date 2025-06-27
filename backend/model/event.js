import { uuidv7 } from "uuidv7";

const eventModel = (sequelize, DataTypes) => {
    const Event = sequelize.define(
        "Event",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            creatorId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            eventName: {
                type: DataTypes.STRING(70),
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            time: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            location: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            performers: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM("accepted", "pending", "rejected"),
                allowNull: false,
                defaultValue: "pending",
            },
            imageUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                validate: {
                    isUrl: true,
                },
            },
        },
        {
            tableName: "events",
            timestamps: true,
        }
    );

    Event.associate = (models) => {
        Event.belongsTo(models.User, {
            foreignKey: "creatorId",
            onDelete: "CASCADE",
        });
    };

    return Event;
};

export default eventModel;
