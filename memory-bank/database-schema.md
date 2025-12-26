# Database Schema: eCRM Audit Platform

## Overview
PostgreSQL database schema for multi-user audit platform with role-based access control.

---

## Tables

### 1. user_profiles
Extends Supabase `auth.users` with role and daily limit.

**Columns:**
- `id` (UUID, PK, FK → auth.users.id)
- `role` (TEXT, NOT NULL, CHECK: 'admin' | 'auditor', DEFAULT: 'auditor')
- `daily_limit` (INTEGER, DEFAULT: 50)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

**Indexes:**
- Primary key on `id`
- Index on `role`

**Relationships:**
- One-to-one with `auth.users`
- One-to-many with `audit_data` (assigned_to)
- One-to-many with `audit_responses` (auditor_id)
- One-to-many with `assignments` (auditor_id)

**RLS Policies:**
- Users can view own profile
- Admins can view all profiles
- Admins can insert/update/delete profiles

---

### 2. audit_data
Stores CSV records (contact/campaign data).

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `contact_id` (TEXT, NOT NULL)
- `contact_date` (TEXT)
- `audio_link` (TEXT) - S3 URL
- `campaign_id` (TEXT, NOT NULL)
- `campaign_name` (TEXT)
- `location` (TEXT) - "lat,lng" format
- `status` (TEXT, CHECK: 'pending' | 'in_progress' | 'completed', DEFAULT: 'pending')
- `assigned_to` (UUID, FK → user_profiles.id, NULLABLE)
- `completed_at` (TIMESTAMP WITH TIME ZONE, NULLABLE)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

**Indexes:**
- Primary key on `id`
- Index on `campaign_id`
- Index on `assigned_to`
- Index on `status`
- Composite index on `(assigned_to, status)`

**Relationships:**
- Many-to-one with `user_profiles` (assigned_to)
- One-to-many with `audit_responses` (audit_data_id)
- One-to-many with `assignments` (audit_data_id)

**RLS Policies:**
- Auditors can SELECT only their assigned records (assigned_to = auth.uid())
- Admins can SELECT/INSERT/UPDATE/DELETE all records

---

### 3. questions
Stores common and campaign-specific questions.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `question_text` (TEXT, NOT NULL)
- `question_type` (TEXT, NOT NULL, CHECK: 'common' | 'campaign')
- `campaign_id` (TEXT, NULLABLE) - NULL for common questions
- `order_index` (INTEGER, NOT NULL) - Display order
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

**Indexes:**
- Primary key on `id`
- Index on `question_type`
- Index on `campaign_id`
- Composite index on `(question_type, campaign_id, order_index)`

**Relationships:**
- One-to-many with `answer_options` (question_id)
- One-to-many with `audit_responses` (question_id)

**RLS Policies:**
- Anyone (authenticated) can SELECT questions
- Only admins can INSERT/UPDATE/DELETE questions

**Constraints:**
- If `question_type = 'campaign'`, `campaign_id` must NOT be NULL
- If `question_type = 'common'`, `campaign_id` must be NULL

---

### 4. answer_options
Multiple choice options for questions.

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `question_id` (UUID, FK → questions.id, NOT NULL, ON DELETE CASCADE)
- `option_text` (TEXT, NOT NULL)
- `order_index` (INTEGER, NOT NULL) - Display order
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

**Indexes:**
- Primary key on `id`
- Index on `question_id`
- Composite index on `(question_id, order_index)`

**Relationships:**
- Many-to-one with `questions` (question_id)
- One-to-many with `audit_responses` (answer_option_id)

**RLS Policies:**
- Anyone (authenticated) can SELECT answer options
- Only admins can INSERT/UPDATE/DELETE answer options

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

**Indexes:**
- Primary key on `id`
- Index on `audit_data_id`
- Index on `auditor_id`
- Index on `question_id`
- Composite index on `(audit_data_id, question_id)`

**Unique Constraint:**
- `(audit_data_id, question_id)` - One answer per question per audit

**Relationships:**
- Many-to-one with `audit_data` (audit_data_id)
- Many-to-one with `questions` (question_id)
- Many-to-one with `answer_options` (answer_option_id)
- Many-to-one with `user_profiles` (auditor_id)

**RLS Policies:**
- Auditors can SELECT own responses (auditor_id = auth.uid())
- Auditors can INSERT own responses (auditor_id = auth.uid())
- Auditors can UPDATE own responses (auditor_id = auth.uid())
- Admins can SELECT all responses

---

### 6. assignments
Tracks data assignment to auditors (audit trail).

**Columns:**
- `id` (UUID, PK, DEFAULT: gen_random_uuid())
- `audit_data_id` (UUID, FK → audit_data.id, NOT NULL, ON DELETE CASCADE)
- `auditor_id` (UUID, FK → user_profiles.id, NOT NULL)
- `assigned_by` (UUID, FK → user_profiles.id, NOT NULL) - Admin who assigned
- `assigned_at` (TIMESTAMP WITH TIME ZONE, DEFAULT: NOW())

**Indexes:**
- Primary key on `id`
- Index on `auditor_id`
- Index on `audit_data_id`

