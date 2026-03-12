import { GoogleGenAI } from "@google/genai";

export const analyzeWithGemini = async (aoClass, images) => {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are an expert orthopedic trauma AI specialized in proximal femoral nailing (PFN) failure prediction.

You MUST provide complete biomechanical estimation from the X-ray images.

STRICT RULES:

-return only json.
- NEVER return null.
- NEVER return empty strings.
- NEVER return 0 unless anatomically correct.
- If exact measurement cannot be calculated, provide a realistic clinical estimate based on visible radiographic proportions.
- All numeric values must be clinically plausible.
- Tip–Apex Distance must be between 10 and 40 mm.
- Neck–Shaft Angle must be between 120 and 140 degrees.
- Risk percentage must be between 0.01 and 99.99 .
- Medial calcar must be one of: "Intact", "Restored", "Compromised".
- Reduction quality must be one of: "Good", "Fair", "Poor".

You must analyze:

1. AO fracture classification
2. Vancouver classification (if applicable, otherwise return "N/A")
3. Fracture location
4. Stability (true if unstable pattern)
5. Risk percentage of mechanical failure
6. Tip–Apex Distance (mm)
7. Medial Calcar status
8. Neck–Shaft Angle (degrees)
9. Reduction Quality

Return ONLY valid JSON in this exact format:

{
  "risk_percentage": number,
  "ao_classification": "",
  "vancouver_classification": "",
  "fracture_location": "",
  "unstable": true,
  "metrics": {
    "tip_apex_distance_mm": number,
    "medial_calcar": "",
    "neck_shaft_angle_deg": number,
    "reduction_quality": ""
  }
}
`
            },
            // 🔥 Image 1
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: images.preAP,
              },
            },

            // 🔥 Image 2
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: images.preLAT,
              },
            },

            // 🔥 Image 3
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: images.postAP,
              },
            },

            // 🔥 Image 4
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: images.postLAT,
              },
            }
          ],
        },
      ],
    });

    const generateClinicalParagraph = (data) => {
      if (!data) return "";

      const {
        ao_classification,
        unstable,
        risk_percentage,
        metrics: {
          tip_apex_distance_mm,
          medial_calcar,
          neck_shaft_angle_deg,
          reduction_quality,
        } = {},
      } = data;

      const stabilityText = unstable ? "unstable" : "stable";
      const riskText = `${risk_percentage.toFixed(2)}%`;

      // TAD commentary referencing Khanna & Tiwari
      const tadText =
        tip_apex_distance_mm < 25
          ? `which is well within the safe zone (<25mm) defined by Khanna & Tiwari, significantly reducing the risk of lag screw cut-out`
          : `which exceeds the safe threshold (<25mm) defined by Khanna & Tiwari, potentially increasing the risk of mechanical failure`;

      // Medial calcar commentary
      const calcarText =
        medial_calcar.toLowerCase() === "restored" || medial_calcar.toLowerCase() === "intact"
          ? "the medial cortex (calcar femorale) is anatomically restored, providing the necessary medial buttress to handle compressive loads and prevent secondary varus collapse"
          : "the medial cortex (calcar femorale) is incompletely restored (gapped), which may increase axial load on the lag screw and predispose to secondary varus collapse";

      // Stability commentary referencing Mandice et al.
      const stabilityComment = unstable
        ? `As emphasized by Mandice et al., the ${ao_classification} pattern is inherently unstable, making calcar restoration critical. Despite adequate reduction, the mechanical failure risk is higher.`
        : `Given the stable fracture pattern and successful reduction, as highlighted by Mandice et al., the overall mechanical failure risk is low.`;

      return `The fracture demonstrates a ${stabilityText} AO ${ao_classification} pattern with ${reduction_quality.toLowerCase()} reduction quality. Biomechanical analysis shows a Tip-Apex Distance (TAD) of approximately ${tip_apex_distance_mm}mm (${tadText}) and a Neck–Shaft Angle of ${neck_shaft_angle_deg}°, with ${calcarText}. ${stabilityComment} The estimated mechanical failure risk is ${riskText}.`;
    };


    const text = response.text;

    const cleaned = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleaned);

    console.log("GEMINI RESPONSE:", parsed);

    return parsed;

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
