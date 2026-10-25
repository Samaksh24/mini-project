import express from "express";
import { uploadSingleImage } from "../middleware/upload.js";
import uploadToImageKit from "../utils/uploadtoImageKit.js";

const router = express.Router();

router.post("/test-upload", uploadSingleImage, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded"
            });
        }

        const imageUrl = await uploadToImageKit(
            req.file.buffer,
            req.file.originalname
        );

        return res.status(200).json({
            message: "Upload successful",
            imageUrl
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Upload failed"
        });
    }
});

export default router;