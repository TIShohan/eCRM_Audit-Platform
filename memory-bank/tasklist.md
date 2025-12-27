# Tasklist: eCRM Audit Platform v2.0

## Phase 7: Reporting (Done ✅)
- [x] Create Reports Page (`src/pages/admin/Reports.jsx`)
- [x] Implement Export Query with table joins
- [x] Generate CSV with full metadata retention
- [x] Fix database relationship joins for export

---

## Phase 8: Auditor Dashboard & Interface (Done ✅)
- [x] Create Auditor Layout (`src/pages/auditor/AuditorLayout.jsx`)
- [x] Create Auditor Dashboard (`src/pages/auditor/AuditorDashboard.jsx`)
- [x] Implement Audit Queue Logic (Auto-fetch next pending)
- [x] Create Audit Interface (`src/pages/auditor/AuditInterface.jsx`)
- [x] Fix "Complete & Next" transition logic
- [x] Use `upsert` for answers to prevent duplicate key errors
- [x] Integrate Audio Controls & Map Preview

---

## Phase 9: Final Polish & Verification
**Goal**: Ensure production readiness and consistent look & feel.

### Task 9.1: Laptop View Optimizations
- [ ] Check sidebar/header spacing on 13-inch and 15-inch screens.
- [ ] Ensure the Audit Interface questions column doesn't overlap on smaller widths.

### Task 9.2: Data Integrity & Security
- [ ] Verify RLS Policies: Ensure Auditors cannot see other auditors' assigned data.
- [ ] Verify RLS Policies: Ensure Auditors cannot modify questions or user profiles.

---

## Phase 10: Completion
- [ ] Final end-to-end user test.
- [ ] Final documentation update.
