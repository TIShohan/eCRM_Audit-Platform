# New Requirements: eCRM Audit Platform v2.0

## Transformation Overview
Evolving from a single-user, client-side CSV tool to a multi-user, database-driven audit platform with role-based access control.

---

## Core Changes

### From → To
- **Single User** → Multi-user with Admin/Auditor roles
- **Manual CSV Upload/Download** → Database-driven workflow
- **localStorage** → Supabase PostgreSQL database
- **No Authentication** → Email/password authentication with role-based access
- **Static Questions** → Dynamic, admin-configurable questions
- **Manual Process** → Automated assignment and tracking

---

## User Roles

### Admin
**Capabilities:**
- Manage users (create, edit, assign roles, set daily limits)
- Upload CSV data to database
- Assign audit data to auditors (manual or auto-distribute)
- Create/edit/delete questions (common and campaign-specific)
- Export audit results with date range filtering
- View system-wide metrics and per-user performance

### Auditor
**Capabilities:**
- View assigned audit records only
- Complete audits with audio playback and question answering
- Track personal metrics (assigned, completed, remaining, daily limit)
- Cannot access other auditors' data
- Cannot modify questions or system configuration

---

## Feature Requirements

### 1. Authentication & Authorization
- Email/password login via Supabase Auth
- Role-based access control (admin vs auditor)
- Automatic redirect to role-specific dashboard
- Session persistence
- Secure logout

### 2. Admin Dashboard

#### User Management
- List all users with metrics:
  - Email
  - Role
  - Daily limit
  - Total assigned records
  - Completed records
- Create new users with role and daily limit
- Edit user role and daily limit
- View per-user performance statistics

#### Data Management
- Upload CSV files (same format as current app)
- Parse and import CSV rows to database
- View all audit data in table format
- Filter by campaign, status, assigned auditor
- Pagination for large datasets
- Manual assignment: Select specific auditor for specific records
- Auto-assignment: Distribute unassigned records evenly across auditors
- Respect daily limits during auto-assignment

#### Question Management
- Two question types:
  1. **Common Questions**: Apply to all audits regardless of campaign
  2. **Campaign-Specific Questions**: Apply only to specific campaign_id
- Create/edit/delete questions
- Define answer options (multiple choice) for each question
- Set question order
- Preview how questions will appear to auditors

#### Reporting & Export
- Date range selector (start date, end date)
- Export CSV with:
  - All original audit data fields
  - Question texts as column headers
  - Selected answers
  - Auditor information
  - Completion timestamps
- UTF-8 BOM encoding for Bengali text support

### 3. Auditor Dashboard

#### Metrics Display
- Total assigned records
- Completed records
- Remaining records
- Daily limit
- Today's completed count
- Progress percentage

#### Audit Interface
- Fetch next pending assigned record
- Display contact details (same as current app)
- Audio player with enhanced controls:
  - Play/pause
  - Variable speed (1x, 1.25x, 1.5x)
  - Skip forward/backward (5 seconds)
  - Progress bar
- Map visualization (Leaflet with OpenStreetMap)
- Dynamic question rendering:
  - Common questions (all audits)
  - Campaign-specific questions (based on current record's campaign_id)
- Answer validation (all questions required)
- Submit answers to database
- Auto-load next record or return to dashboard

#### Daily Limit Enforcement
- Check completed count for current day
- Block "Start Audit" if daily limit reached
- Display clear message when limit reached
- Reset count at midnight (server time)

---

## Technical Requirements

### Backend
- **Supabase** (free tier)
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS) policies
  - Real-time subscriptions (optional)

### Frontend
- **React 19** (current version)
- **Vite** (current build tool)
- **React Router** for multi-page navigation
- **Supabase JS Client** for database operations
- **PapaParse** for CSV processing (keep current)
- **Leaflet** for maps (keep current)

### Data Storage
- Audio files: S3 URLs stored as text in database (not uploaded to Supabase Storage)
- CSV data: Parsed and stored as database records
- Answers: Stored in relational tables with foreign keys
- No localStorage dependency (except for auth tokens)

---

