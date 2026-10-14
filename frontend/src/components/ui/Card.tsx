import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-surface border border-line rounded-container overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-line bg-surface flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-line bg-paper/50 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
