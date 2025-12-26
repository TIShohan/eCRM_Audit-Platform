# Database Schema: eCRM Audit Platform

## Overview
PostgreSQL database schema for multi-user audit platform with role-based access control and full data retention for reporting.

---

## Tables

### 1. user_profiles
Extends Supabase `auth.users` with role and daily limit.

**Columns:**
- `id` (UUID, PK, FK → auth.users.id)
- `role` (TEXT, NOT NULL, CHECK: 'admin' | 'auditor', DEFAULT: 'auditor')
- `daily_limit` (INTEGER, DEFAULT: 50)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

---

### 2. audit_data
Stores full CSV records for parity between upload and export.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
-- **Source Data (From CSV)**
- `assigned_region` (TEXT)
- `assigned_area` (TEXT)
- `assigned_territory` (TEXT)
- `assigned_house` (TEXT)
- `assigned_point` (TEXT)
- `auditee_id` (TEXT) -- 'User_ID' in CSV
- `auditee_name` (TEXT) -- 'User_Name' in CSV
- `route` (TEXT)
- `cluster` (TEXT)
- `outlet_name` (TEXT) -- 'outlet' in CSV
- `contact_id` (TEXT, NOT NULL)
- `contact_date` (TEXT)
- `location` (TEXT) -- "lat,lng" format
- `audio_link` (TEXT)
- `start_time` (TEXT)
- `end_time` (TEXT)
- `duration` (TEXT)
- `campaign_id` (TEXT, NOT NULL)
- `campaign_name` (TEXT)
-- **System Metadata**
- `status` (TEXT, CHECK: 'pending' | 'in_progress' | 'completed', DEFAULT: 'pending')
- `assigned_to` (UUID, FK → user_profiles.id, NULLABLE)
- `completed_at` (TIMESTAMP WITH TIME ZONE, NULLABLE)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

---

### 3. questions
Stores common and campaign-specific questions.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `question_text` (TEXT, NOT NULL)
- `question_type` (TEXT, NOT NULL, CHECK: 'common' | 'campaign')
- `campaign_id` (TEXT, NULLABLE)
- `order_index` (INTEGER, NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

---

### 4. answer_options
Multiple choice options for questions.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `question_id` (UUID, FK → questions.id, NOT NULL, ON DELETE CASCADE)
- `option_text` (TEXT, NOT NULL)
- `order_index` (INTEGER, NOT NULL)

---

### 5. audit_responses
Stores auditor answers.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `audit_data_id` (UUID, FK → audit_data.id, NOT NULL, ON DELETE CASCADE)
- `question_id` (UUID, FK → questions.id, NOT NULL)
- `answer_option_id` (UUID, FK → answer_options.id, NOT NULL)
- `auditor_id` (UUID, FK → user_profiles.id, NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

---

### 6. assignments
Tracks data assignment to auditors.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `audit_data_id` (UUID, FK → audit_data.id, NOT NULL, ON DELETE CASCADE)
- `auditor_id` (UUID, FK → user_profiles.id, NOT NULL)
- `assigned_by` (UUID, FK → user_profiles.id, NOT NULL)
- `assigned_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())
