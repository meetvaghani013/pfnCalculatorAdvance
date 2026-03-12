import Case from "../models/caseModel.js";
import { analyzeWithGemini } from "../services/gemini.js";
import fs from "fs";

export const analyzeCase = async (req, res) => {
  try {
    const { aoClass, patientName, patientAge, patientGender, modeOfInjury} = req.body;


    // ✅ Support both new upload + history re-run
    const preAP = req.files?.preAP?.[0]?.path || req.body.preAPPath;
    const preLAT = req.files?.preLAT?.[0]?.path || req.body.preLATPath;
    const postAP = req.files?.postAP?.[0]?.path || req.body.postAPPath;
    const postLAT = req.files?.postLAT?.[0]?.path || req.body.postLATPath;

    if (!preAP || !preLAT || !postAP || !postLAT) {
      return res.status(400).json({ error: "Images missing" });
    }

    // 🔥 Gemini analysis (only preAP for now)
    const preAPBuffer = fs.readFileSync(preAP);
    const preLATBuffer = fs.readFileSync(preLAT);
    const postAPBuffer = fs.readFileSync(postAP);
    const postLATBuffer = fs.readFileSync(postLAT);

    const preAPBase64 = preAPBuffer.toString("base64");
    const preLATBase64 = preLATBuffer.toString("base64");
    const postAPBase64 = postAPBuffer.toString("base64");
    const postLATBase64 = postLATBuffer.toString("base64");


    const geminiResult = await analyzeWithGemini(aoClass, {
      preAP: preAPBase64,
      preLAT: preLATBase64,
      postAP: postAPBase64,
      postLAT: postLATBase64,
    });



    // ✅ SAVE TO DATABASE
    const newCase = await Case.create({
      patient_name: patientName,
      patient_age: Number(patientAge),
      patient_gender: patientGender,
      mode_of_injury: modeOfInjury,
      ao_classification: geminiResult.ao_classification,
      vancouver_classification: geminiResult.vancouver_classification,
      fracture_location: geminiResult.fracture_location,
      unstable: geminiResult.unstable,
      risk_percentage: geminiResult.risk_percentage,
      metrics: geminiResult.metrics,
      images: {
        preAP,
        preLAT,
        postAP,
        postLAT,
      },
    });

    console.log("Saved to DB:", newCase);

    // ✅ Send saved document to frontend
    res.json(newCase);

  } catch (error) {
    console.error("Analyze Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Analysis failed, Please try again later."
    });
  }
};
