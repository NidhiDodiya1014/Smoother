const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const songRoutes = require("./routes/songRoutes");

const app = express();

app.set("trust proxy", true);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  }
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
