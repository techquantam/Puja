'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface OrderItem {
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    discountPrice?: number;
  };
  quantity: number;
  price: number;
}

interface OrderItemAdmin {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'COD' | 'Online';
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  orderStatus: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  subtotal: number;
  discount: number;
  shippingCharges: number;
  totalAmount: number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderItemAdmin | null>(null);
  const [filterDate, setFilterDate] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pujamart_admin_token');
      if (!token) {
        throw new Error('Not logged in or session expired.');
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch orders.');
      }

      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newOrderStatus: string, newPaymentStatus: string) => {
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('pujamart_admin_token');
      if (!token) {
        throw new Error('Session expired. Please log in again.');
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: newOrderStatus,
          paymentStatus: newPaymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order status.');
      }

      setSuccess('Order status updated successfully!');
      fetchOrders(); // Refresh orders list

      // Update active modal details if open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update.');
    }
  };

  const getOrderStatusColor = (status: OrderItemAdmin['orderStatus']) => {
    switch (status) {
      case 'Placed':
      case 'Confirmed':
        return '#FF9800'; // Orange
      case 'Shipped':
        return '#2196F3'; // Blue
      case 'Delivered':
        return '#4CAF50'; // Green
      case 'Cancelled':
        return '#F44336'; // Red
      default:
        return '#757575';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E150F' }}>Orders Management</h1>
        <button
          onClick={fetchOrders}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF7F00',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Refresh Orders
        </button>
      </div>

      {/* Date Filter Row */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6DDD5',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>Filter by Date:</span>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #E6DDD5',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#1E150F',
          }}
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            style={{
              padding: '8px 14px',
              backgroundColor: '#F0EAE3',
              color: '#5C4E43',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8A7A70' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E6DDD5', borderRadius: '12px', color: '#8A7A70' }}>
          No orders found in database.
        </div>
      ) : (() => {
        const filteredOrders = orders.filter((order) => {
          if (!filterDate) return true;
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate === filterDate;
        });

        if (filteredOrders.length === 0) {
          return (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E6DDD5', borderRadius: '12px', color: '#8A7A70' }}>
              No orders found matching the date: {filterDate}
            </div>
          );
        }

        return (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6DDD5', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FBF8F5', borderBottom: '1px solid #E6DDD5' }}>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Order ID</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Customer</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Date</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Amount</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Payment Mode</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Payment Status</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Order Status</th>
                <th style={{ padding: '16px', color: '#5C4E43', fontSize: '14px', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const dateString = new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid #F0EAE3' }}>
                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#1E150F' }}>
                      {order._id.substring(0, 10)}...
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E150F' }}>{order.userId?.name || 'Devotee'}</div>
                      <div style={{ fontSize: '12px', color: '#8A7A70' }}>{order.userId?.phone}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#5C4E43' }}>{dateString}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 'bold', color: '#FF7F00' }}>
                      ₹{order.totalAmount}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#1E150F' }}>{order.paymentMethod}</td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleStatusChange(order._id, order.orderStatus, e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CCC',
                          fontSize: '13px',
                          backgroundColor: '#FFF',
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value, order.paymentStatus)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid ' + getOrderStatusColor(order.orderStatus),
                          fontSize: '13px',
                          color: getOrderStatusColor(order.orderStatus),
                          fontWeight: 'bold',
                          backgroundColor: '#FFF',
                        }}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1E150F',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })()}

      {/* Details Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E150F' }}>Order Items</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                &times;
              </button>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '16px', backgroundColor: '#FFFBF7', border: '1px solid #FF7F0030', padding: '12px', borderRadius: '8px' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: '#FF7F00', marginBottom: '4px' }}>Shipping Address</strong>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E150F' }}>{selectedOrder.shippingAddress.name}</div>
              <div style={{ fontSize: '12px', color: '#5C4E43', marginTop: '2px' }}>
                {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
              </div>
              <div style={{ fontSize: '12px', color: '#8A7A70', marginTop: '4px' }}>Phone: +91 {selectedOrder.shippingAddress.phone}</div>
            </div>

            {/* Items list */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {selectedOrder.items.map((item, index) => {
                const product = item.productId;
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #EEE',
                    }}
                  >
                    <img
                      src={product?.images?.[0] || 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=600'}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div style={{ marginLeft: '12px', flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E150F' }}>{product?.name || 'Puja Samagri'}</div>
                      <div style={{ fontSize: '12px', color: '#8A7A70' }}>
                        Qty: {item.quantity} x ₹{item.price}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E150F' }}>
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Details */}
            <div style={{ borderTop: '1px solid #EEE', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5C4E43', marginBottom: '4px' }}>
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#2E7D32', marginBottom: '4px' }}>
                  <span>Discounts</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5C4E43', marginBottom: '8px' }}>
                <span>Delivery Charges</span>
                <span>{selectedOrder.shippingCharges === 0 ? 'FREE' : `₹${selectedOrder.shippingCharges}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', color: '#FF7F00' }}>
                <span>Total Amount</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
