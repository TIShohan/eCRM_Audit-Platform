# System Patterns: eCRM Audio Portal

## Architecture Overview

### Single-Page Application Pattern
- **React SPA**: Single `App.jsx` component managing all application state
- **No routing**: Linear workflow doesn't require complex navigation
- **Component-based**: Modular UI components for reusability

### Data Flow Architecture

```
CSV Upload → PapaParse → State Management → LocalStorage Persistence
     ↓              ↓              ↓              ↓
File Input → Parsed Data → React State → Browser Storage
     ↓              ↓              ↓              ↓
Validation → Contact List → Current Index → Progress Tracking
```

## Key Design Patterns

### 1. State Management Pattern
**Centralized State in App Component**
- Single source of truth for all application data
- React hooks (`useState`, `useEffect`) for state management
- No external state management library needed due to application simplicity

```jsx
const [data, setData] = useState([]);           // Contact/campaign data
const [currentIndex, setCurrentIndex] = useState(0);  // Current contact
const [answers, setAnswers] = useState({});     // User responses
const [uploadSuccess, setUploadSuccess] = useState(false);
```

### 2. Persistence Pattern
**LocalStorage Integration**
- Automatic persistence on every state change
- State restoration on application reload
- Separate localStorage keys for different data types

```javascript
// Save pattern
useEffect(() => {
  localStorage.setItem('audioReviewData', JSON.stringify(data));
  localStorage.setItem('audioReviewAnswers', JSON.stringify(answers));
}, [data, answers]);

// Restore pattern
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('audioReviewData');
  return saved ? JSON.parse(saved) : [];
});
```

### 3. Question Management Pattern
**JSON-Driven Question System**
- `commonQuestions.json`: Universal questions for all contacts
- `FixedQuestions.json`: Campaign-specific questions by campaign_id
- Dynamic question rendering based on campaign context

```javascript
// Common questions: Applied to every contact
commonQuestions.map((q, qIndex) => ...)

// Fixed questions: Based on current campaign
fixedQuestions[user.campaign_id]?.map((q, qIndex) => ...)
```

### 4. Answer Storage Pattern
**Hierarchical Answer Structure**
```javascript
answers = {
  [contactId]: {
    common: [answer1, answer2, ...],    // Common question responses
    fixed: [answer1, answer2, ...]      // Campaign-specific responses
  }
}
```

## Component Architecture

### Core Components

1. **App.jsx** (Main Container)
   - State management hub
   - CSV processing logic
   - Navigation controls
   - Question rendering

2. **DownloadCSVButton.jsx** (Export Functionality)
   - Answer aggregation
   - CSV generation with proper encoding
   - File download handling

3. **MapPreview.jsx** (Location Visualization)
   - Leaflet map integration
   - Coordinate parsing and validation
   - Geographic visualization of contact locations

4. **ConfirmationModal.jsx** (User Confirmations)
   - Two-step confirmation pattern
   - App reset functionality
   - Data loss prevention

### Component Relationships

```
App (Root)
├── File Upload (Inline)
├── Contact Details (Inline)
├── MapPreview (Location visualization)
├── Audio Player (Native HTML5)
├── Question Forms (Dynamic rendering)
├── Navigation Controls (Inline)
├── DownloadCSVButton (Export)
└── ConfirmationModal (Reset confirmation)
```

## Critical Implementation Paths

### 1. CSV Processing Pipeline
```
File Input → FileReader API → PapaParse → Data Validation → State Update
```

**Key Logic:**
- Header mapping from CSV columns to application fields
- Data filtering (remove invalid entries)
- Contact deduplication by contact_id

### 2. Audio Management System
```
Audio URL → HTML5 Audio Element → Playback Controls → Speed Management
```

**Key Features:**
- Variable playback speed (1x, 1.25x, 1.5x)
- Skip forward/backward (5-second intervals)
- Play/pause state management
- Progress tracking integration

### 3. Question Validation System
```
Question Rendering → User Input → Answer Validation → Progress Check
```

**Validation Rules:**
- All common questions must be answered
- All campaign-specific questions must be answered
- Navigation blocked until current contact is complete

### 4. Export Generation
```
Answer Collection → Data Aggregation → CSV Formatting → File Download
```

**Export Logic:**
- Header generation from question texts
- Answer mapping across all contacts
- UTF-8 BOM encoding for proper character display

## State Synchronization Patterns

### Automatic Persistence
Every state change triggers localStorage update to ensure data integrity across browser sessions.

### Progressive Enhancement
Application works offline once loaded, with no external API dependencies beyond initial CSV upload.

### Error Boundaries
Graceful handling of:
- Invalid CSV formats
- Missing audio files  
- Corrupted localStorage data
- Network connectivity issues

## Performance Considerations

### Memory Management
- Single contact loaded in UI at a time
- Lazy loading of audio files
- Minimal DOM updates through React's diffing

### Storage Optimization  
- JSON serialization for localStorage
- Efficient answer indexing by contact_id
- Progress state compression 