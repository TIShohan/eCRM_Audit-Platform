# Task List: eCRM Audit Platform Transformation

## Overview
Transform the current client-side CSV app into a full-stack audit platform with Admin/Auditor roles, Supabase backend, and automated workflow.

---

## Phase 1: Foundation & Setup

### Task 1.1: Update Project Documentation
**Goal**: Document new requirements in memory bank
- [x] Update `projectbrief.md` with new multi-user audit platform vision
- [x] Create `newRequirements.md` with detailed feature specs
- [x] Update `progress.md` to reflect transformation phase

**Files**: `memory-bank/projectbrief.md`, `memory-bank/newRequirements.md`

---

### Task 1.2: Supabase Project Setup
**Goal**: Create and configure Supabase project
- [x] Create new Supabase project (free tier)
- [x] Note project URL and anon key
- [x] Create `.env` file with Supabase credentials
- [x] Add `.env` to `.gitignore`

**Files**: `.env`, `.gitignore`

**Credentials needed**:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### Task 1.3: Install Supabase Client
**Goal**: Add Supabase SDK to project
- [x] Run: `npm install @supabase/supabase-js`
- [x] Create `src/lib/supabase.js` with client initialization
- [x] Test connection with simple query

**Files**: `package.json`, `src/lib/supabase.js`

**Code**:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Phase 2: Database Schema Design

### Task 2.1: Design Database Schema
**Goal**: Plan all tables and relationships
- [x] Create `memory-bank/database-schema.md` with table definitions
- [x] Define columns, types, and relationships
- [x] Plan indexes and constraints

**Tables needed**:
1. `users` (extends Supabase auth.users)
2. `audit_data` (CSV records)
3. `questions` (common + campaign-specific)
4. `answer_options` (linked to questions)
5. `audit_responses` (auditor answers)
6. `assignments` (data assigned to auditors)

**Files**: `memory-bank/database-schema.md`

---

### Task 2.2: Create Users Profile Table
**Goal**: Extend Supabase auth with role and limits
- [x] Create `user_profiles` table in Supabase
- [x] Columns: `id` (FK to auth.users), `role`, `daily_limit`, `created_at`
- [x] Set up RLS (Row Level Security) policies
- [x] Create trigger to auto-create profile on user signup

**SQL**:
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'auditor' CHECK (role IN ('admin', 'auditor')),
  daily_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Task 2.3: Create Audit Data Table
**Goal**: Store CSV records in database
- [x] Create `audit_data` table
- [x] Columns: `id`, `contact_id`, `contact_date`, `audio_link`, `campaign_id`, `campaign_name`, `location`, `status`, `assigned_to`, `completed_at`, `created_at`
- [x] Add indexes on `campaign_id`, `assigned_to`, `status`
- [x] Set up RLS policies

**SQL**:
```sql
CREATE TABLE audit_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id TEXT NOT NULL,
  contact_date TEXT,
  start_time TEXT,
  end_time TEXT,
  duration TEXT,
  audio_link TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  outlet_name TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_data_campaign ON audit_data(campaign_id);
CREATE INDEX idx_audit_data_assigned ON audit_data(assigned_to);
CREATE INDEX idx_audit_data_status ON audit_data(status);

ALTER TABLE audit_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors see assigned data"
  ON audit_data FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins see all data"
  ON audit_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Task 2.4: Create Questions Table
**Goal**: Store common and campaign-specific questions
- [x] Create `questions` table
- [x] Columns: `id`, `question_text`, `question_type` (common/campaign), `campaign_id` (nullable), `order_index`, `created_at`
- [x] Set up RLS policies (read: all, write: admin only)

**SQL**:
```sql
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('common', 'campaign')),
  campaign_id TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_campaign ON questions(campaign_id);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify questions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Task 2.5: Create Answer Options Table
**Goal**: Store multiple choice options for questions
- [x] Create `answer_options` table
- [x] Columns: `id`, `question_id` (FK), `option_text`, `order_index`, `created_at`
- [x] Set up RLS policies

