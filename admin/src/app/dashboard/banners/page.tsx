'use client';

import React, { useEffect, useState } from 'react';

interface BannerItem {
  _id: string;
  title: string;
  image: string;
  link?: string;
  isActive: boolean;
  position: number;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/banners?all=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load banners');
      setBanners(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEditClick = (ban: BannerItem) => {
    setEditId(ban._id);
    setTitle(ban.title);
    setImage(ban.image);
    setLink(ban.link || '');
    setPosition(ban.position);
    setIsActive(ban.isActive);
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setTitle('');
    setImage('');
    setLink('');
    setPosition(0);
    setIsActive(true);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('pujamart_admin_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    const body = { title, image, link, position: Number(position), isActive };
    const url = editId
      ? `http://localhost:5000/api/banners/${editId}`
      : 'http://localhost:5000/api/banners';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Operation failed.');
      }

      setSuccess(editId ? 'Banner updated successfully!' : 'Banner created successfully!');
      setShowForm(false);
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('pujamart_admin_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete banner.');
      }

      setSuccess('Banner deleted successfully!');
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '24px', color: '#2C1B10', margin: '0 0 8px 0', fontWeight: '800' }}>Manage Promotional Banners</h3>
          <p style={{ color: '#7A6B5D', margin: 0, fontSize: '15px' }}>Configure home screen landing image slides and click redirects</p>
        </div>
        <button
          onClick={handleAddNewClick}
          style={{
            height: '44px',
            padding: '0 24px',
            backgroundColor: '#FF7F00',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Add New Banner
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#FEE2E2',
          border: '1.5px solid #FCA5A5',
          color: '#991B1B',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#DCFCE7',
          border: '1.5px solid #86EFAC',
          color: '#166534',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {success}
        </div>
      )}

      {showForm && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EADBC8',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(44, 27, 16, 0.02)',
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2C1B10', fontWeight: '700' }}>
            {editId ? 'Modify Banner Slide' : 'List New Slides Banner'}
          </h4>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Banner Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Shravan Special Offers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="label" style={{ margin: 0 }}>Banner Image (Upload or Enter URL)</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const formData = new FormData();
                      formData.append('image', file);

                      const token = localStorage.getItem('pujamart_admin_token');
                      if (!token) {
                        alert('Session expired. Please log in again.');
                        return;
                      }

                      try {
                        const res = await fetch('http://localhost:5000/api/upload', {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setImage(data.imageUrl);
                          alert('Banner image uploaded and URL set successfully!');
                        } else {
                          alert(data.message || 'Upload failed');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Network upload failed.');
                      }
                    }}
                    style={{ fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Click Redirect Link (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. /category/Puja Kits"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Slide Position Index</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0 (first), 1, 2"
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="isBannerActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isBannerActiveCheckbox" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Active (display on website/app slider)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">
                Save Banner
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: '15px', color: '#7A6B5D' }}>Loading banners table...</div>
      ) : banners.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: '#FFFFFF', textAlign: 'center', borderRadius: '16px', border: '1px solid #EADBC8' }}>
          No promotional banners listed. Click Add New Banner to create one.
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EADBC8',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(44, 27, 16, 0.02)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FFFBF7', borderBottom: '1px solid #EADBC8' }}>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Slide Image</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Title</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Redirect Link</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Index</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((ban) => (
                <tr key={ban._id} style={{ borderBottom: '1px solid #EADBC8' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <img
                      src={ban.image}
                      alt={ban.title}
                      style={{ width: '120px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EADBC8' }}
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=150'; }}
                    />
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '600', color: '#2C1B10' }}>{ban.title}</td>
                  <td style={{ padding: '16px 24px', color: '#7A6B5D', fontSize: '14px' }}>{ban.link || 'None'}</td>
                  <td style={{ padding: '16px 24px', fontWeight: '600', color: '#2C1B10' }}>Position #{ban.position}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: ban.isActive ? '#DCFCE7' : '#F3F4F6',
                      color: ban.isActive ? '#166534' : '#4B5563',
                    }}>
                      {ban.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleEditClick(ban)}
                        style={{ background: 'none', border: 'none', color: '#FF7F00', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ban._id)}
                        style={{ background: 'none', border: 'none', color: '#D32F2F', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
