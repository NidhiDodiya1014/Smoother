const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const songRoutes = require("./routes/songRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Smoother backend is running 🚀");
});

app.use("/", songRoutes);

app.use("/user", userRoutes);
module.exports = app;
