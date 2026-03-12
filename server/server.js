import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import historyRoute from "./routes/history.js";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Routes
app.use("/api/analyze", analyzeRoute);
app.use("/api/history", historyRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
