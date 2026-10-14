import React, { useEffect, useState } from 'react';

export interface SeatBarProps {
  enrolled: number;
  capacity: number;
  showText?: boolean;
  className?: string;
}

export const SeatBar: React.FC<SeatBarProps> = ({
  enrolled,
  capacity,
  showText = true,
  className = '',
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  const ratio = capacity > 0 ? Math.min(1, Math.max(0, enrolled / capacity)) : 0;
  const percentage = Math.round(ratio * 100);

  useEffect(() => {
    // Trigger one-time animation on mount / load
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const barColor =
    ratio >= 1.0 ? 'bg-status-full' : ratio >= 0.7 ? 'bg-status-filling' : 'bg-status-open';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out motion-reduce:transition-none`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
      {showText && (
        <div className="flex justify-between items-center text-xs text-muted tabular-nums">
          <span>
            {enrolled} of {capacity} seats
          </span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
};
