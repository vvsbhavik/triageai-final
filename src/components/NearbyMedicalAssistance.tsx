import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Phone, Star, ShieldAlert, CheckCircle2, Clock, Search, Globe, AlertCircle, Loader2 } from "lucide-react";
import { User, Assessment } from "../types";
import { ToastType } from "./ui/Toast";

interface NearbyMedicalAssistanceProps {
  user: User;
  assessment: Assessment;
  addToast: (message: string, type?: ToastType) => void;
  travelModeEnabled: boolean;
  onToggleTravelMode?: (enabled: boolean) => void;
}

interface Hospital {
  id: string;
  name: string;
  type: "Government Hospital" | "Private Hospital" | "Clinic" | "Pharmacy" | "Blood Bank" | "Emergency / Trauma Center";
  rating: number;
  distance: number; // in km
  duration: number; // in minutes
  phone: string;
  isOpen24h: boolean;
  isOpenNow: boolean;
  hasSpecialistWing: boolean;
  specialistName: string;
  touristFriendly: boolean;
  emergencyDept: boolean;
  address: string;
  lat: number;
  lng: number;
  isGov: boolean;
}

// Haversine Distance Formula Helper
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's Radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyMedicalAssistance({
  user,
  assessment,
  addToast,
  travelModeEnabled,
  onToggleTravelMode,
}: NearbyMedicalAssistanceProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [isGpsGranted, setIsGpsGranted] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [activeLocationName, setActiveLocationName] = useState("Your Current Location");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Core API fetcher for nearby medical facilities using OpenStreetMap Overpass API
  const fetchNearbyFacilities = async (lat: number, lng: number, locationName: string) => {
    setLoadingHospitals(true);
    setHospitals([]);
    try {
      const response = await fetch(`/api/nearby-facilities?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("Failed to fetch nearby facilities");
      const result = await response.json();
      if (!result.success || !Array.isArray(result.facilities)) throw new Error("Invalid response");
      const list: Hospital[] = result.facilities.map((facility: any) => ({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        rating: facility.rating ?? 4.5,
        distance: facility.distance ?? 0,
        duration: facility.duration ?? 0,
        phone: facility.phone ?? "None declared",
        isOpen24h: !!facility.isOpen24h,
        isOpenNow: facility.isOpenNow !== false,
        hasSpecialistWing: !!facility.hasSpecialistWing,
        specialistName: assessment?.recommendedSpecialist || "General Medicine",
        touristFriendly: !!facility.touristFriendly,
        emergencyDept: !!facility.emergencyDept,
        address: facility.address ?? "",
        lat,
        lng,
        isGov: String(facility.type||"").toLowerCase().includes("government"),
      }));
      list.sort((a,b)=>a.distance-b.distance);
      setHospitals(list);
      localStorage.setItem("triageai_nearby_hospitals_cache", JSON.stringify({lat,lng,activeLocationName:locationName,hospitals:list,timestamp:Date.now()}));
    } catch (err) {
      console.error(err);
      const cached=localStorage.getItem("triageai_nearby_hospitals_cache");
      if(cached){
        const c=JSON.parse(cached);
        setCoords({lat:c.lat,lng:c.lng});
        setActiveLocationName(c.activeLocationName);
        setHospitals(c.hospitals);
        addToast("Loaded cached nearby hospitals.","info");
      } else {
        addToast("Failed to fetch nearby hospitals.","error");
      }
    } finally {
      setLoadingHospitals(false);
    }
  };

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setIsGpsGranted(false);
      addToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setIsGpsGranted(true);
        setGpsLoading(false);
        const locationName = `GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setActiveLocationName(locationName);
        
        addToast("GPS coordinates retrieved. Fetching nearby medical centers...", "info");
        await fetchNearbyFacilities(latitude, longitude, locationName);
      },
      async (error) => {
        console.warn("GPS access warning (falling back gracefully):", error?.message || error);
        setIsGpsGranted(false);
        setGpsLoading(false);
        addToast("GPS access denied. You may search by City or Pincode manually.", "info");
        
        // Attempt to load from cache first if GPS is denied
        const cached = localStorage.getItem("triageai_nearby_hospitals_cache");
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            setCoords({ lat: cachedData.lat, lng: cachedData.lng });
            setActiveLocationName(cachedData.activeLocationName);
            setHospitals(cachedData.hospitals);
            return;
          } catch (e) {
            // Ignore cache error, continue to fallback
          }
        }

        // Fallback default coordinates: New Delhi, India
        const fallbackName = "New Delhi, Delhi (Default Fallback)";
        setActiveLocationName(fallbackName);
        await fetchNearbyFacilities(28.6139, 77.2090, fallbackName);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Attempt cache check on load to prevent slow GPS calls
    const cached = localStorage.getItem("triageai_nearby_hospitals_cache");
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (cachedData.hospitals && cachedData.hospitals.length > 0) {
          setCoords({ lat: cachedData.lat, lng: cachedData.lng });
          setActiveLocationName(cachedData.activeLocationName);
          setHospitals(cachedData.hospitals);
          setIsGpsGranted(true);
          return;
        }
      } catch (e) {
        console.error("Failed to restore initial hospitals cache", e);
      }
    }
    requestGpsLocation();
  }, [assessment]);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setLoadingHospitals(true);
    addToast(`Resolving coordinates for: ${searchCity}`, "info");

    try {
      // Use OSM Nominatim free keyless geocoding service supporting pincodes and city names
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchCity)}&limit=1`,
        {
          headers: {
            "User-Agent": "TriageAI-Clinics/1.0 (https://ais.dev; bhavikvanapalli06@gmail.com)",
          },
        }
      );

      if (!geoRes.ok) throw new Error("Geocoding service unavailable");

      const geoData = await geoRes.json();
      if (geoData && geoData[0]) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        const displayName = geoData[0].display_name.split(",").slice(0, 2).join(",");
        
        setCoords({ lat, lng });
        setActiveLocationName(displayName);
        addToast(`Location resolved! Querying medical centers near ${displayName}`, "success");
        await fetchNearbyFacilities(lat, lng, displayName);
      } else {
        addToast("Location not recognized. Please enter a valid city or pincode.", "error");
        setLoadingHospitals(false);
      }
    } catch (err) {
      console.error("Geocoding lookup error:", err);
      addToast("Failed to resolve location coordinates. Running default clinical search.", "error");
      const fallbackName = "New Delhi, Delhi (Default Fallback)";
      setActiveLocationName(fallbackName);
      await fetchNearbyFacilities(28.6139, 77.2090, fallbackName);
    }
  };

  const getGoogleMapsSearchUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const getGoogleMapsDirUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const getAppleMapsDirUrl = (lat: number, lng: number) => {
    return `https://maps.apple.com/?daddr=${lat},${lng}`;
  };

  const getOSMDirUrl = (lat: number, lng: number) => {
    return `https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lng}`;
  };

  // Perform client-side filtering and sorting
  const filteredSortedHospitals = React.useMemo(() => {
    let list = hospitals.filter((h) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "hospitals") return h.type === "Government Hospital" || h.type === "Private Hospital" || h.type === "Emergency / Trauma Center";
      if (activeFilter === "emergency") return h.emergencyDept || h.type === "Emergency / Trauma Center";
      if (activeFilter === "clinics") return h.type === "Clinic";
      if (activeFilter === "pharmacies") return h.type === "Pharmacy";
      if (activeFilter === "blood_banks") return h.type === "Blood Bank";
      return true;
    });

    list.sort((a, b) => {
      if (travelModeEnabled) {
        // Priority score for travelers: tourist friendly, open 24h, has emergency dept
        const scoreA = (a.touristFriendly ? 4 : 0) + (a.isOpen24h ? 3 : 0) + (a.emergencyDept ? 2 : 0);
        const scoreB = (b.touristFriendly ? 4 : 0) + (b.isOpen24h ? 3 : 0) + (b.emergencyDept ? 2 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
      } else {
        // Default: specialist wing match priority first, then distance
        const matchA = a.hasSpecialistWing ? 1 : 0;
        const matchB = b.hasSpecialistWing ? 1 : 0;
        if (matchA !== matchB) return matchB - matchA;
      }
      return a.distance - b.distance;
    });
    return list;
  }, [hospitals, travelModeEnabled, activeFilter, assessment?.recommendedSpecialist]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/50 space-y-6 animate-scale-up" id="nearby-medical-assistance">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 animate-pulse" />
            <span>Nearby Medical Assistance</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">Emergency & Specialty Routing</h3>
        </div>

        {/* Travel Mode Toggle Button */}
        {onToggleTravelMode && (
          <button
            onClick={() => onToggleTravelMode(!travelModeEnabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 border ${
              travelModeEnabled
                ? "bg-amber-50 text-amber-800 border-amber-200 ring-4 ring-amber-100"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            id="nearby-travel-mode-toggle"
          >
            <Globe className={`w-3.5 h-3.5 ${travelModeEnabled ? "text-amber-600 animate-spin" : "text-slate-400"}`} />
            <span>{travelModeEnabled ? "Travel Mode Active 🧳" : "Enable Travel Mode"}</span>
          </button>
        )}
      </div>

      {/* Travel mode prioritized banner */}
      {travelModeEnabled && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl flex items-start space-x-3 text-amber-900 animate-scale-up">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wide">Tourist Emergency Routing Active</h4>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              We are prioritizing **24x7 hospitals**, **Emergency departments**, and **Tourist-friendly** multilingual healthcare facilities equipped for international travelers.
            </p>
          </div>
        </div>
      )}

      {/* Geolocation status and Search box */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5 w-full md:flex-1">
          <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="text-xs text-slate-600 font-semibold leading-relaxed w-full">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Active search radius (10 km)</span>
            <span className="text-slate-900 font-extrabold text-sm block">{activeLocationName}</span>
            {isGpsGranted === false && (
              <span className="inline-block text-[9px] text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mt-1.5 animate-pulse">
                ⚠️ GPS Restricted / Denied — Using Manual Input or Fallback Coordinates
              </span>
            )}
          </div>
        </div>

        {/* GPS Button and City Input */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={requestGpsLocation}
            disabled={gpsLoading || loadingHospitals}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 transition-all flex items-center justify-center space-x-1.5 focus:outline-hidden disabled:opacity-50 cursor-pointer"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin text-blue-500" : ""}`} />
            <span>{gpsLoading ? "Retrieving GPS..." : "Auto GPS"}</span>
          </button>

          <form onSubmit={handleCitySearch} className="flex space-x-1.5 w-full sm:w-auto">
            <input
              type="text"
              placeholder="City or Pincode (e.g., New Delhi or 110001)"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 text-slate-800 placeholder-slate-400 w-full sm:w-64"
            />
            <button
              type="submit"
              disabled={loadingHospitals}
              className="px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Specialty Consultation Helper */}
      <div className="p-4 bg-blue-50/40 border border-blue-100/40 rounded-2xl flex items-center space-x-3 text-xs text-blue-800 font-medium">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
        <div className="leading-relaxed">
          AI suggests a <strong>{assessment?.recommendedSpecialist || "General Medicine"}</strong> wing/clinic. Centers tagged with <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">Specialty Wing Match</span> possess on-call practitioners for this condition.
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { id: "all", label: "🏥 All Facilities" },
          { id: "hospitals", label: "🏢 Hospitals" },
          { id: "emergency", label: "🚨 Emergency & Trauma" },
          { id: "clinics", label: "🩺 Clinics" },
          { id: "pharmacies", label: "💊 Pharmacies" },
          { id: "blood_banks", label: "🩸 Blood Banks" },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeFilter === filter.id
                ? "bg-slate-950 border-slate-950 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading overlay for list with premium skeleton loaders */}
      {loadingHospitals && (
        <div className="space-y-4 animate-pulse" id="hospital-skeletons">
          <div className="flex flex-col items-center justify-center py-4 space-y-1.5">
            <span className="text-xs text-blue-600 font-extrabold uppercase tracking-wider animate-pulse">Querying Local Clinical Directories...</span>
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 bg-slate-50/50 border border-slate-200/40 rounded-[24px] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="space-y-3 flex-1 w-full">
                <div className="flex gap-2">
                  <div className="h-4.5 w-16 bg-slate-200/80 rounded-md"></div>
                  <div className="h-4.5 w-20 bg-slate-200/80 rounded-md"></div>
                </div>
                <div className="h-6 w-2/3 sm:w-1/2 bg-slate-200/80 rounded-lg"></div>
                <div className="h-4 w-1/3 bg-slate-200/80 rounded-md"></div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  <div className="h-4.5 w-24 bg-slate-200/80 rounded-md"></div>
                  <div className="h-4.5 w-28 bg-slate-200/80 rounded-md"></div>
                  <div className="h-4.5 w-12 bg-slate-200/80 rounded-md"></div>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto shrink-0 justify-end pt-3 lg:pt-0 border-t border-slate-100 lg:border-0">
                <div className="h-9 w-24 bg-slate-200/80 rounded-xl"></div>
                <div className="h-9 w-24 bg-slate-200/80 rounded-xl"></div>
                <div className="h-9 w-28 bg-slate-200/80 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main List of Nearest Centers */}
      {!loadingHospitals && (
        <div className="space-y-4">
          {filteredSortedHospitals.length === 0 ? (
            <div className="text-center text-slate-400 text-xs font-semibold py-12 border border-dashed border-slate-200 rounded-2xl">
              No matching medical facilities identified within 10km. Please try choosing a different category or search parameter.
            </div>
          ) : (
            filteredSortedHospitals.map((hospital) => {
              const mapsSearchUrl = getGoogleMapsSearchUrl(hospital.lat, hospital.lng);
              const mapsDirUrl = getGoogleMapsDirUrl(hospital.lat, hospital.lng);
              const appleMapsUrl = getAppleMapsDirUrl(hospital.lat, hospital.lng);
              const osmMapsUrl = getOSMDirUrl(hospital.lat, hospital.lng);

              return (
                <div
                  key={hospital.id}
                  className={`p-5 bg-white border rounded-2xl transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:border-slate-300 shadow-xs hover:shadow-md ${
                    hospital.touristFriendly && travelModeEnabled
                      ? "border-amber-200 bg-amber-50/5 hover:border-amber-300"
                      : "border-slate-200/60"
                  }`}
                >
                  <div className="space-y-3 flex-1">
                    {/* Badge Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                        hospital.type === "Government Hospital"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : hospital.type === "Private Hospital"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : hospital.type === "Emergency / Trauma Center"
                          ? "bg-red-50 text-red-800 border-red-200 animate-pulse"
                          : hospital.type === "Pharmacy"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : hospital.type === "Blood Bank"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {hospital.type}
                      </span>

                      {hospital.isOpen24h && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] font-bold tracking-wider uppercase">
                          24/7 ER
                        </span>
                      )}

                      {hospital.hasSpecialistWing && (
                        <span className="px-2 py-0.5 rounded bg-blue-600/10 text-blue-700 border border-blue-600/20 text-[9px] font-extrabold tracking-wider uppercase">
                          Specialty Wing Match
                        </span>
                      )}

                      {hospital.touristFriendly && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[9px] font-bold tracking-wider uppercase flex items-center gap-0.5">
                          <Globe className="w-3 h-3 text-amber-600" />
                          <span>Tourist Friendly</span>
                        </span>
                      )}
                    </div>

                    {/* Name & Distance */}
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                        {hospital.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {hospital.address}
                      </p>
                    </div>

                    {/* Meta details row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 font-medium">
                      <div className="flex items-center space-x-1">
                        <Navigation className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{hospital.distance}</strong> km away</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>~<strong>{hospital.duration}</strong> mins travel time</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-slate-700 font-bold">{hospital.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Coords: <strong>{hospital.lat.toFixed(5)}</strong>, <strong>{hospital.lng.toFixed(5)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto shrink-0 justify-end pt-3 lg:pt-0 border-t border-slate-50 lg:border-0">
                    {hospital.phone !== "None declared" && (
                      <a
                        href={`tel:${hospital.phone.replace(/[^0-9+]/g, "")}`}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Call Hospital</span>
                      </a>
                    )}

                    <div className="flex flex-wrap sm:flex-nowrap gap-1.5 w-full sm:w-auto">
                      <a
                        href={appleMapsUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center"
                        title="Navigate using Apple Maps"
                      >
                        🍏 Apple Maps
                      </a>

                      <a
                        href={osmMapsUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center"
                        title="Navigate using OpenStreetMap"
                      >
                        🗺️ OSM Directions
                      </a>

                      <a
                        href={mapsDirUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                        title="Navigate using Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-white" />
                        <span>Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
