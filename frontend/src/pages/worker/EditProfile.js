import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerAPI, autocompleteAPI } from '../../services/api';

function WorkerEditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);

  const [profile, setProfile] = useState({
    first_name: '',
    surname: '',
    age: '',
    gender: '',
    area_id: '',
    bio: '',
    email: '',
    skills: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, skillsRes, areasRes] = await Promise.all([
        workerAPI.getProfile(),
        autocompleteAPI.getSkills(),
        autocompleteAPI.getAreas()
      ]);

      const p = profileRes.data;
      setProfile({
        first_name: p.first_name,
        surname: p.surname,
        age: p.age,
        gender: p.gender,
        area_id: p.area_id,
        bio: p.bio || '',
        email: p.email || '',
        skills: p.skills.map(s => ({ skill_id: s.skill_id, years_experience: s.years_experience }))
      });
      setSkills(skillsRes.data);
      setAreas(areasRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 401) {
        navigate('/worker/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkillChange = (skillId, checked, yearsExperience = 0) => {
    setProfile(prev => {
      const existingSkills = prev.skills.filter(s => s.skill_id !== skillId);
      if (checked) {
        return { ...prev, skills: [...existingSkills, { skill_id: skillId, years_experience: yearsExperience }] };
      }
      return { ...prev, skills: existingSkills };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await workerAPI.updateProfile({
        first_name: profile.first_name,
        surname: profile.surname,
        age: parseInt(profile.age),
        gender: profile.gender,
        area_id: parseInt(profile.area_id),
        bio: profile.bio,
        email: profile.email
      });

      await workerAPI.addSkills(profile.skills);

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/worker/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!window.confirm('This will permanently delete your profile and all your ratings. Continue?')) return;

    try {
      await workerAPI.deleteProfile();
      localStorage.removeItem('workerToken');
      localStorage.removeItem('workerInfo');
      navigate('/');
    } catch (err) {
      setError('Failed to delete account');
    }
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

      <main className="profile-main" style={{ maxWidth: '600px' }}>
        <Link to="/worker/dashboard" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          &larr; Back to Dashboard
        </Link>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>

          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
          {success && <p className="success-message" style={{ marginBottom: '1rem' }}>{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="surname">Surname *</label>
                <input
                  type="text"
                  id="surname"
                  value={profile.surname}
                  onChange={(e) => setProfile(prev => ({ ...prev, surname: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <input
                  type="number"
                  id="age"
                  min="18"
                  max="99"
                  value={profile.age}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  required
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="area">Area *</label>
              <select
                id="area"
                value={profile.area_id}
                onChange={(e) => setProfile(prev => ({ ...prev, area_id: e.target.value }))}
                required
              >
                <option value="">Select your area...</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Skills *</label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {skills.map(skill => (
                  <div key={skill.id} className="skill-checkbox">
                    <input
                      type="checkbox"
                      id={`skill-${skill.id}`}
                      checked={profile.skills.some(s => s.skill_id === skill.id)}
                      onChange={(e) => handleSkillChange(skill.id, e.target.checked)}
                    />
                    <label htmlFor={`skill-${skill.id}`} style={{ flex: 1 }}>{skill.name}</label>
                    {profile.skills.some(s => s.skill_id === skill.id) && (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Years"
                        style={{ width: '80px' }}
                        value={profile.skills.find(s => s.skill_id === skill.id)?.years_experience || 0}
                        onChange={(e) => handleSkillChange(skill.id, true, parseInt(e.target.value) || 0)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell potential clients about yourself..."
              />
              <div className={`char-counter ${profile.bio.length > 450 ? (profile.bio.length >= 500 ? 'limit' : 'warning') : ''}`}>
                {profile.bio.length}/500
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (optional)</label>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? <span className="spinner"></span> : 'Save Changes'}
            </button>
          </form>

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          <div style={{ textAlign: 'center' }}>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WorkerEditProfile;
