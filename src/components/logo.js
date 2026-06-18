'use client';

import React from 'react';

export default function Logo({ className = 'h-8' }) {
  return (
    <img 
      src="/Logo - White.png" 
      alt="Tarapeza Logo" 
      className={`w-auto object-contain ${className}`}
      style={{ height: '32px' }} // Default height for clean layout scaling
    />
  );
}
