import { HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success-100 text-success-700',
    danger: 'bg-danger-100 text-danger-700',
    warning: 'bg-primary-100 text-primary-700',
    info: 'bg-blue-100 text-blue-700'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
