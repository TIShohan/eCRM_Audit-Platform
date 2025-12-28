# eCRM Audit Platform v2.0

A professional, multi-user quality assurance platform for auditing eCRM campaign audio recordings. Built with React and powered by Supabase.

## 🎯 project Overview

The eCRM Audit Platform v2.0 transforms the manual CSV-based auditing process into a structured, database-driven workflow. It provides administrators with full control over user management, data assignment, and dynamic question configuration, while offering auditors a streamlined, focused environment for audio review.

## ✨ Key Features

### 🔐 Authentication & Roles
- **Secure Login**: Individual email/password accounts via Supabase Auth.
- **Admin Role**: Full system control (Users, Data, Questions, Reports).
- **Auditor Role**: Focused queue-based workflow with daily limits.

### 👩‍💼 Admin Management
- **User Control**: Create/manage auditors and set daily performance limits.
- **Data Ingestion**: High-speed CSV upload with full metadata retention (19+ columns).
- **Intelligent Assignment**: 
  - Manual assignment for specific cases.
  - 🤖 **Auto-Assign**: Round-robin distribution of records to auditors.
- **Dynamic Questions**: Configure common or campaign-specific surveys without code changes.

### 🎧 Auditor Workflow
- **Automated Queue**: Fetches the next pending assignment instantly.
- **Enhanced Player**: Variable speed (1x-2x), keyboard shortcuts, and progress tracking.
- **Visual Context**: Interactive Leaflet maps showing GPS coordinates of the contact.
- **Daily Limits**: Real-time enforcement of work limits to prevent over-auditing.

### 📊 Reporting
- **Custom Export**: Filter completed audits by date range.
- **Deep Joins**: Generates a flattened CSV where every survey question is a column.
- **Full Parity**: Preserves all original CSV columns alongside auditor responses.

## 🛠 Technology Stack

- **React 19**: Modern UI framework.
- **Supabase**: PostgreSQL database, Auth, and Row Level Security (RLS).
- **Vite**: Ultra-fast build tool.
- **Leaflet**: Geospatial mapping.
- **PapaParse**: CSV processing.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase Project (URL & Anon Key)

### 2. Setup
```bash
# Clone and install
git clone <repo-url>
cd ecrm_audio_portal
npm install

# Configure environment
# Create a .env file with:
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Development
```bash
npm run dev
```

## 📋 Database Schema

The platform uses a relational PostgreSQL schema:
- `user_profiles`: Roles, limits, and email synchronization.
- `audit_data`: Central storage for all contact records.
- `questions` & `answer_options`: Dynamic survey engine.
- `audit_responses`: Auditor answers with `upsert` protection.
- `assignments`: Tracking for workload distribution.

## 🔒 Security
- **Row Level Security (RLS)**: Ensures auditors can ONLY see data assigned to them.
- **is_admin()**: Custom SQL function using `SECURITY DEFINER` for recursive-free role checking.

---
*Internal company tool - Quality Assurance Team*
