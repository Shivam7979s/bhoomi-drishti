import { Link } from 'react-router-dom';

interface BrandLogoProps {
  /** Size variant for the circular crest */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme variant for light or dark backgrounds */
  variant?: 'light' | 'dark';
  /** Whether to render the BHOOMI-DRISHTI wordmark and subtitle alongside the crest */
  showWordmark?: boolean;
  /** Custom subtitle text below the wordmark */
  subtitle?: string;
  /** Whether to wrap in a Link returning to "/" */
  asLink?: boolean;
  /** Optional custom class names */
  className?: string;
}

const SIZE_MAP = {
  sm: {
    crest: 'h-9 w-9',
    px: 36,
    srcWebp: '/assets/brand/bhoomi-drishti-logo-navbar.webp',
    srcPng: '/assets/brand/bhoomi-drishti-logo-navbar.png',
    title: 'text-sm tracking-[0.15em]',
    subtitle: 'text-[10px]',
  },
  md: {
    crest: 'h-11 w-11',
    px: 44,
    srcWebp: '/assets/brand/bhoomi-drishti-logo-navbar.webp',
    srcPng: '/assets/brand/bhoomi-drishti-logo-navbar.png',
    title: 'text-base tracking-[0.18em]',
    subtitle: 'text-xs',
  },
  lg: {
    crest: 'h-16 w-16',
    px: 64,
    srcWebp: '/assets/brand/bhoomi-drishti-logo-footer.webp',
    srcPng: '/assets/brand/bhoomi-drishti-logo-footer.png',
    title: 'text-xl tracking-[0.2em]',
    subtitle: 'text-xs sm:text-sm',
  },
};

/**
 * Authoritative BHOOMI-DRISHTI Brand Logo component.
 * Uses the official circular seal artwork with high-DPI web-optimized assets,
 * explicit dimensions to prevent Cumulative Layout Shift (CLS), and accessible labels.
 */
export function BrandLogo({
  size = 'md',
  variant = 'light',
  showWordmark = true,
  subtitle = 'Digital Land Governance Platform',
  asLink = true,
  className = '',
}: BrandLogoProps) {
  const config = SIZE_MAP[size];
  const isDark = variant === 'dark';

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official Circular Brand Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <picture>
          <source srcSet={config.srcWebp} type="image/webp" />
          <img
            src={config.srcPng}
            alt={asLink ? '' : 'BHOOMI-DRISHTI emblem'}
            aria-hidden={asLink ? 'true' : undefined}
            width={config.px}
            height={config.px}
            loading="eager"
            style={{ aspectRatio: '1 / 1' }}
            className={`${config.crest} rounded-full object-cover shadow-xs border ${
              isDark ? 'border-white/20' : 'border-emerald-900/10'
            } transition-transform hover:scale-105 duration-200 motion-reduce:transition-none`}
          />
        </picture>
      </div>

      {/* Brand Wordmark & Institutional Subtitle */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <span
            className={`block font-black leading-tight ${config.title} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            BHOOMI-DRISHTI
          </span>
          {subtitle && (
            <span
              className={`hidden sm:block font-medium leading-tight mt-0.5 ${config.subtitle} ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/"
        aria-label="BHOOMI-DRISHTI Home"
        className="rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 transition-opacity hover:opacity-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}
