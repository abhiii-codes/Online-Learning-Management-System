import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center border border-dashed border-line rounded-container bg-surface/50 ${className}`}>
      {icon && <div className="text-muted mx-auto mb-3 flex justify-center">{icon}</div>}
      <h4 className="text-sm font-medium text-ink">{title}</h4>
      {description && <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
