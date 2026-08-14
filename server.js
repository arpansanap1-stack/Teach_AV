const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const teacherRoutes = require("./routes/teacherRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error(`Missing required .env values: ${missing.join(", ")}`);
    console.error("Copy .env.example to .env and fill these in before starting the server.");
    process.exit(1);
}

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/teachers", teacherRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Teacher Availability API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
