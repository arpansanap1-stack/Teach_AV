const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const teacherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            required: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        room: {
            type: String,
            default: "Not specified"
        },

        password: {
            type: String,
            required: true,
            select: false
        }
    },
    {
        timestamps: true
    }
);

// Hash the password whenever it's set or changed
teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

teacherSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Teacher", teacherSchema);
