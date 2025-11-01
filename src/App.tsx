import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CampaignBuilder from './pages/CampaignBuilder';
import AdGroupBuilder from './pages/AdGroupBuilder';
import AdBuilder from './pages/AdBuilder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/campaigns/:campaignId" element={<CampaignBuilder />} />
        <Route path="/campaigns/:campaignId/ad-groups/:adGroupId" element={<AdGroupBuilder />} />
        <Route path="/campaigns/:campaignId/ad-groups/:adGroupId/ads/:adId" element={<AdBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
