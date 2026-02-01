
import React from 'react';
import { ThemeConfig } from '../types';

interface BrandLogoProps {
  theme: ThemeConfig;
  className?: string;
}

/**
 * Renders the brand logo with dynamic background removal and color adaptation.
 * Works with the provided JPG (Dark text on White bg) by using Blend Modes.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ theme, className = "h-12" }) => {
  // Strategy:
  // Light Theme: Multiply blend mode makes White transparent, keeps Dark text.
  // Dark Theme: Invert logic.
  //    1. Invert image -> White text on Black bg.
  //    2. Screen blend mode -> Black bg transparent, keeps White text.

  const style: React.CSSProperties = theme.isDarkBackground
    ? { filter: 'invert(1) grayscale(1)', mixBlendMode: 'screen' }
    : { mixBlendMode: 'multiply' };

  return (
    <div className={`relative flex items-center ${className}`}>
      <img
        src="/logo_floral.jpg"
        alt="Orchid Architecture"
        className="h-full w-auto object-contain transition-all duration-500"
        style={style}
      />
    </div>
  );
};

export default BrandLogo;
