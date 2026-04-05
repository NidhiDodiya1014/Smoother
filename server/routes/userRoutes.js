const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile } = require("../controllers/userAuth");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;