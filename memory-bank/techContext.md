# Technical Context: eCRM Audit Platform v2.0

## Technology Stack

### Frontend Framework
- **React 19.1.0**: Latest React for high-performance UI rendering.
- **Vite 7.0.4**: Build tool providing fast HMR and optimized production bundles.
- **React Router 7**: Managing multi-role navigation and protected access.

### Backend Infrastructure (Supabase)
- **PostgreSQL**: The relational database engine powering storage and complex views.
- **Supabase Auth**: JWT-based authentication for admins and auditors.
- **Row Level Security (RLS)**: Fine-grained access control at the database level.
- **PostgreSQL Views**: Aggregating millions of records into lightweight summary objects.

### Core Dependencies
- **@supabase/supabase-js**: Client library for database and auth interaction.
- **PapaParse 5.5.3**: Client-side CSV parsing for initial admin uploads.
- **Leaflet 1.9.4 & React-Leaflet 5**: Providing GIS visualization for audit verification.
- **Lucide React**: Modern iconography for the professional dashbaord.

## Development & Deployment

### Environment Configuration
- `.env`: Contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- All API interactions are routed through the Supabase client initialized in `src/lib/supabase.js`.

### Production Constraints
- **Database Scale**: Designed to handle 100,000+ records in `audit_data`.
- **Concurrency**: Locking mechanisms via `UPDATE ... WHERE assigned_to IS NULL` ensure data integrity during simultaneous auditor "claims".
- **Audio Availability**: External S3 links must have appropriate CORS headers for browser-based HTML5 audio playback.

## Technical Constraints

### Browser Compatibility
- **Target**: Desktop environments (Chrome, Edge, Firefox).
- **Layout**: Optimized specifically for 13" - 16" laptop screens (the standard hardware for auditors).

### Security Model
- **Role-Based Access**: Forced at both the UI level (React Router) and the Database level (RLS).
- **Isolation**: Auditors cannot see responses or specific details of audits assigned to others.
- **Audit Trail**: Every response is linked to a unique `auditor_id` and `audit_data_id` with timestamps.

### Performance Optimizations
- **Aggregated Views**: The `daily_inventory_summary` view prevents expensive `COUNT(*)` operations on the raw table during dashboard renders.
- **Batch Insertion**: Admin imports use Supabase's batch insert capability for efficiency.
- **Lazy Loading**: Map markers and audio assets are loaded on-demand.

## Data Schema & Relationships

### Core Entities
- `user_profiles`: Extends Supabase Auth with roles and daily limits.
- `audit_data`: The central repository of campaign records.
- `questions` & `answer_options`: Relational structure for dynamic audit criteria.
- `audit_responses`: The transactional log of completed reviews.

## Deployment Pipeline
- **Hosting**: Deployed to static hosting providers (Netlify/Vercel) with Supabase as the persistent backend.
- **Build Output**: Static assets from `npm run build` are served directly.
