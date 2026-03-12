import React, { useState, useEffect } from "react";
import pfn from "./pfn.jpeg";
import galery from "./galery.jpeg";
import energy from "./energy.jpeg";
import unstable from "./unstable.jpeg";
import errobtn from "./erro.png";
import book from "./book.png";
import book2 from "./book2.png";
import energy2 from "./energy2.png";
import reportIcon from "./report.png";
import image from "./I.png";
import historybtn from "./history.png";
import history2btn from "./history2.png";
import upload from "./upload.png";

const Index = () => {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [modeOfInjury, setModeOfInjury] = useState("");
  const [preview, setPreview] = useState({});
  const [selected, setSelected] = useState("31-A1");
  const [showResult, setShowResult] = useState(false);
  const [runId] = useState(0);
  const [animatedRisk, setAnimatedRisk] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const risk = analysisData?.risk_percentage || 0;
  const isUnstable = analysisData?.unstable || false;
  const GAP = 4;
  const usable = 100 - GAP;
  const greenLength = (animatedRisk / 100) * usable;
  const aoStabilityMap = {
    "31-A1": "Stable",
    "31-A2": "Unstable",
    "31-A3": "Unstable",
  };

  useEffect(() => {
    if (!showResult || !analysisData) return;
    let start = null;
    const duration = 1400;
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);
      setAnimatedRisk(eased * risk);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedRisk(risk);
      }
    };

    requestAnimationFrame(animate);
  }, [risk, showResult, analysisData]);

  useEffect(() => {
    if (showArchive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showArchive]);

  console.log("API RESPONSE:", analysisData);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleHistoryOpen = async () => {
    await fetchHistory();
    setShowArchive(true);
  };

  const baseURL = "http://localhost:5000";

  const handleHistoryClick = (caseData) => {
    const fixPath = (path) => {
      if (!path) return "";
      return `${baseURL}/${path.replace(/\\/g, "/")}`;
    };

    setPreview({
      first: fixPath(caseData.images?.preAP),
      second: fixPath(caseData.images?.preLAT),
      third: fixPath(caseData.images?.postAP),
      fourth: fixPath(caseData.images?.postLAT),
    });

    setPatientName(caseData.patient_name || "");
    setPatientAge(caseData.patient_age || "");
    setPatientGender(caseData.patient_gender || "");
    setModeOfInjury(caseData.mode_of_injury || "");

    setAnalysisData(caseData);
    setShowResult(true);
  };

  const handleRun = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("aoClass", selected);
      formData.append("patientName", patientName);
      formData.append("patientAge", patientAge);
      formData.append("patientGender", patientGender);
      formData.append("modeOfInjury", modeOfInjury);

      const firstFile = document.getElementById("first")?.files?.[0];
      const secondFile = document.getElementById("second")?.files?.[0];
      const thirdFile = document.getElementById("third")?.files?.[0];
      const fourthFile = document.getElementById("fourth")?.files?.[0];

      const files = [firstFile, secondFile, thirdFile, fourthFile].filter(
        Boolean,
      );

      if(!patientAge || !patientGender || !patientName || !modeOfInjury){
        alert("upload patient details")
        setLoading(false);
        return;
      }else if (files.length === 0 && !analysisData?.images) {
        alert("Please upload at least one X-ray image.");
        setLoading(false);
        return;
      }

      if (files.length === 4) {
        formData.append("preAP", firstFile);
        formData.append("preLAT", secondFile);
        formData.append("postAP", thirdFile);
        formData.append("postLAT", fourthFile);
      } else if (analysisData?.images) {
        formData.append("preAPPath", analysisData.images.preAP);
        formData.append("preLATPath", analysisData.images.preLAT);
        formData.append("postAPPath", analysisData.images.postAP);
        formData.append("postLATPath", analysisData.images.postLAT);
      } else {
        alert("Please upload all four views (AP & LAT for Pre and Post).");
        setLoading(false);
        return;
      }


      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (
        !data ||
        data.risk_percentage == null ||
        !data.metrics ||
        data.metrics.tip_apex_distance_mm == null
      ) {
        alert("API not Response please try later.");
        setPreview({});
        setAnalysisData(null);
        setShowResult(false);
        return;
      }

      setAnalysisData(data);
      fetchHistory();
      setAnimatedRisk(0);
      setShowResult(true);
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("API not Response please try later.");
      setPreview({});
      setAnalysisData(null);
      setShowResult(false);
    } finally {
      setLoading(false);
    }
  };

  const options = ["31-A1", "31-A2", "31-A3"];

  const handleChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview((prev) => ({
      ...prev,
      [key]: URL.createObjectURL(file),
    }));
  };

  return (
    <div className="mainDiv">
      <div className="index-components">
        {/* HEADER */}
        <div className="index-header">
          <header>
            <div>
              <img src={pfn} alt="logo" />
              <div>
                <h1>PFN Failure Net</h1>
                <p
                  style={{
                    fontSize: "10px",
                    margin: "0px",
                    color: "#3b82f6",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                >
                  ADVANCED BIOMECHANICAL AI v2.4
                </p>
              </div>
            </div>

            <button onClick={handleHistoryOpen}>
              <img
                src={historybtn}
                alt=" "
                style={{
                  height: "18px",
                  width: "18px",
                  marginRight: "10px",
                  marginBottom: "-4px",
                }}
              />
              History ({history.length})
            </button>
          </header>
        </div>

        {/* BODY */}
        <div className="index-body">
          <div className="body-content">
            {/* LEFT PANEL */}
            <div className="left-panel">
              <h3 className="section-title">
                <img
                  src={galery}
                  alt=""
                  style={{ width: 18, marginBottom: -3 }}
                />{" "}
                Case Entry
              </h3>

              <div className="patient-info">
                <div className="input-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="Enter age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Mode of Injury</label>
                  <select
                    value={modeOfInjury}
                    onChange={(e) => setModeOfInjury(e.target.value)}
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value="RTA">Road Traffic Accident</option>
                    <option value="Fall">Simple Fall</option>
                    <option value="Height Fall">Fall From Height</option>
                    <option value="Sports">Sports Injury</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* PRE OP */}
              <div className="stage">
                <p className="stage-title" style={{ borderColor: "#60a5fa" }}>
                  PRE-OPERATIVE STAGE
                </p>
                <div className="image-row">
                  {["first", "second"].map((key, i) => (
                    <div className="image-box" key={key}>
                      <p className="view-label">
                        {i === 0 ? "AP VIEW" : "LAT VIEW"}
                      </p>

                      <input
                        type="file"
                        id={key}
                        hidden
                        accept="image/*"
                        onChange={(e) => handleChange(e, key)}
                      />

                      <label htmlFor={key} className="upload-box">
                        {preview[key] ? (
                          <img src={preview[key]} alt="" />
                        ) : (
                          <span className="upload-text">
                            <img
                              src={upload}
                              alt=""
                              style={{
                                width: "30px",
                                display: "flex",
                                margin: "0 0 5px 5px",
                              }}
                            />{" "}
                            Upload
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* POST OP */}
              <div className="stage">
                <p className="stage-title" style={{ borderColor: "#4ade80" }}>
                  POST-OPERATIVE STAGE
                </p>
                <div className="image-row">
                  {["third", "fourth"].map((key, i) => (
                    <div className="image-box" key={key}>
                      <p>{i === 0 ? "AP VIEW" : "LAT VIEW"}</p>
                      <input
                        type="file"
                        id={key}
                        hidden
                        accept="image/*"
                        onChange={(e) => handleChange(e, key)}
                      />
                      <label htmlFor={key} className="upload-box">
                        {preview[key] ? (
                          <img src={preview[key]} alt="" />
                        ) : (
                          <span className="upload-text">
                            <img
                              src={upload}
                              alt=""
                              style={{
                                width: "30px",
                                display: "flex",
                                margin: "0 0 5px 5px",
                              }}
                            />
                            Upload
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* AO CLASS */}
              <div className="ao-class">
                <div className="ao-header">
                  <p className="stage-title">AO CLASSIFICATION</p>
                  {(selected === "31-A2" || selected === "31-A3") && (
                    <span className="unstable-text">
                      <img
                        src={unstable}
                        alt=""
                        style={{ width: "10.5px", marginBottom: "-1px" }}
                      />{" "}
                      Unstable Pattern
                    </span>
                  )}
                </div>

                <div className="ao-buttons">
                  {options.map((item) => (
                    <button
                      key={item}
                      className={selected === item ? "active" : ""}
                      onClick={() => setSelected(item)}
                    >
                      {item}
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          marginTop: "3px",
                          color:
                            aoStabilityMap[item] === "Stable"
                              ? "#16a34a"
                              : "#dc2626",
                          fontWeight: "bold",
                        }}
                      >
                        {aoStabilityMap[item]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RUN BUTTON */}
              <button
                className="run-btn"
                onClick={handleRun}
                disabled={loading}
              >
                {loading ? (
                  <div className="btn-loading">
                    <div className="spinner"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="btn-content">
                    <span>Run Failure Prediction</span>
                    <img
                      src={errobtn}
                      alt=""
                      style={{
                        width: "7px",
                        marginLeft: "6px",
                      }}
                    />
                  </div>
                )}
              </button>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel-main">
              <div
                className="right-panel"
                style={{ borderStyle: !showResult ? "dashed" : "solid" }}
              >
                {!showResult ? (
                  /* BEFORE RUN */
                  <div className="center-box">
                    <img src={energy} alt="" className="icon-placeholder" />
                    <h3>Evidence-Based Synthesis</h3>
                    <p>
                      System calibrated for <b>Tip-Apex Distance</b>,{" "}
                      <b>Fracture Stability</b>, and <b>Calcar Femorale</b>{" "}
                      integrity.
                    </p>
                    <div>
                      <p
                        style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                      >
                        TAD Protocol
                      </p>
                      <p
                        style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}
                      >
                        AO Stability
                      </p>
                      <p
                        style={{ backgroundColor: "#d1fae5", color: "#047857" }}
                      >
                        Calcar Integrity
                      </p>
                    </div>
                  </div>
                ) : (
                  /* AFTER RUN */
                  <div className="report-wrapper" key={runId}>
                    <div className="report-header1">
                      <span
                        className={`risk-badge ${isUnstable ? "high" : "low"}`}
                      >
                        {analysisData?.risk_percentage == null
                          ? "--"
                          : analysisData.risk_percentage <= 14
                            ? "LOW RISK"
                            : analysisData.risk_percentage <= 35
                              ? "MODERATE RISK"
                              : "HIGH RISK"}
                      </span>
                    </div>

                    <div className="result-box">
                      <div className="report-header2">
                        <h3>
                          <img
                            src={reportIcon}
                            alt=""
                            style={{ height: "21px", marginBottom: "-3px" }}
                          />{" "}
                          Biomechanical Outcome Report
                        </h3>
                      </div>

                      <div className="report-grid">
                        {/* LEFT */}
                        <div className="risk-circle">
                          <svg viewBox="0 0 36 36" className="risk-svg">
                            {/* 🔴 RED REMAINING RING */}
                            <path
                              className="ring-green"
                              d="
        M18 2.0845
        a 15.9155 15.9155 0 0 1 0 31.831
        a 15.9155 15.9155 0 0 1 0 -31.831
      "
                            />

                            {/* 🟢 GREEN RISK ARC (0 → risk%) */}
                            <path
                              className="ring-red"
                              strokeDasharray={`${greenLength} ${100 - greenLength}`}
                              strokeDashoffset={GAP / 2}
                              d="
        M18 2.0845
        a 15.9155 15.9155 0 0 1 0 31.831
        a 15.9155 15.9155 0 0 1 0 -31.831
      "
                            />

                            {/* % TEXT */}
                            <text x="18" y="19.6" className="percentage">
                              {analysisData?.risk_percentage ?? 0}%
                            </text>
                            <text
                              x="6"
                              y="25"
                              style={{
                                fontSize: "2.3px",
                                fontWeight: "bold",
                                fill: "#94a3b8",
                              }}
                            >
                              TOTAL FAILURE RISK
                            </text>
                          </svg>
                        </div>

                        {/* RIGHT */}
                        <div className="metrics">
                          <div className="metric">
                            <span>TIP–APEX DISTANCE</span>
                            <b style={{ fontSize: "17.5px", color: "#1e293b" }}>
                              {analysisData?.metrics?.tip_apex_distance_mm ??
                                "--"}
                              <span
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "2px",
                                }}
                              >
                                <small>mm</small>
                              </span>
                            </b>
                          </div>
                          <div className="metric">
                            <span>MEDIAL CALCAR</span>
                            <b
                              style={{
                                fontSize: "12.25px",
                                color: "#1e293b",
                              }}
                            >
                              {analysisData?.metrics?.medial_calcar ?? "--"}
                            </b>
                          </div>
                          <div className="metric">
                            <span>NECK–SHAFT ANGLE</span>
                            <b
                              style={{
                                fontSize: "12.25px",
                                color: "#1e293b",
                              }}
                            >
                              {analysisData?.metrics?.neck_shaft_angle_deg ??
                                "--"}
                              °
                            </b>
                          </div>
                          <div className="metric">
                            <span>REDUCTION QUALITY</span>
                            <b
                              style={{
                                fontSize: "12.25px",
                                color: "#1e293b",
                              }}
                            >
                              {analysisData?.metrics?.reduction_quality ?? "--"}
                            </b>
                          </div>
                        </div>
                      </div>

                      <div className="clinical">
                        <div
                          className="clinicalDiv"
                          style={{
                            backgroundColor: "#EFF6FF",
                            borderLeft: "4px solid rgb(37 99 235)",
                            color: "#1d4ed8",
                          }}
                        >
                          <div>
                            <img src={book} alt="Khanna & Tiwari (2015)" />
                          </div>
                          <div className="clinical2">
                            <h3>KHANNA & TIWARI (2015)</h3>
                            <p style={{ color: "#1e40af" }}>
                              TAD {">"} 25mm is the single most significant
                              predictor of screw cut-out.
                            </p>
                          </div>
                        </div>
                        <div
                          className="clinicalDiv"
                          style={{
                            backgroundColor: "#EEF2FF",
                            borderLeft: "4px solid rgb(79 70 229)",
                            color: "#4338ca",
                          }}
                        >
                          <div>
                            <img src={book2} alt="Khan et al. (2018)" />
                          </div>
                          <div className="clinical2">
                            <h3>MANDICE ET AL. (2020)</h3>
                            <p style={{ color: "#3730a3" }}>
                              Unstable (A2/A3) patterns correlate with reduced
                              functional outcome scores.
                            </p>
                          </div>
                        </div>
                        <div
                          className="clinicalDiv"
                          style={{
                            backgroundColor: "#ECFDF5",
                            borderLeft: "4px solid rgb(5 150 105)",
                            color: "#047857",
                          }}
                        >
                          <div>
                            <img src={energy2} alt="Energy-based approach" />
                          </div>
                          <div className="clinical2">
                            <h3>CALCAR FEMORALE STRUCTURAL REVIEW</h3>
                            <p style={{ color: "#065f46" }}>
                              The calcar is the primary axial load-bearing
                              structure; its restoration is vital for primary
                              stability.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "20px",
                          textAlign: "center",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <div className="rightBottom">
                          <img src={image} alt="Clinical Synthesis" />
                          <p style={{ fontSize: "10px", color: "#6b7280" }}>
                            CLINICAL SYNTHESIS
                          </p>
                        </div>
                        <div className="rightBottom2">
                          <p>
                            {analysisData
                              ? `The fracture demonstrates a ${
                                  analysisData?.unstable ? "unstable" : "stable"
                                } AO ${analysisData?.ao_classification ?? "--"} pattern with ${
                                  analysisData?.metrics?.reduction_quality?.toLowerCase?.() ??
                                  "unknown"
                                } reduction quality. Biomechanical analysis shows a Tip-Apex Distance (TAD) of approximately ${
                                  analysisData?.metrics?.tip_apex_distance_mm ??
                                  "--"
                                }mm (${
                                  (analysisData?.metrics
                                    ?.tip_apex_distance_mm ?? 0) < 25
                                    ? "well within the safe zone (<25mm)"
                                    : "above the safe threshold (<25mm)"
                                }) and a Neck–Shaft Angle of ${
                                  analysisData?.metrics?.neck_shaft_angle_deg ??
                                  "--"
                                }°, with ${
                                  ["restored", "intact"].includes(
                                    analysisData?.metrics?.medial_calcar?.toLowerCase?.() ??
                                      "",
                                  )
                                    ? "the medial cortex anatomically restored"
                                    : "the medial cortex incompletely restored"
                                }. The estimated mechanical failure risk is ${
                                  analysisData?.risk_percentage?.toFixed?.(2) ??
                                  "0"
                                }%.`
                              : "Run failure prediction to see detailed biomechanical analysis."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {showResult && (
                <div className="action-buttons">
                  <button
                    className="reset-btn"
                    onClick={() => {
                      setShowResult(false);
                      setAnimatedRisk(0);
                      setPreview({});
                      setPatientName("");
                      setPatientAge("");
                      setPatientGender("");
                      setModeOfInjury("");
                    }}
                  >
                    Reset
                  </button>

                  <button className="export-btn">Export Data</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          <p>BIOMECHANICAL ANALYSIS SUITE • CLINECAL DECISION SUPPORT ONLY</p>
        </div>
      </div>

      {/* ARCHIVE SIDE PANEL */}
      {showArchive && (
        <div className="archive-overlay" onClick={() => setShowArchive(false)}>
          <div className="archive-panel" onClick={(e) => e.stopPropagation()}>
            <div className="archive-header">
              <h3>
                {" "}
                <img
                  src={history2btn}
                  alt=""
                  style={{
                    width: "25px",
                    height: "25px",
                    marginBottom: "-5px",
                  }}
                />{" "}
                Archive
              </h3>
              <button onClick={() => setShowArchive(false)}>✕</button>
            </div>

            <div className="archive-list">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="archive-item"
                  onClick={() => {
                    handleHistoryClick(item);
                    setShowArchive(false);
                  }}
                >
                  <div>
                    <small
                      style={{
                        color: "#94a3b8",
                        fontSize: "10px",
                        fontWeight: "bolder",
                      }}
                    >
                      {new Date(item.createdAt).toLocaleDateString()}
                    </small>
                    <p
                      style={{
                        fontSize: "12.25px",
                        color: "#1e293b",
                        fontWeight: "bolder",
                        margin: "5px 0",
                      }}
                    >
                      AO {item.ao_classification ?? "--"} (calcar:{" "}
                      {item.metrics?.medial_calcar ?? "--"})
                    </p>
                    <p
                      style={{
                        fontSize: "12.25px",
                        color: "#1e293b",
                        fontWeight: "bolder",
                        margin: "5px 0",
                        padding: "0",
                      }}
                    >
                      {item.patient_name} ({item.patient_age} Y)
                    </p>
                    <p style={{ fontSize: "12.25px", color: "#475569",margin:"0" }}>
                      {item.patient_gender} • {item.mode_of_injury}
                    </p>
                  </div>

                  <span className="risk-badge-small">
                    {item.risk_percentage ?? 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
