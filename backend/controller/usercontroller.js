import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Student from "../model/student.js";

function createToken() {
    return;
}

const userController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const role = req.query.role;

            let UserModel;
            if (role.toLowerCase() === "student") {
                UserModel = Student;
            } else if (role.toLowerCase() === "admin") {
                UserModel = Admin;
            } else if (role.toLowerCase() === "superadmin") {
                UserModel = SuperAdmin;
            } else {
                throw new Error("Role tidak valid !");
            }
            console.log(UserModel);
            const user = await Student.findOne({ where: { email } });
            res.send(user);
            // bcrypt.compareSync(password, hash);
        } catch (error) {
            return res.status(400).json({
                message: error,
                status: 400,
            });
        }
    },
};
export default userController;
