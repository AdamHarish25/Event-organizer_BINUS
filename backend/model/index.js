import sequelize from "../config/dbconfg.js";
import { DataTypes } from "sequelize";

import userModel from "./user.js";
import eventModel from "./event.js";
import refreshTokenModel from "./token/refreshToken.js";
import blacklistedTokenModel from "./token/blackListToken.js";

const User = userModel(sequelize, DataTypes);
const Event = eventModel(sequelize, DataTypes);
const RefreshToken = refreshTokenModel(sequelize, DataTypes);
const BlacklistedToken = blacklistedTokenModel(sequelize, DataTypes);

const db = {};

db.User = User;
db.Event = Event;
db.RefreshToken = RefreshToken;
db.BlacklistedToken = BlacklistedToken;

Object.values(db).forEach((model) => {
    if (model.associate) {
        model.associate(db);
    }
});

export default db;
