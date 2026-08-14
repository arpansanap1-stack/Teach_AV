const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Availability = require("../models/Availability");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Every route below requires a valid admin token
router.use(verifyToken, requireAdmin);

// Dashboard summary stats
router.get("/stats", async (req, res) => {
    try {

        const today = new Date().toISOString().slice(0, 10);

        const totalTeachers = await Teacher.countDocuments();

        const totalActiveSlots = await Availability.countDocuments({
            status: "available",
            date: { $gte: today }
        });

        const liveNow = await computeLiveCount();

        const teachers = await Teacher.find();

        const departments = {};
        teachers.forEach(t => {
            departments[t.department] = (departments[t.department] || 0) + 1;
        });

        res.json({ totalTeachers, totalActiveSlots, liveNow, departments });

    } catch (error) {
        res.status(500).json({ message: "Failed to load stats" });
    }
});

// Full teacher list with each teacher's upcoming slot count
router.get("/teachers", async (req, res) => {
    try {

        const teachers = await Teacher.find().sort({ name: 1 });
        const today = new Date().toISOString().slice(0, 10);

        const withCounts = await Promise.all(teachers.map(async (t) => {
            const slotCount = await Availability.countDocuments({
                teacher: t._id,
                status: "available",
                date: { $gte: today }
            });
            return { ...t.toObject(), slotCount };
        }));

        res.json(withCounts);

    } catch (error) {
        res.status(500).json({ message: "Failed to load teachers" });
    }
});

async function computeLiveCount() {

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todaysSlots = await Availability.find({
        status: "available",
        date: today
    });

    const liveTeacherIds = new Set();

    todaysSlots.forEach(slot => {
        const [startH, startM] = slot.startTime.split(":").map(Number);
        const [endH, endM] = slot.endTime.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
            liveTeacherIds.add(slot.teacher.toString());
        }
    });

    return liveTeacherIds.size;

}

module.exports = router;
