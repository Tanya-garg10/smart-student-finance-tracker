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
   \`\`\`bash
   git clone https://github.com/Tanya-garg10/smart-student-finance-tracker.git
   cd smart-student-finance-tracker
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup:**
   Copy the example environment file:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Fill in your configuration details:
   - Firebase config keys
   - \`VITE_GROQ_API_KEY\` (Your Groq API key)

4. **Run the Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`

## 📜 License

This project is licensed under the MIT License. Copyright (c) 2026.
