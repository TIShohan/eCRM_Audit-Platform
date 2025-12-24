# Active Context: eCRM Audio Portal

## Current Work Focus

### Memory Bank System Setup (In Progress)
**Objective**: Establish comprehensive documentation system for project continuity across sessions.

**Current Status**: Setting up all 6 core Memory Bank files to document project understanding, architecture, and current state.

**Next Immediate Steps**:
1. Complete Memory Bank file creation (progress.md remaining)
2. Validate all documentation accuracy against codebase
3. Ready system for future development tasks

## Recent Changes

### Documentation Creation (Current Session)
- ✅ Created `projectbrief.md` - Project scope and requirements definition
- ✅ Created `productContext.md` - Business context and user experience goals  
- ✅ Created `systemPatterns.md` - Architecture patterns and component relationships
- ✅ Created `techContext.md` - Technology stack and development setup
- 🔄 Creating `activeContext.md` - Current state tracking (this file)
- ✅ Updated `progress.md` - Implementation status and remaining work

### Project Analysis Completed
- Comprehensive codebase review of all components
- Analysis of data flow and state management patterns
- Understanding of CSV processing and question management system
- Review of audio playback and export functionality

### Feature Updates (Current Session)
- **Modified `commonQuestions.json`**: Split Q7 into three separate questions (Primary, Secondary, Previous) and renumbered subsequent questions.
- **Modified `App.jsx`**: Changed common questions layout to a 5-column grid.
- **Modified `MapPreview.jsx`**: Controlled map interactivity (disabled pan/zoom, re-enabled zoom buttons).
- **Implemented Dynamic CSV Filename**: Downloaded file is now named `[uploaded_file_name]_answers.csv`. This involved changes in `App.jsx` (passing prop) and `DownloadCSVButton.jsx` (receiving prop and implementing filename logic).

## Current System State

### Application Functionality (Stable)
The application is fully functional with the following working features:

**Data Management**:
- ✅ CSV file upload and parsing with PapaParse
- ✅ LocalStorage persistence across browser sessions
- ✅ Contact/campaign data processing and validation

**Audio Review Interface**:
- ✅ HTML5 audio player with enhanced controls
- ✅ Variable playback speed (1x, 1.25x, 1.5x)
- ✅ Skip forward/backward functionality (5-second intervals)
- ✅ Play/pause state management

**Question System**:
- ✅ Common questions for all contacts (Bengali language)
- ✅ Campaign-specific questions based on campaign_id
- ✅ Answer validation and progress tracking
- ✅ Visual feedback for selected options

**Navigation & Progress**:
- ✅ Sequential contact navigation (Previous/Next)
- ✅ Progress indication (current/total contacts)
- ✅ Answer completion validation before navigation
- ✅ Contact and campaign details display

**Data Export**:
- ✅ CSV generation with UTF-8 BOM encoding
- ✅ Comprehensive answer export with all question texts as headers
- ✅ File download functionality

**Location Features**:
- ✅ Interactive map display using Leaflet
- ✅ Coordinate parsing from CSV data
- ✅ Geographic visualization of contact locations

**Utility Features**:
- ✅ Application reset with two-step confirmation
- ✅ Upload success feedback
- ✅ Responsive design for desktop usage

## Active Decisions & Considerations

### Technical Architecture Choices
1. **No Backend Required**: All processing happens client-side
2. **LocalStorage for Persistence**: Reliable offline functionality
3. **Single Component Architecture**: Simplified state management
4. **JSON-driven Questions**: Flexible question configuration

### Current Design Patterns
1. **State Centralization**: All application state managed in App.jsx
2. **Progressive Enhancement**: Works offline after initial load
3. **Defensive Programming**: Extensive validation and error handling
4. **User Experience Priority**: Blocking navigation until answers complete

### Language & Localization
- **Bengali Questions**: Primary questions in Bengali script
- **Mixed Language Interface**: Some English UI elements
- **UTF-8 Encoding**: Proper character encoding for CSV export

## Important Implementation Insights

### Data Flow Understanding
```
CSV Upload → PapaParse → Data Validation → State Update → LocalStorage
         ↓
Audio Controls → HTML5 API → State Management → Progress Tracking
         ↓
Question Rendering → Answer Collection → Validation → Export Generation
```

### Critical Dependencies
1. **PapaParse**: Essential for CSV processing with header mapping
2. **React-Leaflet**: Required for map functionality  
3. **LocalStorage**: Core persistence mechanism
4. **HTML5 Audio**: Native audio playback without external libraries

### Performance Characteristics
- **Memory Efficient**: Only current contact loaded in UI
- **Storage Optimized**: JSON serialization for answers
- **Network Minimal**: No API calls after CSV upload
- **Responsive UI**: React state updates drive all interactions

## Development Environment Status

### Current Setup
- **Node.js**: Modern version with ES modules support
- **Vite**: Fast development server on port 5173
- **ESLint**: Code quality and React-specific linting
- **Package Management**: npm with lockfile for consistency

### Working Directory Structure
```
ecrm_audio_portal/
├── memory-bank/           # Documentation system (NEW)
│   ├── projectbrief.md    # ✅ Created
│   ├── productContext.md  # ✅ Created  
│   ├── systemPatterns.md  # ✅ Created
│   ├── techContext.md     # ✅ Created
│   ├── activeContext.md   # 🔄 This file
│   └── progress.md        # ⏳ Pending
├── src/                   # Application source
├── public/                # Static assets
├── package.json           # Dependencies and scripts
└── [other config files]   # Build and tool configuration
```

## Next Steps & Priorities

### Immediate (This Session)
1. **Complete Memory Bank Setup**: Finish creating `progress.md`
2. **Validate Documentation**: Ensure all files accurately reflect current state
3. **Ready for Development**: Prepare for future coding tasks

### Future Sessions (When Requested)
1. **Feature Enhancements**: Based on user requirements
2. **Performance Optimizations**: If needed for larger datasets
3. **UI/UX Improvements**: Enhanced user experience features
4. **Testing Implementation**: Unit tests for critical functionality

## Memory Bank Maintenance Notes

### When to Update This File
- Before starting any new development task
- After completing significant features or changes
- When discovering new patterns or insights about the system
- When user provides new requirements or feedback

### Key Tracking Areas
- Changes to component architecture
- Updates to data flow or state management
- New dependencies or technical decisions
- User feedback and requested modifications
- Performance or compatibility issues discovered 