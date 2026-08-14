const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const { verifyToken } = require("../middleware/auth");

// Allows the action only for the matching logged-in student, or an admin
function requireSelfStudent(req, res, next) {
    if (req.user.role === "admin") return next();
    if (req.user.role === "student" && req.user.id === req.params.id) return next();
    return res.status(403).json({ message: "Not authorized to do that" });
}

// Sign up (public)
router.post("/", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const student = await Student.create({ name, email, password });

        const studentObj = student.toObject();
        delete studentObj.password;

        res.status(201).json(studentObj);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "That email is already registered" });
        }
        res.status(400).json({
            message: "Failed to create account",
            error: error.message
        });
    }
});

// Get this student's favorite teachers (full teacher objects)
router.get("/:id/favorites", verifyToken, requireSelfStudent, async (req, res) => {
    try {

        const student = await Student.findById(req.params.id).populate("favorites");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json(student.favorites);

    } catch (error) {
        res.status(500).json({ message: "Failed to load favorites" });
    }
});

// Toggle a teacher in/out of favorites
router.post("/:id/favorites/:teacherId", verifyToken, requireSelfStudent, async (req, res) => {
    try {

        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const index = student.favorites.findIndex(
            f => f.toString() === req.params.teacherId
        );

        let favorited;

        if (index === -1) {
            student.favorites.push(req.params.teacherId);
            favorited = true;
        } else {
            student.favorites.splice(index, 1);
            favorited = false;
        }

        await student.save();

        res.json({ favorited });

    } catch (error) {
        res.status(500).json({ message: "Failed to update favorites" });
    }
});

module.exports = router;
