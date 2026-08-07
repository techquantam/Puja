'use client';

import React, { useEffect, useState } from 'react';

interface CategoryItem {
  _id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/categories?all=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load categories');
      setCategories(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (cat: CategoryItem) => {
    setEditId(cat._id);
    setName(cat.name);
    setDescription(cat.description);
    setImage(cat.image);
    setIsActive(cat.isActive);
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setImage('');
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

    const body = { name, description, image, isActive };
    const url = editId
      ? `http://localhost:5000/api/categories/${editId}`
      : 'http://localhost:5000/api/categories';
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

      setSuccess(editId ? 'Category updated successfully!' : 'Category created successfully!');
      setShowForm(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('pujamart_admin_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete category.');
      }

      setSuccess('Category deleted successfully!');
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '24px', color: '#2C1B10', margin: '0 0 8px 0', fontWeight: '800' }}>Manage Categories</h3>
          <p style={{ color: '#7A6B5D', margin: 0, fontSize: '15px' }}>Add or edit shop product categories</p>
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
          Add New Category
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
            {editId ? 'Edit Category' : 'Create New Category'}
          </h4>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Category Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Agarbatti"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="label" style={{ margin: 0 }}>Category Image (Upload or Enter URL)</label>
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
                          alert('Category image uploaded and URL set successfully!');
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

            <div className="input-group">
              <label className="label">Description</label>
              <textarea
                className="input"
                style={{ height: '80px', padding: '12px 16px', resize: 'vertical' }}
                placeholder="Brief description of the category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isActiveCheckbox" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Active (display on website/app)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">
                Save Category
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
        <div style={{ fontSize: '15px', color: '#7A6B5D' }}>Loading categories table...</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: '#FFFFFF', textAlign: 'center', borderRadius: '16px', border: '1px solid #EADBC8' }}>
          No categories found. Click Add New Category to create one.
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
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Image</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Name</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Description</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} style={{ borderBottom: '1px solid #EADBC8' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EADBC8' }}
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100'; }}
                    />
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '600', color: '#2C1B10' }}>{cat.name}</td>
                  <td style={{ padding: '16px 24px', color: '#7A6B5D', fontSize: '14px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.description}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: cat.isActive ? '#DCFCE7' : '#F3F4F6',
                      color: cat.isActive ? '#166534' : '#4B5563',
                    }}>
                      {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleEditClick(cat)}
                        style={{ background: 'none', border: 'none', color: '#FF7F00', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
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
