# Smart Student Finance Tracker

A modern, AI-powered web application designed to help students track their expenses, set financial goals, and gain insights into their financial habits.

## 🚀 Key Features

- **Dashboard & Analytics:** Interactive charts and an expense heatmap using Recharts to visualize spending patterns.
- **Transaction Management:** Easily add, edit, or delete transactions via intuitive modals.
- **Goal Setting:** Track personal financial goals and monitor your progress over time.
- **AI Financial Coach:** Integrated AI assistance powered by Groq SDK to provide smart insights and commands for managing your finances.
- **Multi-Format Exports:** Download your financial data in CSV, JSON, and PDF formats for reporting and portability.
- **Secure Authentication:** Built with Firebase for secure login and data persistence.

## 💻 Tech Stack

- **Frontend:** React 19, Tailwind CSS v4, Lucide React, Framer Motion
- **Tooling:** Vite, TypeScript
- **Backend & Database:** Firebase (Auth, Firestore)
- **AI Integration:** Groq SDK
- **Data Visualization & Exports:** Recharts, jsPDF, date-fns

## 🛠 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A Firebase project configured
- A Groq API key (for the AI Coach features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tanya-garg10/smart-student-finance-tracker.git
   ```

2. **Navigate into the project directory:**
   ```bash
   cd smart-student-finance-tracker
   ```

3. **Install dependencies:**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

4. **Environment Setup:**
   Create a `.env` file in the root directory by copying the provided example:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure your Firebase and Groq API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port specified in your terminal) to view the application in your browser.

## 📜 License

This project is licensed under the MIT License. Copyright (c) 2026.
