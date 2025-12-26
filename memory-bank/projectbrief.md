# Project Brief: eCRM Audit Platform v2.0

## Project Overview
The eCRM Audit Platform is a multi-user, database-driven web application for systematic review and quality assessment of eCRM (Electronic Customer Relationship Management) campaign audio recordings. The platform features role-based access control with Admin and Auditor roles, automated workflow management, and centralized data storage using Supabase.

## Vision Statement
Transform manual CSV-based auditing into an automated, scalable platform where administrators control data flow, question configuration, and user management, while auditors focus solely on efficient audio review with real-time progress tracking.

## Core Requirements

### Multi-User System
1. **Authentication & Authorization**: Email/password login with role-based access (Admin/Auditor)
2. **User Management**: Admin creates users, assigns roles, sets daily work limits
3. **Database-Driven**: All data stored in Supabase PostgreSQL (no localStorage dependency)
4. **Automated Workflow**: Admins upload CSV → assign to auditors → auditors complete work → admins export results

### Admin Functionality
1. **User Management**: Create users, assign roles, set daily limits, view per-user metrics
2. **Data Management**: Upload CSV to database, assign records (manual or auto-distribute)
3. **Question Configuration**: Create/edit common and campaign-specific questions with answer options
4. **Reporting**: Export audit results with date range filtering

### Auditor Functionality
1. **Dashboard**: View assigned records, completed count, remaining work, daily limit status
2. **Audit Interface**: Audio playback, contact details, map visualization, dynamic questions
3. **Answer Submission**: All answers auto-saved to database
4. **Daily Limit Enforcement**: Cannot exceed admin-set daily work limit

### Preserved Features from v1.0
- Audio player with variable speed and skip controls
- Interactive map visualization (Leaflet + OpenStreetMap)
- Bengali language support
- CSV export with UTF-8 BOM encoding
- Clean, minimal UI design

## Target Users
- **Admins**: QA managers, campaign supervisors
- **Auditors**: Quality assurance team members, internal reviewers

## Key Constraints
- **Backend**: Supabase free tier only
- **Audio Storage**: S3 URLs stored as text (no file uploads to Supabase)
- **No Manual CSV**: Auditors never handle CSV files
- **Role Separation**: Strict access control between admin and auditor functions
- **Daily Limits**: Enforced at application level

## Success Criteria
- Admin can onboard new auditor in < 2 minutes
- Admin can upload and assign 500 records in < 1 minute
- Auditor completes one audit in < 3 minutes (same as v1.0)
- Zero data loss with database persistence
- Questions configurable without code changes

## Technical Scope
- Multi-page React application with routing
- Supabase backend (Auth, Database, RLS policies)
- Role-based dashboards (Admin vs Auditor)
- CSV parsing for admin upload only
- Responsive design for desktop usage
- Modern browser compatibility 