# Live Fraud-Rule Composer & Transaction Explorer

A full-stack, real-time fraud detection dashboard that streams transactions, applies fraud rules on the fly, and lets analysts investigate anomalies with a click.

---

## 🚀 Features

- **🔴 Live Transaction Feed:** Watch fraud alerts and live transactions stream in real-time via WebSocket.
- **🛡️ Rule Composer:** Instantly create, edit, and activate/deactivate fraud detection rules.
- **🔍 Drill-Down View:** Click any transaction to explore full details, triggered rules, and risk scores.
- **📊 Simulation Controls:** Start/stop simulated transaction streams with a single click (Mock data for realtime simulation).
- **⚙️ No-Code Rule Management:** Rules are editable directly in the browser—no redeploy needed.
- **🎨 Modern UI:** Built with `Next.js`, `Tailwind CSS`, and `shadcn/ui` for fast, beautiful prototyping.

---

## 🛠 Tech Stack

- **Frontend:** Next.js, Tailwind CSS, ShadCN UI
- **Backend:** Node.js, WebSocket, Express, MongoDB
- **Rules Engine:** `json-rules-engine` (customized for runtime decision logic)
- **Database:** MongoDB (hosted or local)

---

## 🧱 Project Structure

```
.
├── backend/             # Node.js backend with WebSocket + rule engine + simulation logic
└── frontend/
    └── fraud-explorer/  # Next.js frontend with pages for Live Feed, Rules, and Drill-Down
```

---

## ⚡ Quick Start

### 1. Clone This Repo

```bash
git clone https://github.com/your-org/live-fraud-detector.git
cd live-fraud-detector
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run build
npm run dev
```

🔧 Create a `.env` file in `/backend`:

```
MONGODB_URI=mongodb://localhost:27017/frauddb
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Frontend

```bash
cd frontend/fraud-explorer
npm install
npm run dev
```

🔧 Create a `.env.local` file in `fraud-explorer`:

```
NEXT_PUBLIC_BACKEND_URL=https://project.onrender.com
NEXT_PUBLIC_WS_URL=wss://fraud-backend.com/ws
NEXT_PUBLIC_API_URL=/api
```


## 📈 Metrics & Outcomes

- ✅ Real-time feedback loop from transaction → decision → UI
- 📉 Latency under 1s for rule-based decisions
- 🔧 Pluggable rules & risk scoring for modular experiments
