import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, workerAPI, autocompleteAPI } from '../../services/api';

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
    skills: []
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

  const handleSkillChange = (skillId, checked, yearsExperience = 0) => {
    setProfile(prev => {
      const existingSkills = prev.skills.filter(s => s.skill_id !== skillId);
      if (checked) {
        return { ...prev, skills: [...existingSkills, { skill_id: skillId, years_experience: yearsExperience }] };
      }
      return { ...prev, skills: existingSkills };
    });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await workerAPI.register({
        phone_number: phone,
        pin_hash: pinHash,
        ...profile,
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || profile.skills.length === 0}>
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
