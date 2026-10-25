import User from "../models/usermodel.js";

// Use after authMiddleware. Looks the role up in the DB so it can't be forged from the token.
const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("role");

        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: "Could not verify role" });
    }
};

export default adminMiddleware;
