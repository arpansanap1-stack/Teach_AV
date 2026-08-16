const express = require("express");
const router = express.Router();

const Availability = require("../models/Availability");
const { verifyToken } = require("../middleware/auth");

// Get availability for a teacher (public -- only today-or-future, available slots)
router.get("/:teacherId", async (req, res) => {
    try {

        const today = new Date().toISOString().slice(0, 10);

        const availability = await Availability.find({
            teacher: req.params.teacherId,
            status: "available",
            date: { $gte: today }
        }).sort({
            date: 1,
            startTime: 1
        });

        res.json(availability);

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch availability" });
    }
});

// Add availability -- must be logged in, and teachers can only add for themselves
router.post("/", verifyToken, async (req, res) => {
    try {

        const { teacher, date, startTime, endTime, note } = req.body;

        if (req.user.role === "teacher" && req.user.id !== teacher) {
            return res.status(403).json({ message: "You can only add availability for your own profile" });
        }

        if (!teacher || !date || !startTime || !endTime) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const availability = await Availability.create({ teacher, date, startTime, endTime, note });

        res.status(201).json(availability);

    } catch (error) {
        res.status(400).json({
            message: "Failed to add availability",
            error: error.message
        });
    }
});

// Update availability -- must be logged in, self or admin
router.put("/:id", verifyToken, async (req, res) => {
    try {

        const existing = await Availability.findById(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: "Availability not found" });
        }

        if (req.user.role === "teacher" && req.user.id !== existing.teacher.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this slot" });
        }

        const updated = await Availability.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updated);

    } catch (error) {
        res.status(400).json({
            message: "Failed to update availability",
            error: error.message
        });
    }
});

// Delete availability -- must be logged in, self or admin
router.delete("/:id", verifyToken, async (req, res) => {
    try {

        const existing = await Availability.findById(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: "Availability not found" });
        }

        if (req.user.role === "teacher" && req.user.id !== existing.teacher.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this slot" });
        }

        await Availability.findByIdAndDelete(req.params.id);

        res.json({ message: "Availability removed" });

    } catch (error) {
        res.status(500).json({ message: "Failed to delete availability" });
    }
});

module.exports = router;
