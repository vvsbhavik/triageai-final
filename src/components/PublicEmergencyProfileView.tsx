import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Phone,
  MapPin,
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  Clock,
  Navigation,
  RefreshCw,
  Printer,
  Copy,
  Download,
  Share2,
  FileText,
  Activity,
  Award,
  Heart,
  Briefcase,
  Star,
  Lock
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface PublicEmergencyProfileViewProps {
  userId: string;
}

interface PublicProfile {
  fullName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  allergies: string;
  medications: string;
  medicalHistory: string;
  emergencyContacts: string;
  dob?: string;
  height?: string;
  weight?: string;
  chronicDiseases?: string;
  surgeries?: string;
  primaryContact?: string;
  secondaryContact?: string;
  relationship?: string;
  phone?: string;
  insuranceDetails?: string;
  primaryDoctor?: string;
  preferredHospital?: string;
}

interface LatestAssessment {
  id: string;
  timestamp: string;
  symptoms: string;
  possibleCondition: string;
  severityLevel: "Low" | "Medium" | "High" | "Critical";
  recommendedSpecialist: string;
  firstAidGuidance: string[];
  disclaimer: string;
  doctorSummary: string;
}

export default function PublicEmergencyProfileView({ userId }: PublicEmergencyProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<LatestAssessment | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const fetchPublicProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public-emergency-profile/${userId}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve public emergency profile card.");
      }
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setLatestAssessment(data.latestAssessment);
      } else {
        throw new Error(data.error || "Profile check failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const getBadgeVariant = (level: "Low" | "Medium" | "High" | "Critical") => {
    switch (level) {
      case "Critical":
        return "critical";
      case "High":
        return "high";
      case "Medium":
        return "medium";
      case "Low":
        return "low";
      default:
        return "neutral";
    }
  };

  // Setup URLs for actions
  const emergencyLink = `${window.location.origin}/?emergency=${userId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(emergencyLink)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emergencyLink);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyContactNumber = () => {
    const num = profile?.phone || profile?.emergencyContacts || "";
    if (num) {
      navigator.clipboard.writeText(num);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TriageAI Emergency Card - ${profile?.fullName}`,
          text: `Review critical medical info for first responders.`,
          url: emergencyLink,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TriageAI_Emergency_QR_${profile?.fullName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrCodeUrl, "_blank");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Loading Responder Medical File...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
        <h2 className="text-xl font-extrabold text-white">Profile Card Unavailable</h2>
        <p className="text-xs text-slate-400 text-center max-w-sm leading-relaxed">{error || "Emergency identifier is invalid."}</p>
        <Button id="retry-fetch-profile" onClick={fetchPublicProfile} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700">
          Retry Access
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-sans pb-16 relative" id="public-emergency-responder-profile">
      
      {/* Printable Area - Render ONLY when printing */}
      <div className="hidden print:flex print:flex-col print:items-center print:justify-center print:min-h-screen print:bg-white print:p-0">
        <div className="border-4 border-slate-900 w-[3.375in] h-[2.125in] p-4 rounded-xl flex flex-col justify-between bg-white text-slate-900 shadow-none relative overflow-hidden" style={{ width: "3.375in", height: "2.125in", pageBreakInside: "avoid" }}>
          {/* Logo header */}
          <div className="flex justify-between items-center border-b border-slate-300 pb-1.5">
            <div className="flex items-center space-x-1">
              <div className="p-1 bg-red-600 rounded-md text-white">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black tracking-tight text-slate-900">
                Triage<span className="text-red-600">AI</span> Card
              </span>
            </div>
            <span className="text-[7px] font-extrabold uppercase bg-red-100 text-red-700 px-1 py-0.5 rounded">
              EMERGENCY
            </span>
          </div>

          {/* Main Card Grid */}
          <div className="grid grid-cols-12 gap-2 my-1 flex-grow">
            {/* Card Left Details */}
            <div className="col-span-8 flex flex-col justify-center space-y-1">
              <div>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">PATIENT NAME</span>
                <span className="text-[10px] font-black text-slate-900 leading-tight block truncate">{profile.fullName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <div>
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">BLOOD TYPE</span>
                  <span className="text-[9px] font-bold text-red-600 leading-tight block">{profile.bloodGroup || "O+"}</span>
                </div>
                <div>
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">CONTACT</span>
                  <span className="text-[8px] font-bold text-slate-900 leading-tight block truncate">{profile.primaryContact || "Check QR"}</span>
                </div>
              </div>

              <div>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">PRIMARY PHONE</span>
                <span className="text-[8px] font-bold text-slate-900 leading-tight block">{profile.phone || "Check QR"}</span>
              </div>
            </div>

            {/* Card Right QR Code */}
            <div className="col-span-4 flex flex-col items-center justify-center">
              <div className="border border-slate-300 p-1 rounded-lg bg-white">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-14 h-14 block object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[5px] font-black tracking-wider text-slate-500 mt-0.5 uppercase leading-none">SCAN FOR FILE</span>
            </div>
          </div>

          {/* Card Footer Warning */}
          <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[5px] text-slate-400 font-medium">
            <span>SECURE RESCUE DATA DEPLOYED</span>
            <span>POWERED BY TRIAGEAI</span>
          </div>
        </div>
      </div>

      {/* Top Banner Alert Bar */}
      <div className="bg-red-600 text-white font-bold text-center py-3.5 px-4 text-xs tracking-widest uppercase flex items-center justify-center space-x-2 shadow-md relative z-10 print:hidden">
        <ShieldAlert className="w-4 h-4 animate-pulse shrink-0" />
        <span>CRITICAL HEALTHCARE INFORMATION • FIRST RESPONDER PORTAL</span>
      </div>

      {/* Screen Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8 print:hidden">
        
        {/* Navigation Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Emergency Active Record Card</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bypassed Authorization Key Registered</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 focus:outline-hidden cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Wallet Card</span>
            </button>
            <button
              onClick={handleShare}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 focus:outline-hidden cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share File</span>
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 focus:outline-hidden cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>
          </div>
        </div>

        {/* Master Content Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column Left: Identity Vitals & Medical declarations */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Identity Banner */}
            <div className="bg-slate-900/90 border border-red-500/30 rounded-[32px] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase block">Verified Patient Name</span>
                  <h1 className="text-3xl font-black text-white tracking-tight leading-none">{profile.fullName}</h1>
                </div>
                
                {/* Blood group indicator */}
                <div className="flex items-center space-x-2.5 bg-red-950/40 border border-red-900/50 px-4 py-2.5 rounded-2xl shrink-0">
                  <span className="text-[10px] font-bold uppercase text-red-300">Blood Type</span>
                  <span className="text-xl font-black text-red-500">{profile.bloodGroup || "O-Positive"}</span>
                </div>
              </div>

              {/* Grid of Key Physiological specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-white block truncate">{profile.dob || "Not declared"}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase block mb-1">Gender</span>
                  <span className="text-sm font-bold text-white block truncate">{profile.gender}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase block mb-1">Height</span>
                  <span className="text-sm font-bold text-white block truncate">{profile.height || "Not specified"}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase block mb-1">Weight</span>
                  <span className="text-sm font-bold text-white block truncate">{profile.weight || "Not specified"}</span>
                </div>
              </div>

              {/* Allergy highlight block - MUST BE BIG AND VISIBLE */}
              <div className="p-5 bg-red-950/25 border-l-4 border-red-500 border-y border-r border-slate-800 rounded-2xl space-y-1.5 animate-pulse">
                <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest block">⚠️ CRITICAL KNOWN ALLERGIES</span>
                <p className="text-sm font-black text-white leading-relaxed">{profile.allergies || "None declared"}</p>
              </div>

              {/* Medications & Past parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider block">💊 Current Active Medications</span>
                  <p className="text-xs font-bold text-slate-100 leading-relaxed">{profile.medications || "None declared"}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">📋 Chronic Illnesses</span>
                  <p className="text-xs font-bold text-slate-200 leading-relaxed">{profile.chronicDiseases || "None declared"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">✂️ Previous Surgeries</span>
                  <p className="text-xs font-bold text-slate-200 leading-relaxed">{profile.surgeries || "None declared"}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">📝 Additional Health notes</span>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">{profile.medicalHistory || "None declared"}</p>
                </div>
              </div>

              {/* Emergency Contacts Dial & Action Block */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider block">📞 First-Contact Protocols</span>
                  <button onClick={handleCopyContactNumber} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center space-x-1">
                    <Copy className="w-3 h-3" />
                    <span>{copiedText ? "Copied" : "Copy Contact Number"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase mb-1">Primary Emergency Contact</span>
                    <span className="text-sm font-bold text-white block truncate">{profile.primaryContact || "Not declared"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase mb-1">Relationship / Phone</span>
                    <span className="text-xs font-bold text-white block">
                      {profile.relationship || "Not declared"} • <span className="text-blue-400 font-black">{profile.phone || "Not declared"}</span>
                    </span>
                  </div>
                </div>

                {profile.secondaryContact && (
                  <div className="text-xs pt-2 border-t border-slate-900">
                    <span className="text-[8px] text-slate-500 block uppercase mb-0.5">Secondary Contact</span>
                    <span className="text-xs font-bold text-white">{profile.secondaryContact}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
                  <a
                    href={profile.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, "")}` : "#"}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black text-center flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-red-900/10"
                  >
                    <Phone className="w-4.5 h-4.5" />
                    <span>Call Emergency Contact</span>
                  </a>
                  <a
                    href="tel:112"
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black text-center flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
                    <span>Dial National Rescue (112)</span>
                  </a>
                </div>
              </div>

              {/* Emergency Disclaimer warning */}
              <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl flex items-start space-x-3 text-[11px] text-red-300 leading-relaxed font-semibold">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <strong>Emergency Disclaimer:</strong> This public portal serves to facilitate medical information handoff in emergency rescue environments. Information displayed here is provided on an educational basis by TriageAI clinical triage and user declarations, not as a replacement for emergency responder assessment.
                </div>
              </div>

            </div>
          </div>

          {/* Column Right: Locked AI clinical triage records, and clinical insurance */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Locked clinical AI assessment details */}
            <div className="bg-slate-900 border border-blue-900/20 rounded-[32px] p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Clinical AI Triage Report</span>
                </div>
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[8px] font-bold">
                  <Lock className="w-3 h-3" />
                  <span>SYNC LOCKED</span>
                </div>
              </div>

              {latestAssessment ? (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Assessment severity</span>
                      <span className={`text-xs font-black uppercase ${
                        latestAssessment.severityLevel === "Critical" || latestAssessment.severityLevel === "High"
                          ? "text-red-500"
                          : latestAssessment.severityLevel === "Medium"
                          ? "text-amber-500"
                          : "text-green-500"
                      }`}>
                        {latestAssessment.severityLevel} LEVEL
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Last Triage time</span>
                      <span className="text-slate-300 font-bold">
                        {new Date(latestAssessment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Reported Emergency symptoms</span>
                    <p className="text-slate-200 leading-relaxed font-semibold italic text-[11px]">
                      "{latestAssessment.symptoms}"
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Estimated Possible Condition</span>
                    <p className="text-xs font-extrabold text-white">
                      {latestAssessment.possibleCondition}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Recommended Specialist Consultation</span>
                    <p className="text-xs font-extrabold text-blue-400">
                      {latestAssessment.recommendedSpecialist}
                    </p>
                  </div>

                  {/* Doctor Clinical handoff Notes */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Clinical Physician Handoff Notes</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold italic">
                      "{latestAssessment.doctorSummary}"
                    </p>
                  </div>

                  {/* First aid list */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Administered First Aid Actions</span>
                    <div className="space-y-1.5">
                      {latestAssessment.firstAidGuidance.slice(0, 4).map((step, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start space-x-2.5">
                          <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-medium leading-relaxed text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-bold space-y-2">
                  <Activity className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                  <p>No triage history recorded for this user file.</p>
                </div>
              )}
            </div>

            {/* Healthcare Infrastructure Specifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-4">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-2">
                🏥 Insurance & Attending Infrastructure
              </span>
              
              <div className="space-y-4 text-xs font-semibold text-slate-300">
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Insurance Policy</span>
                  <span className="text-xs font-bold text-white block leading-relaxed">{profile.insuranceDetails || "Not declared"}</span>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Primary Care Physician</span>
                  <span className="text-xs font-bold text-white block leading-relaxed">{profile.primaryDoctor || "Not declared"}</span>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Preferred Clinic Hospital</span>
                  <span className="text-xs font-bold text-white block leading-relaxed">{profile.preferredHospital || "Not declared"}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer info brand */}
        <div className="text-center text-slate-500 text-[10px] font-bold tracking-widest uppercase py-8 border-t border-slate-900">
          POWERED BY TRIAGEAI SECURITY EMERGENCY ENCRYPTED SYSTEM
        </div>

      </div>

    </div>
  );
}
