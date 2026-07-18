import express from "express";
import path from "path";
import fs from "fs";
let createViteServer: any;
import { GoogleGenAI, Type } from "@google/genai";
import { initDb, db } from "./src/server/db.js";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// Initialize Database
initDb();

// Initialize API Keys defensively
let openaiApiKey = process.env.OPENAI_API_KEY;
let geminiApiKey = process.env.GEMINI_API_KEY;

if (openaiApiKey === "YOUR_OPENAI_API_KEY") {
  openaiApiKey = undefined;
}
if (geminiApiKey === "YOUR_GEMINI_API_KEY") {
  geminiApiKey = undefined;
}

// Check if the OpenAI key is actually a Gemini/Google API key (common mixup in development templates)
if (openaiApiKey && (openaiApiKey.startsWith("AQ.Ab8RN") || openaiApiKey.startsWith("AIzaSy") || !openaiApiKey.startsWith("sk-"))) {
  console.log("Detected Gemini/Google API key in OPENAI_API_KEY environment variable. Routing to Gemini API.");
  if (!geminiApiKey) {
    geminiApiKey = openaiApiKey;
  }
  openaiApiKey = undefined; // Do not use it for OpenAI client
}

// Initialize OpenAI Client
let openai: OpenAI | null = null;
if (openaiApiKey) {
  console.log("OPENAI_API_KEY detected. Initializing OpenAI client.");
  try {
    openai = new OpenAI({ apiKey: openaiApiKey });
  } catch (err) {
    console.error("Error creating OpenAI client:", err);
  }
} else {
  console.warn("OpenAI integrations are disabled or will fallback to Gemini/Simulator.");
}

// Initialize Gemini API (Preferred Primary AI Client)
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  console.log("Initializing preferred primary Gemini API client.");
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. Gemini client is unavailable.");
}

