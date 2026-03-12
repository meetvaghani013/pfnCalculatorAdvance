import express from "express";
import multer from "multer";
import { analyzeCase } from "../controllers/analyzeController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  "/",
  upload.fields([
    { name: "preAP" },
    { name: "preLAT" },
    { name: "postAP" },
    { name: "postLAT" }
  ]),
  analyzeCase
);

export default router;
