import React, { useEffect, useState } from 'react';

export interface SeatBarProps {
  enrolled?: number;
  capacity?: number;
  showText?: boolean;
  className?: string;
}

export const SeatBar: React.FC<SeatBarProps> = ({
  enrolled = 0,
  capacity = 0,
  showText = true,
  className = '',
}) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const safeEnrolled = enrolled ?? 0;
  const safeCapacity = capacity ?? 0;
  const freeSeats = Math.max(0, safeCapacity - safeEnrolled);

  // Bar fill represents seats LEFT (not seats taken)
  const freePercent = safeCapacity > 0 ? (freeSeats / safeCapacity) * 100 : 0;
  const filledPercent = safeCapacity > 0 ? Math.min(100, Math.round((safeEnrolled / safeCapacity) * 100)) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(freePercent);
    }, 40);
    return () => clearTimeout(timer);
  }, [freePercent]);

  // Availability coloring based on percentage of seats LEFT:
  // Green above 50% free, amber 20-50% free, red below 20% free
  const barColor =
    freePercent > 50
      ? 'bg-emerald-500'
      : freePercent >= 20
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out motion-reduce:transition-none`}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
      {showText && (
        <div className="flex justify-between items-center text-xs text-muted dark:text-slate-400 tabular-nums">
          <strong className="font-bold text-ink dark:text-slate-100 transition-colors">
            {freeSeats} seats left
          </strong>
          <span>
            {safeEnrolled} of {safeCapacity} ({filledPercent}%)
          </span>
        </div>
      )}
    </div>
  );
};
