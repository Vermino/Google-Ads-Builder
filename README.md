# Google Ads Campaign Builder

A production-ready React + TypeScript application for building and managing Google Ads campaigns with responsive search ads.

## Features

### Core Functionality
- **Full Campaign Management** - Dashboard → Campaign → Ad Group → Ad hierarchy navigation
- **Real-time Ad Preview** - Live Google Ads preview with character validation
- **Character Limits** - Google Ads compliant validation (30 char headlines, 90 char descriptions)
- **Keyword Management** - Multi-match type support (broad, phrase, exact)
- **Global Descriptions** - Reusable descriptions across ad groups

### Technical Features
- **Code Splitting** - Lazy-loaded routes for optimal performance (~100KB bundle reduction)
- **Error Boundary** - Graceful error handling with user-friendly error pages
- **Toast Notifications** - Non-intrusive user feedback system
- **Accessibility** - ARIA labels, keyboard navigation, semantic HTML
- **404 Handling** - Proper not-found routes with navigation
- **TypeScript** - Full type safety across the application
- **State Management** - Centralized Zustand store with immutable updates

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
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── CharacterCounter.tsx
│   │   ├── PageHeader.tsx
│   │   └── ErrorBoundary.tsx
│   ├── campaigns/       # Campaign-specific components
│   ├── adgroups/        # Ad Group-specific components
│   ├── ads/             # Ad-specific components
│   └── layout/          # Layout components (Breadcrumbs, etc.)
├── pages/               # Page components (lazy-loaded)
│   ├── Dashboard.tsx
│   ├── CampaignBuilder.tsx
│   ├── AdGroupBuilder.tsx
│   ├── AdBuilder.tsx
│   └── NotFound.tsx
├── hooks/               # Custom React hooks
│   └── useToast.ts
├── stores/              # Zustand state management
│   └── useCampaignStore.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── constants.ts
│   └── validation.ts
├── mock-data/           # Mock data for development
│   └── campaigns.ts
├── App.tsx              # Main app with routing & code splitting
└── main.tsx             # Entry point with error boundary
```

## Google Ads Limits

| Asset | Character Limit | Max Count |
|-------|----------------|-----------|
| Headline | 30 | 15 |
| Description | 90 | 4 |
| URL Path | 15 | 2 |

## User Flows

### Campaign Creation Flow
1. **Dashboard** - View all campaigns
2. **Campaign Builder** - Configure campaign settings, global descriptions, view ad groups
3. **Ad Group Builder** - Manage keywords, ad group settings, view ads
4. **Ad Builder** - Create/edit responsive search ads with real-time preview

### Navigation
- **Hierarchical** - Natural drill-down from campaigns → ad groups → ads
- **Back Buttons** - Navigate up the hierarchy on each page
- **Browser Support** - Full browser back/forward button support
- **Direct URLs** - Shareable URLs for deep linking to any page

## Performance

### Build Metrics (Production)
- **Main Bundle:** 433 KB (gzipped: 131 KB)
- **Dashboard:** 15 KB (gzipped: 2.3 KB)
- **Campaign Builder:** 24 KB (gzipped: 3.2 KB)
- **Ad Group Builder:** 23 KB (gzipped: 3.4 KB)
- **Ad Builder:** 28 KB (gzipped: 4.0 KB)

### Optimizations
- Code splitting with lazy-loaded routes
- Tree-shaking for unused code elimination
- Minification and compression
- Efficient re-renders with Zustand selectors

## Development Status

### Phase 1: React Web Application ✅ COMPLETE
- ✅ Project setup & tooling
- ✅ TypeScript types & validation
- ✅ Common UI components
- ✅ State management (Zustand)
- ✅ All 4 pages (Dashboard, Campaign, Ad Group, Ad Builder)
- ✅ React Router navigation
- ✅ Error handling & boundaries
- ✅ Accessibility improvements
- ✅ Code splitting & optimization
- ✅ Production build verified

### Future Phases
- ⏳ Phase 2: Tauri desktop integration
- ⏳ Phase 3: Backend API and database
- ⏳ Phase 4: AI-powered ad copy generation

## Contributing

This is a proprietary project. For internal development:

1. Create a feature branch from `main`
2. Make your changes with proper TypeScript types
3. Ensure `npm run build` passes with no errors
4. Test all user flows manually
5. Submit PR for review

## License

Proprietary - Internal Use Only
