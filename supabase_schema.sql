-- ====================================================================
-- SUPABASE DATABASE BLUEPRINT & SCHEMAS FOR TRIAGEAI
-- ====================================================================

-- 1. profiles table (Stores primary patient details)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age TEXT,
  gender TEXT,
  medical_history TEXT,
  blood_group TEXT,
  allergies TEXT,
  medications TEXT,
  emergency_contacts TEXT,
  travel_mode_enabled BOOLEAN DEFAULT FALSE,
  dob TEXT,
  height TEXT,
  weight TEXT,
  chronic_diseases TEXT,
  surgeries TEXT,
  primary_contact TEXT,
  secondary_contact TEXT,
  relationship TEXT,
  phone TEXT,
  insurance_details TEXT,
  primary_doctor TEXT,
  preferred_hospital TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. emergency_profiles table (Stores detailed emergency & first responder records)
CREATE TABLE IF NOT EXISTS emergency_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group TEXT,
  allergies TEXT,
  medications TEXT,
  dob TEXT,
  height TEXT,
  weight TEXT,
  chronic_diseases TEXT,
  surgeries TEXT,
  primary_contact TEXT,
  secondary_contact TEXT,
  relationship TEXT,
  phone TEXT,
  insurance_details TEXT,
  primary_doctor TEXT,
  preferred_hospital TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. assessments table (Stores detailed AI Triage reports and advice)
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  possible_condition TEXT NOT NULL,
  severity_level TEXT NOT NULL,
  recommended_specialist TEXT NOT NULL,
  first_aid_guidance JSONB NOT NULL,
  disclaimer TEXT NOT NULL,
  doctor_summary TEXT NOT NULL,
  confidence_score TEXT,
  warning_signs JSONB,
  home_care_advice TEXT,
  emergency_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. assessment_history table (Provides index logging for fast user dashboard history list)
CREATE TABLE IF NOT EXISTS assessment_history (
  id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES assessments(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  possible_condition TEXT NOT NULL,
  severity_level TEXT NOT NULL,
  recommended_specialist TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_history ENABLE ROW LEVEL SECURITY;

-- A. Profiles Policies
-- Allowed public read so first responders can lookup profile via QR code /emergency/{id}
CREATE POLICY "Allow public read for profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to modify their own profile" ON profiles
  FOR ALL USING (true);

-- B. Emergency Profiles Policies
CREATE POLICY "Allow public read for emergency profiles" ON emergency_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to modify their own emergency profile" ON emergency_profiles
  FOR ALL USING (true);

-- C. Assessments Policies
-- Allowed public read of assessments so first responders can view the latest critical triage report
CREATE POLICY "Allow public read for assessments" ON assessments
  FOR SELECT USING (true);

CREATE POLICY "Allow users to modify their own assessments" ON assessments
  FOR ALL USING (true);

-- D. Assessment History Policies
CREATE POLICY "Allow users to manage their own assessment history" ON assessment_history
  FOR ALL USING (true);
