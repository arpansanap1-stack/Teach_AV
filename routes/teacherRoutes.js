const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Availability = require("../models/Availability");
const { verifyToken, requireSelfOrAdmin } = require("../middleware/auth");

// Get all teachers (public directory -- password is excluded by the schema)
router.get("/", async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ name: 1 });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teachers" });
    }
});

// Get teacher by ID (public)
router.get("/:id", async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teacher" });
    }
});

// Register a new faculty account (public -- this is the sign-up endpoint)
router.post("/", async (req, res) => {
    try {

        const { name, department, subject, email, room, password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const teacher = await Teacher.create({ name, department, subject, email, room, password });

        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        res.status(201).json(teacherObj);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "That email is already registered" });
        }
        res.status(400).json({
            message: "Failed to create teacher",
            error: error.message
        });
    }
});

// Delete teacher -- only that teacher themself, or an admin
router.delete("/:id", verifyToken, requireSelfOrAdmin("id"), async (req, res) => {
    try {

        const teacher = await Teacher.findByIdAndDelete(req.params.id);

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        await Availability.deleteMany({ teacher: req.params.id });

        res.json({ message: "Teacher and their availability removed" });

    } catch (error) {
        res.status(500).json({ message: "Failed to delete teacher" });
    }
});

module.exports = router;
