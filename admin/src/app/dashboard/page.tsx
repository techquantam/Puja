'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    banners: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('pujamart_admin_token');

        // Fetch categories, products, banners, and orders
        const [catRes, prodRes, banRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/products?all=true`),
          fetch(`${API_BASE_URL}/api/banners?all=true`),
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();
        const banData = await banRes.json();

        let ordersCount = 0;
        let revenue = 0;
        let pending = 0;

        if (token) {
          try {
            const ordersRes = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              const ordersList = ordersData.data || [];
              ordersCount = ordersList.length;
              
              // Calculate revenue (Completed payments)
              revenue = ordersList
                .filter((o: any) => o.paymentStatus === 'Completed')
                .reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

              // Calculate pending shipments (Placed or Confirmed status)
              pending = ordersList.filter((o: any) => ['Placed', 'Confirmed'].includes(o.orderStatus)).length;
            }
          } catch (orderError) {
            console.error('Error fetching admin orders for stats:', orderError);
          }
        }

        setStats({
          categories: catData.data?.length || 0,
          products: prodData.pagination?.total || 0,
          banners: banData.data?.length || 0,
          totalOrders: ordersCount,
          totalRevenue: revenue,
          pendingShipments: pending,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EADBC8',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(44, 27, 16, 0.02)',
    flex: 1,
    minWidth: '240px',
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '24px', color: '#2C1B10', margin: '0 0 8px 0', fontWeight: '800' }}>Jai Shree Ram!</h3>
        <p style={{ color: '#7A6B5D', margin: 0, fontSize: '15px' }}>Here is a quick overview of your PujaMart inventory status.</p>
      </div>

      {loading ? (
        <div style={{ fontSize: '15px', color: '#7A6B5D' }}>Loading dashboard metrics...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Inventory Row */}
          <div>
            <h4 style={{ color: '#5C4E43', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Catalog Overview</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Total Categories</span>
                  <span style={{ fontSize: '24px' }}>📁</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF7F00' }}>{stats.categories}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>Active categories in store</p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Active Inventory</span>
                  <span style={{ fontSize: '24px' }}>📦</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF7F00' }}>{stats.products}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>Products listed in catalog</p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Home Banner Slides</span>
                  <span style={{ fontSize: '24px' }}>🖼️</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF7F00' }}>{stats.banners}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>Promotional sliders active</p>
              </div>
            </div>
          </div>

          {/* Orders Stats Row */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#5C4E43', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Orders & Revenue</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Total Orders Placed</span>
                  <span style={{ fontSize: '24px' }}>🛒</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF7F00' }}>{stats.totalOrders}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>Lifetime orders generated</p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Total Revenue</span>
                  <span style={{ fontSize: '24px' }}>💰</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#4CAF50' }}>₹{stats.totalRevenue}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>From completed transactions</p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#7A6B5D' }}>Pending Shipments</span>
                  <span style={{ fontSize: '24px' }}>⏳</span>
                </div>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF9800' }}>{stats.pendingShipments}</span>
                <p style={{ fontSize: '12px', color: '#A8988A', marginTop: '8px' }}>Placed/Confirmed orders to ship</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        marginTop: '40px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #EADBC8',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(44, 27, 16, 0.02)',
      }}>
        <h4 style={{ color: '#2C1B10', margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>Quick Actions</h4>
        <p style={{ color: '#7A6B5D', fontSize: '14px', marginBottom: '24px' }}>Manage your catalog using the sidebar navigation, or quick jump directly to categories and products.</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/dashboard/categories" style={{
            height: '44px',
            padding: '0 20px',
            backgroundColor: '#FF7F00',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}>Manage Categories</a>
          <a href="/dashboard/products" style={{
            height: '44px',
            padding: '0 20px',
            backgroundColor: '#1E150F',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}>Manage Products</a>
          <a href="/dashboard/orders" style={{
            height: '44px',
            padding: '0 20px',
            backgroundColor: '#1E150F',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            border: '1.5px solid #FF7F0030'
          }}>Manage Orders</a>
        </div>
      </div>
    </div>
  );
}
