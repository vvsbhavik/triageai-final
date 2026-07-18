import React, { useState } from "react";
import { Activity, Mail, User, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";
import { Input, TextArea } from "./ui/Input";

interface SignupPageProps {
  onSignupSuccess: (data: {
    email: string;
    fullName: string;
    age: string;
    gender: string;
    medicalHistory: string;
  }) => Promise<void>;
  onNavigate: (page: string) => void;
}

export default function SignupPage({ onSignupSuccess, onNavigate }: SignupPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    age: "",
    gender: "Male",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailTrimmed = formData.email.trim();
    const nameTrimmed = formData.fullName.trim();
    const ageTrimmed = formData.age.trim();

    if (!emailTrimmed || !nameTrimmed) {
      setError("Please fill out your Email and Full Name.");
      return;
    }

    // Email format validation matching standard RFC regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    // Age validation
    const ageNum = parseInt(ageTrimmed, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 125) {
      setError("Please enter a valid age between 1 and 125.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSignupSuccess({
        ...formData,
        email: emailTrimmed,
        fullName: nameTrimmed,
        age: ageNum.toString(),
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 bg-slate-50 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-100">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Your Health Account</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Get personalized AI triage insights matched directly to your physiological metrics.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-100/80 animate-scale-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <Input
                id="signup-name"
                type="text"
                required
                label="Full Name"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
              />

              {/* Email Address */}
              <Input
                id="signup-email"
                type="email"
                required
                label="Email Address"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <Input
                id="signup-age"
                type="number"
                min="1"
                max="120"
                required
                label="Age"
                placeholder="e.g. 28"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="signup-gender" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Biological Sex
                </label>
                <select
                  id="signup-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-1">
              <TextArea
                id="signup-history"
                label="Existing Medical History"
                placeholder="Declare any chronic illnesses, asthma, diabetes, drug allergies, heart history, etc. (Or type 'None')"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                rows={3}
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                This context is passed server-side to the Gemini AI to refine diagnostic suggestions.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              id="signup-submit-button"
              type="submit"
              isLoading={loading}
              className="w-full py-3.5"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Start
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <button
            id="signup-link-to-login"
            onClick={() => onNavigate("login")}
            className="text-blue-600 hover:underline font-semibold focus:outline-hidden focus:underline"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
