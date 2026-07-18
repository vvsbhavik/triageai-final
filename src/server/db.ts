import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  password?: string; // stored simply for mockup demo auth fallback
  fullName: string;
  age: string;
  gender: string;
  medicalHistory: string;
  bloodGroup?: string;
  allergies?: string;
  medications?: string;
  emergencyContacts?: string;
  travelModeEnabled?: boolean;
  // Emergency Profile Extra Fields
  dob?: string;
  height?: string;
  weight?: string;
  chronicDiseases?: string;
  surgeries?: string;
  primaryContact?: string;
  secondaryContact?: string;
  relationship?: string;
  phone?: string;
  insuranceDetails?: string;
  primaryDoctor?: string;
  preferredHospital?: string;
  preferredLanguage?: string;
}

export interface Assessment {
  id: string;
  userId: string;
  timestamp: string;
  symptoms: string;
  possibleCondition: string;
  severityLevel: "Low" | "Medium" | "High" | "Critical";
  recommendedSpecialist: string;
  firstAidGuidance: string[];
  disclaimer: string;
  doctorSummary: string;
  // Extra fields requested
  confidenceScore?: string;
  warningSigns?: string[];
  homeCareAdvice?: string;
  emergencyRecommendation?: string;
}

interface DatabaseSchema {
  users: Record<string, User>;
  assessments: Assessment[];
}

const DB_FILE = path.join(process.cwd(), "db_storage.json");

let memoryDb: DatabaseSchema = {
  users: {},
  assessments: [],
};

// Seed some initial data for visual demo of Dashboard history
const SEED_USER_ID = "demo-user-id";
const SEED_USER_EMAIL = "bhavikvanapalli06@gmail.com";

// Initialize Supabase Client if configured
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL") {
  console.log("Supabase URL and Anon Key detected. Initializing Supabase client.");
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase environment variables are missing. TriageAI will run with local offline-first fallback.");
}

function handleSupabaseError(context: string, error: any) {
  console.warn(`[Supabase Info - ${context}]:`, error);
  if (error && (error.code === "42P01" || (error.message && error.message.toLowerCase().includes("relation")))) {
    console.warn(
      `⚠️  SETUP NOTICE: The database table targeted by '${context}' does not exist in your Supabase project yet.\n` +
      `👉 ACTION REQUIRED: To fix this, please open your Supabase Dashboard SQL Editor and execute the SQL statements in the 'supabase_schema.sql' file at the root of this project.\n` +
      `💡 Note: TriageAI is fully operational in offline fallback mode using local 'db_storage.json' cache, so you can continue testing/using the application while your cloud database is being configured.`
    );
  }
}

// Map helpers between JS camelCase and DB snake_case
function toDbProfile(user: User) {
  return {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    full_name: user.fullName,
    age: String(user.age),
    gender: user.gender,
    medical_history: user.medicalHistory,
    blood_group: user.bloodGroup || "Not Specified",
    allergies: user.allergies || "None declared",
    medications: user.medications || "None declared",
    emergency_contacts: user.emergencyContacts || "None declared",
    travel_mode_enabled: user.travelModeEnabled || false,
    dob: user.dob || "",
    height: user.height || "",
    weight: user.weight || "",
    chronic_diseases: user.chronicDiseases || "",
    surgeries: user.surgeries || "",
    primary_contact: user.primaryContact || "",
    secondary_contact: user.secondaryContact || "",
    relationship: user.relationship || "",
    phone: user.phone || "",
    insurance_details: user.insuranceDetails || "",
    primary_doctor: user.primaryDoctor || "",
    preferred_hospital: user.preferredHospital || "",
    preferred_language: user.preferredLanguage || "English",
  };
}

function fromDbProfile(row: any): User | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.fullName,
    age: String(row.age),
    gender: row.gender,
    medicalHistory: row.medical_history || row.medicalHistory,
    bloodGroup: row.blood_group || row.bloodGroup,
    allergies: row.allergies,
    medications: row.medications,
    emergencyContacts: row.emergency_contacts || row.emergencyContacts,
    travelModeEnabled: row.travel_mode_enabled !== undefined ? row.travel_mode_enabled : row.travelModeEnabled,
    dob: row.dob,
    height: row.height,
    weight: row.weight,
    chronicDiseases: row.chronic_diseases || row.chronicDiseases,
    surgeries: row.surgeries,
    primaryContact: row.primary_contact || row.primaryContact,
    secondaryContact: row.secondary_contact || row.secondaryContact,
    relationship: row.relationship,
    phone: row.phone,
    insuranceDetails: row.insurance_details || row.insuranceDetails,
    primaryDoctor: row.primary_doctor || row.primaryDoctor,
    preferredHospital: row.preferred_hospital || row.preferredHospital,
    preferredLanguage: row.preferred_language || row.preferredLanguage || "English",
  };
}