## Database Schema (High-Level)

### Tables
1. **user_profiles** - Extends Supabase auth.users with role and daily_limit
2. **audit_data** - CSV records with assignment and status tracking
3. **questions** - Common and campaign-specific questions
4. **answer_options** - Multiple choice options for questions
5. **audit_responses** - Auditor answers linked to audit_data and questions
6. **assignments** - Tracks which data is assigned to which auditor

### Relationships
- `audit_data.assigned_to` → `user_profiles.id`
- `questions.campaign_id` → `audit_data.campaign_id` (for campaign-specific questions)
- `answer_options.question_id` → `questions.id`
- `audit_responses.audit_data_id` → `audit_data.id`
- `audit_responses.question_id` → `questions.id`
- `audit_responses.answer_option_id` → `answer_options.id`
- `audit_responses.auditor_id` → `user_profiles.id`

---

## Business Rules

### Assignment Rules
- Each audit record can be assigned to only one auditor
- Auditors can only see and work on their assigned records
- Admin can reassign records if needed
- Auto-assignment distributes evenly based on current workload

### Daily Limit Rules
- Daily limit is per auditor, set by admin
- Limit resets at midnight (server timezone)
- Auditor cannot start new audit if today's completed count >= daily_limit
- Admin can modify daily_limit at any time

### Question Rules
- Common questions appear for every audit
- Campaign-specific questions appear only when audit_data.campaign_id matches question.campaign_id
- All questions must be answered before submission
- Questions can be reordered by admin
- Deleting a question cascades to delete its answer_options

### Data Integrity Rules
- Cannot delete user if they have assigned records
- Cannot delete question if responses exist (or cascade delete responses)
- Audit status: pending → in_progress → completed
- Once completed, audit cannot be edited (read-only for auditor)

---

## Migration from Current App

### What to Keep
- UI design and styling (clean, minimal)
- Audio player controls and logic
- Map visualization component
- Question rendering patterns
- CSV parsing logic (for admin upload)
- Bengali language support

### What to Replace
- localStorage → Supabase database
- Single-page app → Multi-page with routing
- No auth → Full authentication system
- Static questions → Dynamic question management
- Manual CSV workflow → Automated database workflow

### What to Add
- User management system
- Role-based dashboards
- Assignment system (manual + auto)
- Question configuration interface
- Date-range reporting
- Daily limit enforcement
- Real-time metrics

---

## Success Criteria

### For Admin
- Can create and manage users in < 2 minutes
- Can upload 500-row CSV and auto-assign in < 1 minute
- Can create new questions without touching code
- Can export filtered reports in < 30 seconds

### For Auditor
- Can complete one audit in < 3 minutes (same as current app)
- Clear visibility of daily progress and limits
- No confusion about what to work on next
- Seamless audio playback and question answering

### System Performance
- Page load < 2 seconds
- CSV import of 1000 rows < 10 seconds
- Real-time dashboard updates (if implemented)
- No data loss on network interruptions

---

## Security Requirements

### Authentication
- Secure password hashing (handled by Supabase)
- Email verification (optional)
- Session timeout after inactivity
- Secure logout clears all tokens

### Authorization
- RLS policies enforce role-based access
- Auditors cannot access admin routes
- Auditors cannot see other auditors' data
- Admin cannot impersonate auditors (separate login)

### Data Protection
- HTTPS only in production
- Environment variables for sensitive keys
- No sensitive data in client-side code
- Audit trail for admin actions (optional)

---

## Deployment Requirements

### Environment
- Static hosting (Vercel, Netlify)
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Production build optimization
- CDN for static assets

### Supabase Configuration
- Enable RLS on all tables
- Configure auth providers (email/password)
- Set up database backups
- Monitor usage (stay within free tier)

---

## Future Enhancements (Out of Scope for v2.0)

- Real-time collaboration features
- Advanced analytics and reporting dashboards
- Audit quality scoring and auditor performance metrics
- Mobile app (React Native)
- Bulk user import from CSV
- Email notifications for assignments
- Audio transcription and analysis
- Multi-language support beyond Bengali
