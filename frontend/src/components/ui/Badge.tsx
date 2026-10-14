import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'open' | 'filling' | 'full' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center text-xs font-normal px-2 py-0.5 rounded-control transition-colors tabular-nums';

  const variants = {
    neutral: 'bg-paper text-ink border border-line',
    open: 'bg-[#F0FDF4] text-[#1F7A4D] border border-[#BBF7D0]',
    filling: 'bg-[#FFFBEB] text-[#A15C07] border border-[#FDE68A]',
    full: 'bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]',
    outline: 'bg-transparent text-muted border border-line',
  }[variant];

  return (
    <span className={`${base} ${variants} ${className}`} {...props}>
      {children}
    </span>
  );
};