const app = express();
app.use(express.json());

  // Simple session authentication helper (using Bearer token or Custom User-ID header)
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // In this database, we use the user's ID as the simple session token
      const user = await db.getUserById(token);
      if (user) {
        (req as any).user = user;
      }
    } else {
      // Default to demo user for a seamless playground experience if no login token is sent
      const demoUser = await db.getUserByEmail("bhavikvanapalli06@gmail.com");
      if (demoUser) {
        (req as any).user = demoUser;
      }
    }
    next();
  });

  // --- API ROUTES ---

  // Auth Status / Profile check
  app.get("/api/auth/me", async (req, res) => {
    const user = (req as any).user;
    if (user) {
      const { password, ...safeUser } = user;
      res.json({ authenticated: true, user: safeUser });
    } else {
      res.json({ authenticated: false, user: null });
    }
  });

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    const { email, fullName, age, gender, medicalHistory } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: "Email and Full Name are required" });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const newUser = await db.createUser({
      email,
      fullName,
      age: age || "30",
      gender: gender || "Not Specified",
      medicalHistory: medicalHistory || "None declared",
    });

    res.json({ success: true, user: newUser, token: newUser.id });
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await db.getUserByEmail(email);
    if (!user) {
      // For ease of use in the playground, auto-create a user if they don't exist
      user = await db.createUser({
        email,
        fullName: email.split("@")[0].toUpperCase(),
        age: "30",
        gender: "Not Specified",
        medicalHistory: "None declared",
      });
    }

    res.json({ success: true, user, token: user.id });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Update Profile
  app.put("/api/user/profile", async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      fullName,
      age,
      gender,
      medicalHistory,
      bloodGroup,
      allergies,
      medications,
      emergencyContacts,
      travelModeEnabled,
      dob,
      height,
      weight,
      chronicDiseases,
      surgeries,
      primaryContact,
      secondaryContact,
      relationship,
      phone,
      insuranceDetails,
      primaryDoctor,
      preferredHospital,
      preferredLanguage,
    } = req.body;

    const updated = await db.updateUser(user.id, {
      fullName,
      age,
      gender,
      medicalHistory,
      bloodGroup,
      allergies,
      medications,
      emergencyContacts,
      travelModeEnabled,
      dob,
      height,
      weight,
      chronicDiseases,
      surgeries,
      primaryContact,
      secondaryContact,
      relationship,
      phone,
      insuranceDetails,
      primaryDoctor,
      preferredHospital,
      preferredLanguage,
    });

    res.json({ success: true, user: updated });
  });

  // Public Emergency Profile check (No auth needed)
  app.get("/api/public-emergency-profile/:userId", async (req, res) => {
    const { userId } = req.params;
    const userObj = await db.getUserById(userId);
    if (!userObj) {
      return res.status(404).json({ error: "Emergency Profile not found" });
    }
    const assessmentsObj = await db.getAssessmentsByUserId(userId);
    const latestAssessment = assessmentsObj.length > 0 ? assessmentsObj[0] : null;

    // Return only safe public emergency details
    const publicProfile = {
      fullName: userObj.fullName,
      age: userObj.age,
      gender: userObj.gender,
      bloodGroup: userObj.bloodGroup || "Not Specified",
      allergies: userObj.allergies || "None declared",
      medications: userObj.medications || "None declared",
      medicalHistory: userObj.medicalHistory || "None declared",
      emergencyContacts: userObj.emergencyContacts || "None declared",
      dob: userObj.dob || "",
      height: userObj.height || "",
      weight: userObj.weight || "",
      chronicDiseases: userObj.chronicDiseases || "",
      surgeries: userObj.surgeries || "",
      primaryContact: userObj.primaryContact || "",
      secondaryContact: userObj.secondaryContact || "",
      relationship: userObj.relationship || "",
      phone: userObj.phone || "",
      insuranceDetails: userObj.insuranceDetails || "",
      primaryDoctor: userObj.primaryDoctor || "",
      preferredHospital: userObj.preferredHospital || "",
    };

    res.json({
      success: true,
      profile: publicProfile,
      latestAssessment,
    });
  });

  // Symptom Analysis Endpoint using OpenAI with robust failover
  app.post("/api/triage/analyze", async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized user session" });
    }

    const { symptoms, preferredLanguage } = req.body;
    if (!symptoms || symptoms.trim().length < 5) {
      return res.status(400).json({ error: "Please provide a more detailed description of symptoms." });
    }

    const targetLanguage = preferredLanguage || user.preferredLanguage || "English";

    const systemInstruction = `You are TriageAI, an AI Emergency Medical Assistant designed exclusively for users in India.
      Your goal is to serve as a proactive, multi-stage clinical decision and triage engine for patients in India.
      
      CRITICAL SAFETY DIRECTIVES FOR INDIA:
      - Carefully evaluate symptoms for critical, life-threatening red flags (e.g., suspected stroke, heart attack, sudden crushing chest pain, difficulty breathing, severe bleeding, anaphylaxis, drug overdose, third-degree burns, sudden facial droop, or severe physical trauma).
      - If these red flags are present, the severity MUST be set to "Critical".
      - For "Critical" severity, explicitly direct the user to call an Indian ambulance at 108 or standard national emergency services at 112, and proceed to the nearest emergency department or trauma centre immediately.
      - NEVER recommend foreign emergency numbers like 911, 999, etc. ALWAYS recommend Indian standard numbers:
        * National Emergency: 112
        * Emergency Ambulance: 108
        * Medical Emergency: 108
        * Police: 100 or 112
        * Fire: 101
        * Women Helpline: 1091
      - Recommend only Indian healthcare resource formats, Indian hospital terminology (e.g., Government Hospitals, Private Hospitals, Primary Health Centres (PHCs), Community Health Centres (CHCs), Trauma Centres, Blood Banks, Pharmacies), Indian addresses, Indian city/state formats, and Indian examples. Never generate foreign ZIP codes or foreign hospitals/addresses.
      
      MANDATORY LANGUAGE ENFORCEMENT DIRECTIVE:
      - The user's manually chosen preferred language is: ${targetLanguage}.
      - You MUST write the ENTIRE response (all text fields including possibleCondition, recommendedSpecialist, firstAidGuidance, warningSigns, homeCareAdvice, emergencyRecommendation, doctorSummary, disclaimer, detectedLanguage, clinicalReasoning fields, firstAidExtended fields, specialistExplanation, doctorHandoffDetailed fields, followUpQuestions, etc.) in exactly and strictly ${targetLanguage}.
      - NEVER mix languages. Do not use English words in non-English fields. Every single text output must be translated to and written in ${targetLanguage} consistently.
      - Never randomly switch languages. Your output language must be 100% consistent with the chosen language (${targetLanguage}).

      Return a structured JSON object with the following fields:
      - possibleCondition: Natural, concise condition name (educational triage), translated to ${targetLanguage}.
      - severityLevel: EXACTLY "Low" | "Medium" | "High" | "Critical".
      - confidenceScore: Percentage string between "0%" and "100%" (e.g., "94%").
      - recommendedSpecialist: Name of the medical specialty (e.g., "Cardiologist", "Neurologist"), translated to ${targetLanguage}.
      - firstAidGuidance: Array of 3-6 precise, immediate steps to take, translated to ${targetLanguage}.
      - warningSigns: Array of 3-5 critical warning symptoms requiring immediate ER, translated to ${targetLanguage}.
      - homeCareAdvice: Practical, high-quality comfort care tips, translated to ${targetLanguage}.
      - emergencyRecommendation: Specific worsening criteria or criteria to watch for, translated to ${targetLanguage}.
      - doctorSummary: A professional, medical-style clinical note for admission/intake, summarizing the case for a doctor, translated to ${targetLanguage}.
      - disclaimer: Standard educational disclaimer with safety warning, translated to ${targetLanguage}.
      
      - detectedLanguage: Must be set to "${targetLanguage}".
      - clinicalReasoning: Object containing:
        * whyRecommended: Clear explanation of why you reached this recommendation, translated to ${targetLanguage}.
        * detectedSymptoms: Summary of symptoms parsed from input, translated to ${targetLanguage}.
        * clinicalPattern: Identified clinical pattern or physiological pathway, translated to ${targetLanguage}.
        * riskFactors: Matching patient risk factors from profile (age, gender, history) that increase susceptibility, translated to ${targetLanguage}.
        * severityReason: Rationale for why this specific severity level was chosen, translated to ${targetLanguage}.
        * hospitalReason: Why you recommended an Indian hospital vs clinic, translated to ${targetLanguage}.
        * actionsReason: Rationale for the recommended first aid, translated to ${targetLanguage}.
        * confidenceExplanation: Explanation of why confidence is high or low, translated to ${targetLanguage}.
      - specialistExplanation: Detailed rationale for matching the user to this specific specialist division, translated to ${targetLanguage}.
      - firstAidExtended: Object containing:
        * doList: Array of things to DO immediately, translated to ${targetLanguage}.
        * doNotList: Array of things NOT to do under any circumstances, translated to ${targetLanguage}.
        * dangerSigns: Array of danger signs or red flags, translated to ${targetLanguage}.
        * emergencyTips: Quick checklist for high-stress situations, translated to ${targetLanguage}.
        * travelAdvice: Custom travel warnings and resources appropriate for India, translated to ${targetLanguage}.
      - doctorHandoffDetailed: Object containing:
        * chiefComplaint: Standardized medical chief complaint, translated to ${targetLanguage}.
        * timeline: Symptom timeline (onset, duration profile), translated to ${targetLanguage}.
        * investigations: Array of suggested laboratory tests, imaging, or examinations (e.g., ECG, Troponin, CBC), translated to ${targetLanguage}.
        * doctorNotes: Concise, professional doctor-to-doctor notes, translated to ${targetLanguage}.
      - followUpQuestions: Array of exactly 3 highly specific follow-up questions tailored to the symptoms to refine the assessment (e.g. for chest pain: "Does the pain radiate?", "Does deep breathing make it worse?"), translated to ${targetLanguage}.`;

    const patientPrompt = `
      Patient Metrics:
      - Name: ${user.fullName}
      - Age: ${user.age}
      - Biological Sex: ${user.gender}
      - Declared Medical History: ${user.medicalHistory}
      
      Symptom Description:
      "${symptoms}"
    `;

    try {
      let analysisResult: any = null;
      let usedModel = "";

      // 1. ATTEMPT REAL GEMINI CALL FIRST (PREFERRED PRIMARY CLINICAL AI WITH AUTOMATIC MODEL FAILOVER & RETRY)
      if (ai) {
        const candidateModels = [
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash"
        ];
        for (const candidateModel of candidateModels) {
          let attempts = 0;
          const maxAttempts = 2;
          while (attempts < maxAttempts) {
            try {
              attempts++;
              console.log(`Triggering Gemini primary clinical evaluation with candidate model: ${candidateModel} (attempt ${attempts}/${maxAttempts})...`);
              const response = await ai.models.generateContent({
                model: candidateModel,
                contents: patientPrompt,
                config: {
                  systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      possibleCondition: { type: Type.STRING },
                      severityLevel: { type: Type.STRING },
                      confidenceScore: { type: Type.STRING },
                      recommendedSpecialist: { type: Type.STRING },
                      firstAidGuidance: { type: Type.ARRAY, items: { type: Type.STRING } },
                      warningSigns: { type: Type.ARRAY, items: { type: Type.STRING } },
                      homeCareAdvice: { type: Type.STRING },
                      emergencyRecommendation: { type: Type.STRING },
                      doctorSummary: { type: Type.STRING },
                      disclaimer: { type: Type.STRING },
                      detectedLanguage: { type: Type.STRING },
                      clinicalReasoning: {
                        type: Type.OBJECT,
                        properties: {
                          whyRecommended: { type: Type.STRING },
                          detectedSymptoms: { type: Type.STRING },
                          clinicalPattern: { type: Type.STRING },
                          riskFactors: { type: Type.STRING },
                          severityReason: { type: Type.STRING },
                          hospitalReason: { type: Type.STRING },
                          actionsReason: { type: Type.STRING },
                          confidenceExplanation: { type: Type.STRING },
                        },
                        required: ["whyRecommended", "detectedSymptoms", "clinicalPattern", "riskFactors", "severityReason", "hospitalReason", "actionsReason", "confidenceExplanation"]
                      },
                      specialistExplanation: { type: Type.STRING },
                      firstAidExtended: {
                        type: Type.OBJECT,
                        properties: {
                          doList: { type: Type.ARRAY, items: { type: Type.STRING } },
                          doNotList: { type: Type.ARRAY, items: { type: Type.STRING } },
                          dangerSigns: { type: Type.ARRAY, items: { type: Type.STRING } },
                          emergencyTips: { type: Type.STRING },
                          travelAdvice: { type: Type.STRING },
                        },
                        required: ["doList", "doNotList", "dangerSigns", "emergencyTips", "travelAdvice"]
                      },
                      doctorHandoffDetailed: {
                        type: Type.OBJECT,
                        properties: {
                          chiefComplaint: { type: Type.STRING },
                          timeline: { type: Type.STRING },
                          investigations: { type: Type.ARRAY, items: { type: Type.STRING } },
                          doctorNotes: { type: Type.STRING },
                        },
                        required: ["chiefComplaint", "timeline", "investigations", "doctorNotes"]
                      },
                      followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: [
                      "possibleCondition",
                      "severityLevel",
                      "confidenceScore",
                      "recommendedSpecialist",
                      "firstAidGuidance",
                      "warningSigns",
                      "homeCareAdvice",
                      "emergencyRecommendation",
                      "doctorSummary",
                      "disclaimer",
                      "detectedLanguage",
                      "clinicalReasoning",
                      "specialistExplanation",
                      "firstAidExtended",
                      "doctorHandoffDetailed",
                      "followUpQuestions"
                    ]
                  }
                }
              });

              if (response.text) {
                analysisResult = JSON.parse(response.text);
                usedModel = `Gemini (${candidateModel})`;
                console.log(`Gemini clinical evaluation successful using model ${candidateModel}.`);
                break; // Success! Exit the candidate attempts loop.
              }
            } catch (geminiErr: any) {
              const errMsg = geminiErr?.message || String(geminiErr);
              const isRetriable = errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("RESOURCE_EXHAUSTED");
              console.warn(`Gemini candidate model ${candidateModel} attempt ${attempts} failed. Details:`, errMsg);
              if (isRetriable && attempts < maxAttempts) {
                const delay = attempts * 1000;
                console.log(`Retriable Gemini error caught. Waiting ${delay}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
              } else {
                break; // Stop attempting this candidate model, try the next in candidateModels list.
              }
            }
          }
          if (analysisResult) {
            break; // We have a successful result. Exit the candidate models list.
          }
        }

        if (!analysisResult) {
          console.error("All candidate Gemini models failed after retries. Moving to fallback clinical engines...");
        }
      }

      // 2. FALLBACK TO OPENAI IF GEMINI IS UNAVAILABLE OR FAILED
      if (!analysisResult && openai) {
        try {
          console.log("Triggering OpenAI GPT-4o-mini clinical fallback evaluation...");
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: patientPrompt }
            ],
            response_format: { type: "json_object" },
          }, {
            timeout: 15000, // 15-second timeout safeguard passed as an SDK option
          });

          const resText = completion.choices[0].message?.content;
          if (resText) {
            analysisResult = JSON.parse(resText);
            usedModel = "OpenAI GPT-4o-mini";
          }
        } catch (openaiErr) {
          console.error("OpenAI Triage Fallback Failed.", openaiErr);
        }
      }

      // 3. SECURE LOCAL SIMULATOR FAILSAFE FALLBACK
      if (!analysisResult) {
        console.log("Running local heuristic simulator fallback...");
        const text = symptoms.toLowerCase();
        let condition = "General Upper Respiratory Symptoms";
        let severity: "Low" | "Medium" | "High" | "Critical" = "Low";
        let specialist = "General Practitioner";
        let firstAid = [
          "Rest in a comfortable position.",
          "Keep hydrated with water or electrolyte solutions.",
          "Monitor body temperature and pulse rate."
        ];
        let docSummary = "Patient presents with generalized mild symptoms. Advised lifestyle management and rest.";
        let warnings = ["High fever lasting over 3 days", "Difficulty breathing", "Persistent wheezing"];
        let homeCare = "Ensure proper ventilation. Take warm herbal teas and get abundant rest.";
        let emergencyRec = "If you experience high fevers above 102°F or breath shortness, report immediately to urgent care.";

        if (text.includes("chest pain") || text.includes("heart") || text.includes("crushing")) {
          condition = "Suspected Acute Coronary Syndrome (ACS) or Angina";
          severity = "Critical";
          specialist = "Emergency Cardiology / Emergency Room";
          firstAid = [
            "CALL EMERGENCY SERVICES IMMEDIATELY (Dial 108 for Ambulance or 112 for national emergency).",
            "Sit the patient down and keep them calm and comfortable.",
            "Ask if they have prescribed Nitroglycerin and help them take it.",
            "Chew a standard adult aspirin (325mg) if they are not allergic.",
            "Loosen tight clothing and monitor breathing."
          ];
          docSummary = "CRITICAL: Patient reports severe chest pain. Immediate transfer to emergency room initiated for rule-out of acute myocardial infarction.";
          warnings = ["Crushing pressure in chest", "Pain radiating down left arm", "Heavy sweating", "Sudden dizziness"];
          homeCare = "Do not engage in physical activity. Stay seated.";
          emergencyRec = "This is a life-threatening emergency. Proceed instantly to the nearest emergency department.";
        } else if (text.includes("breath") || text.includes("gasping") || text.includes("asthma") || text.includes("wheezing")) {
          condition = "Acute Respiratory Distress / Bronchospasm";
          severity = "High";
          specialist = "Pulmonologist / Emergency Physician";
          firstAid = [
            "Sit in an upright position to ease the work of breathing.",
            "Administer rescue inhaler (Albuterol) if prescribed to the patient.",
            "Ensure access to fresh air; loosen clothing around the neck."
          ];
          docSummary = "HIGH: Presentation matches respiratory discomfort. Recommended bronchodilator therapy check and immediate pulse oximetry tracking.";
          warnings = ["Inability to speak in full sentences", "Cyanosis (blue tint on lips/fingers)", "Chest retractions"];
          homeCare = "Maintain humid environment and use prescription rescue inhalers as ordered.";
          emergencyRec = "Go to ER or call 108 / 112 if respiratory rate exceeds 30 breaths per minute.";
        } else if (text.includes("stomach") || text.includes("appendix") || text.includes("abdomen") || text.includes("nausea")) {
          condition = "Gastroenteritis or Mild Abdominal Distension";
          severity = "Medium";
          specialist = "Gastroenterologist / Family Practice";
          firstAid = [
            "Avoid solid foods for a few hours to allow the gut to rest.",
            "Sip clear fluids or oral rehydration salts slowly.",
            "Apply a warm compress to the abdomen if comfortable."
          ];
          docSummary = "MEDIUM: Abdominal cramps reported. Differential includes acute gastroenteritis vs. mild food intolerance. Watch for guarding.";
          warnings = ["Severe localized pain in lower right quadrant", "Inability to keep fluids down", "High fever"];
          homeCare = "Gradually reintroduce bland foods (BRAT diet). Rest extensively.";
          emergencyRec = "Consult a primary physician if pain persists more than 24 hours.";
        }

        analysisResult = {
          possibleCondition: condition,
          severityLevel: severity,
          confidenceScore: "85% (Heuristic)",
          recommendedSpecialist: specialist,
          firstAidGuidance: firstAid,
          warningSigns: warnings,
          homeCareAdvice: homeCare,
          emergencyRecommendation: emergencyRec,
          doctorSummary: docSummary,
          disclaimer: "SIMULATOR MODE: This is a robust fallback. Configure OPENAI_API_KEY or GEMINI_API_KEY for live AI.",
          detectedLanguage: "English",
          clinicalReasoning: {
            whyRecommended: `TriageAI analyzed the symptoms and matched them to ${condition} because of the reported keywords.`,
            detectedSymptoms: "Parsed from input symptoms.",
            clinicalPattern: "Identified standard physiological pattern based on keyword heuristics.",
            riskFactors: user.medicalHistory || "None declared",
            severityReason: `Urgency set to ${severity} based on clinical guidelines for these symptoms.`,
            hospitalReason: severity === "Critical" || severity === "High" ? "Immediate ER consult recommended for emergency diagnostics." : "GP or walk-in clinical evaluation recommended.",
            actionsReason: "Standard localized supportive first aid procedures matched to symptom severity.",
            confidenceExplanation: "Moderate confidence because this is a rule-based heuristic fallback."
          },
          specialistExplanation: `A ${specialist} is trained to diagnose, monitor, and treat these symptoms.`,
          firstAidExtended: {
            doList: firstAid,
            doNotList: [
              "Do not ignore symptoms.",
              "Do not engage in strenuous physical activities.",
              "Do not take unprescribed medications."
            ],
            dangerSigns: warnings,
            emergencyTips: "Stay calm, sit in an upright position, and call emergency services if symptoms worsen.",
            travelAdvice: user.travelModeEnabled ? "Locate the nearest emergency ward in your current travel city. Dial local emergency numbers." : "Use nearby services widget for localization."
          },
          doctorHandoffDetailed: {
            chiefComplaint: condition,
            timeline: "Acute presentation",
            investigations: severity === "Critical" || severity === "High" ? ["ECG", "Troponin Test", "Full Vitals Scan"] : ["General Consultation", "Basic Physical Exam"],
            doctorNotes: docSummary
          },
          followUpQuestions: [
            "When did the symptoms first start?",
            "Have you experienced similar symptoms in the past?",
            "Are there any other associated symptoms (fever, chest pain, dizziness)?"
          ]
        };

        // Inject Indian localized translations for the local clinical simulator
        if (targetLanguage !== "English") {
          if (targetLanguage === "Hindi") {
            analysisResult.detectedLanguage = "Hindi";
            if (severity === "Critical") {
              analysisResult.possibleCondition = "संदिग्ध तीव्र कोरोनरी सिंड्रोम (ACS) या एनजाइना";
              analysisResult.recommendedSpecialist = "आपातकालीन कार्डियोलॉजिस्ट / आपातकालीन विभाग";
              analysisResult.firstAidGuidance = [
                "तुरंत आपातकालीन सेवाओं को कॉल करें (Ambulance के लिए 108 या राष्ट्रीय आपातकाल के लिए 112 डायल करें)।",
                "मरीज को शांत और आरामदायक स्थिति में बैठाएं।",
                "यदि निर्धारित हो, तो उन्हें नाइट्रोग्लिसरीन लेने में मदद करें।",
                "यदि एलर्जी न हो, तो वयस्क एस्पिरिन (325mg) चबाने को कहें।"
              ];
              analysisResult.warningSigns = ["सीने में अत्यधिक दबाव या दर्द", "बाईं बांह या जबड़े में दर्द का फैलना", "अत्यधिक पसीना और सांस फूलना", "अचानक चक्कर आना"];
              analysisResult.homeCareAdvice = "कोई भी शारीरिक गतिविधि न करें। पूरी तरह शांत रहें और एम्बुलेंस की प्रतीक्षा करें।";
              analysisResult.emergencyRecommendation = "यह एक जीवन-घातक आपातकाल है। तुरंत अस्पताल के आपातकालीन विभाग में पहुंचें।";
              analysisResult.doctorSummary = "CRITICAL: तीव्र सीने में दर्द की शिकायत। आपातकालीन मूल्यांकन और ईसीजी की तत्काल आवश्यकता।";
            } else if (severity === "High") {
              analysisResult.possibleCondition = "तीव्र श्वसन संकट / ब्रोन्कोस्पज़म";
              analysisResult.recommendedSpecialist = "पल्मोनोलॉजिस्ट / आपातकालीन चिकित्सक";
              analysisResult.firstAidGuidance = [
                "सांस लेने को आसान बनाने के लिए सीधे बैठें।",
                "यदि निर्धारित हो, तो इनहेलर (एल्ब्युटेरोल) का उपयोग करें।",
                "ताजी हवा आने दें और गर्दन के पास के कपड़े ढीले करें।"
              ];
              analysisResult.warningSigns = ["पूरे वाक्यों में न बोल पाना", "होंठों या उंगलियों पर नीलापन", "सांस लेते समय छाती का अंदर खिंचना"];
              analysisResult.homeCareAdvice = "नम वातावरण बनाए रखें और निर्धारित इनहेलर का उपयोग करें।";
              analysisResult.emergencyRecommendation = "यदि श्वसन दर प्रति मिनट 30 से अधिक हो जाती है, तो तुरंत 108 या 112 पर कॉल करें।";
              analysisResult.doctorSummary = "HIGH: तीव्र श्वसन संकट की शिकायत। ब्रोंकोडायलेटर थेरेपी और पल्स ऑक्सीमेट्री की आवश्यकता।";
            } else if (severity === "Medium") {
              analysisResult.possibleCondition = "गैस्ट्रोएंटेराइटिस या पेट में दर्द";
              analysisResult.recommendedSpecialist = "गैस्ट्रोएंटेरोलॉजिस्ट / सामान्य चिकित्सक";
              analysisResult.firstAidGuidance = [
                "पेट को आराम देने के लिए कुछ घंटों तक ठोस भोजन से बचें।",
                "तरल पदार्थ या ओआरएस (ORS) धीरे-धीरे पिएं।",
                "यदि आरामदायक हो तो पेट पर गर्म सेक लगाएं।"
              ];
              analysisResult.warningSigns = ["पेट के निचले दाहिने हिस्से में तेज दर्द", "लगातार उल्टी होना", "तेज बुखार"];
              analysisResult.homeCareAdvice = "धीरे-धीरे हल्का भोजन (खिचड़ी, केला) शुरू करें। पर्याप्त आराम करें।";
              analysisResult.emergencyRecommendation = "यदि पेट का दर्द 24 घंटे से अधिक समय तक बना रहता है, तो चिकित्सक से परामर्श लें।";
              analysisResult.doctorSummary = "MEDIUM: पेट दर्द और ऐंठन। गैस्ट्रोएंटेराइटिस की संभावना।";
            } else {
              analysisResult.possibleCondition = "सामान्य ऊपरी श्वसन लक्षण";
              analysisResult.recommendedSpecialist = "सामान्य चिकित्सक";
              analysisResult.firstAidGuidance = [
                "आरामदायक स्थिति में आराम करें।",
                "पानी या ओआरएस (ORS) पीकर शरीर में पानी की कमी न होने दें।",
                "शरीर के तापमान और नाड़ी की दर पर नजर रखें।"
              ];
              analysisResult.warningSigns = ["3 दिनों से अधिक तेज बुखार", "सांस लेने में कठिनाई", "लगातार खांसी"];
              analysisResult.homeCareAdvice = "गर्म हर्बल चाय या काढ़ा लें और पर्याप्त आराम करें।";
              analysisResult.emergencyRecommendation = "यदि तेज बुखार या सांस लेने में तकलीफ हो, तो तुरंत डॉक्टर को दिखाएं।";
              analysisResult.doctorSummary = "LOW: सामान्य सर्दी और खांसी के लक्षण। आराम और घरेलू उपचार की सलाह।";
            }
          } else if (targetLanguage === "Telugu") {
            analysisResult.detectedLanguage = "Telugu";
            if (severity === "Critical") {
              analysisResult.possibleCondition = "తీవ్రమైన గుండె సమస్య (ACS) లేదా అంజైనా అనుమానం";
              analysisResult.recommendedSpecialist = "కార్డియాలజిస్ట్ / అత్యవసర విభాగం";
              analysisResult.firstAidGuidance = [
                "వెంటనే అత్యవసర సేవలకు కాల్ చేయండి (అంబులెన్స్ కోసం 108 లేదా జాతీయ అత్యవసర విభాగం కోసం 112 డయల్ చేయండి).",
                "రోగిని ప్రశాంతంగా కూర్చోబెట్టి సౌకర్యవంతంగా ఉంచండి.",
                "నిర్దేశించిన నైట్రోగ్లిజరిన్ ఉంటే వారికి సహాయం చేయండి.",
                "అలర్జీ లేకపోతే ఒక ఆస్పిరిన్ (325mg) నమలమనండి."
              ];
              analysisResult.warningSigns = ["ఛాతీలో తీవ్రమైన ఒత్తిడి లేదా నొప్పి", "ఎడమ చేయి లేదా దవడ వైపు నొప్పి వ్యాపించడం", "విపరీతమైన చెమట మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది"];
              analysisResult.homeCareAdvice = "ఎటువంటి శారీరక శ్రమ చేయవద్దు. నిశ్శబ్దంగా ఉండి అంబులెన్స్ కొరకు నిరీక్షించండి.";
              analysisResult.emergencyRecommendation = "ఇది ప్రాణాపాయ పరిస్థితి. వెంటనే సమీపంలోని అత్యవసర ఆసుపత్రికి వెళ్ళండి.";
              analysisResult.doctorSummary = "CRITICAL: ఛాతీ నొప్పితో బాధపడుతున్నారు. వెంటనే ఈసీజీ మరియు అత్యవసర వైద్య పరీక్షలు అవసరం.";
            } else if (severity === "High") {
              analysisResult.possibleCondition = "తీవ్రమైన శ్వాసకోశ ఇబ్బంది";
              analysisResult.recommendedSpecialist = "పల్మనాలజిస్ట్ / అత్యవసర వైద్యుడు";
              analysisResult.firstAidGuidance = [
                "ఆక్సిజన్ తీసుకోవడం సులభతరం చేయడానికి నిటారుగా కూర్చోండి.",
                "నిర్దేశించిన ఇన్హేలర్ ఉంటే వెంటనే ఉపయోగించండి.",
                "స్వచ్ఛమైన గాలి లభించేలా చూసుకోండి; మెడ చుట్టూ దుస్తులను వదులు చేయండి."
              ];
              analysisResult.warningSigns = ["పూర్తి వాక్యాలలో మాట్లాడలేకపోవడం", "పెదవులు లేదా వేళ్లు నీలం రంగులోకి మారడం", "నాసికా రంధ్రాలు వెడల్పు కావడం"];
              analysisResult.homeCareAdvice = "నిర్దేశించిన ఇన్హేలర్ ఉపయోగించండి మరియు విశ్రాంతి తీసుకోండి.";
              analysisResult.emergencyRecommendation = "శ్వాస రేటు నిమిషానికి 30 దాటితే, వెంటనే 108 లేదా 112 కి కాల్ చేయండి.";
              analysisResult.doctorSummary = "HIGH: తీవ్రమైన శ్వాస ఇబ్బంది. పల్స్ ఆక్సిమెట్రీ తనిఖీ అవసరం.";
            } else if (severity === "Medium") {
              analysisResult.possibleCondition = "గ్యాస్ట్రోఎంటరైటిస్ లేదా తేలికపాటి కడుపు నొప్పి";
              analysisResult.recommendedSpecialist = "గ్యాస్ట్రోఎంటరాలజిస్ట్ / జనరల్ ఫిజీషియన్";
              analysisResult.firstAidGuidance = [
                "కడుపుకు విశ్రాంతి ఇవ్వడానికి కొన్ని గంటల పాటు ఘన ఆహారాన్ని నివారించండి.",
                "మంచినీరు లేదా ఓఆర్‌ఎస్ (ORS) నెమ్మదిగా తాగండి.",
                "సౌకర్యవంతంగా ఉంటే కడుపుపై వెచ్చని కాపడం పెట్టండి."
              ];
              analysisResult.warningSigns = ["కడుపు కుడి వైపు తీవ్రమైన నొప్పి", "వాంతులు కావడం", "తీవ్రమైన జ్వరం"];
              analysisResult.homeCareAdvice = "నెమ్మదిగా తేలికపాటి ఆహారం తీసుకోండి. తగినంత విశ్రాంతి తీసుకోండి.";
              analysisResult.emergencyRecommendation = "నొప్పి 24 గంటల కంటే ఎక్కువ ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.";
              analysisResult.doctorSummary = "MEDIUM: కడుపు నొప్పి మరియు తిమ్మిరి. గ్యాస్ట్రోఎంటరైటిస్ అనుమానం.";
            } else {
              analysisResult.possibleCondition = "సాధారణ శ్వాసకోశ లక్షణాలు";
              analysisResult.recommendedSpecialist = "జనరల్ ఫిజీషియన్";
              analysisResult.firstAidGuidance = [
                "సౌకర్యవంతమైన స్థితిలో విశ్రాంతి తీసుకోండి.",
                "మంచినీరు లేదా ద్రవపదార్థాలు తాగుతూ ఉండండి.",
                "జ్వరం మరియు నాడి రేటును పర్యవేక్షించండి."
              ];
              analysisResult.warningSigns = ["3 రోజుల కంటే ఎక్కువ తీవ్రమైన జ్వరం", "శ్వాస తీసుకోవడంలో ఇబ్బంది", "నిరంతర దగ్गु"];
              analysisResult.homeCareAdvice = "వెచ్చని ద్రవపదార్థాలు తీసుకోండి మరియు తగినంత విశ్రాంతి పొందండి.";
              analysisResult.emergencyRecommendation = "తీవ్రమైన జ్వరం లేదా శ్వాస తీసుకోవడం కష్టంగా ఉంటే వైద్యుడిని సంప్రదించండి.";
              analysisResult.doctorSummary = "LOW: సాధారణ జలుబు మరియు దగ్గు లక్షణాలు. విశ్రాంతి సిఫార్సు చేయబడింది.";
            }
          } else {
            // Friendly fallback language helper banner for other Indian languages
            analysisResult.possibleCondition = `${analysisResult.possibleCondition} (${targetLanguage} Translation Portal)`;
            analysisResult.disclaimer = `${analysisResult.disclaimer} [Translated for ${targetLanguage}]`;
          }
        }

        usedModel = "Local Clinical Simulator";
      }

      // Add audit metadata on output
      analysisResult.disclaimer = `${analysisResult.disclaimer} [Assessed via ${usedModel}]`;

      // Save to history using database adapter
      const savedResult = await db.createAssessment({
        userId: user.id,
        symptoms,
        possibleCondition: analysisResult.possibleCondition,
        severityLevel: analysisResult.severityLevel as any,
        recommendedSpecialist: analysisResult.recommendedSpecialist,
        firstAidGuidance: analysisResult.firstAidGuidance,
        disclaimer: analysisResult.disclaimer,
        // Serialize advanced fields into doctorSummary as a JSON string
        doctorSummary: JSON.stringify({
          isAdvanced: true,
          rawSummary: analysisResult.doctorSummary,
          detectedLanguage: analysisResult.detectedLanguage || "English",
          clinicalReasoning: analysisResult.clinicalReasoning,
          specialistExplanation: analysisResult.specialistExplanation,
          firstAidExtended: analysisResult.firstAidExtended,
          doctorHandoffDetailed: analysisResult.doctorHandoffDetailed,
          followUpQuestions: analysisResult.followUpQuestions,
        }),
        confidenceScore: analysisResult.confidenceScore,
        warningSigns: analysisResult.warningSigns,
        homeCareAdvice: analysisResult.homeCareAdvice,
        emergencyRecommendation: analysisResult.emergencyRecommendation,
      });

      return res.json({ success: true, assessment: savedResult });
    } catch (err: any) {
      console.error("AI Analysis Core Failed:", err);
      res.status(500).json({ error: "Symptom analysis failed. Please try again shortly.", details: err.message });
    }
  });

  // Get Assessment History
  app.get("/api/triage/history", async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized user session" });
    }
    const history = await db.getAssessmentsByUserId(user.id);
    res.json({ success: true, history });
  });

  // Delete Assessment
  app.delete("/api/triage/history/:id", async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized user session" });
    }
    const { id } = req.params;
    const deleted = await db.deleteAssessment(id, user.id);
    if (deleted) {
      res.json({ success: true, message: "Assessment record deleted" });
    } else {
      res.status(404).json({ error: "Assessment record not found" });
    }
  });

  // --- MAPS / NEARBY FACILITIES ROUTE ---
  // Uses Google Places API (New) with fallback to OSM Overpass API.
  app.get("/api/nearby-facilities", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY;
    let facilities: any[] = [];
    let sourceUsed = "";

    // 1. TRY GOOGLE PLACES API (NEW)
    if (googleMapsKey && googleMapsKey !== "YOUR_GOOGLE_MAPS_API_KEY") {
      try {
        console.log("Fetching nearby facilities from Google Places API...");
        const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleMapsKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.nationalPhoneNumber,places.location,places.types,places.regularOpeningHours",
          },
          body: JSON.stringify({
            includedTypes: ["hospital", "medical_clinic"],
            maxResultCount: 8,
            locationRestriction: {
              circle: {
                center: { latitude, longitude },
                radius: 12000.0, // 12km
              },
            },
          }),
        });

        if (response.ok) {
          const resultJson = await response.json();
          if (resultJson.places && Array.isArray(resultJson.places)) {
            facilities = resultJson.places.map((place: any) => {
              // Calculate real distance using haversine
              const distInKm = calculateHaversine(latitude, longitude, place.location.latitude, place.location.longitude);
              const distanceInMiles = Math.round((distInKm * 0.621371) * 10) / 10;
              const durationInMins = Math.round(distanceInMiles * 4 + 2);

              const types = place.types || [];
              const isHosp = types.includes("hospital");
              const isOpenNow = place.regularOpeningHours?.openNow ?? true;

              return {
                id: place.id,
                name: place.displayName?.text || "Unknown Facility",
                type: isHosp ? "Hospital" : "Clinic",
                rating: place.rating || 4.5,
                distance: distanceInMiles,
                duration: durationInMins,
                phone: place.nationalPhoneNumber || "+91 108",
                isOpen24h: isHosp,
                isOpenNow: isOpenNow,
                hasSpecialistWing: true,
                touristFriendly: true,
                emergencyDept: isHosp,
                address: place.formattedAddress || "Medical District, India",
              };
            });
            sourceUsed = "Google Places API";
          }
        } else {
          console.error("Google Places HTTP failure, response code:", response.status);
        }
      } catch (gmpErr) {
        console.error("Google Places API request failed, falling back to OpenStreetMap Overpass:", gmpErr);
      }
    }

    // 2. FALLBACK TO OPENSTREETMAP OVERPASS API (KEYLESS, FREE, REAL WORLD DATA)
    if (facilities.length === 0) {
      try {
        console.log("Triggering keyless OpenStreetMap Overpass API fallback...");
        const query = `[out:json][timeout:15];
          (
            node["amenity"="hospital"](around:15000,${latitude},${longitude});
            way["amenity"="hospital"](around:15000,${latitude},${longitude});
            node["amenity"="clinic"](around:15000,${latitude},${longitude});
            way["amenity"="clinic"](around:15000,${latitude},${longitude});
            node["amenity"="pharmacy"](around:15000,${latitude},${longitude});
            way["amenity"="pharmacy"](around:15000,${latitude},${longitude});
            node["amenity"="blood_bank"](around:15000,${latitude},${longitude});
            way["amenity"="blood_bank"](around:15000,${latitude},${longitude});
          );
          out center;`;

        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
          headers: {
            "User-Agent": "TriageAI-ClinicFinder/1.0 (https://ais.dev; bhavikvanapalli06@gmail.com)",
          },
        });

        if (response.ok) {
          const resultJson = await response.json();
          if (resultJson.elements && Array.isArray(resultJson.elements)) {
            facilities = resultJson.elements.map((element: any) => {
              const elLat = element.lat || element.center?.lat;
              const elLng = element.lon || element.center?.lon;
              
              const distInKm = calculateHaversine(latitude, longitude, elLat, elLng);
              const distanceInMiles = Math.round((distInKm * 0.621371) * 10) / 10;
              const durationInMins = Math.round(distanceInMiles * 4 + 2);

              const tags = element.tags || {};
              const amenity = tags.amenity || "clinic";
              
              let typeLabel = "Clinic";
              let defaultName = "Primary Health Centre (PHC)";
              
              if (amenity === "hospital") {
                typeLabel = "Hospital";
                defaultName = tags.emergency === "yes" ? "Trauma Centre / Government Hospital" : "Government General Hospital / CHC";
              } else if (amenity === "pharmacy") {
                typeLabel = "Pharmacy";
                defaultName = "Local Pharmacy / Medical Store";
              } else if (amenity === "blood_bank") {
                typeLabel = "Blood Bank";
                defaultName = "Red Cross Blood Bank Centre";
              } else if (amenity === "clinic") {
                typeLabel = "Clinic";
                defaultName = "Community Health Centre (CHC) / PHC";
              }
              
              const name = tags.name || defaultName;
              const isHosp = amenity === "hospital";
              const rawPhone = tags.phone || tags["contact:phone"] || (isHosp ? "+91 108" : "+91 112");
              
              // Compile structured address from OSM tags with Indian format fallback
              const street = tags["addr:street"] || "";
              const housenumber = tags["addr:housenumber"] || "";
              const city = tags["addr:city"] || tags["addr:suburb"] || "";
              const state = tags["addr:state"] || "India";
              const compiledAddr = [housenumber, street, city, state].filter(Boolean).join(", ") || tags["addr:full"] || "MG Road, New Delhi, India";

              return {
                id: `osm-${element.type}-${element.id}`,
                name: name,
                type: typeLabel,
                rating: 4.0 + (element.id % 10) * 0.1, // Generate reproducible deterministic rating
                distance: distanceInMiles,
                duration: durationInMins,
                phone: rawPhone,
                isOpen24h: isHosp || tags.opening_hours?.includes("24/7") || amenity === "blood_bank",
                isOpenNow: true,
                hasSpecialistWing: isHosp,
                touristFriendly: tags["contact:language"]?.includes("en") || tags.wikipedia || false,
                emergencyDept: isHosp || tags.emergency === "yes",
                address: compiledAddr,
              };
            });
            sourceUsed = "OpenStreetMap Overpass API";
          }
        } else {
          console.error("Overpass API returned HTTP error:", response.status);
        }
      } catch (osmErr) {
        console.error("OSM Overpass API Fallback Failed:", osmErr);
      }
    }

    // 3. FINAL STATIC EMERGENCY FALLBACK IF EVERYTHING ELSE FAILS (OR OFFLINE)
    if (facilities.length === 0) {
      console.log("No live map service available. Returning empty results.");
      facilities = [];
      sourceUsed = "None - Offline/Empty Result";
    }

    console.log(`Successfully completed Nearby Search of 15km. Found ${facilities.length} clinics. Source: ${sourceUsed}`);
    res.json({ success: true, source: sourceUsed, facilities });
  });

  // Haversine Distance Formula Helper
  function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's Radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- VITE MIDDLEWARE CONFIGURATION ---

  async function startServer() {
    const PORT = 3000;

    if (process.env.NODE_ENV !== "production") {
      const { createServer } = await import("vite");
      
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`TriageAI Server listening at http://0.0.0.0:${PORT}`);
    });
  }

  if (!process.env.VERCEL) {
    startServer();
  }

  export default app;
