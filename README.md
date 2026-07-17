# CircuitHub: The Ultimate Electrical & Electronic Engineering (EEE) Suite

![CircuitHub Logo](public/vite.svg)

CircuitHub is an intelligent, production-grade learning hub and tool suite designed specifically for electrical and electronic engineers, circuit designers, and university scholars. Combining real-time simulation tools, AI-powered assistance, and project management workflows, CircuitHub bridges the gap between theoretical knowledge and practical application across the entire EEE curriculum.

## 🚀 Features at a Glance

*   **Context-Aware AI Assistant:** An intelligent tutor specializing in the entire EEE curriculum, from Circuit Theory and Analog Electronics to VLSI and Smart Grids.
*   **Capstone Project Workspace:** A dedicated environment to draft, manage, and export thesis chapters. Includes an AI-powered generator to help structure formal academic drafts and format them cleanly.
*   **IEEE-Formatted Report Generation:** Export your simulation results, lab assignments, and project analyses directly into standard IEEE PDF reports.
*   **Live Simulation Solvers & Calculators:** Interactive tools for op-amp configurations, 555-timer oscillators, DSP filter coefficients, RLC bandpass filters, IDMT relay coordination, and much more.
*   **Interactive Component Library:** Explore detailed datasheets, pinouts, and specifications for standard EEE components (e.g., LM358, NE5532).
*   **Firebase Integration:** Secure user authentication and durable cloud persistence (Firestore) to save your capstone drafts and personalized settings.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React (Icons), React Router
*   **Backend:** Express (Node.js), TypeScript
*   **Database & Auth:** Firebase Firestore, Firebase Authentication
*   **AI Integration:** Google Gemini API (Server-side proxy)
*   **Build Tooling:** esbuild (backend), vite (frontend)

---

## 📚 User Guide & Workflows

### 1. The EEE AI Chat Assistant
Located in the bottom right corner of the screen, the AI Assistant acts as your personal EEE tutor. 
*   **Capabilities:** Ask complex questions regarding mathematical derivations, Maxwell's equations, PID compensators, or MOSFET biasing. 
*   **Usage:** Click the floating "Sparkles" button to open the chat. The AI is instructed to return answers using clean Unicode math and provide step-by-step educational breakdowns.

### 2. EEE Suite & Calculators (Lab Sandbox)
Navigate to the "Tools" or "Lab Sandbox" section to access a categorized collection of engineering calculators aligned with standard university course codes (e.g., EEE 3203 Power Electronics, EEE 4211 Switchgear).
*   **Input parameters:** Fill in your hardware component values (Resistance, Capacitance, Voltage).
*   **Real-time output:** Verify your breadboard readings against precise theoretical outputs.

### 3. Capstone Workspace (Thesis Management)
The Capstone Workspace allows final-year students and researchers to organize their thesis documentation.
*   **Creating Chapters:** Define a chapter title, input key bullets or metrics, and set a status (Draft, Review, Final).
*   **AI Generation:** Use the "Generate Draft" feature to let the Gemini model instantly construct a highly detailed, professional academic draft based on your bullet points.
*   **Cloud Saving:** All progress is securely saved to your Firebase account, allowing you to resume work across devices.

### 4. Component Datasheet Library
Search for active and passive components. Review community comments, ratings, and detailed descriptions before wiring them into your physical labs.

---

## ⚙️ Setup and Installation

If you wish to run CircuitHub locally, follow these steps:

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A Firebase Project (Firestore + Authentication)
*   A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd circuithub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   # Server-side AI Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Client-side Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Note: CircuitHub uses a concurrent full-stack architecture. The `dev` command utilizes `tsx` to run the Express backend on port `3000`, which also proxies the Vite frontend middleware.*

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔒 Security Guidelines

*   **API Key Protection:** The Gemini API key is strictly maintained on the backend (`server.ts`). Do not expose `GEMINI_API_KEY` to the client (Vite environment variables).
*   **Firestore Rules:** The database utilizes strict Firestore security rules (`firestore.rules`) to ensure users can only modify and access their own capstone chapters and reviews.

---

## 💡 Contributing

Contributions are welcome! If you're adding new calculators or simulation tools, please adhere to the existing UI paradigms—using Tailwind CSS for styling and keeping complex mathematical logic neatly segregated in the `src/utils/simulatorMath.ts` directory.

## 📄 License

This project is licensed under the MIT License.