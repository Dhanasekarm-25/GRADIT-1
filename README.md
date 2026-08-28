# 🎓 GRADit! College ERP — Autonomous AI Chatbot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph.js-0.2-purple.svg?style=flat)](https://js.langchain.com/docs/langgraph)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20PASSED-brightgreen.svg?style=flat)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)]()

An autonomous, role-aware **AI Chatbot Assistant** developed for the **GRADit! College ERP**. The application allows authorized **Faculty** and **Admin** users to query student attendance, pending fee balances, class statistics, and generate downloadable reports in **PDF**, **Excel (XLSX)**, and **Word (DOCX)** formats via natural language.

---

## 📌 Architecture & Control Flow

```text
                               ┌─────────────────────────┐
                               │ Sticky Floating Chat UI │
                               └────────────┬────────────┘
                                            │ REST / SSE API
                                            ▼
                               ┌─────────────────────────┐
                               │   Next.js API Route     │
                               └────────────┬────────────┘
                                            │ Auth Context & Role Verification
                                            ▼
                               ┌─────────────────────────┐
                               │   LangGraph Workflow    │
                               │  (Intent & Parameter)   │
                               └────────────┬────────────┘
                                            │ Validated Parameters (Zod)
                                            ▼
                               ┌─────────────────────────┐
                               │ Role Permission & Tools │
                               │ (Attendance, Fees, etc) │
                               └────────────┬────────────┘
                                            │ Parameterized SQL Queries
                                            ▼
                               ┌─────────────────────────┐
                               │   PostgreSQL Database   │
                               └────────────┬────────────┘
                                            │ Structured Results
                               ┌────────────┴────────────┐
                               ▼                         ▼
                    ┌────────────────────┐    ┌────────────────────┐
                    │  Formatted Chat    │    │   Report Service   │
                    │      Response      │    │  (PDF/XLSX/DOCX)   │
                    └────────────────────┘    └────────────────────┘
```

> **Non-Negotiable Isolation Rule**: The chatbot is engineered as a standalone module to prevent any unintended side effects on existing ERP services during development and testing.

---

## ✨ Key Features

- **📊 Attendance Intelligence**: Query individual student attendance percentage (`23CS101`), class averages, department summaries, or filter low-attendance students below a configurable threshold (e.g., `< 75%`).
- **💳 Fee & Payment Tracking**: Fetch total fees, paid amounts, pending fee balances, and identify unpaid student lists across classes or departments.
- **📄 Multi-Format Report Generator**: Download verified database outputs directly as formatted **PDF**, **XLSX**, or **DOCX** files with structured tables.
- **🔍 Ambiguity Resolution Engine**: Automatically identifies ambiguous queries (e.g., multiple students named "Arun Kumar") and provides interactive selection chips without guessing database records.
- **🔒 Robust Role-Based Security (RBAC)**: Supports `FACULTY` and `ADMIN` authorization. **Student access is strictly blocked** at both pipeline and tool levels.
- **🤖 Configurable Local LLM**: Integrates with local **Ollama** (`http://localhost:11434`), featuring an offline fallback intent classifier for 100% test reliability without an API key.

---

## 📂 Project Structure

