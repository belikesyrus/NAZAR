# Smart Monitoring System — Setup Guide

## Overview

This is a complete full-stack application for the Department of Social Justice and Empowerment (DoSJE) to monitor projects, institutes, and NGOs under various government schemes.

## Architecture

```
Frontend (React + Vite)  ←→  Backend (Python Flask)  ←→  SQLite DB
     :5173                         :5000                  smart_monitoring.db
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Maps | Leaflet + OpenStreetMap |
| API Client | Axios |
| Backend | Python Flask 3 |
| ORM | SQLAlchemy 2 |
| Auth | Flask-JWT-Extended |
| Database | SQLite (dev) / PostgreSQL (prod) |
| File Storage | Local filesystem (uploads/) |

## User Roles

| Role | Capabilities |
|------|-------------|
| department_official | Full system access, approve reports, manage users |
| inspection_officer | View and submit assigned inspections |
| project_incharge | View own project data, record attendance |
| ngo_staff | Record attendance, submit feedback |
| district_authority | View district data, manage users |
| beneficiary | View own data, submit complaints |
