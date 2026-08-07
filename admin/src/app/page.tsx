'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('pujamart_admin_token');
    if (adminToken) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      color: '#FF7F00',
      fontWeight: 'bold',
      fontSize: '1.2rem'
    }}>
      Loading Anandmayi Bhakti Admin Portal...
    </div>
  );
}