```text
college-erp-chatbot/
│
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── chat/route.ts       # Main AI Agent REST endpoint
│   │   └── reports/download/   # Secure report generation API
│   ├── globals.css             # Tailwind & Glassmorphism styles
│   ├── layout.tsx              # Root HTML wrapper
│   └── page.tsx                # Standalone ERP testing dashboard
│
├── components/
│   └── chat/                   # Floating Chatbot Components
│       ├── ChatButton.tsx      # Fixed floating action button
│       ├── ChatPanel.tsx       # Glassmorphism drawer panel
│       ├── MessageItem.tsx     # Message bubbles, tables & export bar
│       └── RoleSelector.tsx    # Live role switcher header
│
├── lib/
│   ├── agent/                  # AI Pipeline & Workflow
│   │   ├── graph.ts            # LangGraph controlled workflow
│   │   ├── intents.ts          # NLP intent classifier & parameter extractor
│   │   └── llm.ts              # Ollama / LLM provider configuration
│   │
│   ├── db/                     # Data Access Layer
│   │   ├── client.ts           # Parameterized DB client
│   │   ├── seedData.ts         # Test dataset (Students, Fees, Attendance)
│   │   └── types.ts            # TypeScript interfaces
│   │
│   ├── reports/                # Report Service
│   │   ├── pdf.ts              # PDFKit document generator
│   │   ├── excel.ts            # ExcelJS workbook generator
│   │   └── docx.ts             # Docx document generator
│   │
│   └── tools/                  # ERP Tools & Business Logic
│       ├── attendance.ts       # Student/Class/Dept attendance tools
│       ├── fees.ts             # Student/Pending fees tools
│       ├── students.ts         # Student lookup tools
│       └── rbac.ts             # Security & role verification
│
├── tests/
│   ├── unit/                   # Vitest unit test files
│   └── run-tests.js            # Standalone test suite runner
│
├── .env.example                # Environment variables template
├── package.json                # Project manifest
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v10.0.0` or higher
- *(Optional)* **Ollama**: For local LLM inference (`ollama run llama3.2`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/college-erp-chatbot.git
cd college-erp-chatbot

npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gradit_db
APP_ENV=development
JWT_SECRET=super-secret-gradit-test-key
```

### 3. Launch Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Click the floating chat button in the bottom-right corner to interact with the assistant.

---

## 🧪 Running Automated Tests

The standalone chatbot includes a comprehensive unit and integration test suite covering RBAC, Intent Routing, Ambiguity Resolution, Tool Logic, and Document Generation:

```bash
npm test
```

### Expected Output

```text
====================================================
GRADit! ERP AI Chatbot — Standalone Test Suite Runner
====================================================

--- 1. Security & RBAC Tests ---
  ✓ PASS: Block STUDENT access to chatbot workflow
  ✓ PASS: Authorize FACULTY and ADMIN roles

--- 2. Intent Detection & Ambiguity Tests ---
  ✓ PASS: Classify student attendance query
  ✓ PASS: Classify low attendance threshold query
  ✓ PASS: Classify pending fee query

--- 3. Attendance, Fees & Student Tools Tests ---
  ✓ PASS: Fetch student attendance (23CS101)
  ✓ PASS: Handle ambiguous student names (Arun)
  ✓ PASS: Fetch student fees (23CS101)
  ✓ PASS: Fetch pending fee list
  ✓ PASS: Find student by exact code (23CS101)

--- 4. Report Generators Tests (PDF, XLSX, DOCX) ---
  ✓ PASS: PDF Report Generator
  ✓ PASS: Excel XLSX Report Generator
  ✓ PASS: DOCX Report Generator

====================================================
RESULTS: 13 PASSED | 0 FAILED
====================================================
```

---

## 🛠️ API Reference

### 1. Chat Interaction Endpoint

**`POST /api/chat`**

#### Request Body
```json
{
  "message": "Show attendance of 23CS101",
  "role": "FACULTY",
  "userId": "usr-1"
}
```

#### Response
```json
{
  "type": "TEXT",
  "content": "Attendance for Rohan Sharma (23CS101): 82% (41/50 classes attended).",
  "tableData": {
    "columns": ["Student Name", "Student Code", "Class", "Department", "Attended / Total", "Percentage"],
    "rows": [["Rohan Sharma", "23CS101", "23CS101", "CSE", "41 / 50", "82%"]]
  },
  "reportMetadata": {
    "title": "Attendance Record — Rohan Sharma (23CS101)",
    "generatedBy": "FACULTY",
    "generatedAt": "8/28/2026",
    "columns": ["Student Name", "Student Code", "Class", "Department", "Attended / Total", "Percentage"],
    "rows": [["Rohan Sharma", "23CS101", "23CS101", "CSE", "41 / 50", "82%"]]
  }
}
```

---

### 2. Download Report Endpoint

**`POST /api/reports/download`**

#### Request Body
```json
{
  "format": "pdf", // "pdf" | "xlsx" | "docx"
  "role": "FACULTY",
  "reportData": {
    "title": "Pending Fees Report",
    "columns": ["Student Name", "Code", "Pending Fee"],
    "rows": [["Arun Kumar", "23EC205", "₹85,000"]]
  }
}
```

#### Response
Binary stream with `Content-Type` header (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) and `Content-Disposition: attachment`.

---

## 🔗 ERP Target Integration Guide

When ready to integrate into the main GRADit! ERP application:

1. Copy the `components/chat/` directory into your ERP project's UI folder.
2. Copy `lib/agent/`, `lib/tools/`, and `lib/reports/` into your ERP backend library directory.
3. Replace `lib/db/client.ts` data queries with your ERP PostgreSQL database connection pool.
4. Mount `<ChatButton />` and `<ChatPanel />` globally inside your root layout:

```tsx
// app/layout.tsx (Main ERP Layout)
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <html>
      <body>
        <Sidebar />
        <Header />
        <main>{children}</main>
        
        {/* Mount Sticky Chatbot */}
        <ChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </body>
    </html>
  );
}
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
