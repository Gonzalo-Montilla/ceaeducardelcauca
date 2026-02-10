import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, icon, actions }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div className="page-header-card">
        <div className="page-header-title">
          {icon && <span className="page-header-icon">{icon}</span>}
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
};
