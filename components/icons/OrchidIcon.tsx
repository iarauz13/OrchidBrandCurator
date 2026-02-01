import React from 'react';

export const OrchidIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Outline of the 5-petal structure based on user image */}

    {/* Top Petal (Dorsal Sepal) */}
    <path d="M12 2C14 2 16 5 16 8C16 10 14 11 12 11C10 11 8 10 8 8C8 5 10 2 12 2Z" />

    {/* Right Petal */}
    <path d="M16.5 8.5C18.5 8.5 21 9.5 21.5 12C22 14.5 20 16.5 17.5 16.5C16 16.5 15 15.5 14.5 14" />

    {/* Left Petal */}
    <path d="M7.5 8.5C5.5 8.5 3 9.5 2.5 12C2 14.5 4 16.5 6.5 16.5C8 16.5 9 15.5 9.5 14" />

    {/* Bottom Right Sepal */}
    <path d="M15 17C16.5 19 18 21 15 22C13.5 22.5 12.5 20 12.5 18" />

    {/* Bottom Left Sepal */}
    <path d="M9 17C7.5 19 6 21 9 22C10.5 22.5 11.5 20 11.5 18" />

    {/* Center Labellum (Lip) */}
    <path d="M12 11C13.5 11 14 12.5 14 13.5C14 14.5 13 16 12 16C11 16 10 14.5 10 13.5C10 12.5 10.5 11 12 11Z" />
    <path d="M12 13.5V14.5" />
  </svg>
);
