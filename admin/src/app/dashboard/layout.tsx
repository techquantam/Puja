'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('pujamart_admin_token');
    const adminUser = localStorage.getItem('pujamart_admin_user');

    if (!adminToken || !adminUser) {
      router.replace('/login');
    } else {
      setAdmin(JSON.parse(adminUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('pujamart_admin_token');
    localStorage.removeItem('pujamart_admin_refresh_token');
    localStorage.removeItem('pujamart_admin_user');
    router.replace('/login');
  };

  if (!admin) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        backgroundColor: '#FFF9F2',
      }}>
        Authenticating admin session...
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Categories', path: '/dashboard/categories', icon: '📁' },
    { name: 'Products', path: '/dashboard/products', icon: '📦' },
    { name: 'Banners', path: '/dashboard/banners', icon: '🖼️' },
    { name: 'Orders', path: '/dashboard/orders', icon: '🛍️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFF9F2', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1E150F',
        color: '#F5EDE6',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #3D2C1E'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #3D2C1E',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              padding: '2px',
            }}
          />
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#FF7F00', display: 'block' }}>Anandmayi Bhakti</span>
            <span style={{ fontSize: '11px', color: '#A8988A' }}>Admin Console</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <li key={link.path}>
                  <Link href={link.path} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#A8988A',
                    backgroundColor: isActive ? '#FF7F00' : 'transparent',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}>
                    <span>{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #3D2C1E' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block' }}>{admin.name}</span>
            <span style={{ fontSize: '12px', color: '#A8988A' }}>{admin.email}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '8px',
              border: '1.5px solid #FF7F00',
              backgroundColor: 'transparent',
              color: '#FF7F00',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '70px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EADBC8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          boxShadow: '0 2px 4px rgba(44, 27, 16, 0.02)'
        }}>
          <h2 style={{ color: '#2C1B10', margin: 0, fontSize: '20px', fontWeight: '700' }}>
            {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.toUpperCase()}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#388E3C' }}></span>
            <span style={{ fontSize: '13px', color: '#7A6B5D', fontWeight: '500' }}>Service Online</span>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
