import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { searchAPI } from '../services/api';
import './WorkerProfile.css';

function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState({ stars: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    loadWorker();
  }, [id]);

  const loadWorker = async () => {
    try {
      setLoading(true);
      const response = await searchAPI.getWorker(id);
      setWorker(response.data);
    } catch (error) {
      console.error('Failed to load worker:', error);
      setError(error.response?.status === 404 ? 'Worker not found' : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (stars) => {
    setRating(prev => ({ ...prev, stars }));
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (rating.stars === 0) {
      alert('Please select a star rating');
      return;
    }

    setSubmitting(true);
    try {
      await searchAPI.rateWorker(id, rating.stars, rating.comment);
      setSubmitSuccess(true);
      setShowRatingForm(false);
      setRating({ stars: 0, comment: '' });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, clickable = false) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= roundedRating ? 'filled' : ''} ${clickable ? 'clickable' : ''}`}
          onClick={clickable ? () => handleStarClick(i) : undefined}
        >
          &#9733;
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-state card">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">Back to Search</Link>
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
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          &larr; Back to Results
        </button>

        <div className="profile-content card">
          <div className="profile-top">
            <div className="profile-photo-container">
              {worker.profile_photo_url ? (
                <img
                  src={worker.profile_photo_url}
                  alt={`${worker.first_name} ${worker.surname}`}
                  className="profile-photo profile-photo-large"
                />
              ) : (
                <div className="profile-photo profile-photo-large placeholder">
                  {worker.first_name[0]}{worker.surname[0]}
                </div>
              )}
            </div>

            <div className="profile-details">
              <h1>{worker.first_name} {worker.surname}</h1>
              <p className="location">{worker.area_name}</p>
              <p className="age-gender">{worker.age} years old &bull; {worker.gender}</p>

              <div className="rating-display">
                <div className="star-rating">{renderStars(worker.average_rating)}</div>
                <span>
                  {worker.total_ratings > 0
                    ? `${worker.average_rating?.toFixed(1)} (${worker.total_ratings} rating${worker.total_ratings !== 1 ? 's' : ''})`
                    : 'No ratings yet'}
                </span>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setShowRatingForm(true)}
              >
                Rate this Worker
              </button>
            </div>
          </div>

          <section className="profile-section">
            <h2>About</h2>
            <p className="bio">{worker.bio || 'No bio provided.'}</p>
          </section>

          <section className="profile-section">
            <h2>Skills</h2>
            <div className="skills-list">
              {worker.skills?.length > 0 ? (
                worker.skills.map((skill, idx) => (
                  <div key={idx} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-experience">{skill.years_experience} years experience</span>
                  </div>
                ))
              ) : (
                <p>No skills listed.</p>
              )}
            </div>
          </section>

          <section className="profile-section">
            <h2>Contact</h2>
            <div className="contact-info">
              <p><strong>Phone:</strong> {worker.phone_number}</p>
              {worker.email && <p><strong>Email:</strong> {worker.email}</p>}
            </div>
          </section>

          {/* Work Gallery */}
          {worker.gallery && worker.gallery.length > 0 && (
            <section className="profile-section">
              <h2>Work Gallery ({worker.gallery.length} images)</h2>
              <div className="gallery-grid">
                {worker.gallery.map((image, index) => (
                  <div
                    key={image.id}
                    className="gallery-item"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <div className="gallery-item-image">
                      <img src={image.image_url} alt={image.description || 'Work sample'} />
                    </div>
                    {image.description && (
                      <div className="gallery-item-description">
                        {image.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* QR Code for Profile Sharing */}
          <section className="profile-section qr-section">
            <h2>Share this Profile</h2>
            <div className="qr-code-container">
              <QRCodeSVG
                value={`${window.location.origin}/workers/${id}`}
                size={300}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
                className="qr-code"
              />
              <p className="qr-hint">Scan to view this worker's profile</p>
            </div>
          </section>
        </div>

        {submitSuccess && (
          <div className="toast toast-success">
            Rating submitted! It will appear after the worker approves it.
          </div>
        )}

        {showRatingForm && (
          <div className="modal-overlay" onClick={() => setShowRatingForm(false)}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
              <h2>Rate {worker.first_name}</h2>

              <form onSubmit={handleSubmitRating}>
                <div className="form-group">
                  <label>Rating *</label>
                  <div className="star-rating star-selector">
                    {renderStars(rating.stars, true)}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="comment">Comment (optional)</label>
                  <textarea
                    id="comment"
                    value={rating.comment}
                    onChange={(e) => setRating(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience..."
                    rows={4}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRatingForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || rating.stars === 0}
                  >
                    {submitting ? <span className="spinner"></span> : 'Submit Rating'}
                  </button>
                </div>
              </form>

              <p className="modal-note">
                Note: Your rating will be pending until the worker approves it.
              </p>
            </div>
          </div>
        )}

        {/* Gallery Lightbox */}
        {lightboxIndex !== null && worker.gallery && worker.gallery[lightboxIndex] && (
          <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
                &times;
              </button>

              {lightboxIndex > 0 && (
                <button
                  className="lightbox-nav prev"
                  onClick={() => setLightboxIndex(lightboxIndex - 1)}
                >
                  &lsaquo;
                </button>
              )}

              <img
                src={worker.gallery[lightboxIndex].image_url}
                alt={worker.gallery[lightboxIndex].description || 'Work sample'}
                className="lightbox-image"
              />

              {lightboxIndex < worker.gallery.length - 1 && (
                <button
                  className="lightbox-nav next"
                  onClick={() => setLightboxIndex(lightboxIndex + 1)}
                >
                  &rsaquo;
                </button>
              )}

              {worker.gallery[lightboxIndex].description && (
                <div className="lightbox-description">
                  {worker.gallery[lightboxIndex].description}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default WorkerProfile;