**SQL**:
```sql
CREATE TABLE answer_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_answer_options_question ON answer_options(question_id);

ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answer options"
  ON answer_options FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify answer options"
  ON answer_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Task 2.6: Create Audit Responses Table
**Goal**: Store auditor answers
- [x] Create `audit_responses` table
- [x] Columns: `id`, `audit_data_id` (FK), `question_id` (FK), `answer_option_id` (FK), `auditor_id` (FK), `created_at`
- [x] Set up RLS policies

**SQL**:
```sql
CREATE TABLE audit_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_data_id UUID REFERENCES audit_data(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_option_id UUID REFERENCES answer_options(id),
  auditor_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(audit_data_id, question_id)
);

CREATE INDEX idx_responses_audit_data ON audit_responses(audit_data_id);
CREATE INDEX idx_responses_auditor ON audit_responses(auditor_id);

ALTER TABLE audit_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view own responses"
  ON audit_responses FOR SELECT
  USING (auditor_id = auth.uid());

CREATE POLICY "Auditors can insert own responses"
  ON audit_responses FOR INSERT
  WITH CHECK (auditor_id = auth.uid());

CREATE POLICY "Admins can view all responses"
  ON audit_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Task 2.7: Create Assignments Table
**Goal**: Track data assignment to auditors
- [x] Create `assignments` table
- [x] Columns: `id`, `audit_data_id` (FK), `auditor_id` (FK), `assigned_at`, `assigned_by` (FK to admin)
- [x] Set up RLS policies