function toDbAssessment(a: Assessment) {
  return {
    id: a.id,
    user_id: a.userId,
    timestamp: a.timestamp,
    symptoms: a.symptoms,
    possible_condition: a.possibleCondition,
    severity_level: a.severityLevel,
    recommended_specialist: a.recommendedSpecialist,
    first_aid_guidance: a.firstAidGuidance,
    disclaimer: a.disclaimer,
    doctor_summary: a.doctorSummary,
    confidence_score: a.confidenceScore || "N/A",
    warning_signs: a.warningSigns || [],
    home_care_advice: a.homeCareAdvice || "",
    emergency_recommendation: a.emergencyRecommendation || "",
  };
}

function fromDbAssessment(row: any): Assessment | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    timestamp: row.timestamp,
    symptoms: row.symptoms,
    possibleCondition: row.possible_condition || row.possibleCondition,
    severityLevel: row.severity_level || row.severityLevel,
    recommendedSpecialist: row.recommended_specialist || row.recommendedSpecialist,
    firstAidGuidance: Array.isArray(row.first_aid_guidance) ? row.first_aid_guidance : row.firstAidGuidance || [],
    disclaimer: row.disclaimer,
    doctorSummary: row.doctor_summary || row.doctorSummary,
    confidenceScore: row.confidence_score || row.confidenceScore || "N/A",
    warningSigns: Array.isArray(row.warning_signs) ? row.warning_signs : row.warningSigns || [],
    homeCareAdvice: row.home_care_advice || row.homeCareAdvice || "",
    emergencyRecommendation: row.emergency_recommendation || row.emergencyRecommendation || "",
  };
}

export function initDb() {
  // Populate local seed user in memory
  memoryDb.users[SEED_USER_EMAIL] = {
    id: SEED_USER_ID,
    email: SEED_USER_EMAIL,
    fullName: "Bhavik Vanapalli",
    age: "28",
    gender: "Male",
    medicalHistory: "Mild seasonal allergies, no prior major surgeries.",
    bloodGroup: "O-Positive",
    allergies: "Peanuts, Penicillin",
    medications: "Claritin 10mg daily",
    emergencyContacts: "Priya Vanapalli (Spouse) - +91 98765 43210",
    travelModeEnabled: false,
    dob: "1998-05-14",
    height: "180 cm",
    weight: "75 kg",
    chronicDiseases: "Mild seasonal asthma",
    surgeries: "Appendectomy (2018)",
    primaryContact: "Priya Vanapalli",
    secondaryContact: "Anand Vanapalli",
    relationship: "Spouse",
    phone: "+91 98765 43210",
    insuranceDetails: "LIC Star Health Insurance - Policy #IN-8843219",
    primaryDoctor: "Dr. Amit Sharma, MD (Cardiologist)",
    preferredHospital: "Apollo Hospitals, New Delhi",
  };

  memoryDb.assessments = [
    {
      id: "assess-1",
      userId: SEED_USER_ID,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      symptoms: "Mild headache, nasal congestion, and low-grade fever for 2 days.",
      possibleCondition: "Common Cold / Seasonal Viral Infection",
      severityLevel: "Low",
      recommendedSpecialist: "General Practitioner / Family Physician",
      firstAidGuidance: [
        "Stay hydrated by drinking warm fluids (water, herbal teas).",
        "Get plenty of bed rest to allow your immune system to recover.",
        "Consider over-the-counter saline nasal sprays for congestion.",
        "Monitor temperature; you may take paracetamol if you develop discomfort, adhering strictly to package directions."
      ],
      disclaimer: "This assessment is powered by AI and is for educational guidance only. It is not a substitute for professional medical diagnosis or treatment.",
      doctorSummary: "Patient presents with classic upper respiratory symptoms. Likely a self-limiting viral coryza. Rest, hydration, and symptomatic care advised. Follow up if symptoms worsen or persist past 10 days.",
      confidenceScore: "92%",
      warningSigns: ["Fever spikes above 103°F", "Difficulty breathing", "Chest pressure"],
      homeCareAdvice: "Rest and maintain optimal room humidity. Hydrate continuously.",
      emergencyRecommendation: "Monitor vitals. Consult GP if fever persists beyond 5 days."
    }
  ];

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.assessments) {
        memoryDb = parsed;
        // Make sure seed user is always present
        if (!memoryDb.users[SEED_USER_EMAIL]) {
          memoryDb.users[SEED_USER_EMAIL] = {
            id: SEED_USER_ID,
            email: SEED_USER_EMAIL,
            fullName: "Bhavik Vanapalli",
            age: "28",
            gender: "Male",
            medicalHistory: "Mild seasonal allergies, no prior major surgeries.",
            bloodGroup: "O-Positive",
            allergies: "Peanuts, Penicillin",
            medications: "Claritin 10mg daily",
            emergencyContacts: "Priya Vanapalli (Spouse) - +91 98765 43210",
            travelModeEnabled: false,
            dob: "1998-05-14",
            height: "180 cm",
            weight: "75 kg",
            chronicDiseases: "Mild seasonal asthma",
            surgeries: "Appendectomy (2018)",
            primaryContact: "Priya Vanapalli",
            secondaryContact: "Anand Vanapalli",
            relationship: "Spouse",
            phone: "+91 98765 43210",
            insuranceDetails: "LIC Star Health Insurance - Policy #IN-8843219",
            primaryDoctor: "Dr. Amit Sharma, MD (Cardiologist)",
            preferredHospital: "Apollo Hospitals, New Delhi",
          };
        }
      }
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Error reading database file, using memory storage:", err);
  }
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

