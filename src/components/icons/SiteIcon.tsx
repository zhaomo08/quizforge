import * as React from 'react';

// A simple, brand-friendly AI spark icon inside a circle with four small nodes.
// - Inherits color via currentColor. Size controlled by className.
// - Keep paths lightweight for performance and crisp rendering.
export interface SiteIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const SiteIcon: React.FC<SiteIconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Outer subtle ring */}
    <circle cx="12" cy="12" r="9" />

    {/* Four small network nodes */}
    <circle cx="12" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="5.5" cy="12" r="0.9" fill="currentColor" stroke="none" />

    {/* AI spark star */}
    <path d="M12 7.8l1.4 2.4 2.4 1.4-2.4 1.4L12 15.4l-1.4-2.4-2.4-1.4 2.4-1.4L12 7.8z" />
  </svg>
);

export default SiteIcon;
