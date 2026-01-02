# Active Context: eCRM Audit Platform v2.0

## Current Work Focus
**Status**: 🚀 Production Ready & Deployed
The platform is currently in maintenance mode with all core v2.0 features implemented, including the Self-Service "Pull" model and industrial-scale inventory management.

## Recent Changes
- **Duplicate Prevention**: CSV uploads now check for existing `contact_id` records. If duplicates found, admin sees warning modal with stats (total/duplicates/new) and can choose to proceed with only new records or cancel.
- **User Management**: Implemented "Soft Delete" for auditors (Anonymize + Deactivate) to preserve audit history. Updated Admin Dashboards to filter out deleted users. Added self-protection: admins cannot deactivate themselves.
- **Data Ingestion Standard**: Implemented strict date standardization during upload (`standardDate` helper) to normalize mixed CSV formats (UD/Intl) to `YYYY-MM-DD`.
- **Report Reliability**: Rewrote CSV key generation to scan all questions, preventing data loss. Added `Campaign_ID`, legacy question handling, and strictly ordered by `Completed_At`.
- **Admin UX**: Added "Quick Select: Whole Month" to Reports page for one-click exports.
- **Soft Dark Mode**: Implemented a premium auditor-only dark theme (Slate-based) with persistent storage and a dedicated toggle in the header.
- **Tactile Feedback**: Enhanced audio player skip buttons and submission buttons with tactile `onMouseDown/onMouseUp` animations for a physical interaction feel.
- **UI Stability**: Removed hover-based animations from interactive buttons to reduce visual noise and improve workflow stability.
- **Phase 11: High-Scale Optimization**: Fully implemented the "Global Queue" pull model, removing manual assignment bottlenecks.
- **Admin Dashboard**: Transitioned from record-level view to a Daily Inventory Summary aggregated view for better performance with large datasets.
- **Soft-Delete Archiving**: Added `is_archived` flag to `audit_data` to hide completed records from active dashboards.
- **NPM Scripts**: Added `npm start` alias for `npm run dev` for standard deployment compatibility.
- **High-Performance Pull**: Optimized auditor record "claiming" by moving logic from JS to an atomic SQL RPC function (`claim_audit_batch`). Reduced requests from 6 per pull to 1, utilizing `FOR UPDATE SKIP LOCKED` for high-concurrency safety.
- **Database Optimization**: Added B-tree indexes on `status`, `assigned_to`, `contact_id`, and `campaign_id` to ensure sub-millisecond query performance at 100k+ scale.

## Current Objectives
- [x] All core v2.0 phases completed.
- [ ] Monitor production performance with 100k+ records.
- [ ] Gather user feedback for potential v2.1 reporting enhancements.

## Project Progress

### Phase 11: High-Scale & Self-Service Optimization
- ✅ Implemented Global Queue (Pull Model) for auditors.
- ✅ Created `daily_inventory_summary` PostgreSQL view.
- ✅ Developed Daily Summary Dashboard for admins.
- ✅ Implemented business-specific monthly reset logic (5th of the month).
- ✅ Implemented Soft-Delete Archiving for completed records.

### Phase 1-10: Foundation & Transformation
- ✅ Migrated from local v1 tools to Supabase Cloud architecture.
- ✅ Implemented Role-Based Access Control (Admin/Auditor).
- ✅ Built dynamic Question Management system.
- ✅ Developed robust CSV ingestion with full metadata retention.
- ✅ Polished UI/UX for professional audit workflows.

## Current System State
- **Infrastructure**: Supabase (PostgreSQL + Auth + Storage).
- **Backend Logic**: Database-driven queue with "claiming" locks via RLS and Updates.
- **Admin UI**: High-level inventory monitoring and User/Question management.
- **Auditor UI**: Streamlined focus on daily targets and seamless "Complete & Next" workflow.

## Next Steps
1. Performance benchmarking for extremely large CSV imports.
2. Exploratory work for mobile-optimized auditor view (if requested).
3. Advanced analytics for auditor error rates.
