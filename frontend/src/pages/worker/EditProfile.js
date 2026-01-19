import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerAPI, autocompleteAPI } from '../../services/api';
import Autocomplete from '../../components/Autocomplete';

function WorkerEditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [profile, setProfile] = useState({
    first_name: '',
    surname: '',
    age: '',
    gender: '',
    area_id: '',
    bio: '',
    email: '',
    skills: [{ skill_id: null, years_experience: 0 }]
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
      const loadedSkills = p.skills.map(s => ({ skill_id: s.skill_id, years_experience: s.years_experience }));
      setProfile({
        first_name: p.first_name,
        surname: p.surname,
        age: p.age,
        gender: p.gender,
        area_id: p.area_id,
        bio: p.bio || '',
        email: p.email || '',
        skills: loadedSkills.length > 0 ? loadedSkills : [{ skill_id: null, years_experience: 0 }]
      });
      setPhotoUrl(p.profile_photo_url);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await workerAPI.uploadPhoto(formData);
      setPhotoUrl(response.data.photo_url);
      setSuccess('Photo uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle skill selection in a row
  const handleSkillSelect = (index, skillId) => {
    setProfile(prev => {
      const newSkills = [...prev.skills];
      if (skillId) {
        newSkills[index] = { ...newSkills[index], skill_id: parseInt(skillId) };
      } else {
        newSkills[index] = { ...newSkills[index], skill_id: null };
      }
      return { ...prev, skills: newSkills };
    });
  };

  // Handle years of experience change
  const handleYearsChange = (index, years) => {
    setProfile(prev => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], years_experience: years };
      return { ...prev, skills: newSkills };
    });
  };

  // Add a new skill entry row
  const handleAddSkill = () => {
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, { skill_id: null, years_experience: 0 }]
    }));
  };

  // Remove a skill entry row
  const handleRemoveSkill = (index) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Filter out empty skill rows (those with no skill selected)
    const validSkills = profile.skills.filter(s => s.skill_id !== null && s.skill_id !== '');

    // Validate at least one skill is selected
    if (validSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

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

      await workerAPI.addSkills(validSkills);

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

          {/* Profile Photo Section */}
          <div className="form-group" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem' }}>Profile Photo</label>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {photoUrl ? (
                <img
                  src={photoUrl.startsWith('/') ? `http://localhost:3001${photoUrl}` : photoUrl}
                  alt="Profile"
                  className="profile-photo"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="profile-photo"
                  style={{
                    width: '150px',
                    height: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#e5e7eb',
                    color: '#6b7280',
                    fontSize: '3rem',
                    fontWeight: 600
                  }}
                >
                  {profile.first_name?.[0]}{profile.surname?.[0]}
                </div>
              )}
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                {uploadingPhoto ? (
                  <span className="spinner"></span>
                ) : (
                  photoUrl ? 'Change Photo' : 'Upload Photo'
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </label>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                JPEG, PNG, or WebP. Max 5MB. Will be cropped to square.
              </p>
            </div>
          </div>

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
              <Autocomplete
                label="Area *"
                options={areas}
                value={profile.area_id ? profile.area_id.toString() : ''}
                onChange={(value) => setProfile(prev => ({ ...prev, area_id: value }))}
                placeholder="Search areas..."
                allLabel="Select your area..."
              />
            </div>

            <div className="form-group">
              <label>Skills * <span style={{ fontWeight: 'normal', fontSize: '0.875rem', color: '#6b7280' }}>(at least one required)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profile.skills.map((skill, index) => {
                  // Get available skills (exclude already selected skills except current one)
                  const selectedSkillIds = profile.skills.map(s => s.skill_id).filter(id => id !== skill.skill_id);
                  const availableSkills = skills.filter(s => !selectedSkillIds.includes(s.id));

                  return (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <Autocomplete
                          label={index === 0 ? '' : ''}
                          options={availableSkills}
                          value={skill.skill_id ? skill.skill_id.toString() : ''}
                          onChange={(value) => handleSkillSelect(index, value)}
                          placeholder="Search skills..."
                          allLabel="Select a skill..."
                        />
                      </div>
                      <div style={{ width: '100px' }}>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          placeholder="Years exp."
                          value={skill.years_experience || 0}
                          onChange={(e) => handleYearsChange(index, parseInt(e.target.value) || 0)}
                          style={{ width: '100%', height: '42px' }}
                        />
                      </div>
                      {profile.skills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 0.75rem', height: '42px' }}
                          aria-label="Remove skill"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start' }}
                >
                  + Add another skill
                </button>
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
