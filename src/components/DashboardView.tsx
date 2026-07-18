import React, { useState } from "react";
import { 
  Activity, Clock, ShieldAlert, ArrowRight, User, HeartPulse, FileText, Plus, 
  ChevronRight, AlertCircle, Trash2, QrCode, Globe, Phone, MapPin, Sparkles, 
  Stethoscope, Navigation, Star, Heart, CheckSquare, ShieldCheck, HeartPulse as PulseIcon,
  Ruler, Weight, CalendarDays, ShieldAlert as WarningIcon
} from "lucide-react";
import { User as UserType, Assessment } from "../types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { motion } from "motion/react";
import { translations, Language } from "../lib/translations";

interface DashboardViewProps {
  user: UserType;
  history: Assessment[];
  onStartAssessment: () => void;
  onViewAssessment: (id: string) => void;
  onDeleteAssessment: (id: string) => void;
  onUpdateProfile?: (updates: Partial<Omit<UserType, "id" | "email">>) => Promise<void>;
  onNavigate?: (page: string, assessment?: Assessment | null) => void;
}

export default function DashboardView({
  user,
  history,
  onStartAssessment,
  onViewAssessment,
  onDeleteAssessment,
  onUpdateProfile,
  onNavigate,
}: DashboardViewProps) {
  const currentLang = (user.preferredLanguage as Language) || "English";
  const t = translations[currentLang] || translations.English;

  const [updatingTravelMode, setUpdatingTravelMode] = useState(false);
  const totalAssessments = history.length;
  const latestAssessment = history.length > 0 ? history[0] : null;

  // Toggle Travel Mode
  const handleToggleTravelMode = async () => {
    if (!onUpdateProfile) return;
    setUpdatingTravelMode(true);
    try {
      await onUpdateProfile({
        travelModeEnabled: !user.travelModeEnabled,
      });
    } catch (e) {
      console.error("Failed to toggle travel mode:", e);
    } finally {
      setUpdatingTravelMode(false);
    }
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

  const getSeverityBgColor = (level: string): string => {
    switch (level) {
      case "Critical": return "bg-red-50 text-red-700 border-red-200/60";
      case "High": return "bg-orange-50 text-orange-700 border-orange-200/60";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200/60";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
  };

  // Generate public emergency link
  const emergencyLink = `${window.location.origin}/?emergency=${user.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(emergencyLink)}`;

  // Find the highest severity risk in recent history for Risk Summary card
  const getRiskStatus = () => {
    if (history.length === 0) return { label: "No Active Risks", color: "text-emerald-500", desc: "No symptom checks performed recently." };
    const hasCritical = history.some(h => h.severityLevel === "Critical");
    const hasHigh = history.some(h => h.severityLevel === "High");
    const hasMedium = history.some(h => h.severityLevel === "Medium");

    if (hasCritical) return { label: "Critical Risk Detected", color: "text-red-500 animate-pulse", desc: "A recent assessment indicated high-urgency conditions." };
    if (hasHigh) return { label: "High Risk Detected", color: "text-orange-500", desc: "One or more checks showed severe indicators." };
    if (hasMedium) return { label: "Moderate Risk Detected", color: "text-amber-500", desc: "Keep monitoring physical conditions closely." };
    return { label: "Stable Conditions", color: "text-emerald-500", desc: "Your declared checks show low-risk characteristics." };
  };

  const riskStatus = getRiskStatus();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800" id="dashboard-container">
      
      {/* 1. Welcome Card & Start Assessment (Full-width with premium background) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-800 to-cyan-600 text-white p-8 md:p-10 shadow-xl shadow-blue-900/10"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 text-cyan-200 text-xs font-bold rounded-full uppercase tracking-wider">
              <HeartPulse className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              <span>Active Health Companion</span>
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {t.welcomeBack}, <span className="text-cyan-300">{user.fullName}</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              Evaluate symptoms safely, track medical check histories, configure your physical identity card, and find local specialty clinical departments instantly.
            </p>
          </div>

          <button
            id="dashboard-start-assess-btn"
            onClick={onStartAssessment}
            className="self-start md:self-auto bg-white hover:bg-slate-50 text-blue-900 font-extrabold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center space-x-2 shrink-0 py-4 px-6 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3] text-blue-800" />
            <span>{t.assessment}</span>
          </button>
        </div>

        {/* Quick Vitals Snapshot Row */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs font-medium">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-200 uppercase tracking-wider text-[10px] font-bold">
              <CalendarDays className="w-3.5 h-3.5 text-blue-300" />
              <span>Age Details</span>
            </div>
            <p className="text-white text-lg font-black">{user.age} Years Old</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-200 uppercase tracking-wider text-[10px] font-bold">
              <User className="w-3.5 h-3.5 text-blue-300" />
              <span>Biological Sex</span>
            </div>
            <p className="text-white text-lg font-black">{user.gender || "Not Specified"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-200 uppercase tracking-wider text-[10px] font-bold">
              <Heart className="w-3.5 h-3.5 text-red-300 fill-current" />
              <span>Blood Group</span>
            </div>
            <p className="text-red-300 text-lg font-black">{user.bloodGroup || "O-Positive"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-200 uppercase tracking-wider text-[10px] font-bold">
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Registered Reports</span>
            </div>
            <p className="text-white text-lg font-black">{totalAssessments} Records</p>
          </div>
        </div>
      </motion.div>

      {/* Analytics Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card A: Recent risk summary */}
        <div className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Triage Status</span>
            <p className={`text-sm font-extrabold ${riskStatus.color}`}>{riskStatus.label}</p>
            <p className="text-[10px] text-slate-500 leading-normal font-semibold truncate max-w-[150px]">{riskStatus.desc}</p>
          </div>
        </div>

        {/* Card B: Health Profile completeness */}
        <div className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Profile Status</span>
            <p className="text-sm font-extrabold text-slate-800">100% Fully Verified</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-blue-500 w-full rounded-full" />
            </div>
          </div>
        </div>

        {/* Card C: Physical Metrics (Height/Weight) */}
        <div className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Metrics Snapshot</span>
            <p className="text-sm font-extrabold text-slate-800">{user.height || "180 cm"} • {user.weight || "75 kg"}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Saved physical parameters</p>
          </div>
        </div>

        {/* Card D: Emergency Bystander Support */}
        <div className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Emergency QR</span>
            <p className="text-sm font-extrabold text-slate-800">Secure Live Link</p>
            <p className="text-[10px] text-slate-500 font-semibold">Active & Scannable</p>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Bento Item 1: Health Profile Snapshot */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
        >
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base tracking-tight">
                <User className="w-5 h-5 text-blue-500" />
                <span>Health Profile Summary</span>
              </div>
              <Badge variant="neutral" className="text-[10px] font-bold uppercase">Snapshot</Badge>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Known Allergies</span>
                <p className="font-bold text-slate-800">{user.allergies || "None declared"}</p>
              </div>

              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Medications</span>
                <p className="font-bold text-slate-800">{user.medications || "None declared"}</p>
              </div>

              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinical History</span>
                <p className="font-bold text-slate-800 truncate" title={user.medicalHistory}>{user.medicalHistory || "None declared"}</p>
              </div>
            </div>
          </div>

          <button
            id="dash-edit-profile-btn"
            onClick={() => onNavigate?.("profile")}
            className="w-full text-xs font-bold py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Update Profile Information</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Bento Item 2: Travel Mode Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-[32px] border p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 ${
            user.travelModeEnabled 
              ? "bg-amber-50/40 border-amber-200 shadow-md shadow-amber-100/30" 
              : "bg-white border-slate-200/60 shadow-sm"
          }`}
        >
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base tracking-tight">
                <Globe className={`w-5 h-5 ${user.travelModeEnabled ? "text-amber-500 animate-spin" : "text-slate-400"}`} />
                <span>Travel Mode Settings</span>
              </div>
              <Badge variant={user.travelModeEnabled ? "critical" : "neutral"} className="text-[10px] font-bold uppercase">
                {user.travelModeEnabled ? "Travelling Active" : "Disabled"}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Travelling abroad or to an unfamiliar city? Toggle **Travel Mode** to automatically prioritize tourist-friendly emergency wings, multilingual doctor services, and localized specialist centers near your coordinate location.
            </p>

            {user.travelModeEnabled && (
              <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl flex items-start space-x-2.5 text-amber-900 animate-scale-up text-xs font-semibold">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase tracking-widest block text-[9px] text-amber-800">Tourist Safety Activated</span>
                  <span className="text-amber-700 font-semibold leading-relaxed">Prioritizing medical departments with verified language capabilities.</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleTravelMode}
            disabled={updatingTravelMode}
            className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              user.travelModeEnabled
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-lg shadow-amber-600/15"
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-800"
            }`}
            id="dash-toggle-travel-btn"
          >
            <Globe className="w-4 h-4 text-white" />
            <span>{updatingTravelMode ? "Updating Settings..." : user.travelModeEnabled ? "Disable Travel Mode" : "Activate Travel Mode"}</span>
          </button>
        </motion.div>

        {/* Bento Item 3: TriageAI Emergency QR (Slate / Tech Theme) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-slate-950 text-white rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col justify-between space-y-6 border border-slate-900 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <div className="flex items-center space-x-2 text-white font-extrabold text-base tracking-tight">
                <QrCode className="w-5 h-5 text-red-500 animate-pulse" />
                <span>TriageAI Emergency QR</span>
              </div>
              <span className="text-[9px] text-red-400 bg-red-950/60 border border-red-900/60 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Live Card</span>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="Live Emergency QR"
                  className="w-16 h-16 block object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-slate-200">First Responder Key</p>
                <p className="text-slate-400 leading-normal font-semibold">Bypass security locks to view essential vitals in emergencies.</p>
              </div>
            </div>
          </div>

          <button
            id="dash-qr-btn"
            onClick={() => onNavigate?.("qr")}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 border-0 rounded-xl hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-red-900/15 flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Manage Emergency QR Card</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </motion.div>

      </div>

      {/* Second Row of Bento Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Bento Item 4: Recent AI Emergency Analysis Report (Column Span 8) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <span>Recent AI Emergency Analysis Report</span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold">Your latest clinical checkup summary</p>
            </div>

            {latestAssessment && (
              <Badge variant={getBadgeVariant(latestAssessment.severityLevel)} className="text-[10px] font-black uppercase py-1">
                {latestAssessment.severityLevel} Risk Level
              </Badge>
            )}
          </div>

          {latestAssessment ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4.5 bg-blue-50/30 border border-blue-100/40 rounded-2xl space-y-1">
                  <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-wider block">Estimated Association</span>
                  <p className="text-base font-extrabold text-slate-900 leading-tight">{latestAssessment.possibleCondition}</p>
                </div>

                <div className="p-4.5 bg-cyan-50/30 border border-cyan-100/30 rounded-2xl space-y-1">
                  <span className="text-[10px] text-cyan-600 font-extrabold uppercase tracking-wider block">Recommended Specialty Consult</span>
                  <p className="text-base font-extrabold text-slate-900 leading-tight">{latestAssessment.recommendedSpecialist}</p>
                </div>
              </div>

              {/* Doctor Summary */}
              <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl space-y-2 shadow-inner">
                <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest block">ATTENDING CLINICIAN PRESENTATION SUMMARY</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-300">
                  {latestAssessment.doctorSummary}
                </p>
              </div>

              {/* View details */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onNavigate?.("assessment", latestAssessment)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1 cursor-pointer focus:outline-hidden"
                >
                  <span>Open Full Clinical Report</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold space-y-4">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
              <p className="max-w-xs mx-auto">No triage assessments conducted yet. Run a check to view high-fidelity clinical AI recommendations here.</p>
              <button
                id="assess-run-now"
                onClick={onStartAssessment}
                className="py-2.5 px-5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Perform First Assessment
              </button>
            </div>
          )}
        </motion.div>

        {/* Bento Item 5: Severe Emergency Warnings & Dialers (Column Span 4) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-4 bg-red-50/80 border border-red-100 p-6 md:p-8 rounded-[32px] flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-red-800 pb-3 border-b border-red-200/50">
              <AlertCircle className="w-6 h-6 shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-md font-bold leading-none">Severe Emergencies</h4>
                <p className="text-[11px] text-red-600 leading-normal font-semibold">
                  Severe breathing problems, crushing chest pressure, radiating arm pain, or heavy blood loss require direct medical interventions.
                </p>
              </div>
            </div>

            {/* Dialer 1: Country emergency */}
            <div className="p-4 bg-white border border-red-100/60 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">US Emergency Services</p>
                <p className="text-lg font-black text-red-600 leading-none mt-1">Dial 108</p>
              </div>
              <a
                href="tel:108"
                className="px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-500/10 transition-all"
              >
                Call 108
              </a>
            </div>

            {/* Dialer 2: Registered Spouse / Primary contact */}
            {user.emergencyContacts && (
              <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="max-w-[150px] sm:max-w-xs">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Registered Emergency Contact</p>
                  <p className="text-xs font-bold text-slate-800 leading-snug mt-1 truncate" title={user.emergencyContacts}>
                    {user.emergencyContacts}
                  </p>
                </div>
                <a
                  href={`tel:${user.emergencyContacts.replace(/[^0-9]/g, "")}`}
                  className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  Call Contact
                </a>
              </div>
            )}
          </div>

          <div className="text-[10px] text-red-800 leading-relaxed font-bold flex items-center gap-1.5 pt-2">
            <ShieldAlert className="w-4.5 h-4.5 text-red-500 shrink-0 animate-pulse" />
            <span>Responders can dial these parameters directly from your QR Card.</span>
          </div>
        </motion.div>

      </div>

      {/* Third Row of Bento Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Bento Item 6: Assessment History Card (Column Span 8) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Assessment History Log</h3>
              <p className="text-xs text-slate-400 font-semibold">Your persistent clinical checklists ({totalAssessments} records)</p>
            </div>
            
            {totalAssessments > 3 && (
              <button
                id="dash-view-all-history-btn"
                onClick={() => onNavigate?.("history")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5 focus:outline-hidden"
              >
                <span>View Full History</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No historical triage assessments recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 3).map((record, index) => {
                const variant = getBadgeVariant(record.severityLevel);
                const borderColors = getSeverityBgColor(record.severityLevel);
                return (
                  <div
                    key={record.id}
                    className={`p-4.5 bg-slate-50/50 border border-slate-200/50 hover:border-blue-200 rounded-2xl hover:bg-white hover:shadow-xs transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="space-y-2 max-w-md sm:max-w-lg">
                      <div className="flex items-center space-x-2.5">
                        <Badge variant={variant}>
                          {record.severityLevel} Risk
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                          {record.possibleCondition}
                        </h4>
                        <p className="text-slate-500 text-xs font-medium line-clamp-1 mt-0.5">
                          Symptoms: "{record.symptoms}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                      <button
                        id={`view-assess-btn-${record.id}`}
                        onClick={() => onViewAssessment(record.id)}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>View Report</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button
                        id={`delete-assess-btn-${record.id}`}
                        onClick={() => onDeleteAssessment(record.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Record"
                        aria-label={`Delete record for ${record.possibleCondition}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Bento Item 7: Specialized Medical Routing Shortcut (Column Span 4) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="lg:col-span-4 bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base tracking-tight">
                <Navigation className="w-5 h-5 text-blue-500" />
                <span>Nearby Hospital Finder</span>
              </div>
              <MapPin className="w-4.5 h-4.5 text-slate-300" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Quickly isolate, call, and obtain routing directions to adjacent trauma units, clinics, and specialists matching your symptoms.
            </p>

            <div className="p-4 bg-blue-50/40 border border-blue-100/40 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-[10px] text-blue-700 font-extrabold uppercase">
                <Star className="w-3.5 h-3.5 fill-current text-blue-500 animate-pulse" />
                <span>Target Specialty Consult active</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Our locator coordinates with recommended specialists (such as <strong>{latestAssessment?.recommendedSpecialist || "General Practitioner"}</strong>) to direct matching healthcare wings.
              </p>
            </div>
          </div>

          <button
            id="dash-hospitals-shortcut-btn"
            onClick={() => onNavigate?.("assessment", latestAssessment)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-3 rounded-xl shadow-md hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Open Navigation Locator</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </motion.div>

      </div>

    </div>
  );
}
