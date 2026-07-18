import React from "react";
import { Activity, ShieldCheck, Heart, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12" id="application-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-900">
          {/* Logo & Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Triage<span className="text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Helping users navigate medical symptoms using secure server-side Generative AI guidance. Access critical self-care, recommended specialist checks, and clean summaries instantly before reaching clinical care.
            </p>
            <div className="flex items-center space-x-2 pt-2 text-xs text-blue-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA-aligned & HIPAA-friendly platform guidelines</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-cyan-400 transition-colors cursor-pointer">Symptom Input & Triage</span>
              </li>
              <li>
                <span className="hover:text-cyan-400 transition-colors cursor-pointer">AI Severity Grading</span>
              </li>
              <li>
                <span className="hover:text-cyan-400 transition-colors cursor-pointer">First-Aid Recommendation</span>
              </li>
              <li>
                <span className="hover:text-cyan-400 transition-colors cursor-pointer">Doctor Summary Export</span>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>System Status: <strong className="text-green-400 font-normal">Active</strong></span>
              </li>
              <li>
                <span>Email: support@triageai.demo</span>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block mt-1">Disclaimer: Demo purposes only</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Medical Disclaimer banner */}
        <div className="mt-8 bg-red-950/40 border border-red-900/50 rounded-2xl p-4.5 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-red-300 uppercase tracking-wide">Critical Medical Notice & Disclaimer</h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              TriageAI does not provide professional medical diagnosis, advice, treatment, or clinical decisions. All assessment results are synthesized using Gemini artificial intelligence models and are strictly for educational and guidance assistance. In the event of a severe medical emergency, crushing chest pain, difficulty breathing, or severe trauma, please call <strong>112</strong> (National Emergency) or <strong>108</strong> (Ambulance) or go directly to the nearest emergency room immediately.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} TriageAI. Built for Google AI Studio. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for medical triage education</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