**SQL**:
```sql
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_data_id UUID REFERENCES audit_data(id) ON DELETE CASCADE,
  auditor_id UUID REFERENCES user_profiles(id),
  assigned_by UUID REFERENCES user_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(audit_data_id, auditor_id)
);

CREATE INDEX idx_assignments_auditor ON assignments(auditor_id);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors see own assignments"
  ON assignments FOR SELECT
  USING (auditor_id = auth.uid());

CREATE POLICY "Admins manage assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Phase 3: Authentication System

### Task 3.1: Create Auth Context
**Goal**: Set up React context for authentication
- [x] Create `src/contexts/AuthContext.jsx`
- [x] Implement login, logout, signup functions
- [x] Track current user and role
- [x] Handle auth state changes

**Files**: `src/contexts/AuthContext.jsx`

---

### Task 3.2: Create Login Page
**Goal**: Build login UI
- [x] Create `src/pages/Login.jsx`
- [x] Email/password form
- [x] Error handling
- [x] Redirect to dashboard on success

**Files**: `src/pages/Login.jsx`

---

### Task 3.3: Create Protected Route Component
**Goal**: Restrict access based on auth and role
- [x] Create `src/components/ProtectedRoute.jsx`
- [x] Check if user is authenticated
- [x] Check user role
- [x] Redirect to login if not authenticated

**Files**: `src/components/ProtectedRoute.jsx`

---

### Task 3.4: Set Up React Router
**Goal**: Add routing for multi-page app
- [x] Install: `npm install react-router-dom`
- [x] Create `src/App.jsx` with routes
- [x] Routes: `/login`, `/admin/*`, `/auditor/*`
- [x] Wrap routes with AuthContext

**Files**: `src/App.jsx`

---

## Phase 4: Admin Dashboard - User Management

### Task 4.1: Create Admin Layout
**Goal**: Build admin dashboard shell
- [x] Create `src/pages/admin/AdminLayout.jsx`
- [x] Sidebar navigation
- [x] Header with logout
- [x] Outlet for nested routes

**Files**: `src/pages/admin/AdminLayout.jsx`

---

### Task 4.2: Create Admin Dashboard Home
**Goal**: Show overview metrics
- [x] Create `src/pages/admin/Dashboard.jsx`
- [x] Fetch and display:
  - Total users count
  - Total audit data count
  - Completed audits count
- [x] Use Supabase queries

**Files**: `src/pages/admin/Dashboard.jsx`

---

### Task 4.3: Create User List Page
**Goal**: Display all users
- [x] Create `src/pages/admin/UserManagement.jsx`
- [x] Fetch all user profiles
- [x] Display in table: email, role, daily_limit
- [x] Add "Create User" button

**Files**: `src/pages/admin/UserManagement.jsx`

---

### Task 4.4: Create User Form (Create/Edit)
**Goal**: Add/edit users
- [x] Create `src/components/admin/UserForm.jsx`
- [x] Form fields: email, password, role, daily_limit
- [x] Use Supabase Admin API to create user
- [x] Update user_profiles table

**Files**: `src/components/admin/UserForm.jsx`

**Note**: Creating users requires Supabase service role key (backend function or Edge Function)

---

### Task 4.5: Implement User Metrics Display
**Goal**: Show per-user audit stats
- [x] Update `UserManagement.jsx`
- [x] For each user, query:
  - Total assigned records
  - Completed records
- [x] Display in table columns

**Files**: `src/pages/admin/UserManagement.jsx`

---

## Phase 5: Admin Dashboard - Data Management

### Task 5.1: Create Data Upload Page
**Goal**: CSV upload interface for admin
- [x] Create `src/pages/admin/DataManagement.jsx`
- [x] File input for CSV
- [x] Parse CSV with PapaParse
- [x] Preview parsed data in UI (Integrated in upload flow)

**Files**: `src/pages/admin/DataManagement.jsx`

---

### Task 5.2: Implement CSV to Database Import
**Goal**: Save CSV rows to audit_data table
- [x] In `DataManagement.jsx`, add upload logic
- [x] Loop through parsed CSV rows
- [x] Insert rows into `audit_data` table (Batch insert)
- [x] Show success/error feedback
- [x] Handle errors

**Files**: `src/pages/admin/DataManagement.jsx`

---

### Task 5.3: Create Data List Page
**Goal**: View all uploaded audit data
- [x] Create `src/pages/admin/DataList.jsx`
- [x] Fetch all records from `audit_data`
- [x] Display in table: contact_id, campaign, status, assigned_to
- [x] Add filters: status
- [x] Integrate with routing

**Files**: `src/pages/admin/DataList.jsx`

---

### Task 5.4: Create Manual Assignment Interface
**Goal**: Assign data to specific auditor
- [x] In `DataList.jsx`, add "Assign" button per row
- [x] Modal to select auditor from `user_profiles`
- [x] Update `audit_data.assigned_to`
- [x] Create record in `assignments` table

**Files**: `src/pages/admin/DataList.jsx`

---

### Task 5.5: Create Auto-Assignment Function
**Goal**: Distribute data evenly to auditors
- [x] Create `src/utils/autoAssign.js`
- [x] Fetch all auditors
- [x] Fetch unassigned data
- [x] Distribute evenly (round-robin)
- [x] Insert into assignments table

**Files**: `src/utils/autoAssign.js`

---

### Task 5.6: Add Auto-Assign Button to UI
**Goal**: Trigger auto-assignment from admin panel
- [x] In `DataList.jsx`, add "Auto-Assign Unassigned" button
- [x] Call auto-assign utility function
- [x] Show success feedback
- [x] Refresh data list

**Files**: `src/pages/admin/DataList.jsx`

---

## Phase 6: Admin Dashboard - Question Management

### Task 6.1: Create Question Management Page
**Goal**: List all questions
- [x] Create `src/pages/admin/QuestionManagement.jsx`
- [x] Tabs: "Common Questions" and "Campaign Questions"
- [x] Fetch and display questions by type
- [x] Add "Create Question" button

**Files**: `src/pages/admin/QuestionManagement.jsx`

---

### Task 6.2: Create Question Form Component
**Goal**: Add/edit questions
- [x] Create `src/components/admin/QuestionForm.jsx`
- [x] Fields: question_text, question_type, campaign_id (if campaign type), order_index
- [x] Insert/update in `questions` table
- [x] Handle form validation

**Files**: `src/components/admin/QuestionForm.jsx`

---

### Task 6.3: Create Answer Options Manager
**Goal**: Add/edit answer options for a question
- [x] Integrated into QuestionForm.jsx
- [x] Display existing options
- [x] Add new option input
- [x] Delete option button
- [x] Save to `answer_options` table

**Files**: `src/components/admin/QuestionForm.jsx`

---

### Task 6.4: Integrate Options Manager into Question Form
**Goal**: Manage options while creating/editing question
- [x] Done (Task 6.3)

---

### Task 6.5: Add Delete Question Functionality
**Goal**: Remove questions from database
- [x] In `QuestionManagement.jsx`, add delete button per question
- [x] Confirmation modal
- [x] Delete from `questions` table
- [x] Refresh list

**Files**: `src/pages/admin/QuestionManagement.jsx`

---

## Phase 7: Admin Dashboard - Reporting

### Task 7.1: Create Reports Page
**Goal**: Export audit results
- [x] Create `src/pages/admin/Reports.jsx`
- [x] Date range picker (start date, end date)
- [x] "Export CSV" button

**Files**: `src/pages/admin/Reports.jsx`

---

### Task 7.2: Implement Export Query
**Goal**: Fetch audit data with responses
- [x] In `Reports.jsx`, create query function
- [x] Join tables: `audit_data`, `audit_responses`, `questions`, `answer_options`, `user_profiles`
- [x] Filter by date range
- [x] Return combined dataset

**Files**: `src/pages/admin/Reports.jsx`

---

### Task 7.3: Generate CSV from Query Results
**Goal**: Convert data to CSV format
- [x] Use PapaParse to generate CSV
- [x] Columns: all audit_data fields + question texts + answers + auditor email
- [x] UTF-8 BOM encoding
- [x] Trigger download

**Files**: `src/pages/admin/Reports.jsx`

---

## Phase 8: Auditor Dashboard

### Task 8.1: Create Auditor Layout
**Goal**: Build auditor dashboard shell
- [ ] Create `src/pages/auditor/AuditorLayout.jsx`
- [ ] Header with logout
- [ ] Outlet for nested routes

**Files**: `src/pages/auditor/AuditorLayout.jsx`

---

### Task 8.2: Create Auditor Dashboard Home
**Goal**: Show auditor metrics
- [ ] Create `src/pages/auditor/Dashboard.jsx`
- [ ] Fetch and display:
  - Total assigned records
  - Completed records
  - Remaining records
  - Daily limit
  - Today's completed count
- [ ] "Start Audit" button

**Files**: `src/pages/auditor/Dashboard.jsx`

---

### Task 8.3: Implement Daily Limit Check
**Goal**: Prevent exceeding daily limit
- [ ] Create `src/utils/checkDailyLimit.js`
- [ ] Query today's completed audits for current user
- [ ] Compare with user's daily_limit
- [ ] Return true/false

**Files**: `src/utils/checkDailyLimit.js`

---

### Task 8.4: Create Audit Interface Page
**Goal**: Display audit form
- [ ] Create `src/pages/auditor/AuditInterface.jsx`
- [ ] Fetch next assigned, pending record
- [ ] Display contact details (like current app)
- [ ] Display audio player with controls
- [ ] Display map (Leaflet)

**Files**: `src/pages/auditor/AuditInterface.jsx`

---

### Task 8.5: Fetch and Render Questions
**Goal**: Show common + campaign questions
- [ ] In `AuditInterface.jsx`, fetch:
  - All common questions
  - Campaign-specific questions for current record's campaign_id
- [ ] Fetch answer options for each question
- [ ] Render questions with radio buttons (like current app)

**Files**: `src/pages/auditor/AuditInterface.jsx`

---

### Task 8.6: Implement Answer Submission
**Goal**: Save answers to database
- [ ] In `AuditInterface.jsx`, create submit handler
- [ ] Validate all questions answered
- [ ] Insert answers into `audit_responses` table
- [ ] Update `audit_data.status` to 'completed'
- [ ] Update `audit_data.completed_at` timestamp
- [ ] Redirect to dashboard or load next record

**Files**: `src/pages/auditor/AuditInterface.jsx`

---

### Task 8.7: Add Audio Controls (Reuse Current Logic)
**Goal**: Enhanced audio playback
- [ ] Copy audio control logic from current `App.jsx`
- [ ] Implement speed toggle (1x, 1.25x, 1.5x)
- [ ] Skip forward/backward buttons
- [ ] Integrate into `AuditInterface.jsx`

**Files**: `src/pages/auditor/AuditInterface.jsx`

---

### Task 8.8: Add Map Preview (Reuse Current Component)
**Goal**: Show contact location
- [ ] Copy `MapPreview.jsx` component
- [ ] Pass location data from current audit record
- [ ] Display in `AuditInterface.jsx`

**Files**: `src/components/MapPreview.jsx`, `src/pages/auditor/AuditInterface.jsx`

---

## Phase 9: UI Polish & Styling

### Task 9.1: Create Consistent Layout Styles
**Goal**: Unified design across admin and auditor
- [ ] Update `src/index.css` with global styles
- [ ] Define color scheme, typography
- [ ] Reuse current app's clean design patterns

**Files**: `src/index.css`

---

### Task 9.2: Style Admin Dashboard
**Goal**: Professional admin interface
- [ ] Style sidebar navigation
- [ ] Style tables (user list, data list, questions)
- [ ] Add hover effects, buttons
- [ ] Responsive design

**Files**: `src/pages/admin/*.jsx`, `src/App.css`

---

### Task 9.3: Style Auditor Interface
**Goal**: Clean, focused audit experience
- [ ] Style audit form (similar to current app)
- [ ] Style question cards
- [ ] Style audio player controls
- [ ] Ensure mobile responsiveness

**Files**: `src/pages/auditor/AuditInterface.jsx`, `src/App.css`

---

### Task 9.4: Add Loading States
**Goal**: Better UX during async operations
- [ ] Create `src/components/LoadingSpinner.jsx`
- [ ] Add to all pages with data fetching
- [ ] Show during CSV import, data loading

**Files**: `src/components/LoadingSpinner.jsx`

---

### Task 9.5: Add Error Handling UI
**Goal**: User-friendly error messages
- [ ] Create `src/components/ErrorMessage.jsx`
- [ ] Display Supabase errors gracefully
- [ ] Add retry buttons where applicable

**Files**: `src/components/ErrorMessage.jsx`

---

## Phase 10: Testing & Deployment

### Task 10.1: Test Admin Workflows
**Goal**: Verify all admin features work
- [ ] Test user creation and role assignment
- [ ] Test CSV upload and import
- [ ] Test manual and auto-assignment
- [ ] Test question management
- [ ] Test report export

---

### Task 10.2: Test Auditor Workflows
**Goal**: Verify auditor experience
- [ ] Test login and dashboard
- [ ] Test daily limit enforcement
- [ ] Test audit interface (audio, questions, map)
- [ ] Test answer submission
- [ ] Test navigation between records

---

### Task 10.3: Seed Database with Test Data
**Goal**: Populate database for testing
- [ ] Create SQL script: `seed-data.sql`
- [ ] Insert sample users (1 admin, 2 auditors)
- [ ] Insert sample audit_data records
- [ ] Insert sample questions (common + campaign)
- [ ] Insert sample answer options

**Files**: `seed-data.sql`

---

### Task 10.4: Update Documentation
**Goal**: Document new system
- [ ] Update `README.md` with setup instructions
- [ ] Document Supabase setup steps
- [ ] Document environment variables
- [ ] Add user guide for admin and auditor

**Files**: `README.md`

---

### Task 10.5: Deploy to Production
**Goal**: Host the app
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to Vercel/Netlify
- [ ] Configure environment variables on hosting platform
- [ ] Test production deployment

---

## Phase 11: Advanced Features (Optional)

### Task 11.1: Add Bulk User Import
**Goal**: Import multiple users from CSV
- [ ] Admin can upload CSV with user emails
- [ ] Auto-create user accounts
- [ ] Assign default role and daily limit

---

### Task 11.2: Add Audit History View
**Goal**: Auditors can review past audits
- [ ] Create page showing completed audits
- [ ] Display submitted answers
- [ ] Read-only view

---

### Task 11.3: Add Real-time Updates
**Goal**: Live dashboard updates
- [ ] Use Supabase Realtime subscriptions
- [ ] Update admin dashboard when audits completed
- [ ] Update auditor dashboard when new data assigned

---

### Task 11.4: Add Audit Quality Scoring
**Goal**: Track auditor performance
- [ ] Admin sets "correct" answers for sample audits
- [ ] Compare auditor answers to correct answers
- [ ] Calculate accuracy score per auditor

---

## Summary

**Total Tasks**: ~70 small, manageable steps

**Estimated Timeline**: 
- Phase 1-2: 1-2 days (setup + database)
- Phase 3-4: 2-3 days (auth + admin user management)
- Phase 5-6: 3-4 days (data + question management)
- Phase 7-8: 3-4 days (reporting + auditor interface)
- Phase 9-10: 2-3 days (polish + testing)

**Any agent can pick up any task** with context from:
- This task list
- `memory-bank/projectbrief.md`
- `memory-bank/database-schema.md` (to be created in Task 2.1)
