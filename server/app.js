const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const songRoutes = require("./routes/songRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("FRONTEND_URL env var is required in production!"); })()
    : "http://localhost:5173")
}));

const addSongLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please wait before adding more songs." }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Smoother backend is running 🚀");
});

app.use("/addSong", addSongLimiter);
app.use("/", songRoutes);
app.use("/user", userRoutes);

module.exports = app;
