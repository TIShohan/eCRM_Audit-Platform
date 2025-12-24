# Technical Context: eCRM Audio Portal

## Technology Stack

### Frontend Framework
- **React 19.1.0**: Latest React with modern hooks and concurrent features
- **Vite 7.0.4**: Fast build tool and development server
- **ES Modules**: Modern JavaScript module system

### Core Dependencies

#### Data Processing
- **PapaParse 5.5.3**: CSV parsing and generation
  - Handles CSV import with header mapping
  - Manages encoding issues with Bengali text
  - Provides robust error handling for malformed CSV files

#### Mapping & Visualization
- **Leaflet 1.9.4**: Interactive maps library
- **React-Leaflet 5.0.0**: React wrapper for Leaflet
  - Displays contact locations on OpenStreetMap
  - Handles coordinate parsing and validation
  - Provides popup functionality for location details

#### Audio Processing
- **HTML5 Audio API**: Native browser audio support
  - No external audio libraries required
  - Variable playback speed support
  - Built-in controls and progress tracking

### Development Tools

#### Code Quality
- **ESLint 9.30.1**: JavaScript linting with React-specific rules
- **@eslint/js**: Core ESLint configuration
- **eslint-plugin-react-hooks**: React Hooks linting rules
- **eslint-plugin-react-refresh**: Hot reload compatibility

#### Build System
- **@vitejs/plugin-react 4.6.0**: React integration for Vite
- **PostCSS**: CSS processing (implicit via Vite)
- **ES2022**: Modern JavaScript features support

## Development Environment

### Setup Requirements
```bash
# Node.js version: 18+ (for ES modules support)
# Package manager: npm (included with Node.js)

# Installation
npm install

# Development server
npm run dev        # Runs on http://localhost:5173

# Production build
npm run build      # Outputs to dist/

# Linting
npm run lint       # ESLint check

# Preview production build
npm run preview    # Serves built files locally
```

### Development Server Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

## Technical Constraints

### Browser Compatibility
- **Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Required Features**:
  - ES2022 module support
  - HTML5 Audio API
  - FileReader API
  - localStorage API
  - CSS Grid and Flexbox

### Performance Requirements
- **Audio Loading**: Streaming audio from AWS S3 URLs
- **Memory Usage**: Handle datasets up to 1000+ contacts
- **Storage Limits**: localStorage ~5-10MB typical usage
- **Network**: Works offline after initial load

### Security Considerations
- **No Authentication**: Internal tool, no user management
- **CORS**: Audio files must allow cross-origin requests
- **Data Privacy**: All data stored locally in browser
- **File Validation**: CSV structure validation required

## Data Formats & Integration

### CSV Input Format
```csv
Contact_id,Contact_Date,audio_links,campaign_id,campaign,Contact_Location,...
12663294,7/20/2025,https://s3-url.mp3,146,"BD Circle 1-2-1","25.67192204,88.91558146"
```

**Required Fields:**
- `Contact_id`: Unique identifier
- `audio_links`: S3 URL to MP3 files
- `campaign_id`: Numeric campaign identifier
- `campaign`: Campaign name/description
- `Contact_Location`: Comma-separated lat,lng coordinates

### Audio File Requirements
- **Format**: MP3 files hosted on AWS S3
- **Access**: Public read access or signed URLs
- **Encoding**: Standard MP3 encoding compatible with HTML5 Audio
- **Duration**: Typically 2-15 minutes per recording

### Question Configuration
```json
// commonQuestions.json
[
  {
    "question": "Q1. অডিও কোয়ালিটি কেমন ?",
    "options": ["ভালো", "কিছুই শোনা যাচ্ছে না", "বুজতে কষ্ট হচ্ছে"]
  }
]

// FixedQuestions.json  
{
  "985": [
    {
      "question": "Campaign-specific question text",
      "options": ["Yes", "No"]
    }
  ]
}
```

## Deployment Architecture

### Static Hosting
- **Target**: Static file hosting (Netlify, Vercel, S3 + CloudFront)
- **Build Output**: Single-page application in `dist/` folder
- **Assets**: All resources bundled and optimized by Vite

### Environment Configuration
```javascript
// No environment variables currently required
// All configuration handled through JSON files
```

### File Structure
```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index-[hash].js # Bundled JavaScript
│   ├── index-[hash].css # Bundled CSS
│   └── [assets]        # Images, fonts, etc.
└── vite.svg           # Favicon
```

## Development Patterns

### Hot Module Replacement
- Vite provides instant updates during development
- React Fast Refresh preserves component state
- CSS changes apply immediately without page reload

### Code Organization
```
src/
├── App.jsx                 # Main application component
├── App.css                 # Global styles
├── main.jsx               # React root mounting
├── index.css              # Base CSS styles
├── commonQuestions.json    # Question configuration
├── FixedQuestions.json    # Campaign-specific questions
└── components/
    ├── DownloadCSVButton.jsx
    ├── MapPreview.jsx
    ├── ConfirmationModal.jsx
    └── ConfirmationModal.css
```

### Styling Approach
- **CSS-in-JS**: Inline styles for dynamic styling
- **CSS Files**: Separate files for reusable component styles
- **No Framework**: Custom CSS without UI library dependencies
- **Responsive**: CSS Grid and Flexbox for layout 