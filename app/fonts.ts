import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

export const Inter_Font = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// Using Inter as a fallback for Geist
export const Geist = Inter_Font;
export const Geist_Mono = Inter_Font; 