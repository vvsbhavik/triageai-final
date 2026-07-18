import React, { useState } from "react";
import { Activity, Mail, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface LoginPageProps {
  onLoginSuccess: (email: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onLoginSuccess, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onLoginSuccess(email);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-100">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Log in to access your secure triage history and saved health profile.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-100/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in"
              >
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <Input
                id="email-input"
                type="email"
                required
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
              />
              <p className="text-[11px] text-slate-400 font-medium">
                Tip: Enter your email to see your diagnostic dashboard instantly.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              id="login-submit-button"
              type="submit"
              isLoading={loading}
              className="w-full py-3.5"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Dashboard
            </Button>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col space-y-2 text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Playground Quick Entry</span>
            <button
              id="quick-demo-login"
              onClick={() => setEmail("bhavikvanapalli06@gmail.com")}
              className="px-4 py-2.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 text-blue-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Fill Seed Demo Email</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <button
            id="link-to-signup"
            onClick={() => onNavigate("signup")}
            className="text-blue-600 hover:underline font-semibold focus:outline-hidden focus:underline"
          >
            Create an account free
          </button>
        </p>
      </div>
    </div>
  );
}
