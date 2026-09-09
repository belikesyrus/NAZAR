# Installation Guide (Windows PowerShell)

## Prerequisites

1. Python 3.10+ — https://www.python.org/downloads/
2. Node.js 18+ — https://nodejs.org/
3. Git (optional)

Verify installations:
```powershell
python --version
node --version
npm --version
```

---

## Step 1: Extract/Clone the Project

Place the project at a convenient path, e.g.:
```
C:\Projects\smart-monitoring-system\
```

---

## Step 2: Backend Setup

```powershell
# Navigate to backend
cd "C:\Projects\smart-monitoring-system\backend"

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# If activation fails with execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Copy environment file
Copy-Item .env.example .env

# (Optional) Edit .env to set custom SECRET_KEY and JWT_SECRET_KEY
notepad .env

# Initialize database and seed demo data
python seed.py

# Start backend server
python run.py
```

Backend will start at: **http://localhost:5000**

You should see:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

---

## Step 3: Frontend Setup

Open a **NEW** PowerShell window:

```powershell
# Navigate to frontend
cd "C:\Projects\smart-monitoring-system\frontend"

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env

# Start development server
npm run dev
```

Frontend will start at: **http://localhost:5173**

---

## Step 4: Open in Browser

Navigate to: **http://localhost:5173**

Login with any demo credential from the login page.

---

## Verify Backend is Running

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:5000/api/health" | Select-Object -ExpandProperty Content
```

Expected response: `{"service":"Smart Monitoring System API","status":"ok"}`
