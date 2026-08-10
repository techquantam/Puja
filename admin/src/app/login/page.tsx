'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { API_BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!contact || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      const { user, accessToken, refreshToken } = data.data;

      // Ensure user has admin privileges
      if (user.role !== 'admin') {
        throw new Error('Access denied: Unauthorized dashboard access.');
      }

      setSuccess('Sign in successful. Redirecting...');
      localStorage.setItem('pujamart_admin_token', accessToken);
      localStorage.setItem('pujamart_admin_refresh_token', refreshToken);
      localStorage.setItem('pujamart_admin_user', JSON.stringify(user));

      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="Anandmayi Bhakti Logo" className={styles.logoImage} />
          </div>
          <h1 className={styles.title}>Anandmayi Bhakti</h1>
          <p className={styles.subtitle}>Admin Console Login</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
          {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}

          <div className="input-group">
            <label className="label">Admin Email or Mobile</label>
            <input
              type="text"
              className="input"
              placeholder="admin@anandmayibhakti.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary styles.submitBtn"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
