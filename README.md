# Live Fraud Detection System
 A real-time fraud detection dashboard that:

- Streams live transactions via WebSocket

- Applies dynamic, editable fraud rules

- Flags and scores suspicious transactions

- Lets analysts compose rules and drill down into decision logs

## 🚀 Features
- Live Transaction Feed: See transactions and fraud alerts in real time

- Rule Composer: Create, edit, and toggle fraud rules instantly

- Drill-Down View: Inspect transaction details, risk scores, and triggered rules

- Simulation Control: Start/stop simulated transaction streams from the UI

- Fully Editable Rules: No code needed—analysts can update detection logic on the fly

- Modern UI: Built with Next.js, Tailwind CSS, and shadcn/ui

## 🛠️ Tech Stack
![image](https://github.com/user-attachments/assets/e9b73b85-738c-4294-9c65-8b33703c39f4)

📦 Project Structure
text
fraud-detection-system/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── package.json
│   └── next.config.js
└── README.md
⚡ Quick Start
1. Clone the Repo
bash
git clone https://github.com/YOUR_USERNAME/fraud-detection-system.git
cd fraud-detection-system
2. Setup MongoDB
Create a free MongoDB Atlas cluster

Add a database user and whitelist your IP

Copy your connection string

3. Backend Setup
bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and DB name

npm install
npm run dev
# Or for ESM: node --loader ts-node/esm src/index.ts
4. Frontend Setup
bash
cd ../frontend
npm install
npm run dev
# Visit http://localhost:3000
