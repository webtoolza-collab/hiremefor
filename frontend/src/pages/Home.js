import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI, autocompleteAPI } from '../services/api';
import './Home.css';

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(searchParams.get('skill_id') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area_id') || '');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    searchWorkers();
  }, [selectedSkill, selectedArea, pagination.page, pagination.limit, sortBy, sortOrder]);

  const loadOptions = async () => {
    try {
      const [skillsRes, areasRes] = await Promise.all([
        autocompleteAPI.getSkills(),
        autocompleteAPI.getAreas()
      ]);
      setSkills(skillsRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const searchWorkers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (selectedSkill) params.skill_id = selectedSkill;
      if (selectedArea) params.area_id = selectedArea;

      const response = await searchAPI.searchWorkers(params);
      setWorkers(response.data.workers);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));

      // Update URL
      const newParams = new URLSearchParams();
      if (selectedSkill) newParams.set('skill_id', selectedSkill);
      if (selectedArea) newParams.set('area_id', selectedArea);
      setSearchParams(newParams);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    searchWorkers();
  };

  const clearFilters = () => {
    setSelectedSkill('');
    setSelectedArea('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= roundedRating ? 'filled' : ''}`}>
          &#9733;
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="logo">HIRE ME FOR</h1>
        <nav>
          <Link to="/worker/login" className="nav-link">Worker Login</Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="search-section">
          <h2>Find Skilled Workers in Your Area</h2>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-filters">
              <div className="form-group">
                <label htmlFor="skill">Skill</label>
                <select
                  id="skill"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  <option value="">All Skills</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="area">Area</label>
                <select
                  id="area"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <option value="">All Areas</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div className="search-buttons">
                <button type="submit" className="btn btn-primary">
                  {loading ? <span className="spinner"></span> : 'Search'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="results-section">
          <div className="results-header">
            <h3>
              {pagination.total} Worker{pagination.total !== 1 ? 's' : ''} Found
            </h3>

            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="first_name">Name</option>
                <option value="surname">Surname</option>
                <option value="age">Age</option>
                <option value="rating">Rating</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>

            <div className="per-page">
              <label>Show:</label>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="empty-state">
              <p>No workers found matching your criteria.</p>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="workers-grid">
              {workers.map(worker => (
                <Link to={`/workers/${worker.id}`} key={worker.id} className="worker-card card">
                  <div className="worker-photo">
                    {worker.profile_photo_url ? (
                      <img
                        src={worker.profile_photo_url}
                        alt={`${worker.first_name} ${worker.surname}`}
                        className="profile-photo-thumb"
                      />
                    ) : (
                      <div className="profile-photo-thumb placeholder">
                        {worker.first_name[0]}{worker.surname[0]}
                      </div>
                    )}
                  </div>
                  <div className="worker-info">
                    <h4>{worker.first_name} {worker.surname}</h4>
                    <p className="worker-area">{worker.area_name}</p>
                    <div className="worker-skills">
                      {worker.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill.name}</span>
                      ))}
                      {worker.skills?.length > 3 && (
                        <span className="skill-tag more">+{worker.skills.length - 3}</span>
                      )}
                    </div>
                    <div className="worker-rating">
                      <div className="star-rating">{renderStars(worker.avg_rating)}</div>
                      <span className="rating-count">
                        {worker.rating_count > 0 ? `(${worker.rating_count})` : 'No ratings yet'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination">
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
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Hire Me For. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
