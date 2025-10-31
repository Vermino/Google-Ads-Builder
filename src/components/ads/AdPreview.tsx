import React from 'react';
import type { ResponsiveSearchAd } from '@/types';

export interface AdPreviewProps {
  ad: ResponsiveSearchAd;
}

const AdPreview: React.FC<AdPreviewProps> = ({ ad }) => {
  // Extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'example.com';
    }
  };

  // Build display URL
  const buildDisplayUrl = (): string => {
    const domain = getDomain(ad.finalUrl);
    const parts = [domain];
    if (ad.path1) parts.push(ad.path1);
    if (ad.path2) parts.push(ad.path2);
    return parts.join(' › ');
  };

  // Get first 3 headlines with content
  const getPreviewHeadlines = (): string => {
    const headlines = ad.headlines
      .filter((h) => h.text.trim().length > 0)
      .slice(0, 3)
      .map((h) => h.text);

    return headlines.length > 0 ? headlines.join(' | ') : 'Your headlines will appear here';
  };

  // Get first 2 descriptions with content
  const getPreviewDescriptions = (): string => {
    const descriptions = ad.descriptions
      .filter((d) => d.text.trim().length > 0)
      .slice(0, 2)
      .map((d) => d.text);

    return descriptions.length > 0 ? descriptions.join(' ') : 'Your descriptions will appear here.';
  };

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Ad Preview</h2>
        </div>

        {/* Google-style Ad Preview */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-gray-600 mb-1">Ad</div>
          <div className="text-sm text-green-700 mb-1">{buildDisplayUrl()}</div>
          <div className="text-xl text-blue-600 hover:underline cursor-pointer mb-2 leading-tight">
            {getPreviewHeadlines()}
          </div>
          <div className="text-sm text-gray-700 leading-snug">{getPreviewDescriptions()}</div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips for Better Ads</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use landing page copy for better message match</li>
            <li>• Include numbers and social proof (35,000+ members)</li>
            <li>• Lead with benefits, not features</li>
            <li>• Add risk reversals (10-day trial, cancel anytime)</li>
            <li>• Avoid saturated messaging ("professional service")</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdPreview;
