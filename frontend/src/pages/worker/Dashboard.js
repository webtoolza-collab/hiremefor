import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerAPI, authAPI } from '../../services/api';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('workerToken');
    if (!token) {
      navigate('/worker/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setError(null);
    try {
      const [profileRes, statsRes, ratingsRes] = await Promise.all([
        workerAPI.getProfile(),
        workerAPI.getStats(),
        workerAPI.getPendingRatings()
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setPendingRatings(ratingsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 401) {
        navigate('/worker/login');
      } else if (!err.response) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('Failed to load data. Please try again.');
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

  const handleAcceptRating = async (ratingId) => {
    try {
      await workerAPI.acceptRating(ratingId);
      loadData();
    } catch (err) {
      console.error('Failed to accept rating:', err);
    }
  };

  const handleRejectRating = async (ratingId) => {
    if (!window.confirm('Are you sure? This action is permanent.')) return;
    try {
      await workerAPI.rejectRating(ratingId);
      loadData();
    } catch (err) {
      console.error('Failed to reject rating:', err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.round(rating) ? 'filled' : ''}`}>
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

  if (error) {
    return (
      <div className="profile-page">
        <header className="profile-header">
          <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
        </header>
        <main className="profile-main">
          <div className="card" style={{ textAlign: 'center', padding: '3rem', background: '#fef2f2', border: '1px solid #fee2e2' }}>
            <p style={{ color: '#dc2626', fontWeight: 500, marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => { setLoading(true); loadData(); }}>
              Try Again
            </button>
          </div>
        </main>
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
        <h1 style={{ marginBottom: '1.5rem' }}>Welcome, {profile?.first_name}!</h1>

        {/* Profile Summary */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}>
          <div style={{ flexShrink: 0 }}>
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" className="profile-photo" />
            ) : (
              <div className="profile-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#6b7280', fontSize: '2rem', fontWeight: 600 }}>
                {profile?.first_name?.[0]}{profile?.surname?.[0]}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2>{profile?.first_name} {profile?.surname}</h2>
            <p style={{ color: '#6b7280' }}>{profile?.area_name}</p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              {profile?.age} years old • {profile?.gender}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{profile?.phone_number}</p>

            <div style={{ marginTop: '1rem' }}>
              <div className="star-rating">{renderStars(stats?.average_rating || 0)}</div>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {stats?.average_rating?.toFixed(1) || '0.0'} ({stats?.accepted_ratings || 0} ratings)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link to="/worker/profile/edit" className="btn btn-primary">
                Edit Profile
              </Link>
              <Link to="/worker/gallery" className="btn btn-secondary">
                My Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Skills</h3>
          {profile?.skills?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  {skill.skill_name} ({skill.years_experience} yrs)
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No skills added yet.</p>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>About You</h3>
            <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
          </div>
        )}

        {/* Pending Ratings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Pending Ratings ({pendingRatings.length})</h3>
            <Link to="/worker/ratings" style={{ color: '#dc2626', fontSize: '0.875rem' }}>View All</Link>
          </div>

          {pendingRatings.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No pending ratings to review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingRatings.slice(0, 5).map(rating => (
                <div key={rating.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="star-rating">{renderStars(rating.stars)}</div>
                      {rating.comment && <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>{rating.comment}</p>}
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleAcceptRating(rating.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleRejectRating(rating.id)}
                      >
                        Reject
                      </button>
                    </div>
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

export default WorkerDashboard;
