# Product Context: eCRM Audit Platform v2.0

## Problem Statement

### The Challenge
eCRM campaigns generate thousands of audio recordings daily. Without a systematic, scalable review process, quality assurance is:
- **Bottle-necked**: Manual assignment of files to auditors is slow and prone to errors.
- **Inconsistent**: Auditors may follow different evaluation standards without centralized question management.
- **Opaque**: Tracking progress across massive datasets is difficult without real-time aggregation.
- **Insecure**: Sharing files and results via spreadsheets leads to data leaks and versioning issues.

## Solution Approach

### Core Value Proposition
A cloud-native, industrial-scale audit management system that automates the distribution of work via a self-service queue and centralizes evaluation data for instant reporting.

### Key Problems Solved (v2.0)

1. **Automated Distribution (Self-Service)**:
   - Eliminates manual assignment; auditors "pull" work as they go.
   - Enforces daily quotas automatically per user.

2. **Centralized Question Management**:
   - Admins can update audit criteria instantly via a UI.
   - Supports both global and campaign-specific logic.

3. **High-Scale Monitoring**:
   - Real-time inventory tracking (Total, Audited, Available) across huge datasets.
   - Professional dashboard for management to monitor campaign health.

4. **Data Security & Integrity**:
   - Row Level Security (RLS) ensures auditors only access their own assigned or unassigned data.
   - Centralized database prevents "lost" results or duplicate reviews.

## User Experience Goals

### Primary User Journeys
1. **The Admin**: Uploads bulk CSV data, manages auditors/quotas, and exports final reports.
2. **The Auditor**: Logs in, sees their daily target, and works through a seamless "Complete & Next" queue.

### Design Principles
- **Operational Focus**: The interface is optimized for speed and repetition.
- **No Friction**: Automate every step between "Review" and "Next Record".
- **Contextual Clarity**: All metadata (location, campaign, dates) is visible alongside the audio player.

## Business Impact
- **Throughput**: Significantly increases the number of audits performed per day by eliminating administrative overhead.
- **Accuracy**: Dynamic forms andGPS mapping provide higher confidence in audit results.
- **Speed-to-Insight**: Exportable data is always ready for stakeholder review, with no manual merging required.
