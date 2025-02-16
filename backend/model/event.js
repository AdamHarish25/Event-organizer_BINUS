import { DataTypes } from "sequelize";
import sequelize from "../config/dbconfg.js";

const Event = sequelize.define(
    "Event",
    {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            autoIncrement: true,
        },
        eventName: {
            type: DataTypes.STRING(70),
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        performers: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [["accepted", "pending", "rejected"]],
            },
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);

export default Event;
