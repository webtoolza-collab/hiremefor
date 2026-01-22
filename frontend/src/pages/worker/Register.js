import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, workerAPI, autocompleteAPI } from '../../services/api';
import Autocomplete from '../../components/Autocomplete';

function WorkerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: PIN, 4: profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinHash, setPinHash] = useState('');

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
    skills: [{ skill_id: null, years_experience: 0 }]
  });

  useEffect(() => {
    if (step === 4) {
      loadOptions();
    }
  }, [step]);

  const loadOptions = async () => {
    try {
      const [skillsRes, areasRes] = await Promise.all([
        autocompleteAPI.getSkills(),
        autocompleteAPI.getAreas()
      ]);
      setSkills(skillsRes.data);
      setAreas(areasRes.data);
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.requestOTP(phone);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.verifyOTP(phone, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePIN = async (e) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.createPIN(phone, pin);
      setPinHash(response.data.pin_hash);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create PIN');
    } finally {
      setLoading(false);
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

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Filter out empty skill rows (those with no skill selected)
    const validSkills = profile.skills.filter(s => s.skill_id !== null && s.skill_id !== '');

    // Validate at least one skill is selected
    if (validSkills.length === 0) {
      setError('Please select at least one skill');
      setLoading(false);
      return;
    }

    try {
      await workerAPI.register({
        phone_number: phone,
        pin_hash: pinHash,
        ...profile,
        skills: validSkills,
        age: parseInt(profile.age),
        area_id: parseInt(profile.area_id)
      });

      // Auto login
      const loginRes = await authAPI.login(phone, pin);
      localStorage.setItem('workerToken', loginRes.data.token);
      localStorage.setItem('workerInfo', JSON.stringify(loginRes.data.worker));

      navigate('/worker/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
      </header>

      <main className="profile-main" style={{ maxWidth: step === 4 ? '600px' : '400px' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Worker Registration</h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                style={{
                  width: '2rem',
                  height: '4px',
                  background: s <= step ? '#dc2626' : '#e5e7eb',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}

          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Enter your phone number to receive a verification code.
              </p>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="0123456789"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || phone.length !== 10}>
                {loading ? <span className="spinner"></span> : 'Request OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Enter the 6-digit code sent to {phone}
              </p>
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  type="text"
                  id="otp"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length !== 6}>
                {loading ? <span className="spinner"></span> : 'Verify'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCreatePIN}>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Create a 4-digit PIN for logging in.
              </p>
              <div className="form-group">
                <label htmlFor="pin">PIN</label>
                <input
                  type="password"
                  id="pin"
                  placeholder="****"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPin">Confirm PIN</label>
                <input
                  type="password"
                  id="confirmPin"
                  placeholder="****"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || pin.length !== 4 || confirmPin.length !== 4}>
                {loading ? <span className="spinner"></span> : 'Create PIN'}
              </button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmitProfile}>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Complete your profile to start receiving job opportunities.
              </p>

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
                            label=""
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !profile.skills.some(s => s.skill_id !== null)}>
                {loading ? <span className="spinner"></span> : 'Complete Registration'}
              </button>
            </form>
          )}

          {step === 1 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: '#6b7280' }}>Already have an account? </span>
              <Link to="/worker/login" style={{ color: '#dc2626' }}>Login</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WorkerRegister;
