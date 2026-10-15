import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-accent text-white hover:bg-[#243CA8] active:bg-[#1C2230] border border-transparent shadow-none',
    secondary: 'bg-surface text-ink hover:bg-paper active:bg-line border border-line shadow-none dark:bg-transparent dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-white',
    ghost: 'bg-transparent text-muted hover:text-ink hover:bg-paper active:bg-line border border-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60',
    danger: 'bg-status-full text-white hover:opacity-90 active:opacity-100 border border-transparent',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
