import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, breadcrumbs }) => {
  return (
    <div className="mb-6">
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex items-center justify-between">
        <div>
          {subtitle && <div className="text-sm text-gray-500 mb-1">{subtitle}</div>}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
