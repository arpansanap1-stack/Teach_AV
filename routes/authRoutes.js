const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Student login
router.post("/student/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const student = await Student.findOne({ email: email.toLowerCase() }).select("+password");

        if (!student || !(await student.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken({ id: student._id.toString(), role: "student" });

        res.json({
            token,
            student: {
                _id: student._id,
                name: student.name,
                email: student.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
});

// Teacher login
router.post("/teacher/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const teacher = await Teacher.findOne({ email: email.toLowerCase() }).select("+password");

        if (!teacher || !(await teacher.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken({ id: teacher._id.toString(), role: "teacher" });

        res.json({
            token,
            teacher: {
                _id: teacher._id,
                name: teacher.name,
                department: teacher.department,
                email: teacher.email,
                room: teacher.room
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
});

// Admin login -- single account, credentials live in .env rather than the database
router.post("/admin/login", (req, res) => {

    const { email, password } = req.body;

    if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const token = signToken({ id: "admin", role: "admin" });
        return res.json({ token });
    }

    res.status(401).json({ message: "Invalid admin credentials" });

});

module.exports = router;
