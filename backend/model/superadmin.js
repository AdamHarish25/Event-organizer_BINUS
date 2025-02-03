import { DataTypes } from "sequelize";
import sequelize from "../config/dbconfg.js";

const SuperAdmin = sequelize.define(
    "SuperAdmin",
    {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            allowNull: false,
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
        freezeTableName: true,
        timestamps: false,
    }
);

export default SuperAdmin;
