'use client';

import React from 'react';
import Image from 'next/image';

export default function Logo({ className = 'h-8' }) {
  return (
    <Image 
      src="/Logo - White.png" 
      alt="Tarapeza Logo" 
      width={120}
      height={32}
      priority
      className={`w-auto object-contain ${className}`}
    />
  );
}
