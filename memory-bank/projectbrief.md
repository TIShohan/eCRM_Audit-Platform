# Project Brief: eCRM Audit Platform v2.0

## Project Overview
A multi-user, industrial-scale audit management platform for systematically reviewing eCRM campaign audio recordings. Powered by Supabase, the platform enables a frictionless "Self-Service" workflow between admins and auditors.

## Vision Statement
Eliminate administrative bottlenecks by providing a high-level inventory management interface for admins and a streamlined, quota-driven pull queue for auditors.

## Core Requirements

### Automated Workflow (The "Pull" Model)
1. **Admin Ingestion**: Admins upload global CSV data which enters the unassigned pool.
2. **Auditor Claiming**: The Auditor interface automatically pulls the oldest unassigned pending record and "claims" it for the current user.
3. **No-Manual-Assignment**: Admins no longer need to pre-distribute records; they simply monitor the "Daily Quota" and "Global Available" metrics.

### Admin Features
1. **Inventory Dashboard**: High-level tracking of Total, Audited, Claimed, and Available records grouped by **Upload Date**.
2. **User Control**: Management of auditors including Full Name, Mobile, Email, and Daily Limit quotas.
3. **Data Lifecycle**: "Danger Zone" tools for purging completed audits or resetting the entire database for new campaigns.
4. **Reporting**: Advanced CSV exports merging contact metadata with auditor responses.

### Auditor Features
1. **Quota-Focused Dashboard**: Simplified UI showing only "Daily Quota Left" and "Completed Today".
2. **Seamless Navigation**: "Complete & Next" workflow that automatically claims the next available record until the daily limit is hit.
3. **Rich Context**: Interactive maps, audio player, and dynamic question rendering.

## Technical Scope
- **Backend**: Supabase (PostgreSQL + Auth).
- **Architecture**: Pull-based global queue (Self-Service).
- **Performance**: PostgreSQL Views for real-time inventory aggregation.
- **Design**: Minimalist, premium dashboard optimized for 16:9 laptop screens.

## Success Criteria
- Handle datasets of 100,000+ records without performance degradation.
- Zero administrative intervention required for day-to-day record distribution.
- Full contact metadata retention for every exported audit report.