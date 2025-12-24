# eCRM Audio Portal

An internal quality assurance tool for reviewing and auditing audio recordings from eCRM (Electronic Customer Relationship Management) campaigns. This React-based web application enables QA teams to systematically review recorded conversations between Research Associates (RAs) and customers.

## 🎯 Purpose

The eCRM Audio Portal streamlines the audio review process by providing:
- **Structured Quality Assessment**: Standardized questions for consistent evaluation
- **Enhanced Audio Controls**: Variable playback speed, skip controls, and progress tracking  
- **Progress Management**: Automatic saving and restoration of review progress
- **Comprehensive Reporting**: Export detailed CSV reports of all reviews
- **Location Visualization**: Interactive maps showing contact locations

## ✨ Features

### Core Functionality
- **CSV Data Import**: Upload contact and campaign data with audio links
- **Audio Player**: HTML5 audio with enhanced controls (1x, 1.25x, 1.5x playback speeds)
- **Question System**: 
  - Common questions for all contacts (Bengali language)
  - Campaign-specific questions based on campaign ID
- **Progress Tracking**: Automatic localStorage persistence across browser sessions
- **Interactive Maps**: Leaflet integration for contact location visualization
- **CSV Export**: Generate comprehensive reports with UTF-8 encoding
- **Data Validation**: Answer completion validation before navigation
- **Reset Functionality**: Two-step confirmation for data clearing

### User Interface
- Clean, focused design for efficient audio review
- Sequential navigation through contacts
- Real-time progress indicators
- Visual feedback for selected answers
- Responsive layout optimized for desktop use

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for ES modules support)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ecrm_audio_portal

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Usage

### 1. Data Upload
1. Prepare a CSV file with the following required columns:
   - `Contact_id`: Unique contact identifier
   - `audio_links`: URL to MP3 audio files (typically AWS S3)
   - `campaign_id`: Numeric campaign identifier
   - `campaign`: Campaign name/description
   - `Contact_Location`: Comma-separated latitude,longitude coordinates

2. Click "Choose File" and select your CSV file
3. Wait for successful upload confirmation

### 2. Audio Review Process
1. Navigate through contacts using Previous/Next buttons
2. Listen to audio recordings using the enhanced player controls
3. Review contact details and location information
4. Answer all required questions:
   - **Common Questions**: Applied to every contact
   - **Campaign Questions**: Specific to the current campaign
5. Complete all questions before proceeding to the next contact

### 3. Export Results
1. Click "Download Review Answers CSV" to export all responses
2. The generated CSV will include:
   - Contact information
   - All question texts as column headers
   - Reviewer responses for each contact

### 4. Session Management
- Progress is automatically saved in your browser
- Resume reviews after closing/reopening the browser
- Use "Reset App" to clear all data and start fresh

## 🛠 Technology Stack

- **React 19.1.0**: Modern React with hooks and concurrent features
- **Vite 7.0.4**: Fast build tool and development server
- **PapaParse 5.5.3**: Robust CSV parsing and generation
- **Leaflet 1.9.4 + React-Leaflet 5.0.0**: Interactive mapping
- **HTML5 Audio API**: Native browser audio support
- **LocalStorage**: Client-side data persistence

## 📁 Project Structure

```
ecrm_audio_portal/
├── memory-bank/              # Project documentation system
│   ├── projectbrief.md       # Project scope and requirements
│   ├── productContext.md     # Business context and goals
│   ├── systemPatterns.md     # Architecture and design patterns
│   ├── techContext.md        # Technology stack and setup
│   ├── activeContext.md      # Current work focus and state
│   └── progress.md           # Implementation status
├── src/
│   ├── App.jsx               # Main application component
│   ├── App.css               # Global styles
│   ├── main.jsx              # React root mounting
│   ├── index.css             # Base CSS styles
│   ├── commonQuestions.json  # Universal questions configuration
│   ├── FixedQuestions.json   # Campaign-specific questions
│   └── components/
│       ├── DownloadCSVButton.jsx
│       ├── MapPreview.jsx
│       ├── ConfirmationModal.jsx
│       └── ConfirmationModal.css
├── public/                   # Static assets
├── package.json              # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## 🔧 Configuration

### Question Management
Questions are configured through JSON files in the `src/` directory:

- **`commonQuestions.json`**: Questions applied to all contacts
- **`FixedQuestions.json`**: Campaign-specific questions mapped by campaign_id

### Audio Requirements
- **Format**: MP3 files compatible with HTML5 Audio
- **Hosting**: AWS S3 URLs with appropriate CORS configuration
- **Duration**: Typically 2-15 minutes per recording

## 🚀 Deployment

The application builds to a static site suitable for hosting on:
- Netlify
- Vercel  
- AWS S3 + CloudFront
- Any static file hosting service

```bash
npm run build
# Deploy contents of dist/ folder
```

## 📝 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint checks
```

## 🎯 Key Features for QA Teams

- **Consistency**: Standardized questions ensure uniform evaluation criteria
- **Efficiency**: Enhanced audio controls and progress tracking speed up reviews
- **Reliability**: Automatic progress saving prevents data loss
- **Reporting**: Comprehensive CSV exports for management reporting
- **Offline Capable**: Works without internet after initial data upload

## 🔒 Privacy & Security

- **No Authentication**: Designed for internal use without login requirements
- **Client-Side Processing**: All data remains in the browser
- **Local Storage**: No external databases or servers required
- **Data Control**: Users maintain complete control over their data

## 📞 Support

This is an internal tool designed for eCRM quality assurance workflows. For questions about usage or configuration, refer to the documentation in the `memory-bank/` directory.

## 📄 License

Internal company tool - All rights reserved.
