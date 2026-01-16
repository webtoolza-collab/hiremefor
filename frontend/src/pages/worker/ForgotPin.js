import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import '../WorkerProfile.css';

function ForgotPin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone entry, 2: OTP verify, 3: new PIN
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.resetPINRequest(phoneNumber);
      setSuccess('OTP sent to your phone number');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPIN(phoneNumber, otpCode, newPin);
      setSuccess('PIN reset successfully! You can now log in.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset PIN');
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
          <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Reset PIN</h1>

          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
          {success && <p className="success-message" style={{ marginBottom: '1rem' }}>{success}</p>}

          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Enter your registered phone number and we'll send you an OTP to reset your PIN.
              </p>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="0123456789"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Request OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyAndReset}>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Enter the OTP sent to {phoneNumber} and your new PIN.
              </p>

              <div className="form-group">
                <label htmlFor="otp">OTP Code</label>
                <input
                  type="text"
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPin">New PIN</label>
                <input
                  type="password"
                  id="newPin"
                  placeholder="****"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Reset PIN'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => { setStep(1); setOtpCode(''); setNewPin(''); setConfirmPin(''); setError(''); setSuccess(''); }}
              >
                Back
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#10b981', marginBottom: '1.5rem' }}>
                Your PIN has been reset successfully!
              </p>
              <Link to="/worker/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
                Go to Login
              </Link>
            </div>
          )}

          {step !== 3 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/worker/login" style={{ color: '#6b7280' }}>Back to Login</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ForgotPin;
