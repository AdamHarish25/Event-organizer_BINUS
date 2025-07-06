import { DataTypes, Sequelize } from "sequelize";

import { sequelize } from "../config/dbconfig.js";
import userModel from "./user.model.js";
import eventModel from "./event.model.js";
import refreshTokenModel from "./refreshToken.model.js";
import blacklistedTokenModel from "./blacklistToken.model.js";
import resetTokenModel from "./resetToken.model.js";
import OTPModel from "./otp.model.js";

const User = userModel(sequelize, DataTypes);
const Event = eventModel(sequelize, DataTypes);
const RefreshToken = refreshTokenModel(sequelize, DataTypes);
const BlacklistedToken = blacklistedTokenModel(sequelize, DataTypes);
const ResetToken = resetTokenModel(sequelize, DataTypes);
const OTP = OTPModel(sequelize, DataTypes);

const db = {};

db.User = User;
db.Event = Event;
db.RefreshToken = RefreshToken;
db.BlacklistedToken = BlacklistedToken;
db.ResetToken = ResetToken;
db.OTP = OTP;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

Object.values(db).forEach((model) => {
    if (model.associate) {
        model.associate(db);
    }
});

export default db;
