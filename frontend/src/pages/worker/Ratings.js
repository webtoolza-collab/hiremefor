import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerAPI } from '../../services/api';

function WorkerRatings() {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const response = await workerAPI.getRatings();
      setRatings(response.data);
    } catch (err) {
      console.error('Failed to load ratings:', err);
      if (err.response?.status === 401) {
        navigate('/worker/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await workerAPI.acceptRating(id);
      loadRatings();
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this rating? This action is permanent.')) return;
    try {
      await workerAPI.rejectRating(id);
      loadRatings();
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const filteredRatings = filter === 'all' ? ratings : ratings.filter(r => r.status === filter);

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

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state" style={{ margin: '4rem auto' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
      </header>

      <main className="profile-main">
        <Link to="/worker/dashboard" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          &larr; Back to Dashboard
        </Link>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1>Your Ratings</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'pending', 'accepted', 'rejected'].map(f => (
                <button
                  key={f}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredRatings.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              No {filter === 'all' ? '' : filter} ratings found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredRatings.map(rating => (
                <div
                  key={rating.id}
                  style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      rating.status === 'accepted' ? '#10b981' :
                      rating.status === 'rejected' ? '#ef4444' : '#fbbf24'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="star-rating">{renderStars(rating.stars)}</div>
                        <span
                          style={{
                            padding: '0.125rem 0.5rem',
                            borderRadius: '4px',
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
                      </div>
                      {rating.comment && (
                        <p style={{ color: '#4b5563', marginBottom: '0.5rem' }}>{rating.comment}</p>
                      )}
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Received: {new Date(rating.created_at).toLocaleDateString()}
                        {rating.reviewed_at && ` | Reviewed: ${new Date(rating.reviewed_at).toLocaleDateString()}`}
                      </p>
                    </div>

                    {rating.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          onClick={() => handleAccept(rating.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          onClick={() => handleReject(rating.id)}
                        >
                          Reject
                        </button>
                      </div>
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

export default WorkerRatings;
