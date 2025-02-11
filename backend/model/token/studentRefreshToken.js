import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";
import Student from "../student.js";
import sequelize from "../../config/dbconfg.js";

const StudentRefreshToken = sequelize.define(
    "StudentRefreshToken",
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
            type: DataTypes.CHAR(10),
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

Student.hasMany(StudentRefreshToken, {
    foreignKey: "ownerId",
    as: "studentTokenData",
    onDelete: "CASCADE",
});
StudentRefreshToken.belongsTo(Student, { foreignKey: "ownerId" });

export default StudentRefreshToken;
