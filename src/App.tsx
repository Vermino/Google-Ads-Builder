import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CampaignBuilder = lazy(() => import('./pages/CampaignBuilder'));
const AdGroupBuilder = lazy(() => import('./pages/AdGroupBuilder'));
const AdBuilder = lazy(() => import('./pages/AdBuilder'));
const Automation = lazy(() => import('./pages/Automation'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/campaigns/:campaignId" element={<CampaignBuilder />} />
          <Route path="/campaigns/:campaignId/ad-groups/:adGroupId" element={<AdGroupBuilder />} />
          <Route path="/campaigns/:campaignId/ad-groups/:adGroupId/ads/:adId" element={<AdBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
