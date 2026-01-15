import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import '../WorkerProfile.css';

function WorkerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone_number: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.phone_number, formData.pin);
      localStorage.setItem('workerToken', response.data.token);
      localStorage.setItem('workerInfo', JSON.stringify(response.data.worker));
      navigate('/worker/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
      </header>

      <main className="profile-main" style={{ maxWidth: '400px' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Worker Login</h1>

          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                placeholder="0123456789"
                maxLength={10}
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value.replace(/\D/g, '') }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pin">PIN</label>
              <input
                type="password"
                id="pin"
                placeholder="****"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/worker/register" style={{ color: '#dc2626' }}>Create an account</Link>
            <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>|</span>
            <Link to="/worker/forgot-pin" style={{ color: '#6b7280' }}>Forgot PIN?</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WorkerLogin;
