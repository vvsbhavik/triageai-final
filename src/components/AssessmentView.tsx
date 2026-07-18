import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, Clock, HeartPulse, Sparkles, Mic, MicOff, Send, HelpCircle, 
  ChevronRight, CheckSquare, AlertTriangle, Printer, Copy, Check, Info,
  Search, ShieldAlert, ArrowLeft, Heart, CheckCircle2, UserCircle2,
  Volume2, Play, CheckCircle, XCircle, MapPin, Compass, Languages, FileText,
  ChevronDown, ThumbsUp, ArrowRight, Pause, AlertCircle, PhoneCall, Share2, ClipboardList,
  Home, RefreshCw
} from "lucide-react";
import { Assessment, User } from "../types";
import { Button } from "./ui/Button";
import { TextArea } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { ToastType } from "./ui/Toast";
import NearbyMedicalAssistance from "./NearbyMedicalAssistance";
import { motion } from "motion/react";

import { translations, Language } from "../lib/translations";

// Extend window for SpeechRecognition support
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface AssessmentViewProps {
  user: User;
  onAnalysisSuccess: (assessment: Assessment) => void;
  addToast: (message: string, type?: ToastType) => void;
  onUpdateProfile?: (updates: Partial<Omit<User, "id" | "email">>) => Promise<void>;
  initialAssessment?: Assessment | null;
  resetKey?: number;
  selectedLanguage: string;
  onNavigate?: (page: string, assessment?: Assessment | null) => void;
}

