import express from "express";
import {
    submitComplaint,
    getComplaints,
    updateComplaintStatus,
    getMyComplaints
} from "../controllers/complaintController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { uploadSingleImage } from "../middleware/upload.js";

const router = express.Router();

// Public: anyone can see the priority list
router.get("/", getComplaints);

router.post(
    "/submitcomplaint",
    authMiddleware,
    uploadSingleImage,
    submitComplaint
);

// Admin only: mark Pending / Resolved / Rejected
router.patch(
    "/:id/status",
    authMiddleware,
    adminMiddleware,
    updateComplaintStatus
);

router.get("/mine", authMiddleware, getMyComplaints);
export default router;
