import React, { useState, useEffect } from "react";
import { Activity, User, Save, Edit2, ShieldCheck, Mail, HeartPulse, Sparkles, Phone, Lock } from "lucide-react";
import { User as UserType } from "../types";
import { Button } from "./ui/Button";
import { Input, TextArea } from "./ui/Input";

interface ProfileViewProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<Omit<UserType, "id" | "email">>) => Promise<void>;
}

export default function ProfileView({ user, onUpdateProfile }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Complete field mapping
  const [fullName, setFullName] = useState(user.fullName || "");
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || "O-Positive");
  const [allergies, setAllergies] = useState(user.allergies || "");
  const [medications, setMedications] = useState(user.medications || "");
  const [medicalHistory, setMedicalHistory] = useState(user.medicalHistory || "");
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

  useEffect(() => {
    setFullName(user.fullName || "");
    setAge(user.age || "");
    setGender(user.gender || "Male");
    setBloodGroup(user.bloodGroup || "O-Positive");
    setAllergies(user.allergies || "");
    setMedications(user.medications || "");
    setMedicalHistory(user.medicalHistory || "");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameTrimmed = fullName.trim();
    if (!nameTrimmed) {
      setError("Name is required.");
      return;
    }

    // Validate Age
    const ageTrimmed = age.trim();
    const ageNum = parseInt(ageTrimmed, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 125) {
      setError("Please enter a valid age between 1 and 125.");
      return;
    }

    // Validate Phone if provided
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed) {
      const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
      if (!phoneRegex.test(phoneTrimmed) || phoneTrimmed.replace(/\D/g, "").length < 7) {
        setError("Please enter a valid telephone number (at least 7 digits).");
        return;
      }
    }

    // Validate DOB if provided
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      if (dobDate > today) {
        setError("Date of Birth cannot be in the future.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Keep emergencyContacts field filled and synchronized
      const compiledEmergencyContacts = primaryContact.trim()
        ? `${primaryContact.trim()} (${relationship.trim() || "Contact"}) - ${phoneTrimmed}${secondaryContact.trim() ? `, Sec: ${secondaryContact.trim()}` : ""}`
        : (user.emergencyContacts || "None declared");

      await onUpdateProfile({
        fullName: nameTrimmed,
        age: ageNum.toString(),
        gender,
        bloodGroup,
        allergies,
        medications,
        medicalHistory,
        dob,
        height,
        weight,
        chronicDiseases,
        surgeries,
        primaryContact,
        secondaryContact,
        relationship,
        phone: phoneTrimmed,
        insuranceDetails,
        primaryDoctor,
        preferredHospital,
        emergencyContacts: compiledEmergencyContacts,
      });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="profile-view-container">
      {/* Title */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Health Profile</h1>
        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">
          Manage your physiological metrics, medications, and contact protocols
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-200/60 p-6 text-center space-y-4 shadow-xs">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
              {fullName
                ? fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "U"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{user.email}</p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Demo Profile Verified</span>
              </span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100/60 rounded-[28px] p-5 space-y-2">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Why we use this data</h4>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              We leverage your declared age, biological sex, and clinical history as criteria when assessing symptom severities. This generates higher fidelity self-care recommendations customized for you.
            </p>
          </div>
        </div>

        {/* Right Side: Form details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-100/40">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Notifications */}
              {error && (
                <div role="alert" className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold animate-fade-in">
                  {error}
                </div>
              )}

              {/* Action buttons on top */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-md font-bold text-slate-900 uppercase text-xs tracking-wider">Profile Information</h3>
                {!editing ? (
                  <Button
                    id="edit-profile-btn"
                    type="button"
                    onClick={() => setEditing(true)}
                    variant="secondary"
                    className="py-2 text-xs font-bold"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit Profile Details
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      id="cancel-edit-btn"
                      type="button"
                      variant="ghost"
                      className="py-2 text-xs font-bold"
                      onClick={() => {
                        setEditing(false);
                        setFullName(user.fullName || "");
                        setAge(user.age || "");
                        setGender(user.gender || "Male");
                        setBloodGroup(user.bloodGroup || "O-Positive");
                        setAllergies(user.allergies || "");
                        setMedications(user.medications || "");
                        setMedicalHistory(user.medicalHistory || "");
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
                        setError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      id="save-profile-btn"
                      type="submit"
                      isLoading={loading}
                      className="py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="space-y-6">
                
                {/* 1. PERSONAL */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    1. Personal & Physical specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="profile-name-input"
                      required
                      label="Full Name"
                      disabled={!editing}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                      id="profile-dob-input"
                      label="Date of Birth"
                      type="date"
                      disabled={!editing}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Biological Sex</label>
                      <select
                        id="profile-gender-input"
                        disabled={!editing}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 disabled:opacity-75 disabled:bg-slate-50/50"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
                      <select
                        id="profile-blood-input"
                        disabled={!editing}
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 disabled:opacity-75 disabled:bg-slate-50/50"
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
                      id="profile-height-input"
                      label="Height"
                      placeholder="e.g. 180 cm"
                      disabled={!editing}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />

                    <Input
                      id="profile-weight-input"
                      label="Weight"
                      placeholder="e.g. 75 kg"
                      disabled={!editing}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. CLINICAL */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    2. Medical Profile specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextArea
                      id="profile-allergies-input"
                      label="Allergies"
                      disabled={!editing}
                      placeholder="None declared"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      rows={2}
                    />
                    <TextArea
                      id="profile-medications-input"
                      label="Current Medications"
                      disabled={!editing}
                      placeholder="None declared"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextArea
                      id="profile-chronic-input"
                      label="Chronic Illnesses & Diseases"
                      disabled={!editing}
                      placeholder="None declared"
                      value={chronicDiseases}
                      onChange={(e) => setChronicDiseases(e.target.value)}
                      rows={2}
                    />
                    <TextArea
                      id="profile-surgeries-input"
                      label="Previous Surgeries"
                      disabled={!editing}
                      placeholder="None declared"
                      value={surgeries}
                      onChange={(e) => setSurgeries(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <TextArea
                    id="profile-history-input"
                    label="Additional Medical History & Chronic Illness Context"
                    disabled={!editing}
                    placeholder="Provide details about prior medical history"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* 3. CONTACTS */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    3. First-Responder Emergency Contacts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="profile-primary-contact"
                      label="Primary Contact Name"
                      disabled={!editing}
                      value={primaryContact}
                      onChange={(e) => setPrimaryContact(e.target.value)}
                    />
                    <Input
                      id="profile-secondary-contact"
                      label="Secondary Contact Name"
                      disabled={!editing}
                      value={secondaryContact}
                      onChange={(e) => setSecondaryContact(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="profile-relationship"
                      label="Relationship to Patient"
                      disabled={!editing}
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    />
                    <Input
                      id="profile-phone"
                      label="Phone Number"
                      disabled={!editing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. HEALTH INFRASTRUCTURE */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    4. Healthcare Infrastructure & Insurance
                  </h4>
                  <Input
                    id="profile-insurance"
                    label="Insurance Details"
                    disabled={!editing}
                    value={insuranceDetails}
                    onChange={(e) => setInsuranceDetails(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="profile-doctor"
                      label="Primary Care Doctor"
                      disabled={!editing}
                      value={primaryDoctor}
                      onChange={(e) => setPrimaryDoctor(e.target.value)}
                    />
                    <Input
                      id="profile-hospital"
                      label="Preferred Clinic / Hospital"
                      disabled={!editing}
                      value={preferredHospital}
                      onChange={(e) => setPreferredHospital(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
