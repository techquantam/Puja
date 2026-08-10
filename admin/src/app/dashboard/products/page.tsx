'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface ProductItem {
  _id: string;
  name: string;
  description: string;
  category: { _id: string; name: string };
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  isActive: boolean;
}

interface CategoryItem {
  _id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState(0);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?all=true&limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load products');
      setProducts(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories?all=true`);
      const data = await res.json();
      if (res.ok) setCategories(data.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleEditClick = (prod: ProductItem) => {
    setError(null);
    setSuccess(null);
    setEditId(prod._id);
    setName(prod.name);
    setDescription(prod.description);
    setCategoryId(prod.category?._id || '');
    setPrice(prod.price);
    setDiscountPrice(prod.discountPrice);
    setImageUrl(prod.images[0] || '');
    setStock(prod.stock);
    setIsBestSeller(prod.isBestSeller);
    setIsNewArrival(prod.isNewArrival);
    setIsFeatured(prod.isFeatured);
    setIsFlashSale(prod.isFlashSale);
    setIsActive(prod.isActive);
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setError(null);
    setSuccess(null);
    setEditId(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?._id || '');
    setPrice(0);
    setDiscountPrice(undefined);
    setImageUrl('');
    setStock(0);
    setIsBestSeller(false);
    setIsNewArrival(false);
    setIsFeatured(false);
    setIsFlashSale(false);
    setIsActive(true);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (discountPrice !== undefined && discountPrice !== null) {
      if (Number(discountPrice) >= Number(price)) {
        setError('Discount price must be strictly lower than original price.');
        return;
      }
    }

    const token = localStorage.getItem('pujamart_admin_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    const body = {
      name,
      description,
      category: categoryId,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      images: [imageUrl],
      stock: Number(stock),
      isBestSeller,
      isNewArrival,
      isFeatured,
      isFlashSale,
      isActive,
    };

    const url = editId
      ? `${API_BASE_URL}/api/products/${editId}`
      : `${API_BASE_URL}/api/products`;
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

      setSuccess(editId ? 'Product updated successfully!' : 'Product created successfully!');
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('pujamart_admin_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete product.');
      }

      setSuccess('Product deleted successfully!');
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '24px', color: '#2C1B10', margin: '0 0 8px 0', fontWeight: '800' }}>Product Inventory</h3>
          <p style={{ color: '#7A6B5D', margin: 0, fontSize: '15px' }}>Configure items, stock levels, discounts, and active display settings</p>
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
          Add New Product
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
            {editId ? 'Modify Product Specifications' : 'List New Puja Product'}
          </h4>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Product Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Copper Kalash 5 Inch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Category</label>
                <select
                  className="input"
                  style={{ cursor: 'pointer' }}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="label" style={{ margin: 0 }}>Image (Upload or Enter URL)</label>
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
                        const res = await fetch(`${API_BASE_URL}/api/upload`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setImageUrl(data.imageUrl);
                          alert('Image uploaded and URL set successfully!');
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
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Original Price (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Discount Price (₹ - Optional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Leave empty if no discount"
                  value={discountPrice || ''}
                  onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Stock Level</label>
                <input
                  type="number"
                  className="input"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Description</label>
              <textarea
                className="input"
                style={{ height: '80px', padding: '12px 16px', resize: 'vertical' }}
                placeholder="Product description and details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} /> Best Seller
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} /> New Arrival
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={isFlashSale} onChange={(e) => setIsFlashSale(e.target.checked)} /> Flash Sale
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Display Active
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">
                Save Product
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
        <div style={{ fontSize: '15px', color: '#7A6B5D' }}>Loading products table...</div>
      ) : products.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: '#FFFFFF', textAlign: 'center', borderRadius: '16px', border: '1px solid #EADBC8' }}>
          No products listed. Click Add New Product to create one.
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
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Category</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Price</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Stock</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Tags</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#2C1B10' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id} style={{ borderBottom: '1px solid #EADBC8' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EADBC8' }}
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100'; }}
                    />
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontWeight: '600', color: '#2C1B10', display: 'block' }}>{prod.name}</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      backgroundColor: prod.isActive ? '#DCFCE7' : '#F3F4F6',
                      color: prod.isActive ? '#166534' : '#4B5563',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}>
                      {prod.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#7A6B5D', fontSize: '14px' }}>
                    {prod.category?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '600', color: '#2C1B10' }}>
                    {prod.discountPrice ? (
                      <div>
                        <span style={{ color: '#FF7F00' }}>₹{prod.discountPrice}</span>
                        <span style={{ fontSize: '11px', color: '#A8988A', textDecoration: 'line-through', marginLeft: '6px' }}>₹{prod.price}</span>
                      </div>
                    ) : (
                      <span>₹{prod.price}</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', color: prod.stock > 10 ? '#7A6B5D' : '#D32F2F', fontWeight: prod.stock > 10 ? '400' : '600', fontSize: '14px' }}>
                    {prod.stock} units
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '160px' }}>
                      {prod.isBestSeller && <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#D97706' }}>BEST</span>}
                      {prod.isNewArrival && <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#2563EB' }}>NEW</span>}
                      {prod.isFeatured && <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F3E8FF', color: '#7C3AED' }}>FEATURED</span>}
                      {prod.isFlashSale && <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>FLASH</span>}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleEditClick(prod)}
                        style={{ background: 'none', border: 'none', color: '#FF7F00', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prod._id)}
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
