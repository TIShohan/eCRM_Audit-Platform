# Active Context: eCRM Audit Platform v2.0

## Current Work Focus

### Phase 5: Data Management (In Progress)
**Objective**: Transition from client-side CSV processing to database-driven data management.

## Recent Changes
- **Database Schema**: Added `start_time`, `end_time`, `duration`, and `outlet_name` to `audit_data` table for parity with v1 CSV data.
- **Data Management (v2.0)**: Implemented `DataManagement.jsx` with CSV parsing (PapaParse) and batch database insertion into `audit_data`.
- **Admin Dashboard**: Completed User Management (listing, creating, editing, and metrics).
- **Routing**: Integrated Data Management and Auditor Dashboard placeholder routes in `App.jsx`.

## Current Objectives
- **Phase 5: Data Management**:
    - [x] Task 5.1 & 5.2: CSV Upload and Import logic (Completed).
    - [ ] Task 5.3: Create Data List view to browse and filter uploaded records.
    - [ ] Task 5.4: Implement Manual/Auto Assignment of data to auditors.

## Project Progress

### Phase 4: Admin Dashboard - User Management
- ✅ Created `AdminLayout.jsx` with sidebar navigation and logout functionality.
- ✅ Created `Dashboard.jsx` with overview stats (Users, Data, Completion).
- ✅ Created `UserManagement.jsx` page for listing and managing auditors.
- ✅ Created `UserForm.jsx` modal for auditor creation/editing (via Supabase Auth).
- ✅ Enhanced `UserManagement.jsx` to fetch real-time metrics (Assigned/Completed) per auditor.

### Phase 3: Authentication & Routing
- ✅ Implemented `AuthContext.jsx` using Supabase Auth.
- ✅ Created `Login.jsx` with automatic role-based redirection.
- ✅ Created `ProtectedRoute.jsx` for enforcing role access (Admin/Auditor).
- ✅ Set up React Router with nested routes for Admin and Auditor dashboards.

### Phase 2: Database Schema
- ✅ Designed and implemented base tables: `user_profiles`, `audit_data`, `questions`, `answer_options`, `audit_responses`, `assignments`.
- ✅ Configured Row Level Security (RLS) policies for all tables.

## Current System State
- **Auth**: Functional login/logout with role persistence.
- **Admin**: Dashboard stats, full User Management, and new CSV Data Upload interface.
- **Auditor**: Routing to placeholder dashboard (Phase 8 will migrate v1 UI here).

## Next Steps & Priorities
1. Build `src/pages/admin/DataList.jsx` to browse/filter uploaded records.
2. Implement Assignment logic (Manual/Auto).
3. Phase 6: Question Management.