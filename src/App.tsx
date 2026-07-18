import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import DashboardView from "./components/DashboardView";
import AssessmentView from "./components/AssessmentView";
import HistoryView from "./components/HistoryView";
import ProfileView from "./components/ProfileView";
import EmergencyQRView from "./components/EmergencyQRView";
import PublicEmergencyProfileView from "./components/PublicEmergencyProfileView";
import { ToastContainer, Toast, ToastType } from "./components/ui/Toast";
import { Skeleton, ClinicalReportSkeleton } from "./components/ui/Skeleton";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { User, Assessment } from "./types";
import { Info, AlertTriangle, X, Copy, Check, Calendar, ClipboardList, ShieldAlert, HeartPulse } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [loading, setLoading] = useState(true);
  const [emergencyUserId, setEmergencyUserId] = useState<string | null>(null);
  const [assessmentKey, setAssessmentKey] = useState<number>(0);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  const handleNavigate = (page: string, assessment: Assessment | null = null) => {
    if (page === "assessment") {
      setAssessmentKey((prev) => prev + 1);
      setActiveAssessment(assessment);
    }
    setCurrentPage(page);
  };

  // Restore preferred language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("triage_preferred_language");
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem("triage_preferred_language", lang);

    if (user) {
      setUser((prev) => prev ? { ...prev, preferredLanguage: lang } : null);
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fullName: user.fullName,
            emergencyContactName: user.emergencyContactName,
            emergencyContactPhone: user.emergencyContactPhone,
            bloodType: user.bloodType,
            allergies: user.allergies,
            chronicConditions: user.chronicConditions,
            medications: user.medications,
            preferredLanguage: lang,
          }),
        });
      } catch (err) {
        console.error("Failed to sync preferred language:", err);
      }
    }
    addToast(`Language updated to ${lang}`, "info");
  };

  // Check URL parameters for emergency responder bypass
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emergencyId = params.get("emergency");
    if (emergencyId) {
      setEmergencyUserId(emergencyId);
    }
  }, []);

  // Detail Modal overlay state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to fetch authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("triage_auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Keyboard accessibility: Close details modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAssessment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform automatic authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.preferredLanguage) {
            setSelectedLanguage(data.user.preferredLanguage);
            localStorage.setItem("triage_preferred_language", data.user.preferredLanguage);
          } else {
            const localLang = localStorage.getItem("triage_preferred_language") || "English";
            setSelectedLanguage(localLang);
            // Sync to database profile
            fetch("/api/user/profile", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("triage_auth_token")}`,
              },
              body: JSON.stringify({
                fullName: data.user.fullName,
                emergencyContactName: data.user.emergencyContactName,
                emergencyContactPhone: data.user.emergencyContactPhone,
                bloodType: data.user.bloodType,
                allergies: data.user.allergies,
                chronicConditions: data.user.chronicConditions,
                medications: data.user.medications,
                preferredLanguage: localLang,
              }),
            }).catch((syncErr) => console.error("Sync language error:", syncErr));
          }
          // Load their assessment history
          const histRes = await fetch("/api/triage/history", {
            headers: { Authorization: `Bearer ${data.user.id}` },
          });
          const histData = await histRes.json();
          if (histData.success && histData.history) {
            setHistory(histData.history);
          }
          setCurrentPage("dashboard");
          addToast(`Welcome back, ${data.user.fullName}!`, "info");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        // Add a slight realistic delay to feel polished
        setTimeout(() => {
          setLoading(false);
        }, 800);
      }
    };
    checkAuth();
  }, []);

  // Handle Login submission
  const handleLoginSuccess = async (email: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast(data.error || "Failed to login", "error");
      throw new Error(data.error || "Failed to login");
    }

    localStorage.setItem("triage_auth_token", data.token);
    setUser(data.user);

    if (data.user.preferredLanguage) {
      setSelectedLanguage(data.user.preferredLanguage);
      localStorage.setItem("triage_preferred_language", data.user.preferredLanguage);
    } else {
      const localLang = localStorage.getItem("triage_preferred_language") || "English";
      setSelectedLanguage(localLang);
      fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          fullName: data.user.fullName,
          emergencyContactName: data.user.emergencyContactName,
          emergencyContactPhone: data.user.emergencyContactPhone,
          bloodType: data.user.bloodType,
          allergies: data.user.allergies,
          chronicConditions: data.user.chronicConditions,
          medications: data.user.medications,
          preferredLanguage: localLang,
        }),
      }).catch((syncErr) => console.error("Sync language error:", syncErr));
    }

    // Fetch history
    const histRes = await fetch("/api/triage/history", {
      headers: { Authorization: `Bearer ${data.user.id}` },
    });
    const histData = await histRes.json();
    if (histData.success && histData.history) {
      setHistory(histData.history);
    }

    addToast("Successfully signed in!", "success");
    setCurrentPage("dashboard");
  };

  // Handle Signup submission
  const handleSignupSuccess = async (formData: {
    email: string;
    fullName: string;
    age: string;
    gender: string;
    medicalHistory: string;
  }) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast(data.error || "Failed to sign up", "error");
      throw new Error(data.error || "Failed to sign up");
    }

    localStorage.setItem("triage_auth_token", data.token);
    setUser(data.user);
    setHistory([]);

    const currentLangSetting = selectedLanguage || localStorage.getItem("triage_preferred_language") || "English";
    setSelectedLanguage(currentLangSetting);
    localStorage.setItem("triage_preferred_language", currentLangSetting);

    fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify({
        fullName: data.user.fullName,
        preferredLanguage: currentLangSetting,
      }),
    }).catch((syncErr) => console.error("Sync signup language error:", syncErr));

    addToast("Account successfully created!", "success");
    setCurrentPage("dashboard");
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("triage_auth_token");
    setUser(null);
    setHistory([]);
    addToast("Logged out safely.", "info");
    setCurrentPage("landing");
  };

  // Update profile
  const handleUpdateProfile = async (updates: Partial<Omit<User, "id" | "email">>) => {
    if (!user) return;
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast(data.error || "Failed to update profile", "error");
      throw new Error(data.error || "Failed to update profile");
    }
    setUser(data.user);
    addToast("Profile details updated successfully!", "success");
  };

  // Delete Assessment
  const handleDeleteAssessment = (id: string) => {
    if (!user) return;
    setAssessmentToDelete(id);
  };

  const confirmDeleteAssessment = async () => {
    if (!user || !assessmentToDelete) return;
    try {
      const res = await fetch(`/api/triage/history/${assessmentToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory((prev) => prev.filter((item) => item.id !== assessmentToDelete));
        addToast("Assessment record deleted successfully", "success");
        if (selectedAssessment?.id === assessmentToDelete) {
          setSelectedAssessment(null);
        }
      } else {
        addToast("Failed to delete assessment record", "error");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      addToast("Failed to delete record.", "error");
    } finally {
      setAssessmentToDelete(null);
    }
  };

  // Added on new check success
  const handleAnalysisSuccess = (assessment: Assessment) => {
    setHistory((prev) => [assessment, ...prev]);
    addToast("Triage assessment created successfully!", "success");
  };

  const handleCopyModalNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModal(true);
    addToast("Clinical note copied to clipboard!", "success");
    setTimeout(() => setCopiedModal(false), 2000);
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8" aria-busy="true">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-3 flex-grow">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-2/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-14 w-44 rounded-2xl shrink-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <ClinicalReportSkeleton />
        </div>
      );
    }

    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onGetStarted={() => handleNavigate(user ? "assessment" : "signup")}
            onLogin={() => handleNavigate("login")}
          />
        );
      case "login":
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case "signup":
        return <SignupPage onSignupSuccess={handleSignupSuccess} onNavigate={handleNavigate} />;
      case "dashboard":
        return user ? (
          <DashboardView
            user={user}
            history={history}
            onStartAssessment={() => handleNavigate("assessment")}
            onViewAssessment={(id) => {
              const matched = history.find((a) => a.id === id);
              if (matched) setSelectedAssessment(matched);
            }}
            onDeleteAssessment={handleDeleteAssessment}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={handleNavigate}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        );
      case "assessment":
        return user ? (
          <AssessmentView
            resetKey={assessmentKey}
            user={user}
            onAnalysisSuccess={handleAnalysisSuccess}
            addToast={addToast}
            onUpdateProfile={handleUpdateProfile}
            initialAssessment={activeAssessment}
            selectedLanguage={selectedLanguage}
            onNavigate={handleNavigate}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        );
      case "history":
        return user ? (
          <HistoryView history={history} onDelete={handleDeleteAssessment} addToast={addToast} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        );
      case "qr":
        return user ? (
          <EmergencyQRView user={user} onUpdateProfile={handleUpdateProfile} addToast={addToast} history={history} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        );
      case "profile":
        return user ? (
          <ProfileView user={user} onUpdateProfile={handleUpdateProfile} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        );
      default:
        return (
          <LandingPage
            onGetStarted={() => handleNavigate(user ? "assessment" : "signup")}
            onLogin={() => handleNavigate("login")}
          />
        );
    }
  };

  if (emergencyUserId) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 font-sans" id="applet-viewport-root">
        <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 py-3.5 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-600 rounded-lg text-white">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-widest uppercase">TriageAI First Responder Portal</span>
          </div>
          <button
            onClick={() => {
              setEmergencyUserId(null);
              window.history.pushState({}, document.title, window.location.pathname);
            }}
            className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 rounded-xl transition-all"
          >
            Go to Main Site
          </button>
        </header>
        <main className="flex-grow">
          <PublicEmergencyProfileView userId={emergencyUserId} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans" id="applet-viewport-root">
      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Content Render */}
      <main className="flex-grow">{renderPage()}</main>

      {/* Bottom Footer */}
      <Footer />

      {/* Elegant Details Overlay Modal */}
      {selectedAssessment && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedAssessment(null)} aria-hidden="true" />

          <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up relative z-10">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center border-b border-slate-900 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-lg font-extrabold leading-none">
                    AI Assessment Guidelines
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-slate-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Check conducted on {new Date(selectedAssessment.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                id="close-assessment-modal"
                onClick={() => setSelectedAssessment(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                aria-label="Close modal dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-grow">
              {/* Symptoms snapshot */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Reported Symptoms Snapshot
                </span>
                <p className="text-sm text-slate-600 font-medium italic bg-slate-50 border border-slate-200/50 p-4 rounded-2xl leading-relaxed">
                  &quot;{selectedAssessment.symptoms}&quot;
                </p>
              </div>

              {/* Assessment Severity & Specialist summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50/50 border border-blue-100/60 rounded-2xl space-y-1">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                    Symptom Clinical Association
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedAssessment.possibleCondition}
                  </h4>
                  <div className="pt-2">
                    <Badge
                      variant={
                        selectedAssessment.severityLevel.toLowerCase() as
                          | "critical"
                          | "high"
                          | "medium"
                          | "low"
                      }
                    >
                      Severity: {selectedAssessment.severityLevel}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 bg-cyan-50/30 border border-cyan-100/40 rounded-2xl space-y-1">
                  <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">
                    Recommended Specialty Consult
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedAssessment.recommendedSpecialist}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Seek a primary diagnosis from an expert specialized in this medical domain.
                  </p>
                </div>
              </div>

              {/* First Aid checklists */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Supportive Comfort Care Guidelines
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedAssessment.firstAidGuidance.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start space-x-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinician Handover note copy block */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-[28px] space-y-3 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    Physician Intake Note
                  </span>
                  <button
                    id="modal-copy-note-btn"
                    onClick={() => handleCopyModalNote(selectedAssessment.doctorSummary)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 focus:outline-hidden focus:underline"
                  >
                    {copiedModal ? (
                      <span className="text-green-400">Copied Note!</span>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Clinical Note</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedAssessment.doctorSummary}
                </p>
              </div>

              {/* Critical warning notice */}
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2.5 text-red-800 text-[11px] leading-relaxed font-medium">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Emergency Notice:</strong> {selectedAssessment.disclaimer}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5.5 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
              <Button
                id="modal-close-bottom-btn"
                onClick={() => setSelectedAssessment(null)}
                variant="secondary"
              >
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Custom Confirm Delete Modal */}
      {assessmentToDelete && (
        <div
          className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={() => setAssessmentToDelete(null)} />
          <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up relative z-10 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-md font-extrabold text-slate-900">Delete Assessment Record?</h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Are you sure you want to delete this triage assessment from your clinical history? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                id="cancel-delete-btn"
                onClick={() => setAssessmentToDelete(null)}
                variant="secondary"
                className="py-2 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-btn"
                onClick={confirmDeleteAssessment}
                className="py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
