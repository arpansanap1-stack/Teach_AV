const jwt = require("jsonwebtoken");

// Verifies the Bearer token and attaches { id, role } to req.user
function verifyToken(req, res, next) {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token, please log in again" });
    }

}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
}

// Allows the action only if the caller is an admin, or the teacher acting on their own record
function requireSelfOrAdmin(paramName) {
    return (req, res, next) => {
        if (req.user.role === "admin") return next();
        if (req.user.role === "teacher" && req.user.id === req.params[paramName]) return next();
        return res.status(403).json({ message: "Not authorized to do that" });
    };
}

module.exports = { verifyToken, requireAdmin, requireSelfOrAdmin };
