# Aurelia AI ✦ Autonomous Planning & Productivity Intelligence

A modern, full-stack AI-powered planning workspace and productivity copilot. Aurelia AI turns high-level goals into structured, executable action boards with automated timeline scheduling, Eisenhower prioritization, and interactive planning frameworks.

---

## ✨ Features

- 🧠 **AI Planning Studio**: Interactive conversational planning copilot powered by Lyzr Agent API.
- 📋 **Interactive Action Board**:
  - **Dynamic Task Checklist**: Prioritized tasks with completion tracking, confetti celebrations, and quick status filters.
  - **Schedule Timeline**: Time-blocked day planner with category indicators (focus, break, admin, review).
  - **Eisenhower Matrix**: Visual 4-quadrant urgency & importance task breakdown (Do, Schedule, Delegate, Eliminate).
- 🧩 **Productivity Frameworks Library**:
  - Eisenhower Matrix (Urgent vs. Important)
  - Time Blocking & Deep Work
  - Pomodoro Technique (25/5 cycles)
  - SMART Goals framework
  - MoSCoW Prioritization (Must, Should, Could, Won't)
- 🧙 **Guided Plan Wizard**: Multi-step blueprint builder to quickly configure goals, constraints, milestones, and deliverable targets.
- 🗂️ **Multi-Session History**: Persistent local workspaces to manage separate planning tracks, sprints, and projects.
- 🔊 **Sound Design & Micro-interactions**: Haptic-style audio feedback and subtle UI polish.

---

## 🛠️ Architecture & Tech Stack

- **Client**:
  - React 19 + TypeScript + Vite
  - Lucide React (modern icon suite)
  - Canvas Confetti (celebratory milestones)
  - Marked (rich markdown streaming render)
  - Custom dark glassmorphic design system
- **Server**:
  - Node.js + Express
  - TypeScript + tsx
  - Helmet & CORS security middleware
  - Rate limiting (`express-rate-limit`)
  - Vitest test suite
  - Lyzr Agent Integration

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/MukesReddy/AURELIA-AI.git
cd AURELIA-AI
npm install
npm --prefix server install
npm --prefix client install
```

### Environment Configuration

Configure your environment variables in `server/.env`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
LYZR_API_KEY=your_lyzr_api_key_here
LYZR_AGENT_ID=your_lyzr_agent_id_here
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 💻 Running the Application

### Development Mode

Run the backend and frontend simultaneously:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
```
Runs at: `http://localhost:5000`

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
Runs at: `http://localhost:5173`

### Production Build & Single-Port Serve

1. Build the frontend:
   ```bash
   npm run build:client
   ```

2. Start the unified production server:
   ```bash
   npm start
   ```
   Both the frontend and API will be served at `http://localhost:5000`.

---

## 🧪 Testing

Run backend tests with Vitest:

```bash
npm run test:server
```

---

## 📄 License

MIT License.
