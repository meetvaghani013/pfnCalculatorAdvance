import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    // 🔹 Patient Info
    patient_name: {
      type: String,
      required: true,
      trim: true,
    },
    patient_age: {
      type: Number,
      required: true,
      min: 0,
    },
    patient_gender: {
      type: String,
      required: true,
      trim: true,
    },
    mode_of_injury: {
      type: String,
      required: true,
      trim: true,
    },


    // 🔹 Fracture Classification
    ao_classification: String,
    vancouver_classification: String,
    fracture_location: String,

    // 🔹 Analysis
    unstable: Boolean,
    risk_percentage: Number,
    metrics: Object,
    images: Object,
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);

export default Case;
