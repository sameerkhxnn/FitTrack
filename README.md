# FitTrack — Precision Fitness & Strength SaaS

![FitTrack Banner](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_%2F_SQLite-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Security](https://img.shields.io/badge/Auth-JWT_%2B_Bcrypt-emerald?style=for-the-badge)](https://jwt.io)
[![Tests](https://img.shields.io/badge/Tests-Pytest_Passing-brightgreen?style=for-the-badge)](https://pytest.org)

**FitTrack** is a production-grade, full-stack fitness and athletic progression tracking SaaS application. Built with a high-performance Python FastAPI backend, SQLAlchemy ORM, and a modern React 19 + Vite frontend styled with Tailwind CSS, Recharts data visualizations, and Lucide React iconography.

---

## ⚡ Key Highlights & Architecture

- **Dark Modern Fitness Aesthetic**: Deep zinc/slate surfaces (`#090d16`), electric emerald (`#10b981`), cyber cyan (`#06b6d4`), and amber accents with glassmorphism and subtle micro-interactions.
- **Strict Multi-Tenant Isolation**: Zero data leaks between accounts; all database queries enforce `user_id == current_user.id`.
- **Adaptive Database Engine**: Seamless connection to PostgreSQL in staging/production, with automatic resilient fallback to SQLite for immediate, zero-friction local development.
- **Scientific Fitness Engine**: Accurate mathematical derivations for:
  - **Mifflin-St Jeor BMR**
  - **TDEE & Goal Caloric Adjustments** (Deficit / Surplus / Recomposition)
  - **Protein Optimization** (1.6g – 2.4g / kg)
  - **Epley 1RM Formula**: $\text{1RM} = \text{Weight} \times (1 + \frac{\text{Reps}}{30})$
- **Bi-Directional Unit Support**: Instant toggle between **Metric** (kg, cm) and **Imperial** (lbs, in, ft) preserved in user profile and local state.

---

## 📱 Feature Overview

### 1. Authentication & Security
- Secure registration, password hashing via native **Bcrypt**, and stateless **PyJWT** access tokens.
- Protected routes guard private endpoints and handle session expiration with automated redirects.

### 2. Command Center Dashboard
- Dynamic time-of-day greeting, current date header, and quick action launch buttons.
- 6 key metrics: Current Weight, Goal Weight, Net Delta, Streak Counter, Daily Calories, and Protein target progress bar.
- Interactive Recharts 30-day weight area chart and weekly workout consistency distribution bars.
- Recent workout sessions feed, latest PR trophies, and hydration trackers.

### 3. Profile & Fitness Goals
- Configures height, current weight, target weight, biological gender, and activity levels.
- Live calculation of **BMI**, **BMR**, **TDEE**, daily target calories, and recommended protein ranges.

### 4. Weight Tracking
- Add, edit, and delete weight records with date pickers and optional notes.
- Historical trend chart with 7-day, 30-day, 90-day, and all-time zoom filters.
- Summary statistics: starting weight, current weight, net change, and weekly average velocity.

### 5. Body Measurements
- Track 7 anatomical landmarks: **Waist, Chest, Arms, Shoulders, Thighs, Hips, Neck**.
- Circumference trajectory line charts with support for partial/optional fields.
- **Date-to-Date Comparison Engine**: Evaluates precise deltas ($+$ / $-$ cm or in) between any two selected measurement dates.

### 6. Workout Routines & Live Session Logging
- **Routine Builder**: Create and edit workout splits (e.g. Push Day, Pull Day, Leg Day) with target sets, reps, weight, and rest periods.
- **Live Workout Mode**:
  - Live stopwatch timer tracking total duration.
  - Interactive set completion checkboxes.
  - **Automated Rest Countdown Timer** with alerts for subsequent sets.
  - Auto-calculates total volume lifted ($\text{sets} \times \text{reps} \times \text{weight}$) and estimated calories burned.
  - Automated detection of new Personal Records on set completion.

### 7. Personal Records & Strength Analytics
- Tracks heaviest weight, best reps, and calculates estimated 1RM via the Epley and Brzycki formulas.
- Bar chart comparison of top movements and trophy showcase with achievement badges.

### 8. Progress Photos & Visual Comparison
- Upload photos tagged by date, body weight, pose (Front, Side, Back, Custom), and notes.
- Private per-user storage isolation.
- Side-by-side comparison modal with days-apart counter and weight delta calculation.

### 9. Daily Nutrition & Macronutrients
- Meal logging categorised by **Breakfast, Lunch, Dinner, Snack**.
- Real-time remaining calorie ring, macro distribution donut chart (Protein, Carbs, Fat), and adherence progress bars.

### 10. Hydration & Daily Habits
- Daily water goal tracker with quick-add cups (+250ml, +500ml, +750ml, -250ml) and fluid level animation.
- Daily habit checklist: Sleep hours, Step counts, Mobility/Stretching, Cardio, and Workout completed status.

### 11. Fitness Calculators Suite
8 evidence-based calculators:
1. **BMI Calculator** (with WHO classification)
2. **BMR Calculator** (Mifflin-St Jeor formula)
3. **TDEE Calculator** (Activity multipliers)
4. **Calorie Target Calculator** (Goal-adjusted deficit / surplus)
5. **Protein Optimizer** (Hypertrophy / Fat loss target grams)
6. **1RM Strength Calculator** (Epley & Brzycki with rep-max percentage table)
7. **Macronutrient Split Calculator** (Balanced, High-Protein, Low-Carb, Keto)
8. **Goal Timeline Calculator** (Sustainable completion date forecast)

### 12. Advanced Analytics Hub
- Cross-domain performance graphs filterable by **7d, 30d, 90d, 180d, 365d, and All Time**.
- Correlations: Weight trend vs Volume progression, Body circumference vs Calorie consistency.

### 13. "My Journey" Milestone Timeline
- Living narrative timeline merging account creation, weight milestones, first workouts, PR breaks, and photo uploads.

### 14. Achievements & In-App Notifications
- Milestone trophy badges (First Step, 10 Workouts, Century Club, First PR, 5 PRs, Visual Proof, etc.).
- In-app notification center alerting users of unlocked achievements and milestones.

### 15. Settings & Data Portability
- Account info update and secure password change.
- Global unit toggle (Metric vs Imperial).
- **GDPR Data Portability**: Export complete account history as a structured JSON file.
- **Danger Zone**: Permanent account deletion with confirmation safeguards.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **Routing** | React Router v7 / v6 |
| **Styling** | Tailwind CSS v3.4 |
| **Icons** | Lucide React |
| **Charts & Visuals** | Recharts (Area, Bar, Line, Pie) |
| **Backend Framework** | Python 3.12 + FastAPI |
| **ORM & Database** | SQLAlchemy 2.0 + PostgreSQL / SQLite |
| **Migrations** | Alembic |
| **Authentication** | PyJWT + Bcrypt |
| **Data Validation** | Pydantic v2 |
| **Testing** | Pytest + FastAPI TestClient |

---

## 📂 Project Structure

```
Anime projects/
├── backend/
│   ├── alembic/                 # Database migrations
│   ├── app/
│   │   ├── api/v1/endpoints/    # Modular REST route handlers
│   │   ├── core/                # Config, database setup, JWT security, deps
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic v2 request/response schemas
│   │   ├── services/            # Metabolic formulas and calculations
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest test suite
│   ├── requirements.txt         # Python dependencies
│   └── alembic.ini              # Alembic config
├── frontend/
│   ├── src/
│   │   ├── components/common/   # Button, Card, Input, Modal, Badge, Skeleton
│   │   ├── components/layout/   # Navbar, Sidebar, AppLayout, ProtectedRoute
│   │   ├── context/             # AuthContext, ToastContext, UnitContext
│   │   ├── pages/               # 15+ feature pages
│   │   ├── services/            # Api client
│   │   ├── App.jsx              # Routes declaration
│   │   └── index.css            # Dark mode styling & tailwind directives
│   ├── index.html
│   └── package.json
├── package.json                 # Monorepo runner scripts
├── uvicorn.cmd                  # Windows executable wrapper
├── alembic.cmd                  # Windows executable wrapper
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** *(optional; app automatically uses SQLite if PostgreSQL is not running)*

### 1. Start the Backend
From the workspace root:
```bash
# Option A: From root directory
uvicorn app.main:app --reload

# Option B: Using python directly
python -m uvicorn app.main:app --reload
```
The interactive Swagger API documentation will be available at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### 2. Start the Frontend
From the workspace root or inside `frontend/`:
```bash
# Run from root:
npm run dev

# Or from inside frontend:
cd frontend
npm run dev
```
Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🧪 Running Automated Tests

To execute the full backend test suite covering authentication, permissions, data isolation, and calculations:
```bash
python -m pytest backend/tests -v
```

---

## 🔒 Security Hardening

- **User Data Isolation**: Every SQL query is parameterized with `user_id == current_user.id`. Users cannot view or mutate another user's sessions, measurements, or weights.
- **Password Security**: Native 72-byte salt-hashed Bcrypt algorithm. Plaintext passwords are never stored.
- **File Upload Protection**: Content-type whitelisting (JPEG, PNG, WebP) and storage in isolated user subdirectories.
- **SQL Injection Prevention**: Full SQLAlchemy 2.0 ORM query parameterization.

---

## 📜 License
FitTrack is an open-source SaaS application released under the **MIT License**.
