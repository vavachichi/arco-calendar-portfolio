import React from 'react';

interface ArkoLogoProps {
  variant?: 'dark' | 'light' | 'white-box';
  className?: string;
  showText?: boolean;
}

export const ArkoLogo: React.FC<ArkoLogoProps> = ({ 
  variant = 'light', 
  className = '',
}) => {
  if (variant === 'white-box') {
    return (
      <div className={`inline-flex items-center bg-white px-3.5 py-1.5 rounded-lg shadow-xs border border-slate-200 ${className}`}>
        <span className="text-xs sm:text-sm font-bold tracking-tight text-[#162e4d] font-sans">
          한국문화예술위원회
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`text-xs sm:text-sm font-bold tracking-tight font-sans ${
        variant === 'dark' ? 'text-[#162e4d]' : 'text-white'
      }`}>
        한국문화예술위원회
      </span>
    </div>
  );
};

