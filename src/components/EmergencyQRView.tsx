import React, { useState, useEffect } from "react";
import { User, Assessment } from "../types";
import {
  ShieldAlert,
  QrCode,
  ClipboardList,
  Phone,
  User as UserIcon,
  Calendar,
  Heart,
  AlertTriangle,
  Save,
  Check,
  Printer,
  Copy,
  Plus,
  Activity,
  Star,
  Download,
  Share2,
  Stethoscope,
  Lock,
  Sparkles,
  Shield,
  FileText,
  Weight as WeightIcon,
  Ruler,
  FileCheck
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input, TextArea } from "./ui/Input";
import { ToastType } from "./ui/Toast";

interface EmergencyQRViewProps {
  user: User;
  onUpdateProfile: (updates: Partial<Omit<User, "id" | "email">>) => Promise<void>;
  addToast: (message: string, type?: ToastType) => void;
  history: Assessment[];
}

export default function EmergencyQRView({ user, onUpdateProfile, addToast, history }: EmergencyQRViewProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Local form state for all standard and extra fields
  const [fullName, setFullName] = useState(user.fullName || "");
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "Not Specified");
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || "O-Positive");
  const [allergies, setAllergies] = useState(user.allergies || "");
  const [medications, setMedications] = useState(user.medications || "");
  const [medicalHistory, setMedicalHistory] = useState(user.medicalHistory || "");
  const [emergencyContacts, setEmergencyContacts] = useState(user.emergencyContacts || "");

  // Extended Emergency Profile fields
  const [dob, setDob] = useState(user.dob || "");
  const [height, setHeight] = useState(user.height || "");
  const [weight, setWeight] = useState(user.weight || "");
  const [chronicDiseases, setChronicDiseases] = useState(user.chronicDiseases || "");
  const [surgeries, setSurgeries] = useState(user.surgeries || "");
  const [primaryContact, setPrimaryContact] = useState(user.primaryContact || "");
  const [secondaryContact, setSecondaryContact] = useState(user.secondaryContact || "");
  const [relationship, setRelationship] = useState(user.relationship || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [insuranceDetails, setInsuranceDetails] = useState(user.insuranceDetails || "");
  const [primaryDoctor, setPrimaryDoctor] = useState(user.primaryDoctor || "");
  const [preferredHospital, setPreferredHospital] = useState(user.preferredHospital || "");

  // Sync with user prop if it changes
  useEffect(() => {
    setFullName(user.fullName || "");
    setAge(user.age || "");
    setGender(user.gender || "Not Specified");
    setBloodGroup(user.bloodGroup || "O-Positive");
    setAllergies(user.allergies || "");
    setMedications(user.medications || "");
    setMedicalHistory(user.medicalHistory || "");
    setEmergencyContacts(user.emergencyContacts || "");
    setDob(user.dob || "");
    setHeight(user.height || "");
    setWeight(user.weight || "");
    setChronicDiseases(user.chronicDiseases || "");
    setSurgeries(user.surgeries || "");
    setPrimaryContact(user.primaryContact || "");
    setSecondaryContact(user.secondaryContact || "");
    setRelationship(user.relationship || "");
    setPhone(user.phone || "");
    setInsuranceDetails(user.insuranceDetails || "");
    setPrimaryDoctor(user.primaryDoctor || "");
    setPreferredHospital(user.preferredHospital || "");
  }, [user]);

  // Extract latest AI assessment
  const latestAssessment = history && history.length > 0 ? history[0] : null;

  // Calculate public emergency link
  const emergencyLink = `${window.location.origin}/?emergency=${user.id}`;
  // QR Server free API to render high resolution QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(emergencyLink)}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameTrimmed = fullName.trim();
    if (!nameTrimmed) {
      addToast("Full Name is required.", "error");
      return;
    }

    // Validate Age
    const ageTrimmed = age.toString().trim();
    const ageNum = parseInt(ageTrimmed, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 125) {
      addToast("Please enter a valid age between 1 and 125.", "error");
      return;
    }

    // Validate Phone if provided
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed) {
      const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
      if (!phoneRegex.test(phoneTrimmed) || phoneTrimmed.replace(/\D/g, "").length < 7) {
        addToast("Please enter a valid telephone number (at least 7 digits).", "error");
        return;
      }
    }

    // Validate DOB if provided
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      if (dobDate > today) {
        addToast("Date of Birth cannot be in the future.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      // Keep old emergencyContacts field filled for compatibility or join them
      const compiledEmergencyContacts = primaryContact.trim()
        ? `${primaryContact.trim()} (${relationship.trim() || "Contact"}) - ${phoneTrimmed}${secondaryContact.trim() ? `, Sec: ${secondaryContact.trim()}` : ""}`
        : (emergencyContacts || "None declared");

      await onUpdateProfile({
        fullName: nameTrimmed,
        age: ageNum.toString(),
        gender,
        bloodGroup,
        allergies: allergies || "None declared",
        medications: medications || "None declared",
        medicalHistory: medicalHistory || "None declared",
        emergencyContacts: compiledEmergencyContacts,
        dob,
        height,
        weight,
        chronicDiseases,
        surgeries,
        primaryContact: primaryContact.trim(),
        secondaryContact: secondaryContact.trim(),
        relationship: relationship.trim(),
        phone: phoneTrimmed,
        insuranceDetails,
        primaryDoctor,
        preferredHospital,
      });
      setEditing(false);
      addToast("Emergency Profile updated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update emergency profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emergencyLink);
    setCopiedLink(true);
    addToast("Emergency profile link copied!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TriageAI Emergency Medical Identity - ${user.fullName}`,
          text: `Instant secure first responder medical file for ${user.fullName}.`,
          url: emergencyLink,
        });
        addToast("Emergency card shared successfully!", "success");
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
      link.download = `TriageAI_QR_${fullName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast("QR Code image downloaded!", "success");
    } catch (err) {
      window.open(qrCodeUrl, "_blank");
      addToast("Failed automatic download. Saving in a new window instead.", "info");
    }
  };

  const handleCopyContact = () => {
    const num = phone || user.phone || "";
    if (num) {
      navigator.clipboard.writeText(num);
      addToast(`Emergency contact phone copied: ${num}`, "success");
    } else {
      addToast("No specific phone number is stored yet.", "error");
    }
  };

  const handlePrint = () => {
    addToast("Opening system print dialog...", "info");
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="emergency-profile-page">
      
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
                <span className="text-[10px] font-black text-slate-900 leading-tight block truncate">{fullName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <div>
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">BLOOD TYPE</span>
                  <span className="text-[9px] font-bold text-red-600 leading-tight block">{bloodGroup || "O+"}</span>
                </div>
                <div>
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">CONTACT</span>
                  <span className="text-[8px] font-bold text-slate-900 leading-tight block truncate">{primaryContact || "Check QR"}</span>
                </div>
              </div>

              <div>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide block leading-none">PRIMARY PHONE</span>
                <span className="text-[8px] font-bold text-slate-900 leading-tight block">{phone || "Check QR"}</span>
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
        <p className="text-slate-500 text-xs mt-4 font-semibold italic text-center">
          Cut along the outer boundary to carry in your wallet.
        </p>
      </div>

      {/* Screen Interactive Page */}
      <div className="print:hidden space-y-8">
        
        {/* Title Banner */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Premium Healthcare Account</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Emergency Profile</h1>
          <p className="text-sm text-slate-500 max-w-2xl font-medium leading-relaxed">
            Manage your secure physiological specifications, contacts, and insurance configurations. First responders can instantly scan your personalized medical card to extract live vitals without any login requirements.
          </p>
        </div>

        {/* Master Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Glassmorphism Interactive Wallet Card & Actions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Wallet Card container with Glassmorphism aesthetic */}
            <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-950 text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden border border-slate-800/80">
              {/* Absolutes and backdrop filters */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Card Header and branding */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg text-white shadow-md">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs tracking-widest text-slate-200">TRIAGEAI EMERGENCY IDENTITY</span>
                    <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider leading-none">Wallet Medical Card</p>
                  </div>
                </div>
                <Star className="w-4 h-4 text-cyan-400 fill-current animate-pulse shrink-0" />
              </div>

              {/* QR and Identity Content section */}
              <div className="py-6 flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="bg-white p-4 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-cyan-400/80 hover:scale-105 transition-all duration-300">
                  <img
                    src={qrCodeUrl}
                    alt="TriageAI High-Res Emergency QR"
                    className="w-40 h-40 block object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest leading-none">SCAN SECURE LINK</p>
                  <p className="text-[8px] text-slate-400 font-semibold mt-1">NO AUTHENTICATION NEEDED FOR RESPONDERS</p>
                </div>
              </div>

              {/* Info grid on card */}
              <div className="space-y-3.5 pt-4 border-t border-white/10 relative z-10 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] block">PATIENT NAME</span>
                    <span className="text-sm font-black text-white truncate block">{fullName || "Not Specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] block">BLOOD GROUP</span>
                    <span className="text-sm font-black text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded-md inline-block">
                      {bloodGroup || "O-Positive"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] block">EMERGENCY CONTACT</span>
                    <span className="text-xs font-bold text-white truncate block" title={primaryContact}>
                      {primaryContact || "Not Registered"} {relationship ? `(${relationship})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] block">PRIMARY PHONE</span>
                    <span className="text-xs font-bold text-white truncate block">
                      {phone || "Not Registered"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Interactive Action Panel */}
            <div className="bg-white rounded-[28px] border border-slate-200/60 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Responders Actions Panel</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#"}
                  onClick={() => !phone && addToast("No emergency phone number configured yet.", "error")}
                  className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden text-center shadow-xs"
                >
                  <Phone className="w-4.5 h-4.5" />
                  <span>Call Contact</span>
                </a>

                <button
                  onClick={handleCopyContact}
                  className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Phone</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleDownloadQR}
                  className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden"
                  title="Download Emergency QR Code image"
                >
                  <Download className="w-4 h-4" />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden"
                  title="Print Wallet-Sized Clinical Card"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Card</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden"
                  title="Copy and Share public emergency link"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Share Card</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>Secure URL Key:</span>
                <span className="text-blue-600 truncate max-w-[200px] select-all cursor-pointer font-mono" onClick={handleCopyLink}>
                  {emergencyLink}
                </span>
              </div>
            </div>

            {/* Read-Only Locked AI Data Section */}
            <div className="bg-gradient-to-tr from-slate-50 to-blue-50/20 border border-blue-100/50 rounded-[32px] p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-blue-100/60">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">Synchronized AI Triage Data</span>
                </div>
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-200/50 border border-slate-300/30 text-slate-600 text-[9px] font-bold">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>INTEGRITY SECURED</span>
                </div>
              </div>

              {latestAssessment ? (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/40">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assessment Severity</span>
                      <span className={`text-xs font-black uppercase ${
                        latestAssessment.severityLevel === "Critical" || latestAssessment.severityLevel === "High"
                          ? "text-red-600"
                          : latestAssessment.severityLevel === "Medium"
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}>
                        {latestAssessment.severityLevel} Severity
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Conducted Time</span>
                      <span className="text-slate-600 font-bold">
                        {new Date(latestAssessment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/40 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Recommended Specialist</span>
                    <span className="text-slate-800 font-extrabold block text-xs">
                      {latestAssessment.recommendedSpecialist}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/40 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Physician Handoff notes</span>
                    <p className="text-slate-600 leading-relaxed font-semibold italic">
                      "{latestAssessment.doctorSummary}"
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/40 space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">First Aid Guidance Summary</span>
                    <ul className="space-y-1.5 font-medium text-slate-700">
                      {latestAssessment.firstAidGuidance.slice(0, 3).map((guidance, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] leading-snug">{guidance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold leading-normal text-center italic pt-1">
                    *This clinical handoff file is automatically populated by TriageAI upon check completion. Manual input is blocked.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 font-medium text-xs space-y-1.5">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                  <p>No active symptoms history assessment recorded yet.</p>
                  <p className="text-[10px] text-slate-400">Complete a symptom check, and its parameters will sync here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Manage Details Form */}
          <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/40 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-extrabold text-slate-900">Secure Medical Profile Parameters</h3>
                <p className="text-xs text-slate-400 font-semibold">Ensure this parameters matrix remains updated for safety operations</p>
              </div>
              {!editing && (
                <Button
                  id="edit-qr-profile-btn"
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  className="py-2 px-4.5 text-xs font-black shadow-xs"
                >
                  Edit Profile Parameters
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
                
                {/* 1. PERSONAL DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    1. Personal Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="edit-full-name"
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                      id="edit-dob"
                      label="Date of Birth"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gender</label>
                      <select
                        id="edit-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Not Specified">Not Specified</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
                      <select
                        id="edit-blood-group"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      >
                        <option value="A-Positive">A-Positive (A+)</option>
                        <option value="A-Negative">A-Negative (A-)</option>
                        <option value="B-Positive">B-Positive (B+)</option>
                        <option value="B-Negative">B-Negative (B-)</option>
                        <option value="AB-Positive">AB-Positive (AB+)</option>
                        <option value="AB-Negative">AB-Negative (AB-)</option>
                        <option value="O-Positive">O-Positive (O+)</option>
                        <option value="O-Negative">O-Negative (O-)</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <Input
                      id="edit-height"
                      label="Height"
                      placeholder="e.g. 180 cm"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />

                    <Input
                      id="edit-weight"
                      label="Weight"
                      placeholder="e.g. 75 kg"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. MEDICAL INFORMATION */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    2. Medical Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextArea
                      id="edit-allergies"
                      label="Allergies"
                      placeholder="e.g. Penicillin, Peanuts, Bee Stings, Latex (Comma separated)"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      rows={2}
                    />
                    <TextArea
                      id="edit-medications"
                      label="Current Medications"
                      placeholder="e.g. Albuterol Inhaler 2 puffs as needed, Lisinopril 10mg daily"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextArea
                      id="edit-chronic"
                      label="Chronic Diseases"
                      placeholder="e.g. Mild seasonal asthma, Type 2 diabetes"
                      value={chronicDiseases}
                      onChange={(e) => setChronicDiseases(e.target.value)}
                      rows={2}
                    />
                    <TextArea
                      id="edit-surgeries"
                      label="Previous Surgeries"
                      placeholder="e.g. Appendectomy (2018), Knee Arthroscopy (2021)"
                      value={surgeries}
                      onChange={(e) => setSurgeries(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <TextArea
                    id="edit-medical-history"
                    label="Additional Medical History Note"
                    placeholder="Provide any additional diagnostic context you wish to declare to attending clinicians."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* 3. EMERGENCY CONTACTS */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    3. Emergency Contacts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="edit-primary-contact"
                      label="Primary Contact Name"
                      placeholder="e.g. Priya Vanapalli"
                      required
                      value={primaryContact}
                      onChange={(e) => setPrimaryContact(e.target.value)}
                    />
                    <Input
                      id="edit-secondary-contact"
                      label="Secondary Contact Name"
                      placeholder="e.g. Anand Vanapalli"
                      value={secondaryContact}
                      onChange={(e) => setSecondaryContact(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="edit-relationship"
                      label="Relationship to Patient"
                      placeholder="e.g. Spouse, Parent, Sibling"
                      required
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    />
                    <Input
                      id="edit-phone"
                      label="Phone Number"
                      placeholder="e.g. +91 98765 43210"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. CLINICAL ENVIRONMENT EXTRA PARAMETERS */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    4. Healthcare Infrastructure & Insurance
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      id="edit-insurance"
                      label="Insurance Details"
                      placeholder="e.g. LIC Star Health - Policy #IN-8843219"
                      value={insuranceDetails}
                      onChange={(e) => setInsuranceDetails(e.target.value)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="edit-doctor"
                        label="Primary Doctor"
                        placeholder="e.g. Dr. Amit Sharma, MD (Cardiologist)"
                        value={primaryDoctor}
                        onChange={(e) => setPrimaryDoctor(e.target.value)}
                      />
                      <Input
                        id="edit-hospital"
                        label="Preferred Hospital"
                        placeholder="e.g. Apollo Hospitals, New Delhi"
                        value={preferredHospital}
                        onChange={(e) => setPreferredHospital(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    id="cancel-qr-edit"
                    type="button"
                    variant="secondary"
                    className="py-2.5 px-5 text-xs font-extrabold"
                    onClick={() => {
                      // Reset local states to user variables
                      setFullName(user.fullName || "");
                      setAge(user.age || "");
                      setGender(user.gender || "Not Specified");
                      setBloodGroup(user.bloodGroup || "O-Positive");
                      setAllergies(user.allergies || "");
                      setMedications(user.medications || "");
                      setMedicalHistory(user.medicalHistory || "");
                      setEmergencyContacts(user.emergencyContacts || "");
                      setDob(user.dob || "");
                      setHeight(user.height || "");
                      setWeight(user.weight || "");
                      setChronicDiseases(user.chronicDiseases || "");
                      setSurgeries(user.surgeries || "");
                      setPrimaryContact(user.primaryContact || "");
                      setSecondaryContact(user.secondaryContact || "");
                      setRelationship(user.relationship || "");
                      setPhone(user.phone || "");
                      setInsuranceDetails(user.insuranceDetails || "");
                      setPrimaryDoctor(user.primaryDoctor || "");
                      setPreferredHospital(user.preferredHospital || "");
                      setEditing(false);
                    }}
                  >
                    Cancel Edit
                  </Button>
                  <Button
                    id="save-qr-edit"
                    type="submit"
                    isLoading={saving}
                    className="py-2.5 px-6 text-xs font-extrabold bg-blue-600 hover:bg-blue-700"
                  >
                    Save Emergency Profile
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                
                {/* Visual grid layout of parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 1. Biological Profile */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block border-b border-blue-100/50 pb-1.5">
                      👤 Biological Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Full Name</span>
                        <span className="text-slate-900 font-bold text-sm block">{fullName || "Not declared"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Date of Birth</span>
                        <span className="text-slate-900 font-bold text-sm block">{dob || `${age ? `~${age} Years Old` : "Not declared"}`}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Gender</span>
                        <span className="text-slate-900 font-bold text-sm block">{gender}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Blood Type</span>
                        <span className="text-red-600 font-black text-sm block">{bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Height</span>
                        <span className="text-slate-900 font-bold text-sm block">{height || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Weight</span>
                        <span className="text-slate-900 font-bold text-sm block">{weight || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Emergency Contacts info */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block border-b border-blue-100/50 pb-1.5">
                      📞 First-Contact Protocols
                    </span>
                    <div className="space-y-2 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Primary emergency contact</span>
                        <p className="text-slate-950 font-bold text-sm">{primaryContact || "Not declared"}</p>
                      </div>
                      {secondaryContact && (
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Secondary contact</span>
                          <p className="text-slate-800 font-medium">{secondaryContact}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-200/50 mt-1.5">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Relationship</span>
                          <p className="text-slate-800 font-bold">{relationship || "Not specified"}</p>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Direct phone</span>
                          <p className="text-blue-600 font-black">{phone || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Clinical Parameters Cards */}
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-slate-200/60 rounded-2xl">
                    <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider block mb-1">
                      ⚠️ Allergy Exclusions
                    </span>
                    <p className="text-slate-800 text-xs font-bold leading-relaxed">{allergies || "None declared"}</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/60 rounded-2xl">
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block mb-1">
                      💊 Active Medications Registry
                    </span>
                    <p className="text-slate-800 text-xs font-bold leading-relaxed">{medications || "None declared"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200/60 rounded-2xl">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                        📋 Chronic Illness Diseases
                      </span>
                      <p className="text-slate-800 text-xs font-bold leading-relaxed">{chronicDiseases || "None declared"}</p>
                    </div>

                    <div className="p-4 bg-white border border-slate-200/60 rounded-2xl">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                        ✂️ Previous Surgeries History
                      </span>
                      <p className="text-slate-800 text-xs font-bold leading-relaxed">{surgeries || "None declared"}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/60 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                      🗒️ Additional Medical Background Context
                    </span>
                    <p className="text-slate-800 text-xs font-medium leading-relaxed">{medicalHistory || "None declared"}</p>
                  </div>

                  {/* 4. Healthcare Infrastructure Display */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block border-b border-blue-100/50 pb-1.5">
                      🏥 Insurance & Attending Infrastructure
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                      <div className="sm:col-span-1">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Insurance details</span>
                        <span className="text-slate-900 font-bold text-xs block leading-relaxed">{insuranceDetails || "Not declared"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Primary Care Physician</span>
                        <span className="text-slate-900 font-bold text-xs block leading-relaxed">{primaryDoctor || "Not declared"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none mb-1">Preferred Hospital</span>
                        <span className="text-slate-900 font-bold text-xs block leading-relaxed">{preferredHospital || "Not declared"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety notice disclaimer */}
                <div className="p-4.5 bg-red-50/70 border border-red-100 rounded-2xl flex items-start space-x-3 text-xs text-red-800 leading-relaxed font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    Emergency responders have secure bypass access permission to review this information during live operations. Ensure all data fields are populated truthfully and accurately.
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
