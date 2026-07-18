export interface User {
  id: string;
  email: string;
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
}
