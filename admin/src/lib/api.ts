/**
 * Central API configuration for the Admin Portal.
 *
 * In development: set NEXT_PUBLIC_API_URL=http://localhost:5000 in .env.local
 * In production (Vercel): set NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
