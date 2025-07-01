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

## 📦 Project Structure
- backend
- frontend/fraud-explorer

## ⚡ Quick Start
   clone this repo.
1. run backend -> npm install , npm run build , npm run dev
2. env file setup
    MONGODB_URI=xxxxxxxxxxxxx 
   PORT=8080
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
3. Run frontend -> from fraud-explorer
4.  NEXT_PUBLIC_BACKEND_URL=https://fraud-backend-7vvy.onrender.com
NEXT_PUBLIC_WS_URL=https://fraud-backend-7vvy.onrender.com/ws
NEXT_PUBLIC_API_URL=/api
5. npm install , npm run dev



