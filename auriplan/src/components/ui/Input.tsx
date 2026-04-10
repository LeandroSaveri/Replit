// ============================================
// INPUT COMPONENT - Input Reutilizável
// ============================================

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helper, 
    leftIcon, 
    rightIcon, 
    fullWidth,
    className = '',
    ...props 
  }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              h-12 bg-slate-800 border rounded-xl text-white placeholder-slate-500
              focus:outline-none focus:border-blue-500 transition-colors
              ${leftIcon ? 'pl-11' : 'px-4'}
              ${rightIcon ? 'pr-11' : 'pr-4'}
              ${error ? 'border-red-500/50' : 'border-slate-700'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
