import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-line/70 rounded animate-pulse ${width} ${height} ${className}`}
      {...props}
    />
  );
};

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => {
  return (
    <div className="flex items-center space-x-4 py-3 px-4 border-b border-line last:border-b-0 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-line/70 rounded flex-1"
          style={{ maxWidth: i === 0 ? '120px' : i === cols - 1 ? '80px' : 'auto' }}
        />
      ))}
    </div>
  );
};
