import React, { useState } from "react";
import { Activity, Stethoscope, User, LogOut, FileText, LayoutDashboard, Menu, X, Globe } from "lucide-react";
import { User as UserType } from "../types";
import { SUPPORTED_LANGUAGES, translations, Language } from "../lib/translations";

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function Header({
  user,
  onLogout,
  currentPage,
  onNavigate,
  selectedLanguage,
  onLanguageChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLang = (selectedLanguage as Language) || "English";
  const t = translations[currentLang] || translations.English;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleMobileNav = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate(user ? "dashboard" : "landing")}
            className="flex items-center space-x-2 text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl group"
            id="logo-button"
            aria-label="TriageAI Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-all duration-300">
              <Activity className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-300 rounded-full flex items-center justify-center border-2 border-white">
                <Stethoscope className="w-2 h-2 text-blue-800" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                Triage<span className="font-semibold text-blue-900">AI</span>
              </span>
              <p className="text-[10px] text-blue-500 font-medium tracking-wider uppercase leading-none">
                Emergency Guide
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Desktop Navigation">
            {user ? (
              <>
                <button
                  id="nav-dashboard"
                  onClick={() => onNavigate("dashboard")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentPage === "dashboard"
                      ? "bg-blue-50 text-blue-700 shadow-2xs shadow-blue-100/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t.dashboard}</span>
                </button>
                <button
                  id="nav-assessment"
                  onClick={() => onNavigate("assessment")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentPage === "assessment"
                      ? "bg-blue-50 text-blue-700 shadow-2xs shadow-blue-100/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span className="text-blue-900 font-semibold">{t.assessment}</span>
                </button>
                <button
                  id="nav-history"
                  onClick={() => onNavigate("history")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentPage === "history"
                      ? "bg-blue-50 text-blue-700 shadow-2xs shadow-blue-100/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.history}</span>
                </button>
                <button
                  id="nav-qr"
                  onClick={() => onNavigate("qr")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentPage === "qr"
                      ? "bg-blue-50 text-blue-700 shadow-2xs shadow-blue-100/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <Activity className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 font-bold">{t.emergencyProfile}</span>
                </button>
                <button
                  id="nav-profile"
                  onClick={() => onNavigate("profile")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentPage === "profile"
                      ? "bg-blue-50 text-blue-700 shadow-2xs shadow-blue-100/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{t.myProfile}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-landing-features"
                  onClick={() => {
                    onNavigate("landing");
                    setTimeout(() => {
                      document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {t.features}
                </button>
                <button
                  id="nav-landing-how"
                  onClick={() => {
                    onNavigate("landing");
                    setTimeout(() => {
                      document.getElementById("how-it-works-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {t.howItWorks}
                </button>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Global Language Selector */}
            <div className="relative flex items-center bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-2.5 py-1.5 transition-all shadow-3xs group focus-within:ring-2 focus-within:ring-blue-500 mr-1">
              <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-500 mr-2 shrink-0" />
              <select
                id="language-selector-desktop"
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 hover:text-blue-700 focus:outline-hidden cursor-pointer pr-1"
                aria-label="Select preferred language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="font-semibold text-slate-800">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* User initials badge */}
                <button
                  onClick={() => onNavigate("profile")}
                  className="flex items-center space-x-2 text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl group"
                  id="user-profile-badge"
                  aria-label="View profile"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs border border-white group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors max-w-[120px] truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 max-w-[120px] truncate">
                      {user.email}
                    </p>
                  </div>
                </button>

                {/* Logout button */}
                <button
                  id="header-logout-button"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="header-login-button"
                  onClick={() => onNavigate("login")}
                  className="px-4 py-2 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {t.login}
                </button>
                <button
                  id="header-signup-button"
                  onClick={() => onNavigate("signup")}
                  className="px-4.5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {t.signUp}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle main menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden glass-panel border-b border-blue-100 px-4 pt-2 pb-4 space-y-2 animate-fade-in"
        >
          {/* Mobile Language Selector */}
          <div className="flex items-center space-x-2 px-3.5 py-2.5 border-b border-slate-100">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 mr-1">{t.language}:</span>
            <select
              id="language-selector-mobile"
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-blue-700 focus:outline-hidden cursor-pointer"
              aria-label="Select preferred language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="font-semibold text-slate-800">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="space-y-1.5 pt-1">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-semibold text-sm flex items-center justify-center border border-white">
                  {getInitials(user.fullName)}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">{user.fullName}</p>
                  <p className="text-slate-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => handleMobileNav("dashboard")}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === "dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>{t.dashboard}</span>
              </button>
              <button
                onClick={() => handleMobileNav("assessment")}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === "assessment"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Activity className="w-4.5 h-4.5 text-cyan-500" />
                <span>{t.assessment}</span>
              </button>
              <button
                onClick={() => handleMobileNav("history")}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === "history"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4.5 h-4.5" />
                <span>{t.history}</span>
              </button>
              <button
                onClick={() => handleMobileNav("qr")}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === "qr"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Activity className="w-4.5 h-4.5 text-red-500" />
                <span className="text-red-700 font-bold">{t.emergencyProfile}</span>
              </button>
              <button
                onClick={() => handleMobileNav("profile")}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === "profile"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User className="w-4.5 h-4.5" />
                <span>{t.myProfile}</span>
              </button>
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onNavigate("landing");
                  setMobileMenuOpen(false);
                  setTimeout(() => {
                    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="w-full text-left px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                {t.features}
              </button>
              <button
                onClick={() => {
                  onNavigate("landing");
                  setMobileMenuOpen(false);
                  setTimeout(() => {
                    document.getElementById("how-it-works-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="w-full text-left px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                {t.howItWorks}
              </button>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleMobileNav("login")}
                  className="w-full py-2.5 text-center text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => handleMobileNav("signup")}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl shadow-xs"
                >
                  {t.signUp}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
