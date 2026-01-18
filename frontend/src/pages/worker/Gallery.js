import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerAPI, authAPI } from '../../services/api';

function WorkerGallery() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('workerToken');
    if (!token) {
      navigate('/worker/login');
      return;
    }
    loadGallery();
  }, [navigate]);

  const loadGallery = async () => {
    try {
      setError(null);
      const response = await workerAPI.getGallery();
      setGallery(response.data);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      if (err.response?.status === 401) {
        navigate('/worker/login');
      } else {
        setError('Failed to load gallery');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('workerToken');
      localStorage.removeItem('workerInfo');
      navigate('/worker/login');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      return;
    }

    // Check limit
    if (gallery.length >= 30) {
      alert('You have reached the maximum of 30 images. Please delete some images first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('description', description.trim());

      await workerAPI.uploadGalleryImage(formData);
      setDescription('');
      setSuccessMessage('Image uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadGallery();
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (image) => {
    setEditingId(image.id);
    setEditDescription(image.description || '');
  };

  const handleSaveEdit = async (id) => {
    try {
      await workerAPI.updateGalleryImage(id, editDescription.trim());
      setEditingId(null);
      setSuccessMessage('Description updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadGallery();
    } catch (err) {
      console.error('Failed to update description:', err);
      setError('Failed to update description');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      await workerAPI.deleteGalleryImage(id);
      setSuccessMessage('Image deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadGallery();
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state" style={{ margin: '4rem auto' }}>
          <div className="spinner"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>

      <main className="profile-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>My Work Gallery</h1>
          <Link to="/worker/dashboard" className="btn btn-secondary">&larr; Back to Dashboard</Link>
        </div>

        {successMessage && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Upload Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Image ({gallery.length}/30)</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Showcase your previous work to attract more clients. Each image can have a description up to 200 characters.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Description (optional)
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="Describe this work (e.g., 'Kitchen sink repair in Johannesburg')"
                  rows={2}
                  maxLength={200}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '0.5rem',
                  bottom: '0.5rem',
                  fontSize: '0.75rem',
                  color: description.length >= 180 ? '#dc2626' : '#9ca3af'
                }}>
                  {description.length}/200
                </span>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="gallery-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
                disabled={uploading || gallery.length >= 30}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.25rem' }}>+</span>
                    Upload Image
                  </>
                )}
              </button>
              {gallery.length >= 30 && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Maximum 30 images reached. Delete some images to upload more.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Your Gallery ({gallery.length} images)</h3>

          {gallery.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              You haven't uploaded any images yet. Start showcasing your work to attract more clients!
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {gallery.map((image) => (
                <div
                  key={image.id}
                  style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ position: 'relative', paddingBottom: '75%', overflow: 'hidden' }}>
                    <img
                      src={image.image_url}
                      alt={image.description || 'Work sample'}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  <div style={{ padding: '1rem' }}>
                    {editingId === image.id ? (
                      <div>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value.slice(0, 200))}
                          maxLength={200}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSaveEdit(image.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{
                          fontSize: '0.875rem',
                          color: image.description ? '#374151' : '#9ca3af',
                          marginBottom: '0.75rem',
                          minHeight: '2.5rem'
                        }}>
                          {image.description || 'No description'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(image)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(image.id)}
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WorkerGallery;