export const db = {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const normEmail = email.toLowerCase().trim();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", normEmail)
          .maybeSingle();

        if (error) {
          handleSupabaseError("fetching user by email", error);
        } else if (data) {
          const user = fromDbProfile(data);
          if (user) {
            // Keep local memory synced
            memoryDb.users[normEmail] = user;
            saveDb();
            return user;
          }
        }
      } catch (err) {
        console.warn("Exception fetching user from Supabase by email, falling back:", err);
      }
    }
    return memoryDb.users[normEmail];
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          handleSupabaseError("fetching user by ID", error);
        } else if (data) {
          const user = fromDbProfile(data);
          if (user) {
            // Keep local memory synced
            memoryDb.users[user.email.toLowerCase().trim()] = user;
            saveDb();
            return user;
          }
        }
      } catch (err) {
        console.warn("Exception fetching user from Supabase by ID, falling back:", err);
      }
    }
    return Object.values(memoryDb.users).find((u) => u.id === id);
  },

  async createUser(user: Omit<User, "id">): Promise<User> {
    const id = "user-" + Math.random().toString(36).substr(2, 9);
    const newUser: User = { ...user, id, email: user.email.toLowerCase().trim() };
    
    // Sync to memory
    memoryDb.users[newUser.email] = newUser;
    saveDb();

    if (supabase) {
      try {
        const dbProfile = toDbProfile(newUser);
        const { error } = await supabase.from("profiles").insert([dbProfile]);
        if (error) {
          handleSupabaseError("inserting profile", error);
        }

        // Mirror insert to secondary emergency_profiles table for completeness
        const { error: err2 } = await supabase.from("emergency_profiles").insert([{
          id: "ep-" + Math.random().toString(36).substr(2, 9),
          user_id: newUser.id,
          blood_group: newUser.bloodGroup || "Not Specified",
          allergies: newUser.allergies || "None declared",
          medications: newUser.medications || "None declared",
          dob: newUser.dob || "",
          height: newUser.height || "",
          weight: newUser.weight || "",
          chronic_diseases: newUser.chronicDiseases || "",
          surgeries: newUser.surgeries || "",
          primary_contact: newUser.primaryContact || "",
          secondary_contact: newUser.secondaryContact || "",
          relationship: newUser.relationship || "",
          phone: newUser.phone || "",
          insurance_details: newUser.insuranceDetails || "",
          primary_doctor: newUser.primaryDoctor || "",
          preferred_hospital: newUser.preferredHospital || "",
        }]);
        if (err2) {
          handleSupabaseError("inserting emergency_profile record", err2);
        }
      } catch (err) {
        console.warn("Exception syncing user insertion to Supabase:", err);
      }
    }

    return newUser;
  },

  async updateUser(id: string, updates: Partial<Omit<User, "id" | "email" | "password">>): Promise<User | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    memoryDb.users[user.email.toLowerCase().trim()] = updatedUser;
    saveDb();

    if (supabase) {
      try {
        const dbProfile = toDbProfile(updatedUser);
        const { error } = await supabase
          .from("profiles")
          .update(dbProfile)
          .eq("id", id);
        
        if (error) {
          handleSupabaseError("updating profile", error);
        }

        // Upsert/Update the secondary emergency_profiles record for total consistency
        const { data: epCheck } = await supabase.from("emergency_profiles").select("id").eq("user_id", id).maybeSingle();
        if (epCheck) {
          await supabase.from("emergency_profiles").update({
            blood_group: updatedUser.bloodGroup || "Not Specified",
            allergies: updatedUser.allergies || "None declared",
            medications: updatedUser.medications || "None declared",
            dob: updatedUser.dob || "",
            height: updatedUser.height || "",
            weight: updatedUser.weight || "",
            chronic_diseases: updatedUser.chronicDiseases || "",
            surgeries: updatedUser.surgeries || "",
            primary_contact: updatedUser.primaryContact || "",
            secondary_contact: updatedUser.secondaryContact || "",
            relationship: updatedUser.relationship || "",
            phone: updatedUser.phone || "",
            insurance_details: updatedUser.insuranceDetails || "",
            primary_doctor: updatedUser.primaryDoctor || "",
            preferred_hospital: updatedUser.preferredHospital || "",
          }).eq("user_id", id);
        } else {
          await supabase.from("emergency_profiles").insert([{
            id: "ep-" + Math.random().toString(36).substr(2, 9),
            user_id: id,
            blood_group: updatedUser.bloodGroup || "Not Specified",
            allergies: updatedUser.allergies || "None declared",
            medications: updatedUser.medications || "None declared",
            dob: updatedUser.dob || "",
            height: updatedUser.height || "",
            weight: updatedUser.weight || "",
            chronic_diseases: updatedUser.chronicDiseases || "",
            surgeries: updatedUser.surgeries || "",
            primary_contact: updatedUser.primaryContact || "",
            secondary_contact: updatedUser.secondaryContact || "",
            relationship: updatedUser.relationship || "",
            phone: updatedUser.phone || "",
            insurance_details: updatedUser.insuranceDetails || "",
            primary_doctor: updatedUser.primaryDoctor || "",
            preferred_hospital: updatedUser.preferredHospital || "",
          }]);
        }
      } catch (err) {
        console.warn("Exception syncing user updates to Supabase:", err);
      }
    }

    return updatedUser;
  },

  async getAssessmentsByUserId(userId: string): Promise<Assessment[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false });

        if (error) {
          handleSupabaseError("fetching assessments", error);
        } else if (data) {
          const list = data.map(fromDbAssessment).filter(Boolean) as Assessment[];
          // Synced local database representation
          memoryDb.assessments = memoryDb.assessments.filter((a) => a.userId !== userId).concat(list);
          saveDb();
          return list;
        }
      } catch (err) {
        console.warn("Exception querying assessments from Supabase, falling back:", err);
      }
    }

    return memoryDb.assessments
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createAssessment(assessment: Omit<Assessment, "id" | "timestamp">): Promise<Assessment> {
    const id = "assess-" + Math.random().toString(36).substr(2, 9);
    const newAssessment: Assessment = {
      ...assessment,
      id,
      timestamp: new Date().toISOString(),
    };

    // Save to local cache
    memoryDb.assessments.push(newAssessment);
    saveDb();

    if (supabase) {
      try {
        const dbAssess = toDbAssessment(newAssessment);
        const { error } = await supabase.from("assessments").insert([dbAssess]);
        if (error) {
          handleSupabaseError("inserting assessment", error);
        }

        // Mirror insertion to assessment_history as requested for consistency
        const { error: errHist } = await supabase.from("assessment_history").insert([{
          id: "hist-" + Math.random().toString(36).substr(2, 9),
          assessment_id: newAssessment.id,
          user_id: newAssessment.userId,
          timestamp: newAssessment.timestamp,
          symptoms: newAssessment.symptoms,
          possible_condition: newAssessment.possibleCondition,
          severity_level: newAssessment.severityLevel,
          recommended_specialist: newAssessment.recommendedSpecialist,
        }]);
        if (errHist) {
          handleSupabaseError("syncing to assessment_history", errHist);
        }
      } catch (err) {
        console.warn("Exception syncing assessment to Supabase:", err);
      }
    }

    return newAssessment;
  },

  async deleteAssessment(id: string, userId: string): Promise<boolean> {
    const initialLen = memoryDb.assessments.length;
    memoryDb.assessments = memoryDb.assessments.filter((a) => !(a.id === id && a.userId === userId));
    const deleted = memoryDb.assessments.length < initialLen;
    if (deleted) {
      saveDb();
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from("assessments")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        
        if (error) {
          handleSupabaseError("deleting assessment", error);
        }
      } catch (err) {
        console.warn("Exception syncing assessment deletion to Supabase:", err);
      }
    }

    return deleted;
  }
};
