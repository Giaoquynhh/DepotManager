import { ReactNode } from 'react';

interface AvatarProps {
  children: ReactNode;
  className?: string;
}

interface AvatarFallbackProps {
  children: ReactNode;
  className?: string;
}

export function Avatar({ children, className = '' }: AvatarProps) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
    </div>
  );
}

export function AvatarFallback({ children, className = '' }: AvatarFallbackProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium ${className}`}>
      {children}
    </div>
  );
}

