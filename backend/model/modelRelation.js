import Student from "./student.js";
import Admin from "./admin.js";
import SuperAdmin from "./superadmin.js";
import StudentRefreshToken from "./token/studentRefreshToken.js";
import AdminRefreshToken from "./token/adminRefreshToken.js";
import SuperAdminRefreshToken from "./token/superAdminRefreshToken.js";

import sequelize from "../config/dbconfg.js";

// Student.hasMany(StudentRefreshToken, {
//     foreignKey: "ownerId",
//     as: "studentTokenData",
//     onDelete: "CASCADE",
// });
// StudentRefreshToken.belongsTo(Student, { foreignKey: "ownerId" });

// Admin.hasMany(AdminRefreshToken, {
//     foreignKey: "ownerId",
//     as: "adminTokenData",
//     onDelete: "CASCADE",
// });
// AdminRefreshToken.belongsTo(Admin, { foreignKey: "ownerId" });

// SuperAdmin.hasMany(SuperAdminRefreshToken, {
//     foreignKey: "ownerId",
//     as: "superAdminTokenData",
//     onDelete: "CASCADE",
// });
// SuperAdminRefreshToken.belongsTo(SuperAdmin, { foreignKey: "ownerId" });

sequelize.sync({ force: true });
