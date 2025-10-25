import { uuidv7 } from "uuidv7";

const notificationModel = (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        "Notification",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: () => uuidv7(),
                primaryKey: true,
            },
            eventId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "events",
                    key: "id",
                },
            },
            senderId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            recipientId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            feedback: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            payload: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            notificationType: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    isIn: [
                        [
                            "event_created",
                            "event_updated",
                            "event_deleted",
                            "event_pending",
                            "event_revised",
                            "event_approved",
                            "event_rejected",
                        ],
                    ],
                },
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "notifications",
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ["recipientId"],
                },
                {
                    fields: ["isRead"],
                },
            ],
        }
    );

    Notification.associate = (models) => {
        Notification.belongsTo(models.Event, {
            foreignKey: "eventId",
            as: "event",
            onDelete: "SET NULL",
        });

        Notification.belongsTo(models.User, {
            foreignKey: "senderId",
            as: "sender",
            onDelete: "SET NULL",
        });

        Notification.belongsTo(models.User, {
            foreignKey: "recipientId",
            as: "recipient",
            onDelete: "SET NULL",
        });
    };

    return Notification;
};

export default notificationModel;
