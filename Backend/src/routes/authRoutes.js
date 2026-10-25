import express from 'express'
import { login, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/register',register);
router.post('/login',login);

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  return res.status(200).json({ message: "Logged out" });
});


export default router;