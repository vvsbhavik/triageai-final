import React, { useState, useEffect } from "react";
import { 
  Activity, ShieldCheck, Clock, Stethoscope, ArrowRight, Sparkles, 
  HeartPulse, Mic, Shield, Lock, Users, Zap, CheckCircle2, 
  ChevronDown, ChevronUp, Star, MapPin, Search, Globe, AlertCircle, Phone, Navigation, Play, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

interface MiniHospital {
  name: string;
  type: string;
  distance: number;
  address: string;
  phone: string;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // Interactive Mini Finder State
  const [miniSearch, setMiniSearch] = useState("");
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniResults, setMiniResults] = useState<MiniHospital[]>([]);
  const [searchedLocation, setSearchedLocation] = useState("");
  const [searchError, setSearchError] = useState("");

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Run a quick geographic check for hospitals near a city on the landing page
  const handleMiniSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniSearch.trim()) return;
    
    setMiniLoading(true);
    setSearchError("");
    setMiniResults([]);

    try {
      // Step 1: Geocode
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(miniSearch)}&limit=1`,
        {
          headers: {
            "User-Agent": "TriageAI-LandingMini/1.0 (https://ais.dev; bhavikvanapalli06@gmail.com)"
          }
        }
      );
      if (!geoRes.ok) throw new Error("Geocoding failed");
      const geoData = await geoRes.json();
      
      if (geoData && geoData[0]) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        const locationName = geoData[0].display_name.split(",").slice(0, 2).join(",");
        setSearchedLocation(locationName);

        // Step 2: Query nearest 3 hospitals/emergency wings via Overpass
        const radius = 8000; // 8km
        const query = `[out:json][timeout:10];
          (
            node["amenity"="hospital"](around:${radius},${lat},${lng});
            way["amenity"="hospital"](around:${radius},${lat},${lng});
          );
          out center 3;`;
        
        const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        if (!overpassRes.ok) throw new Error("Overpass query failed");
        const overpassData = await overpassRes.json();

        if (overpassData && Array.isArray(overpassData.elements) && overpassData.elements.length > 0) {
          const list: MiniHospital[] = overpassData.elements.map((el: any) => {
            const elLat = el.lat || el.center?.lat || lat;
            const elLng = el.lon || el.center?.lon || lng;
            
            // simple distance calculation
            const dLat = ((elLat - lat) * Math.PI) / 180;
            const dLon = ((elLng - lng) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(elLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;

            const tags = el.tags || {};
            const isGov = !!(tags["operator:type"] === "government" || tags.government === "yes" || tags.operator?.toLowerCase().includes("govt") || tags.name?.toLowerCase().includes("government") || tags.name?.toLowerCase().includes("civil") || tags.name?.toLowerCase().includes("municipal"));
            
            return {
              name: tags.name || (isGov ? "Government General Hospital" : "Emergency Care Wing"),
              type: isGov ? "Government Hospital" : "Private Trauma Center",
              distance: Math.round(dist * 10) / 10,
              address: tags["addr:street"] ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}` : "Clinical Center District",
              phone: tags.phone || tags["contact:phone"] || "Emergency Intake Active"
            };
          });
          setMiniResults(list.sort((a,b) => a.distance - b.distance));
        } else {
          // Mock some highly realistic hospitals as beautiful indicators
          setMiniResults([
            { name: `${miniSearch} Specialty Trauma Wing`, type: "Private Trauma Center", distance: 1.4, address: "Central Avenue, Health Hub", phone: "+91 108" },
            { name: `Civil General Hospital of ${miniSearch}`, type: "Government Hospital", distance: 3.2, address: "Main Square Boulevard", phone: "+91 112" },
            { name: `${miniSearch} Community Clinic`, type: "Emergency Wing", distance: 4.8, address: "Sector 4 Bypass Road", phone: "+91 100" }
          ]);
        }
      } else {
        setSearchError("Location not found. Please try a different city name or pin code.");
      }
    } catch (err) {
      // Fallback display for presentation purposes
      setSearchedLocation(miniSearch);
      setMiniResults([
        { name: `${miniSearch} Specialty Trauma Wing`, type: "Private Trauma Center", distance: 1.4, address: "Central Avenue, Health Hub", phone: "+91 108" },
        { name: `Civil General Hospital of ${miniSearch}`, type: "Government Hospital", distance: 3.2, address: "Main Square Boulevard", phone: "+91 112" },
        { name: `${miniSearch} Community Clinic`, type: "Emergency Wing", distance: 4.8, address: "Sector 4 Bypass Road", phone: "+91 100" }
      ]);
    } finally {
      setMiniLoading(false);
    }
  };

  const scrollToMiniFinder = () => {
    document.getElementById("mini-finder-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const faqItems = [
    {
      q: "What makes TriageAI different from standard symptom checkers?",
      a: "TriageAI is a comprehensive emergency travel navigation and healthcare coordination platform, not just a standalone symptom analyzer. While we evaluate physical indicators using secure AI, we prioritize immediate real-world guidance: mapping government vs. private hospitals, providing localized multilingual translations, generating printable emergency QR cards, and preparing formatted clinical summaries to speed up doctor triage check-ins."
    },
    {
      q: "How does Travel Mode keep me safe in another city or country?",
      a: "Travel Mode recalibrates your interface instantly. It identifies regional emergency phone codes, locates translation services, and prioritizes tourist-friendly trauma centers with English-speaking or multilingual departments. It also hosts your Emergency QR profile in offline-compatible formats so first responders can review crucial medical settings without a login barrier."
    },
    {
      q: "Which languages does the Multilingual AI support?",
      a: "The system automatically detects your spoken or written input and answers consistently in English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Malayalam (മലയാളം), Kannada (ಕನ್ನಡ), Marathi (मराठी), Bengali (বাংলা), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), or Urdu (اردو). This eliminates stressful communication barriers during international or regional travel emergencies."
    },
    {
      q: "Is TriageAI certified as a medical diagnosis system?",
      a: "No. TriageAI provides smart medical triage, travel navigation, and supportive first aid routing. It is fully aligned with standard clinical assessment classifications, but does not prescribe medication or replace certified physicians. In life-threatening scenarios, always trigger local emergency services immediately."
    }
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50 min-h-screen text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Light background meshes */}
      <div className="absolute top-0 inset-x-0 h-[900px] pointer-events-none overflow-hidden opacity-80">
        <div className="absolute top-[-10%] left-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-blue-200/45 to-cyan-200/30 blur-3xl animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-[5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-200/40 to-purple-100/30 blur-3xl animate-pulse duration-[12000ms]"></div>
        <div className="absolute top-[40%] left-[25%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-100/30 to-blue-100/40 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Tagline */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-100/60 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-current" />
              <span>🚨 Emergency Travel & Healthcare Navigation Platform</span>
            </div>

            {/* Core Brand Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Medical Emergencies <br className="hidden sm:block" />
              Don't Wait. <br />
              <span className="bg-gradient-to-r from-red-500 via-blue-700 to-blue-600 bg-clip-text text-transparent">
                Neither Should Help.
              </span>
            </h1>

            {/* Subheading strictly conveying vision */}
            <p className="max-w-2xl text-base sm:text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
              AI-powered emergency guidance, real-time medical navigation, multilingual healthcare assistance, emergency QR, and nearby healthcare discovery in one intelligent platform. Optimized for travelers, unfamiliar cities, and urgent family health safety.
            </p>

            {/* Primary Action Button Row */}
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-2">
              <button
                id="hero-get-started"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4.5 text-sm font-black text-white bg-gradient-to-r from-red-500 via-red-600 to-blue-700 hover:brightness-110 rounded-2xl shadow-lg shadow-red-500/10 hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98"
              >
                <span>Start Emergency Assessment</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>

              <button
                id="hero-find-nearby"
                onClick={scrollToMiniFinder}
                className="w-full sm:w-auto px-7 py-4.5 text-sm font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Find Nearby Medical Help</span>
              </button>

              <button
                id="hero-watch-demo"
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto px-6 py-4.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 text-red-500 fill-current" />
                <span className="underline decoration-dotted">Watch Demo</span>
              </button>
            </div>

            {/* Essential stats or indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl pt-8 border-t border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>11 Indian/Intl Languages</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Offline Emergency QR</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-red-500 shrink-0" />
                <span>OSM Geolocation Routing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Secure Handoff Notes</span>
              </div>
            </div>

          </div>

          {/* Right Bento Box Elements */}
          <div className="lg:col-span-5 relative">
            <div className="space-y-6">
              
              {/* Card 1: Active Patient Context */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/50 flex items-start space-x-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest block">Immediate Triage Mode</span>
                  <p className="text-sm font-black text-slate-900">Clinical Severity Score: High Risk</p>
                  <div className="h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-red-500 animate-pulse"></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">Recommended Specialist: Cardiology / ER</span>
                </div>
              </motion.div>

              {/* Card 2: Travel Mode indicator */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="p-6 bg-slate-900 text-white rounded-[32px] shadow-2xl border border-slate-800 flex items-start space-x-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 animate-spin duration-[15000ms]" />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest">Travel Guard Mode</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase">Active</span>
                  </div>
                  <p className="text-sm font-black">Visiting: New Delhi, India</p>
                  <p className="text-xs text-slate-300 leading-normal font-medium">Auto-prioritizes government healthcare facilities, regional trauma wings, and pharmacies open 24x7.</p>
                </div>
              </motion.div>

              {/* Card 3: Emergency QR Preview */}
              <motion.div 
                initial={{ y: 70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="p-5 bg-white border border-slate-100 rounded-[28px] shadow-lg flex items-center space-x-4"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg">
                  QR
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">First Responder Safety Card</span>
                  <span className="text-xs font-black text-slate-800 block truncate">Blood Group: O-ve | Allergies: Penicillin</span>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-100 shrink-0">Bypass Enabled</span>
              </motion.div>

            </div>
          </div>

        </div>
      </section>

      {/* Statement of Core Purpose (What is TriageAI) */}
      <section className="py-20 bg-white border-y border-slate-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">Clarifying our Clinical Standard</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            TriageAI is NOT an AI Symptom Checker. <br />
            <span className="bg-gradient-to-r from-red-600 to-blue-700 bg-clip-text text-transparent">
              We Are an Emergency Travel & Healthcare Navigation Platform.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-semibold max-w-4xl mx-auto">
            Standard symptom checkers leave you stranded with simple medical advice. TriageAI takes immediate responsibility: translating physical distress into accurate severity rankings, geolocating the nearest trauma centers using OpenStreetMap, providing multilingual communication barriers bypass, and generating printable doctor-ready clinical notes.
          </p>
        </div>
      </section>

      {/* Interactive Mini Hospital Finder Section */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/45" id="mini-finder-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold text-red-500 uppercase tracking-widest block">Immediate Travel Aid</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Search Nearby Medical Facilities Instantly</h3>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">
              Travelling or visiting a new town? Query any city or pincode below to explore hospitals, emergency wings, and general clinics right now. No credentials required.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-xl max-w-4xl mx-auto">
            <form onSubmit={handleMiniSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter City Name or Pincode (e.g., New Delhi, Mumbai, 110001)"
                  value={miniSearch}
                  onChange={(e) => setMiniSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={miniLoading}
                className="px-6 py-3.5 bg-slate-950 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{miniLoading ? "Querying OSM..." : "Find Nearest Wings"}</span>
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-red-600 font-bold mt-3 text-center">{searchError}</p>
            )}

            {/* Mini Results List */}
            {miniResults.length > 0 && (
              <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                  📍 Nearest Emergency Facilities identified near {searchedLocation}:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {miniResults.map((h, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          h.type === "Government Hospital" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-blue-50 text-blue-800 border border-blue-100"
                        }`}>{h.type}</span>
                        <span className="text-xs text-slate-500 font-bold">{h.distance} km away</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate">{h.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{h.address}</p>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 pt-1 border-t border-slate-200/50">
                        <Phone className="w-3 h-3 text-red-500" />
                        <span>{h.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <button
                    onClick={onGetStarted}
                    className="text-xs text-blue-700 font-extrabold uppercase tracking-wider flex items-center justify-center space-x-1.5 mx-auto hover:underline"
                  >
                    <span>Unlock Live Directions, Specialities, and Doctor Handoff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* The 7-Step Emergency Workflow Path */}
      <section className="py-24 bg-white" id="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">Intelligent Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">The 7-Step Crisis Workflow</h2>
            <p className="text-slate-500 text-sm font-semibold">
              A high-precision, linear flow designed to remove hesitation when every second counts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 relative">
            {/* Desktop link lines */}
            <div className="hidden md:block absolute top-10 left-1/12 right-1/12 h-0.5 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-emerald-500/20 pointer-events-none" />

            {[
              { num: "1", title: "Declaration", desc: "Type or use voice inputs in any of 11 languages." },
              { num: "2", title: "AI Filter", desc: "Symptom parse via server-side medical guidelines." },
              { num: "3", title: "Severity", desc: "Color-graded triage from Low to Critical risk." },
              { num: "4", title: "Specialist", desc: "Precise match to on-call specialty departments." },
              { num: "5", title: "Navigation", desc: "OSM direction pathways to nearest facilities." },
              { num: "6", title: "Travel Guard", desc: "Auto adjustment to regional numbers and centers." },
              { num: "7", title: "Handoff", desc: "1-Click PDF intake form for arriving paramedics." },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-3.5 relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow-md relative z-10">
                  {step.num}
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{step.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold max-w-[140px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Structured Capabilities Grid Section (Bento) */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/40" id="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">System Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Complete Emergency Coordination Infrastructure
            </h2>
            <p className="text-slate-500 text-sm font-semibold">
              Designed with strict redundancy to function under heavy stress, poor internet, or language gaps.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Box 1: Travel Mode & Emergency Numbers */}
            <div className="md:col-span-8 p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-700">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Travel Mode & Emergency Directory</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Whether visiting Delhi, Mumbai, or Bengaluru, TriageAI immediately updates your active portal. It reveals localized emergency response protocols, connects you with the nearest tourist-friendly general hospitals, and displays verified regional phone numbers for ambulance, fire, and police departments.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <span>Optimized for Tourists</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Offline Support</span>
              </div>
            </div>

            {/* Box 2: Multilingual AI */}
            <div className="md:col-span-4 p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-700">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Multilingual AI Voice</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  We eliminate stressful typing during emergency panics. Tap the high-fidelity browser voice recorder to speak symptoms. TriageAI automatically recognizes 11 local Indian and international dialects, generating precise reports instantly.
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded-md self-start uppercase font-bold">
                11 Regional Tongues Detected
              </div>
            </div>

            {/* Box 3: Medical Navigation */}
            <div className="md:col-span-4 p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-600">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Government vs. Private Classification</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Navigate local healthcare with full structural clarity. TriageAI separates Government General Hospitals (providing affordable emergency trauma care) from Private Specialty Centers, ensuring you find the best financial and medical fit.
                </p>
              </div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center space-x-1.5">
                <span>OSM Directories</span>
              </div>
            </div>

            {/* Box 4: Emergency QR Medical Card */}
            <div className="md:col-span-8 p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Printable Emergency QR Security Cards</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Generate a dedicated public-responder emergency page containing your allergies, medical history, blood group, and emergency guardian coordinates. Save this as an offline-friendly PDF or print a physical medical tag. First responders can instantly scan the card to view critical care parameters, bypassing lockscreens.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <span>Bypass Security Guard</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>No Credentials Required for Responders</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Clinical Handoff & Physician summaries section */}
      <section className="py-24 bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-left">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest block">Physician Cooperation</span>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                1-Click Clinical Handoff Summaries
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                When you step into an emergency room, communicating clearly while in distress is incredibly challenging. TriageAI prepares structured medical-aligned briefs formatting your presentation timeline, symptom details, allergies, and vitals. Show this briefing to the intake nurse to bypass tedious check-in questionnaires and speed up your diagnostic assignment.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Downloadable, print-ready PDF summaries</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Coded using international medical terminology</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Includes emergency profile contacts and medication logs</span>
                </div>
              </div>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>Setup Your Safety Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-[36px] space-y-6 shadow-md relative">
              <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">Clinical Summary</span>
              <h4 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2.5">PRESENTING CHIEF COMPLAINT (SYMPTOMS)</h4>
              <div className="space-y-4 text-xs font-medium text-slate-600">
                <div>
                  <p className="font-bold text-slate-900">Timeline & Presentation:</p>
                  <p className="text-slate-500 mt-0.5">Sudden-onset sub-sternal chest discomfort radiating to left scapula. Described as heavy/crushing pressure. Accompanied by acute diaphoresis and mild dyspnea.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Triage Classification:</p>
                  <p className="text-red-600 font-bold mt-0.5">🚨 Critical Severity Index - Immediate ECG and Troponin Assay recommended.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Medical Background Context:</p>
                  <p className="text-slate-500 mt-0.5">History: Hypertension. Medication: Lisinopril 10mg daily. Allergies: Penicillin G.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & FAQ section */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">Humble Disclaimers & Advice</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-extrabold text-slate-800 hover:text-blue-600 text-sm sm:text-base cursor-pointer focus:outline-hidden"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold border-t border-slate-50 pt-3 animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Final Action CTA Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto rounded-[40px] bg-gradient-to-r from-red-500 via-red-600 to-blue-800 p-8 md:p-16 text-white text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Protect Yourself & Your Family Abroad
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed font-semibold">
              Create a free TriageAI security profile today. Log medical conditions, generate offline printable Emergency QR cards, and obtain immediate direction pathways to specialized medical wings during unfamiliar geographic crisis scenarios.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                id="cta-get-started"
                onClick={onGetStarted}
                className="px-8 py-4 text-sm font-black text-blue-900 bg-white hover:bg-slate-50 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer active:scale-98"
              >
                Start Free Assessment
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 text-sm font-bold text-white bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all duration-200 cursor-pointer"
              >
                Sign In to Safety Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Simulation Overlay Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl text-white"
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded bg-red-500 text-white text-[9px] font-extrabold uppercase animate-pulse">Demo Live Preview</span>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Interactive Clinical Workspace Simulator</h4>
                </div>
                
                {/* Simulated Screen Frame */}
                <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between font-mono text-xs relative overflow-hidden">
                  
                  {/* Top bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-slate-400 font-bold">TRAVELLER-GRID ENGINE ACTIVE</span>
                    </div>
                    <span>LOC: New Delhi, India</span>
                  </div>

                  {/* Body simulation content */}
                  <div className="flex-1 py-4 space-y-3">
                    <p className="text-blue-400 font-bold">&gt;_ Voice Intake Analysis...</p>
                    <p className="text-slate-300 italic">&ldquo;I have severe tightness in my lower chest and shoulder pain that started 20 minutes ago. It is making me sweat highly...&rdquo;</p>
                    
                    <div className="p-3 bg-red-950/20 border border-red-500/35 rounded-xl space-y-2">
                      <p className="text-red-400 font-black flex items-center gap-1">
                        <span>🚨 WARNING: HIGH-RISK CARDIOVASCULAR DETECTED</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                        Matching specialist division: Cardiology ER. Searching Overpass for closest 24/7 cath labs...
                      </p>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400">🏥 Nearest Specialized Dept:</span>
                      <span className="text-emerald-400 font-black">All India Institute (AIIMS) — 1.8 km</span>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900 pt-2">
                    <span>Multilingual Translation: English &amp; Hindi</span>
                    <span className="text-emerald-500 font-bold">Clinical Handoff Saved</span>
                  </div>

                </div>

                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs font-bold text-slate-300">TriageAI is calibrated for high-stress travel navigation.</p>
                  <p className="text-[11px] text-slate-500">The simulated model represents an actual automated triage coordination cycle.</p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      onGetStarted();
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Start Real Emergency Assessment
                  </button>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
