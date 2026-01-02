# System Patterns: eCRM Audit Platform v2.0

## Architecture Overview

### Cloud-Native SPA Pattern
- **React + Vite**: Modern frontend stack for a fast, responsive interface.
- **Supabase Backend**: Replaces local state with a real-time PostgreSQL database, Auth, and RLS.
- **React Router**: Multi-route architecture with role-based access control (Admin/Auditor).

### Data Flow Architecture (v2.0 Pull Model)

```
Admin CSV Upload → Date Standardization (YYYY-MM-DD) → Supabase audit_data (assigned_to: NULL)
      ↓
Auditor Dashboard → Pull Next Available (UPDATE assigned_to: auth.uid())
      ↓
Audit Interface → Capture Responses → Supabase audit_responses
      ↓
Admin Reporting → Reliable CSV Export (Canonical Questions + Legacy Handling)
```

## Key Design Patterns

### 1. Self-Service "Pull" Pattern
**Global Queue Distribution**
- Instead of manual assignment, the system uses a "Pull" mechanism.
- Auditors request the next record; the system identifies the oldest `pending` record where `assigned_to` is `NULL`.
- **Atomic Claiming**: Uses a single SQL UPDATE with a LIMIT/ORDER clause to prevent race conditions (one record per auditor).

### 2. Role-Based Access Control (RBAC) Pattern
**Context-Driven UI & Security**
- `AuthContext.jsx`: Centralizes user session and profile data (including role).
- `ProtectedRoute.jsx`: Enforces route access based on `profile.role`.
- **Database Security**: Supabase Row Level Security (RLS) ensures auditors can only see unassigned records or those they have claimed.

### 3. High-Performance Inventory Pattern
**PostgreSQL Views for Real-time Monitoring**
- `daily_inventory_summary`: A database view that aggregates record status by upload date.
- This pattern allows the Admin Dashboard to load instantly even with 100,000+ records, as it only queries the pre-computed summary.

### 4. Dynamic Question Management
**Normalized Schema Integration**
- Questions and Answer Options are stored in relational tables.
- `AuditInterface.jsx` fetches questions dynamically based on `question_type` (Common vs. Campaign-specific).
- Allows admins to modify audit criteria without changing frontend code.

### 5. Custom Reset Logic Pattern
**Business Cycle Accounting**
- Monthly completion metrics carry over until the **5th day** of the following month.
- This logic is encapsulated in the metrics-fetching functions to align with monthly performance reporting deadlines.

### 6. Dynamic Theming Pattern (Auditor Exclusive)
**CSS Variable Context Injection**
- The system uses a specialized `AuditorLayout` that manages a `isDark` state.
- **Contextual Styling**: Colors are defined as CSS variables (`--bg-color`, `--surface-color`) in `index.css`.
- **State Propagation**: Theme state is persisted in `localStorage` and passed to child components via React Router's `Outlet` context, allowing dynamic adaptation of cards, maps, and forms.
- **Global Injection**: The theme class is injected directly into `document.body` to ensure 100% screen coverage without browser margin artifacts.

### 7. User Soft Delete Pattern
**Data Integrity Preservation**
- **Problem**: Deleting users breaks foreign key constraints on `audit_responses`.
- **Solution**: "Delete" actions perform a Soft Delete:
  1. Set `is_active` to `false` (immediate lockout).
  2. Scramble `email` (`deleted_<timestamp>_...`) to release the unique constraint.
  3. Anonymize `full_name` (`[DELETED] ...`).
- **UI Filtering**: Admin lists (`UserManagement`, `Dashboard`) automatically filter out emails starting with `deleted_`.

## Component Architecture

### Core Modules

1. **Admin Suite**
   - `UserManagement.jsx`: CRUD for auditors and quota settings.
   - `DataManagement.jsx`: Large-scale CSV ingestion (PapaParse + Supabase Batch).
   - `InventoryDashboard.jsx`: High-level monitoring via `daily_inventory_summary`.

2. **Auditor Suite**
   - `AuditorDashboard.jsx`: Focuses on personal quotas and monthly progress.
   - `AuditInterface.jsx`: The "Active Review" environment with audio controls and GPS mapping.

3. **Shared Components**
   - `MapPreview.jsx`: Leaflet-based location visualization.
   - `AuthContext.jsx`: Supabase session management.

## State Management Patterns

### Server-State Dominance
- Most state is managed by Supabase/PostgreSQL.
- `useEffect` hooks in pages fetch the latest "truth" from the database on mount or action.
- React state is used primarily for UI status (loading, submitting, local answer tracking).

### Optimistic Claiming
- When an auditor clicks "Start Audit", the record is claimed in the database *before* the UI transitions, ensuring no two auditors land on the same record.

## Technical Constraints & Guardrails
- **Daily Limit**: Enforced in the UI and can be backed by database constraints.
- **Audio Streaming**: Direct S3 playback via HTML5 API.
- **Responsive Layout**: Specialized optimizations for 13" - 16" laptop screens used by auditors.
