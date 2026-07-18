# TriageAI - AI-Powered Emergency Medical Symptom Triage & Guidance Platform

TriageAI is a secure, stable, and highly performant full-stack healthcare triage and decision-guidance platform. Built for senior software engineers, first responders, and emergency clinical operations, TriageAI leverages advanced large language models (LLMs) with multi-tier, zero-downtime redundancy systems to evaluate patient symptoms, calculate severity scores, suggest immediate first-aid, map local medical centers, and generate emergency response QR codes.

---

## 🚀 Key Production Capabilities

1. **Dual AI Diagnostic Engine & Fallbacks**: Integrated with **OpenAI GPT-4o-mini** as the primary structured triage analyzer. If OpenAI is unavailable, it automatically rolls back to **Gemini 3.5 Flash**, and finally defaults to a **Local Clinical Heuristic Simulator** if network access is completely cut off.
2. **Durable Persistence & Local Cache**: Seamlessly integrates with **Supabase (PostgreSQL)** for secure storage of user medical histories and assessment logs. It features a local file-based and memory-cached database fallback if Supabase is offline.
3. **Medical Facility Locator**: Identifies nearby emergency departments and clinics. Searches **Google Places API (New)**, falls back dynamically to keyless **OpenStreetMap Overpass API**, and keeps a final pre-compiled emergency facility list as an offline safeguard.
4. **Emergency Profile & QR Code System**: Generates secure medical ID QR codes. Emergency personnel can scan the QR code to instantly view a safe, read-only emergency medical record (allergies, medications, blood group, contacts) without needing a password.
5. **Validated Forms**: Enforces strict verification of clinical fields (age, emails, telephone formats, blood types, emergency contact structures).
6. **Robust Visual System**: Built using React 19, Tailwind CSS, Motion animations, and beautiful premium skeleton loaders for real-time querying states.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS, Motion (Animations)
- **Backend**: Node.js, Express, TypeScript (`tsx` in development, compiled to Standalone CommonJS for production)
- **AI Integrations**: `@google/genai` (Gemini SDK), `openai` (GPT SDK)
- **Database**: Supabase client (`@supabase/supabase-js`), local backup JSON database (`db_storage.json`)
- **Compilation Toolchain**: `esbuild` (bundling server into `dist/server.cjs`), `tsc` (TypeScript type verification)

---

## 📋 Environment Variables

To run TriageAI in production, create a `.env` file in your root folder based on the variables declared in `.env.example`:

```env
# ====================================================================
# TRIAGEAI REQUIRED ENVIRONMENT VARIABLES
# ====================================================================

# 1. AI API KEYS
# OPENAI_API_KEY: Primary AI clinical triage engine (GPT-4o-mini)
OPENAI_API_KEY="your_openai_api_key_here"

# GEMINI_API_KEY: Secondary AI backup model (Gemini 3.5 Flash)
GEMINI_API_KEY="your_gemini_api_key_here"


# 2. SUPABASE CONNECTIVITY (Optional - Falls back to local json storage gracefully)
# SUPABASE_URL: Endpoint of your Supabase project (e.g., https://xxxxxx.supabase.co)
SUPABASE_URL="your_supabase_url_here"

# SUPABASE_ANON_KEY: Public anonymous API key
SUPABASE_ANON_KEY="your_supabase_anon_key_here"


# 3. LOCATION & MAPPING API (Optional - Falls back to keyless Overpass OSM API and local cache)
# GOOGLE_MAPS_API_KEY: Powers backend Google Places API nearby search
GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"


# 4. APPLET SPECIFICATIONS
# APP_URL: Base URL of the hosted application (used to generate emergency QR code links)
APP_URL="https://triage-ai.example.com"
```

---

## 💻 Local Development

### 1. Installation
Install all dependencies using npm:
```bash
npm install
```

### 2. Run the Development Server
This boots up the Vite-Express full-stack container on [http://localhost:3000](http://localhost:3000):
```bash
npm run dev
```

### 3. Verify TypeScript and Code Style
Verify that the codebase has no syntax errors, missing imports, or type problems:
```bash
npm run lint
```

---

## 🏗️ Production Build and Deployment

### 1. Build Phase
Compile the React front-end application and bundle the backend TypeScript server using:
```bash
npm run build
```
This script executes:
1. `vite build`: Compiles and bundles static files into the `dist/` directory.
2. `esbuild server.ts`: Bundles the Express backend server into a single, highly-optimized CommonJS file located at `dist/server.cjs` (resolving relative ESM path issues for Node).

### 2. Run in Production Mode
Start the bundled production application:
```bash
npm run start
```
The server will boot and serve the client assets statically alongside the backend API endpoints on port `3000`.

---

## ☁️ Deployment Steps

### Option A: Deployment on Vercel (Frontend + Serverless)
TriageAI is pre-configured with a Vercel-native serverless architecture.
1. **Zero Configuration**: Simply import your repository into your Vercel Dashboard.
2. **Environment Setup**: Add your required environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_MAPS_API_KEY`, and `APP_URL`) in the Project Settings -> Environment Variables.
3. **Automatic Routing**: Vercel will automatically compile the Vite frontend to static pages, and mount the `/api/*` serverless functions located in the `/api` directory according to the included `vercel.json` configuration file. No additional settings or adapters are needed!

### Option B: Deploying on Google Cloud Run, Render, or Railway (Recommended)
Because TriageAI is structured as a robust, single-port full-stack Node.js server, standard container-based hosts are highly recommended:
1. **Render / Railway**: 
   - Create a new Web Service.
   - Set **Build Command** to: `npm run build`
   - Set **Start Command** to: `npm run start`
   - Bind to port `3000`.
   - Add your environment variables in the dashboard dashboard.
2. **Docker / Cloud Run**:
   - The app runs behind standard ingress port `3000`. Build a lightweight Node container and deploy.

---

## 🔒 Security & Data Compliance
- **Zero Exposed Client Secrets**: All API requests involving LLMs (OpenAI, Gemini), mapping coordinates, or Supabase connection requests are proxied securely through the `/api/*` backend routes. API keys never touch the user's browser.
- **First Responder Portal Privacy**: The public emergency ID QR codes point strictly to a sanitized, read-only dashboard. No user passwords or core assessment details are retrievable from this portal unless authorized.
- **Input Sanitization & Overload Prevention**: Forms validate strict boundaries for user input. Backends feature timeout controls on AI endpoints to prevent server-side event blocking.
