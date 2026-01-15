import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from './AdminLayout';

function AdminRatings() {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [pagination.page, filter]);

  const loadRatings = async () => {
    try {
      const response = await adminAPI.getRatings({ page: pagination.page, limit: pagination.limit, status: filter || undefined });
      setRatings(response.data.ratings);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (err) {
      console.error('Failed to load ratings:', err);
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          &#9733;
        </span>
      );
    }
    return stars;
  };

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: '2rem' }}>All Ratings</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setFilter(status); setPagination(prev => ({ ...prev, page: 1 })); }}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : ratings.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No ratings found.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Worker</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Rating</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Comment</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map(rating => (
                  <tr key={rating.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{rating.first_name} {rating.surname}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div className="star-rating">{renderStars(rating.stars)}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', maxWidth: '300px' }}>
                      {rating.comment ? (rating.comment.length > 100 ? rating.comment.substring(0, 100) + '...' : rating.comment) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: rating.status === 'accepted' ? '#d1fae5' :
                                     rating.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: rating.status === 'accepted' ? '#047857' :
                                 rating.status === 'rejected' ? '#dc2626' : '#d97706'
                        }}
                      >
                        {rating.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                      {new Date(rating.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.total_pages > 1 && (
              <div className="pagination" style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.total_pages}</span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminRatings;
