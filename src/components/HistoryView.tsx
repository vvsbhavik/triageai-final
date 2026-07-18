import React, { useState } from "react";
import { Activity, Clock, Search, Filter, Trash2, ChevronRight, ChevronDown, CheckSquare, Sparkles, Copy, Check, Printer } from "lucide-react";
import { Assessment } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { ToastType } from "./ui/Toast";

interface HistoryViewProps {
  history: Assessment[];
  onDelete: (id: string) => void;
  addToast: (message: string, type?: ToastType) => void;
}

export default function HistoryView({ history, onDelete, addToast }: HistoryViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("Clinical intake note copied successfully!", "success");
    setTimeout(() => setCopiedId(null), 2000);
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

  // Filter & Search Logic
  const filteredHistory = history.filter((item) => {
    const matchesSeverity = filterSeverity === "All" || item.severityLevel === filterSeverity;
    const matchesSearch =
      item.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.possibleCondition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recommendedSpecialist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="history-view-container">
      {/* Title */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assessment History</h1>
        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">
          Saved AI symptom evaluations and clinician handover records
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4.5 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-8">
        {/* Search */}
        <div className="w-full md:flex-1">
          <Input
            id="history-search-input"
            type="text"
            placeholder="Search symptoms, conditions, or specialists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity:</span>
          <select
            id="history-severity-filter"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-800"
          >
            <option value="All">All Severity Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main List Grid */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-16 text-center space-y-4 shadow-xs animate-scale-up">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Activity className="w-8 h-8" />
          </div>
          <div className="max-w-xs mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">No Matching Records</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              We couldn&apos;t find any saved triage history matching your query or filter level.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4" id="history-items-list">
          {filteredHistory.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const badgeVariant = getBadgeVariant(item.severityLevel);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-3xl transition-all duration-300 animate-scale-up ${
                  isExpanded ? "border-blue-200 shadow-lg shadow-blue-50/40" : "border-slate-200/60 hover:border-slate-300"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header Row clickable */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-5.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                  id={`history-row-${item.id}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(item.id);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={badgeVariant}>
                        {item.severityLevel} Risk
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </span>
                    </div>

                    <h3 className="text-md font-extrabold text-slate-900">{item.possibleCondition}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      Symptoms: &quot;{item.symptoms}&quot;
                    </p>
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <button
                      id={`delete-history-btn-${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Delete assessment"
                      aria-label={`Delete assessment record for ${item.possibleCondition}`}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                    <div className="p-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-5.5 pb-6 pt-2 border-t border-slate-100 space-y-6 bg-slate-50/50 rounded-b-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Specialist and guidelines */}
                      <div className="space-y-4">
                        <div className="p-4.5 bg-white border border-slate-200/60 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Specialist Consult</span>
                          <span className="text-sm font-extrabold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-md inline-block">
                            {item.recommendedSpecialist}
                          </span>
                        </div>

                        {/* First-aid check list */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center space-x-1">
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                            <span>First-aid and comfort instructions</span>
                          </span>
                          <ul className="space-y-2 text-xs text-slate-600 font-medium">
                            {item.firstAidGuidance.map((step, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right: Intake Note */}
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Physician intake handover note
                          </span>
                          <button
                            id={`copy-history-note-${item.id}`}
                            onClick={() => handleCopyNote(item.id, item.doctorSummary)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 focus:outline-hidden focus:underline"
                          >
                            {copiedId === item.id ? (
                              <span className="text-green-600 font-bold">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy clinical note</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                          {item.doctorSummary}
                        </p>
                      </div>
                    </div>

                    {/* Disclaimer Banner */}
                    <div className="p-4 bg-amber-50 border border-amber-100/60 rounded-xl flex items-start space-x-2 text-amber-800 text-[11px] font-medium leading-relaxed">
                      <span className="font-black text-amber-700 uppercase shrink-0">Disclaimer:</span>
                      <span>{item.disclaimer}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
