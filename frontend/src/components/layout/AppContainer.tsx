import type { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * If true, removes max-w and padding constraints for full-bleed layouts (e.g. interactive GIS map).
   */
  fullBleed?: boolean;
}

/**
 * Standardized sovereign application container.
 * Enforces uniform max-width, responsive horizontal padding,
 * and vertical rhythm across all Bhoomi-Drishti application surfaces.
 */
export function AppContainer({
  children,
  className = '',
  fullBleed = false,
}: AppContainerProps) {
  if (fullBleed) {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8 ${className}`}>
      {children}
    </div>
  );
}
