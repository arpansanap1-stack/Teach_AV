const express = require("express");
const router = express.Router();

const Complaint = require("../models/Complaint");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Submit a complaint -- students only
router.post("/", verifyToken, async (req, res) => {
    try {

        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can file complaints" });
        }

        const { teacher, subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: "Subject and message are required" });
        }

        const complaint = await Complaint.create({
            student: req.user.id,
            teacher: teacher || null,
            subject,
            message
        });

        res.status(201).json(complaint);

    } catch (error) {
        res.status(400).json({
            message: "Failed to submit complaint",
            error: error.message
        });
    }
});

// A student's own complaint history
router.get("/mine", verifyToken, async (req, res) => {
    try {

        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const complaints = await Complaint.find({ student: req.user.id })
            .populate("teacher", "name")
            .sort({ createdAt: -1 });

        res.json(complaints);

    } catch (error) {
        res.status(500).json({ message: "Failed to load complaints" });
    }
});

// All complaints -- admin only
router.get("/", verifyToken, requireAdmin, async (req, res) => {
    try {

        const complaints = await Complaint.find()
            .populate("student", "name email")
            .populate("teacher", "name")
            .sort({ createdAt: -1 });

        res.json(complaints);

    } catch (error) {
        res.status(500).json({ message: "Failed to load complaints" });
    }
});

// Mark a complaint resolved -- admin only
router.patch("/:id/resolve", verifyToken, requireAdmin, async (req, res) => {
    try {

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: "resolved" },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.json(complaint);

    } catch (error) {
        res.status(500).json({ message: "Failed to update complaint" });
    }
});

module.exports = router;