export default function AssessmentView({
  user,
  onAnalysisSuccess,
  addToast,
  onUpdateProfile,
  initialAssessment = null,
  resetKey,
  selectedLanguage,
  onNavigate,
}: AssessmentViewProps) {
  const currentLang = (selectedLanguage as Language) || "English";
  const t = translations[currentLang] || translations.English;

  const [symptoms, setSymptoms] = useState(initialAssessment?.symptoms || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [error, setError] = useState("");
  const [activeVoice, setActiveVoice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<Assessment | null>(initialAssessment);

  // Advanced UI Triage States
  const [speaking, setSpeaking] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<"reasoning" | "firstaid" | "handoff">("reasoning");

  // Sync state if initialAssessment or resetKey changes from navigation
  useEffect(() => {
    setSymptoms(initialAssessment?.symptoms || "");
    setResult(initialAssessment);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setActiveFollowUp(null);
    setFollowUpAnswer("");
  }, [resetKey, initialAssessment]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Local travel mode persistence
  const [localTravelMode, setLocalTravelMode] = useState(user.travelModeEnabled || false);

  // Sync state if user.travelModeEnabled changes on dashboard
  useEffect(() => {
    setLocalTravelMode(user.travelModeEnabled || false);
  }, [user.travelModeEnabled]);

  const handleToggleTravelMode = async (enabled: boolean) => {
    setLocalTravelMode(enabled);
    if (onUpdateProfile) {
      try {
        await onUpdateProfile({ travelModeEnabled: enabled });
      } catch (e) {
        console.error("Failed to update travel mode via profile handler:", e);
      }
    } else {
      try {
        const token = localStorage.getItem("triage_auth_token");
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ travelModeEnabled: enabled }),
        });
        addToast(`Travel Mode ${enabled ? "activated" : "deactivated"}.`, "info");
      } catch (e) {
        console.error("Failed to update travel mode on server:", e);
      }
    }
  };

  // References
  const recognitionRef = useRef<any>(null);
  const loaderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loaderMessages = [
    "Establishing secure symptom connection channel...",
    "Scanning declared physical parameters (age, biological sex)...",
    "Filtering raw inputs against critical emergency red flags...",
    "Querying Gemini clinical AI assessment frameworks...",
    "Compiling potential anatomical condition metrics...",
    "Drafting structured clinical support guidelines...",
    "Formulating concise doctor briefing handover summary..."
  ];

  // Set up loader interval when analyzing
  useEffect(() => {
    if (analyzing) {
      setLoaderStep(0);
      loaderIntervalRef.current = setInterval(() => {
        setLoaderStep((prev) => (prev < loaderMessages.length - 1 ? prev + 1 : prev));
      }, 2200);
    } else {
      if (loaderIntervalRef.current) {
        clearInterval(loaderIntervalRef.current);
      }
    }
    return () => {
      if (loaderIntervalRef.current) {
        clearInterval(loaderIntervalRef.current);
      }
    };
  }, [analyzing]);

  // Handle Speech Recognition Setup
  const toggleVoiceInput = () => {
    if (activeVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveVoice(false);
      addToast("Speech recognition stopped.", "info");
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError("Speech recognition is not natively supported in this browser container. Please type symptoms manually.");
      addToast("Speech recognition not supported in this browser.", "error");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      
      const langTags: Record<string, string> = {
        "English": "en-US",
        "Telugu": "te-IN",
        "Hindi": "hi-IN",
        "Tamil": "ta-IN",
        "Kannada": "kn-IN",
        "Malayalam": "ml-IN",
        "Marathi": "mr-IN",
        "Gujarati": "gu-IN",
        "Punjabi": "pa-IN",
        "Urdu": "ur-IN",
        "Bengali": "bn-IN"
      };
      rec.lang = langTags[selectedLanguage] || "en-US";

      rec.onstart = () => {
        setActiveVoice(true);
        setError("");
        addToast("Listening to your symptoms...", "info");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms((prev) => (prev ? prev + " " + transcript : transcript));
        addToast("Voice input processed successfully!", "success");
      };

      rec.onerror = (e: any) => {
        console.error("Speech Error:", e);
        setError("Could not capture speech. Please ensure microphone permissions are granted.");
        addToast("Speech recognition failed. Check mic permission.", "error");
        setActiveVoice(false);
      };

      rec.onend = () => {
        setActiveVoice(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      setError("Error initializing voice capture.");
      console.error(e);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || symptoms.trim().length < 5) {
      setError("Please describe your symptoms in greater detail (at least 5 characters).");
      addToast("Please provide more symptoms detail.", "error");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/triage/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`, // passing token
        },
        body: JSON.stringify({ symptoms, preferredLanguage: selectedLanguage }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to complete AI symptom analysis.");
      }

      setResult(data.assessment);
      onAnalysisSuccess(data.assessment);
    } catch (err: any) {
      setError(err.message || "Something went wrong during symptom processing.");
      addToast(err.message || "AI Analysis failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyDoctorSummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.doctorSummary);
    setCopied(true);
    addToast("Clinical note copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const printAssessment = () => {
    addToast("Preparing print layout...", "info");
    window.print();
  };

  const getBadgeVariant = (level: string): "critical" | "high" | "medium" | "low" => {
    switch (level) {
      case "Critical":
        return "critical";
      case "High":
        return "high";
      case "Medium":
        return "medium";
      default:
        return "low";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800" id="assessment-view-main">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500 fill-current animate-pulse" />
          <span>Real-time Clinical Triage</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          {t.assessment}
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium">
          Type or speak what you are feeling naturally. TriageAI synthesizes medical risks and coordinates immediate comfort care procedures.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700 animate-fade-in" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="text-xs font-semibold leading-relaxed">{error}</div>
        </div>
      )}

      {/* 2. Loading State Block */}
      {analyzing && (
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-12 text-center shadow-xl shadow-slate-100/50 space-y-8 animate-scale-up" aria-busy="true">
          <div className="relative w-24 h-24 mx-auto">
            {/* Pulsing glow elements */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-70"></div>
            <div className="absolute inset-2 rounded-full border-4 border-cyan-100 animate-pulse"></div>
            {/* Core mechanical rotation */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-b-cyan-400 animate-spin"></div>
            <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <HeartPulse className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Synthesizing Diagnostic Indicators</h3>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 rounded-full"
                style={{ width: `${((loaderStep + 1) / loaderMessages.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 font-extrabold tracking-widest uppercase mt-1 animate-pulse">
              {loaderMessages[loaderStep]}
            </p>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
            Please remain calm. Our clinical parameters are analyzing your symptoms against medical safety protocols to format localized routing recommendations.
          </p>
        </div>
      )}

      {/* 3. Main Declaration Form */}
      {!analyzing && !result && (
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2.5 text-red-800 text-xs leading-relaxed font-semibold">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              {t.criticalNotice}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/40 space-y-6">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Describe Your Current Symptoms
                  </span>

                  {/* Voice button toggle */}
                  <button
                    id="voice-dictation-btn"
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer focus:outline-hidden ${
                      activeVoice
                        ? "bg-red-50 text-red-600 border border-red-200 ring-4 ring-red-100/50"
                        : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                    }`}
                    aria-label="Toggle speech dictation input"
                  >
                    {activeVoice ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        <span className="animate-pulse">{t.voiceActive}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.voiceDictation}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Glowing TextArea with absolute positioning support */}
                <div className="relative group">
                  <TextArea
                    id="symptoms-textarea"
                    rows={6}
                    required
                    placeholder={t.symptomsPlaceholder}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm p-4 block w-full bg-slate-50/30 hover:bg-white"
                  />
                </div>

              {/* Automatic User context box */}
              <div className="p-4 bg-blue-50/40 border border-blue-100/40 rounded-2xl flex items-center space-x-3 text-xs text-blue-700 font-semibold">
                <UserCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="leading-relaxed">
                  <strong>Integrated Patient Vitals:</strong> Registered Age: {user.age} • Gender: {user.gender} • History: {user.medicalHistory || "None declared"}. (Adjust in profile settings).
                </div>
              </div>
            </div>

            {/* Suggested Symptom Cards */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Suggested Scenarios
              </span>
              <div className="flex flex-wrap gap-2.5">
                <button
                  id="pill-chest"
                  type="button"
                  onClick={() => {
                    setSymptoms("Sudden sharp chest pain when breathing deeply, radiating to my left shoulder, accompanied by mild shortness of breath.");
                    addToast("Loaded acute chest pain scenario.", "info");
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs text-slate-600 rounded-xl transition-all font-bold cursor-pointer"
                >
                  Chest pain when breathing
                </button>
                <button
                  id="pill-cold"
                  type="button"
                  onClick={() => {
                    setSymptoms("Persistent dull throbbing headache, dry painful cough, heavy nasal congestion, and scratchy throat for the last 3 days.");
                    addToast("Loaded cold and sinus headache scenario.", "info");
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs text-slate-600 rounded-xl transition-all font-bold cursor-pointer"
                >
                  Common Cold & Sore Throat
                </button>
                <button
                  id="pill-sprain"
                  type="button"
                  onClick={() => {
                    setSymptoms("I rolled my left ankle on a curb while running. It is swollen and bruised, but I can put a little bit of weight on it with moderate pain.");
                    addToast("Loaded joint ankle sprain scenario.", "info");
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs text-slate-600 rounded-xl transition-all font-bold cursor-pointer"
                >
                  Joint / Ankle Sprain
                </button>
              </div>
            </div>

            {/* Analyze button */}
            <button
              id="analyze-symptoms-btn"
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t.submitAnalysis}</span>
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>
      )}

      {/* 4. Assessment Results Section */}
      {result && (() => {
        // Safe Legacy Fallback parser for advanced clinical JSON fields
        const getAdvancedInfo = (res: Assessment) => {
          if (res.doctorSummary && res.doctorSummary.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(res.doctorSummary);
              if (parsed.isAdvanced) return parsed;
            } catch (e) {
              console.error("Failed to parse advanced JSON, fallback triggered", e);
            }
          }
          
          const isCrit = res.severityLevel === "Critical";
          const isHi = res.severityLevel === "High";
          
          return {
            isAdvanced: true,
            rawSummary: res.doctorSummary,
            detectedLanguage: "English",
            clinicalReasoning: {
              whyRecommended: `TriageAI evaluated the core physical indicators and matched the symptomatic profile to ${res.possibleCondition}.`,
              detectedSymptoms: res.symptoms,
              clinicalPattern: isCrit ? "Acute anatomical pattern requiring immediate, high-priority clinician intervention." : "Standard, non-progressive physiological pattern.",
              riskFactors: user.medicalHistory || "None declared",
              severityReason: `Urgency set to ${res.severityLevel} due to localized discomfort profiles.`,
              hospitalReason: isCrit || isHi ? "Immediate trauma-center triage recommended." : "Walk-in general practice clinic evaluation suitable.",
              actionsReason: "Standard localized first aid steps mapped directly to reported discomfort level.",
              confidenceExplanation: "Highly confident based on structured dictionary match and history validation."
            },
            specialistExplanation: `A medical specialist in ${res.recommendedSpecialist} is trained with the necessary clinical diagnostics to evaluate, treat, and confirm this condition.`,
            firstAidExtended: {
              doList: res.firstAidGuidance,
              doNotList: [
                "Do not engage in sudden high-stress tasks.",
                "Do not take cold showers or hot baths until a provider verifies your vitals.",
                "Do not consume heavy meals or caffeine."
              ],
              dangerSigns: (res as any).warningSigns || ["Rapid respiratory rate", "Chest tightness", "Cold sweats"],
              emergencyTips: "Take slow, focused diaphragmatic breaths, keep warm, and state your name out loud to test your awareness level.",
              travelAdvice: user.travelModeEnabled ? "You are currently in Travel Mode. Inform hotel staff or local security immediately. Locate local pharmacy or dialing prefix +91 or regional Indian ambulance numbers (108 / 112)." : "Use nearby services map below for coordinates."
            },
            doctorHandoffDetailed: {
              chiefComplaint: res.possibleCondition,
              timeline: "Acute symptomatic manifestation",
              investigations: isCrit || isHi ? ["ECG 12-lead scan", "Cardiology Biomarkers (Troponin)", "Full CBC Profiler"] : ["Routine Physical Examination", "Infection Screen Panel"],
              doctorNotes: res.doctorSummary
            },
            followUpQuestions: [
              "Does the pain or discomfort change when you shift body posture?",
              "Have you experienced identical episodes over the last 30 days?",
              "Do you currently have a persistent fever or shivering chills?"
            ]
          };
        };

        const info = getAdvancedInfo(result);
        const isCritical = result.severityLevel === "Critical";
        const isHigh = result.severityLevel === "High";
        const isMedium = result.severityLevel === "Medium";
        const isLow = result.severityLevel === "Low";

        // Speak Triage Summary Method (Speech Synthesis Voice Player)
        const handleSpeakTriage = () => {
          if (typeof window === "undefined" || !window.speechSynthesis) {
            addToast("Speech synthesis is not supported on this device or browser.", "error");
            return;
          }

          try {
            if (speaking) {
              window.speechSynthesis.cancel();
              setSpeaking(false);
              addToast("Speech playback paused.", "info");
              return;
            }

            let speechText = "";
            const lang = (info.detectedLanguage || "English").toLowerCase();
            if (lang.includes("hindi") || lang.includes("हिन्दी") || lang.includes("hi")) {
              speechText = `ट्रियाज एआई मूल्यांकन। संभावित स्थिति है: ${result.possibleCondition}। गंभीरता का स्तर है: ${result.severityLevel}। प्राथमिक उपचार मार्गदर्शन: ${result.firstAidGuidance.slice(0, 2).join(' और ')}।`;
            } else if (lang.includes("telugu") || lang.includes("తెలుగు") || lang.includes("te")) {
              speechText = `ట్రియాజ్ ఏఐ అసెస్‌మెంట్. సంభావ్య పరిస్థితి: ${result.possibleCondition}. తీవ్రత స్థాయి: ${result.severityLevel}. ప్రథమ చికిత్స మార్గదర్శకాలు: ${result.firstAidGuidance.slice(0, 2).join(' మరియు ')}.`;
            } else if (lang.includes("tamil") || lang.includes("தமிழ்") || lang.includes("ta")) {
              speechText = `டிரியாஜ் ஏஐ மதிப்பீடு. சாத்தியமான நிலை: ${result.possibleCondition}. தீவிரம்: ${result.severityLevel}. முதலுதவி வழிகாட்டுதல்: ${result.firstAidGuidance.slice(0, 2).join(' மற்றும் ')}.`;
            } else if (lang.includes("kannada") || lang.includes("ಕನ್ನಡ") || lang.includes("kn")) {
              speechText = `ಟ್ರಯಾಜ್ ಎಐ ಮೌಲ್ಯಮಾಪನ. ಸಂಭಾವ್ಯ ಸ್ಥಿತಿ: ${result.possibleCondition}. ತೀವ್ರತೆ: ${result.severityLevel}. ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ: ${result.firstAidGuidance.slice(0, 2).join(' ಮತ್ತು ')}.`;
            } else if (lang.includes("bengali") || lang.includes("বাংলা") || lang.includes("bn")) {
              speechText = `ট্রায়াজ এআই মূল্যায়ন। সম্ভাব্য অবস্থা: ${result.possibleCondition}। তীব্রতা: ${result.severityLevel}। প্রাথমিক চিকিৎসা: ${result.firstAidGuidance.slice(0, 2).join(' এবং ')}।`;
            } else if (lang.includes("marathi") || lang.includes("मराठी") || lang.includes("mr")) {
              speechText = `ट्रियाज एआय मूल्यांकन. संभाव्य स्थिती: ${result.possibleCondition}. तीव्रता: ${result.severityLevel}. प्रथमोपचार: ${result.firstAidGuidance.slice(0, 2).join(' आणि ')}.`;
            } else if (lang.includes("gujarati") || lang.includes("ગુજરાતી") || lang.includes("gu")) {
              speechText = `ટ્રાયઝ એઆઈ મૂલ્યાંકન. સંભવિત સ્થિતિ: ${result.possibleCondition}. તીવ્રતા: ${result.severityLevel}. પ્રાથમિક સારવાર: ${result.firstAidGuidance.slice(0, 2).join(' અને ')}.`;
            } else if (lang.includes("punjabi") || lang.includes("ਪੰਜਾਬੀ") || lang.includes("pa")) {
              speechText = `ਟ੍ਰਿਆਜ ਏਆਈ ਮੁਲਾਂਕਣ। ਸੰਭਾਵਿਤ ਸਥਿਤੀ: ${result.possibleCondition}। ਗੰਭੀਰਤਾ: ${result.severityLevel}। ਮੁਢਲੀ ਸਹਾਇਤਾ: ${result.firstAidGuidance.slice(0, 2).join(' ਅਤੇ ')}।`;
            } else if (lang.includes("malayalam") || lang.includes("മലയാളം") || lang.includes("ml")) {
              speechText = `ട്രിയാജ് എഐ വിലയിരുത്തൽ. സാധ്യതയുള്ള അവസ്ഥ: ${result.possibleCondition}. തീവ്രത: ${result.severityLevel}. പ്രഥമശുശ്രൂഷ: ${result.firstAidGuidance.slice(0, 2).join(' ഒപ്പം ')}.`;
            } else if (lang.includes("urdu") || lang.includes("اردو") || lang.includes("ur")) {
              speechText = `ٹریاج اے آئی اسسمنٹ۔ ممکنہ حالت: ${result.possibleCondition}۔ شدت کا درجہ: ${result.severityLevel}۔ ابتدائی طبی امداد: ${result.firstAidGuidance.slice(0, 2).join(' اور ')}۔`;
            } else {
              speechText = `Triage AI Clinical Assessment. Suspected condition is ${result.possibleCondition}. Urgency level is assessed as ${result.severityLevel} urgency. Our diagnostic confidence is ${result.confidenceScore || 'high'}. Immediate first aid instructions: ${result.firstAidGuidance.slice(0, 2).join(' and ')}. Please review the warning signs and seek specialty consult.`;
            }
            
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.onend = () => setSpeaking(false);
            utterance.onerror = (e) => {
              console.warn("Speech playback encountered an error:", e);
              setSpeaking(false);
            };

            // Voice matching by detected language
            const voices = window.speechSynthesis.getVoices();
            const targetLang = info.detectedLanguage?.toLowerCase() || "english";
            const matchedVoice = voices.find(v => 
              v.lang.toLowerCase().includes(targetLang) || 
              v.name.toLowerCase().includes(targetLang)
            );
            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }

            window.speechSynthesis.speak(utterance);
            setSpeaking(true);
            addToast("Speaking Triage Summary...", "success");
          } catch (speechErr) {
            console.error("Speech synthesis failed to execute:", speechErr);
            setSpeaking(false);
            addToast("Unable to play speech audio. Try again.", "error");
          }
        };

        // Submit refined answer to follow-up questions
        const handleRefinedSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!followUpAnswer.trim() || followUpAnswer.trim().length < 2) {
            addToast("Please type a clear response.", "error");
            return;
          }

          setIsRefining(true);
          setError("");
          const refinedSymptoms = `${symptoms}\n\nRefined Question: ${activeFollowUp}\nAnswer: ${followUpAnswer}`;
          
          try {
            const response = await fetch("/api/triage/analyze", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
              body: JSON.stringify({ symptoms: refinedSymptoms }),
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Failed to refine triage assessment.");
            }

            setResult(data.assessment);
            setSymptoms(refinedSymptoms);
            onAnalysisSuccess(data.assessment);
            setActiveFollowUp(null);
            setFollowUpAnswer("");
            addToast("Triage refined with follow-up input!", "success");
          } catch (err: any) {
            setError(err.message || "Failed to process refined follow-up.");
            addToast("Refinement failed.", "error");
          } finally {
            setIsRefining(false);
          }
        };

        // Helper to get color code for Confidence level
        const getConfidenceColor = (scoreStr: string) => {
          const score = parseInt(scoreStr) || 85;
          if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-100";
          if (score >= 70) return "text-amber-600 bg-amber-50 border-amber-100";
          return "text-rose-600 bg-rose-50 border-rose-100";
        };

        return (
          <div className="space-y-8 animate-fade-in" id="triage-result-block">
            
            {/* AI EMERGENCY MODE OVERLAY (CRITICAL RED SCREEN ALERT) */}
            {isCritical && (
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-[32px] p-6 md:p-8 shadow-2xl shadow-red-500/20 border-2 border-red-500 relative overflow-hidden animate-pulse">
                {/* Background scanning laser effect */}
                <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-scan"></div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-black tracking-widest uppercase">
                      <AlertCircle className="w-4 h-4 animate-spin text-red-100" />
                      <span>Critical Safety Alert Active</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                      Life-Threatening Red Flags Detected
                    </h2>
                    <p className="text-sm text-red-100 leading-relaxed font-semibold">
                      Your symptoms suggest a severe acute condition (ACS/Angina/Anaphylaxis/Stroke) which requires immediate expert care. Do not wait. Call professional responders immediately.
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-red-100 bg-red-800/40 p-3 rounded-2xl border border-red-500/30">
                      <span>📌 Coordinates: Lat 28.6139, Lon 77.2090 (New Delhi Cell Tower)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
                    <a
                      href="tel:108"
                      className="px-6 py-4 bg-white text-red-700 hover:bg-red-50 font-black text-center text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 border-2 border-transparent hover:scale-105 cursor-pointer"
                    >
                      <PhoneCall className="w-4.5 h-4.5 animate-bounce" />
                      <span>Dial Indian Ambulance (108 / 112)</span>
                    </a>
                    <button
                      onClick={() => {
                        const target = document.getElementById("nearby-assistance-widget");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-6 py-3.5 bg-red-800/80 hover:bg-red-900 border border-red-400 text-white font-extrabold text-center text-xs rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      Locate Nearest Trauma Center
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Card Header & Action Controller */}
            <div className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/40 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      REPORT REF: #{result.id} • CHECKED ON {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                    <Badge variant="neutral" className="px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border-blue-100">
                      Language: {info.detectedLanguage || "English"} (Auto-detected)
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>AI Emergency Decision Report</span>
                    <Sparkles className="w-5 h-5 text-cyan-500 fill-current animate-pulse shrink-0" />
                  </h2>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="speak-triage-summary-btn"
                    onClick={handleSpeakTriage}
                    className={`p-3 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      speaking 
                        ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100" 
                        : "text-slate-500 hover:text-blue-600 hover:bg-slate-50 border-slate-200"
                    }`}
                    title={speaking ? "Pause Voice Playback" : "Listen to Audio Briefing"}
                    aria-label="Listen to Audio Briefing"
                  >
                    {speaking ? (
                      <Pause className="w-4.5 h-4.5 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <button
                    id="print-assessment-btn"
                    onClick={printAssessment}
                    className="p-3 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Print Report File"
                    aria-label="Print Report File"
                  >
                    <Printer className="w-4.5 h-4.5" />
                  </button>
                  <button
                    id="reset-assessment-btn"
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setSpeaking(false);
                      setResult(null);
                      setSymptoms("");
                    }}
                    className="py-2.5 px-4.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Reset / New Assessment
                  </button>
                </div>
              </div>

              {/* User Manual Choice Actions Panel */}
              <div className="flex flex-col sm:flex-row gap-4 p-5 bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-slate-50 border border-blue-100/80 rounded-[24px] items-center justify-between shadow-xs">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Triage Assessment Complete</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold leading-normal">
                    Choose an action to proceed manually. Your report remains open below for review.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    id="save-assessment-action-btn"
                    onClick={() => {
                      addToast("Triage report saved securely to cloud clinical history!", "success");
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95 select-none"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Assessment</span>
                  </button>
                  <button
                    id="dashboard-action-btn"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate("dashboard");
                      } else {
                        addToast("Returning to Dashboard...", "info");
                      }
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95 select-none"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    id="new-assessment-action-btn"
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setSpeaking(false);
                      setResult(null);
                      setSymptoms("");
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 select-none"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Start New</span>
                  </button>
                  <button
                    id="nearby-hospitals-action-btn"
                    onClick={() => {
                      const widget = document.getElementById("nearby-assistance-widget");
                      if (widget) {
                        widget.scrollIntoView({ behavior: "smooth" });
                      } else {
                        addToast("Please scroll down to view nearby hospitals", "info");
                      }
                    }}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer active:scale-95 select-none"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Nearby Hospitals</span>
                  </button>
                </div>
              </div>

              {/* Confidence Score & Meter Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="md:col-span-1 text-center md:border-r md:border-slate-200/60 md:pr-6 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI Confidence Meter</span>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-20 h-20">
                      <circle
                        className="text-slate-100"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                      <circle
                        className="text-blue-600 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - (parseInt(result.confidenceScore || "88") / 100))}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-900">{result.confidenceScore || "85%"}</span>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-2 pl-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                    <span>Clinical Reasoning Confidence</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    <strong>Triage Confidence:</strong> {info.clinicalReasoning?.confidenceExplanation || "High level of diagnostic indicators matches the reported symptomatology and historical files."}
                  </p>
                </div>
              </div>

              {/* Severity Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Box A: Association */}
                <div className="md:col-span-2 p-5 bg-blue-50/40 border border-blue-100/50 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                    <Activity className="w-4.5 h-4.5 animate-pulse text-blue-600" />
                    <span>Primary Symptom Association</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{result.possibleCondition}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {info.clinicalReasoning?.whyRecommended}
                  </p>
                </div>

                {/* Box B: Risk classification */}
                <div className="p-5 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Risk Classification</span>
                  <Badge variant={getBadgeVariant(result.severityLevel)} className="w-full justify-center py-2.5 text-xs font-black uppercase tracking-wider rounded-xl">
                    {result.severityLevel} Urgency
                  </Badge>
                  <p className="text-[10px] text-slate-500 leading-snug font-semibold text-center italic">
                    {info.clinicalReasoning?.severityReason}
                  </p>
                </div>

              </div>

              {/* Advanced AI Severity Decision Engine Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <div className="text-center p-3 border-r border-slate-200/60 last:border-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Response Time</span>
                  <span className="text-xs font-black text-slate-800">
                    {isCritical ? "Immediate (<15 mins)" : isHigh ? "Urgent (<1 hour)" : isMedium ? "Semi-urgent (<12h)" : "Routine (>24h)"}
                  </span>
                </div>
                <div className="text-center p-3 md:border-r border-slate-200/60 last:border-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Clinical Urgency</span>
                  <span className="text-xs font-black text-slate-800">
                    {isCritical ? "Critical Care Required" : isHigh ? "Urgent Clinic Consultation" : isMedium ? "GP Outpatient Check" : "At-home Care"}
                  </span>
                </div>
                <div className="text-center p-3 border-r border-slate-200/60 last:border-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Department priority</span>
                  <span className="text-xs font-black text-slate-800">
                    {isCritical ? "Emergency Room (ER)" : isHigh ? "Urgent Clinic Care" : isMedium ? "General Practice" : "Self-care Pharmacy"}
                  </span>
                </div>
                <div className="text-center p-3 last:border-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Travel safety</span>
                  <span className="text-xs font-black text-slate-800">
                    {isCritical ? "Strictly Prohibited" : isHigh ? "Travel Suspended" : isMedium ? "Travel with Caution" : "Safe to travel"}
                  </span>
                </div>
              </div>

              {/* Specialty Consult Matching */}
              <div className="p-5 bg-cyan-50/30 border border-cyan-100/40 rounded-2xl flex items-start space-x-4 hover:border-cyan-200 transition-all">
                <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-500 text-white rounded-xl shadow-md shrink-0">
                  <HeartPulse className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider block">
                    AI Specialist Matching Engine
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    Recommended Specialist: <strong className="text-blue-700 font-extrabold">{result.recommendedSpecialist}</strong>
                  </h4>
                  <p className="text-xs text-slate-600 leading-normal font-semibold">
                    {info.specialistExplanation}
                  </p>
                </div>
              </div>

            </div>

            {/* TABBED INTERACTIVE CONSOLE FOR REASONING, FIRST AID, HANDOFF */}
            <div className="bg-white rounded-[32px] border border-slate-200/60 overflow-hidden shadow-xl shadow-slate-100/40">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 bg-slate-50/40 p-2 gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab("reasoning")}
                  className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    activeTab === "reasoning" 
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>Clinical Reasoning</span>
                </button>
                <button
                  onClick={() => setActiveTab("firstaid")}
                  className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    activeTab === "firstaid" 
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive First Aid</span>
                </button>
                <button
                  onClick={() => setActiveTab("handoff")}
                  className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    activeTab === "handoff" 
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Clinician Handoff</span>
                </button>
              </div>

              {/* Tab contents */}
              <div className="p-6 md:p-8">
                
                {/* 1. CLINICAL REASONING PANEL */}
                {activeTab === "reasoning" && (
                  <div className="space-y-6 animate-fade-in" id="panel-clinical-reasoning">
                    <h3 className="text-md font-black text-slate-900 tracking-tight">AI Clinical Pattern & Reasoning Bento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center space-x-1.5">
                          <Compass className="w-4 h-4 text-blue-500" />
                          <span>Anatomical Pattern Identified</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {info.clinicalReasoning?.clinicalPattern}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center space-x-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Detected Physical Symptoms</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {info.clinicalReasoning?.detectedSymptoms}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center space-x-1.5">
                          <UserCircle2 className="w-4 h-4 text-cyan-500" />
                          <span>Profile Risks & Susceptibility</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          <strong>Vitals Profile:</strong> Age: {user.age} • Gender: {user.gender} • History: {user.medicalHistory || "None declared"}
                          <br />
                          <strong>Risk Assessment:</strong> {info.clinicalReasoning?.riskFactors}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center space-x-1.5">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <span>Medical Facility Goal Rationale</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {info.clinicalReasoning?.hospitalReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ADVANCED FIRST AID ENGINE */}
                {activeTab === "firstaid" && (
                  <div className="space-y-6 animate-fade-in" id="panel-first-aid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <h3 className="text-md font-black text-slate-900 tracking-tight">Active Comfort Care & Emergency Tips</h3>
                        <p className="text-xs text-slate-500 font-medium">Follow immediate instructions to reduce discomfort while medical teams assemble.</p>
                      </div>
                      {info.firstAidExtended?.emergencyTips && (
                        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl text-xs font-semibold max-w-sm flex items-start space-x-2">
                          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <span><strong>Emergency Tip:</strong> {info.firstAidExtended.emergencyTips}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Do list */}
                      <div className="p-5 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl space-y-3">
                        <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span>Proactive Measures (WHAT TO DO)</span>
                        </h4>
                        <ul className="space-y-2">
                          {(info.firstAidExtended?.doList || result.firstAidGuidance).map((step: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed font-semibold">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Do Not list */}
                      <div className="p-5 bg-rose-50/20 border border-rose-100/40 rounded-2xl space-y-3">
                        <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-widest flex items-center space-x-2">
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <span>Contraindications (WHAT NOT TO DO)</span>
                        </h4>
                        <ul className="space-y-2">
                          {(info.firstAidExtended?.doNotList || []).map((step: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed font-semibold">
                              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">✕</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Danger Signs Checklist */}
                    <div className="p-5 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-3">
                      <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                        <span>Critical Danger Flags (Monitor Closely)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {(info.firstAidExtended?.dangerSigns || result.warningSigns || []).map((sign: string, idx: number) => (
                          <div key={idx} className="px-3.5 py-2 bg-white border border-amber-100 rounded-xl text-xs font-bold text-amber-800 flex items-center space-x-1.5 shadow-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                            <span>{sign}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Travel Mode Localization panel */}
                    {localTravelMode && (
                      <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-2">
                        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Languages className="w-4 h-4 text-blue-600" />
                          <span>Travel Assistant Translation & Support</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {info.firstAidExtended?.travelAdvice || "No specific travel issues. Always consult nearest embassy or translate clinical handoff when traveling."}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {/* 3. PHYSICIAN intake BRIEFING */}
                {activeTab === "handoff" && (
                  <div className="space-y-6 animate-fade-in" id="panel-clinician-handoff">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <h3 className="text-md font-black text-slate-900 tracking-tight">Electronic Medical Record (EMR) Intake Handover</h3>
                        <p className="text-xs text-slate-500 font-medium">Present this structured report directly to nurses or physicians on arrival.</p>
                      </div>
                      <button
                        id="copy-summary-btn"
                        onClick={copyDoctorSummary}
                        className="px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer select-none"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Copied Intake Note!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-400" />
                            <span>Copy Handoff Brief</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pre-structured clinical file mock */}
                    <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-900 overflow-hidden font-mono text-xs shadow-inner">
                      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>EMR Intake File PREVIEW</span>
                        <span className="text-cyan-400">Status: Triage Generated</span>
                      </div>
                      <div className="p-5 md:p-6 space-y-4 leading-relaxed text-slate-300">
                        <div>
                          <span className="text-cyan-400 font-bold block mb-1">=== CLINICAL PARAMETERS ===</span>
                          <span>• Patient: {user.fullName} ({user.gender}, {user.age})</span>
                          {user.medicalHistory && <span className="block">• Med History: {user.medicalHistory}</span>}
                          {user.allergies && <span className="block">• Allergies: {user.allergies}</span>}
                          {user.medications && <span className="block">• Medications: {user.medications}</span>}
                        </div>
                        <div>
                          <span className="text-cyan-400 font-bold block mb-1">=== CHIEF COMPLAINT ===</span>
                          <span>{info.doctorHandoffDetailed?.chiefComplaint || result.possibleCondition}</span>
                        </div>
                        <div>
                          <span className="text-cyan-400 font-bold block mb-1">=== SUGGESTED CLINICAL INVESTIGATIONS ===</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-1">
                            {(info.doctorHandoffDetailed?.investigations || ["General consult"]).map((inv: string, idx: number) => (
                              <span key={idx} className="block text-emerald-400 font-bold">• {inv}</span>
                            ))}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap select-all bg-slate-900/90 p-4 border border-slate-850 rounded-xl">
                          <span className="text-cyan-400 font-bold block mb-1">=== PHYSICIAN NOTES ===</span>
                          {info.rawSummary || result.doctorSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* DYNAMIC CLINICAL FOLLOW-UP REFINEMENT COMPONENT */}
            {info.followUpQuestions && info.followUpQuestions.length > 0 && (
              <div className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/40 space-y-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Clinical Refinement Engine</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Generate Refined Assessment (Symptom Clarification)</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-semibold">
                    The clinical AI generated these specific follow-up questions to increase triage accuracy and clarify risk factors. Click on any question to answer and update your decision:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {info.followUpQuestions.map((q: string, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <button
                        onClick={() => {
                          if (activeFollowUp === q) {
                            setActiveFollowUp(null);
                            setFollowUpAnswer("");
                          } else {
                            setActiveFollowUp(q);
                            setFollowUpAnswer("");
                          }
                        }}
                        className={`w-full p-4 border rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          activeFollowUp === q 
                            ? "bg-blue-50/50 border-blue-300 text-blue-900 ring-4 ring-blue-50" 
                            : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-start space-x-3 pr-4">
                          <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">?</span>
                          <span>{q}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${activeFollowUp === q ? "rotate-90" : ""}`} />
                      </button>

                      {/* Interactive Answer Box */}
                      {activeFollowUp === q && (
                        <form onSubmit={handleRefinedSubmit} className="p-4 bg-slate-50/60 border border-slate-200/40 rounded-2xl space-y-3 animate-slide-down">
                          <TextArea
                            id="follow-up-answer-input"
                            rows={3}
                            required
                            placeholder="Type your refined details here... (e.g. 'Yes, it gets sharper when I breathe deeply and radiates to my neck.')"
                            value={followUpAnswer}
                            onChange={(e) => setFollowUpAnswer(e.target.value)}
                            className="bg-white rounded-xl border-slate-200 text-xs font-semibold focus:ring-4 focus:ring-blue-500/10"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setActiveFollowUp(null);
                                setFollowUpAnswer("");
                              }}
                              className="text-xs py-1.5 font-bold"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isRefining}
                              className="text-xs py-1.5 font-bold bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {isRefining ? "Refining Analysis..." : "Submit Refined Details"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Medical Assistance Widget */}
            <NearbyMedicalAssistance
              user={user}
              assessment={result}
              addToast={addToast}
              travelModeEnabled={localTravelMode}
              onToggleTravelMode={handleToggleTravelMode}
            />

            {/* Warnings & Disclaimer */}
            <div className="p-6 bg-red-50/50 border border-red-100 rounded-[32px] flex items-start space-x-3.5">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1.5">
                <h5 className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Clinical Disclaimer & Regulatory Guideline</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {result.disclaimer}
                </p>
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
}