**Unique Constraint:**
- `(audit_data_id, auditor_id)` - Prevent duplicate assignments

**Relationships:**
- Many-to-one with `audit_data` (audit_data_id)
- Many-to-one with `user_profiles` (auditor_id)
- Many-to-one with `user_profiles` (assigned_by)

**RLS Policies:**
- Auditors can SELECT own assignments (auditor_id = auth.uid())
- Admins can SELECT/INSERT all assignments

---

## Entity Relationship Diagram (Text)

```
auth.users (Supabase)
    ↓ 1:1
user_profiles
    ↓ 1:N (assigned_to)
    ├─→ audit_data
    │       ↓ 1:N
    │       └─→ audit_responses
    │               ↓ N:1
    │               ├─→ questions ←─┐
    │               │       ↓ 1:N   │
    │               │       └─→ answer_options
    │               │               ↓ N:1
    │               └───────────────┘
    │
    ├─→ assignments (auditor_id)
    │       ↓ N:1
    │       └─→ audit_data
    │
    └─→ audit_responses (auditor_id)
```

---

## Data Flow

### Admin Uploads CSV
1. Parse CSV rows
2. Insert into `audit_data` (status = 'pending', assigned_to = NULL)

### Admin Assigns Data
**Manual:**
1. Admin selects `audit_data` record
2. Admin selects auditor
3. Update `audit_data.assigned_to = auditor_id`
4. Insert into `assignments` (audit_data_id, auditor_id, assigned_by)

**Auto:**
1. Fetch all auditors
2. Fetch unassigned `audit_data` (assigned_to IS NULL)
3. Distribute evenly (round-robin)
4. Bulk update `audit_data.assigned_to`
5. Bulk insert into `assignments`

### Auditor Completes Audit
1. Fetch next pending assigned record (assigned_to = auth.uid(), status = 'pending')
2. Update `audit_data.status = 'in_progress'`
3. Fetch common questions + campaign-specific questions
4. Auditor selects answers
5. Insert into `audit_responses` (one row per question)
6. Update `audit_data.status = 'completed'`, `completed_at = NOW()`

### Admin Exports Results
1. Query `audit_data` JOIN `audit_responses` JOIN `questions` JOIN `answer_options` JOIN `user_profiles`
2. Filter by date range (`completed_at BETWEEN start_date AND end_date`)
3. Generate CSV with all columns
4. Download

---

## Sample Queries

### Get Auditor's Assigned Pending Records
```sql
SELECT * FROM audit_data
WHERE assigned_to = auth.uid()
  AND status = 'pending'
ORDER BY created_at ASC
LIMIT 1;
```

### Get Questions for Current Audit
```sql
-- Common questions
SELECT * FROM questions
WHERE question_type = 'common'
ORDER BY order_index;

-- Campaign-specific questions
SELECT * FROM questions
WHERE question_type = 'campaign'
  AND campaign_id = '146'
ORDER BY order_index;
```

### Get Auditor Metrics
```sql
SELECT
  COUNT(*) FILTER (WHERE assigned_to = 'auditor-uuid') AS total_assigned,
  COUNT(*) FILTER (WHERE assigned_to = 'auditor-uuid' AND status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE assigned_to = 'auditor-uuid' AND status = 'pending') AS remaining,
  COUNT(*) FILTER (
    WHERE assigned_to = 'auditor-uuid'
      AND status = 'completed'
      AND DATE(completed_at) = CURRENT_DATE
  ) AS today_completed
FROM audit_data;
```

### Export Query (Admin)
```sql
SELECT
  ad.contact_id,
  ad.contact_date,
  ad.audio_link,
  ad.campaign_id,
  ad.campaign_name,
  ad.location,
  ad.status,
  ad.completed_at,
  up.email AS auditor_email,
  q.question_text,
  ao.option_text AS answer
FROM audit_data ad
LEFT JOIN user_profiles up ON ad.assigned_to = up.id
LEFT JOIN audit_responses ar ON ad.id = ar.audit_data_id
LEFT JOIN questions q ON ar.question_id = q.id
LEFT JOIN answer_options ao ON ar.answer_option_id = ao.id
WHERE ad.completed_at BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY ad.contact_id, q.order_index;
```

---

## Migration from v1.0

### Data Migration (Optional)
If migrating existing localStorage data:
1. Export current answers CSV
2. Parse CSV
3. Insert into `audit_data` (mark as completed)
4. Create placeholder auditor user
5. Insert into `audit_responses`

### Question Migration
1. Parse `commonQuestions.json`
2. Insert into `questions` (question_type = 'common')
3. Insert options into `answer_options`
4. Parse `FixedQuestions.json`
5. Insert into `questions` (question_type = 'campaign', campaign_id = key)
6. Insert options into `answer_options`

---

## Notes

- **UUID vs Integer IDs**: Using UUIDs for security (no enumeration attacks)
- **Soft Delete**: Not implemented (hard delete with CASCADE)
- **Audit Trail**: `assignments` table tracks who assigned what
- **Timestamps**: All tables have `created_at` for audit purposes
- **RLS**: Enforces role-based access at database level
- **Indexes**: Optimized for common queries (assigned data, questions by campaign)
