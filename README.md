# Google Ads Campaign Builder - Phase 1

A production-ready React + TypeScript application for building and managing Google Ads campaigns with responsive search ads.

## Features

- Full campaign management (Dashboard, Campaign Builder, Ad Group Builder, Ad Builder)
- Real-time ad preview with character validation
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Mock data for testing and development

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v3+
- **State Management:** Zustand
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **Validation:** Zod
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── campaigns/       # Campaign-specific components
│   ├── adgroups/        # Ad Group-specific components
│   └── ads/             # Ad-specific components
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── CampaignBuilder.tsx
│   ├── AdGroupBuilder.tsx
│   └── AdBuilder.tsx
├── stores/              # Zustand state management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── mock-data/           # Mock data for development
└── App.tsx              # Main app with routing
```

## Character Limits

- **Headlines:** 30 characters max
- **Descriptions:** 90 characters max
- **URL Paths:** 15 characters max

## Development Status

- ✅ Phase 1: React web application (IN PROGRESS)
- ⏳ Phase 2: Tauri desktop integration
- ⏳ Phase 3: Backend API and database
- ⏳ Phase 4: AI-powered ad copy generation

## License

Proprietary - Internal Use Only
