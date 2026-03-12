import Case from "../models/caseModel.js";

export const getHistory = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 }); // newest first
    res.json(cases);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
