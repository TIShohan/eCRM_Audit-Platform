# Project Brief: eCRM Audio Portal

## Project Overview
The eCRM Audio Portal is an internal audit tool designed for reviewing and quality-assessing audio recordings from eCRM (Electronic Customer Relationship Management) campaigns. This React-based web application enables quality assurance teams to systematically review recorded conversations between Research Associates (RAs) and customers.

## Core Requirements

### Primary Functionality
1. **CSV Data Processing**: Import CSV files containing contact information, campaign details, and audio file links
2. **Audio Review Interface**: Play and control audio recordings with enhanced playback features
3. **Structured Questioning System**: 
   - Common questions applied to all audio reviews
   - Campaign-specific questions based on campaign ID
4. **Answer Collection & Export**: Save reviewer responses and export comprehensive CSV reports
5. **Progress Tracking**: Maintain review state with localStorage persistence
6. **Location Visualization**: Display contact locations on interactive maps

### User Workflow
1. Upload CSV file with contact and audio data
2. Navigate through contacts sequentially  
3. Listen to audio recordings while reviewing contact details
4. Answer standardized questions about call quality and compliance
5. Export completed reviews as structured CSV reports

## Target Users
- Quality Assurance teams
- Campaign managers
- Internal auditors reviewing eCRM call quality

## Key Constraints
- Bengali language support for questions and interface elements
- Offline-capable with localStorage persistence
- Audio files hosted on AWS S3
- CSV import/export functionality required
- No user authentication system needed (internal tool)

## Success Criteria
- Streamlined audio review process
- Consistent data collection across all campaigns
- Easy export of audit results
- Reliable progress tracking and state management

## Technical Scope
- Single-page React application
- File-based data processing (no backend required)
- Responsive design for desktop usage
- Modern browser compatibility 