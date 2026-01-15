import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await adminAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      navigate('/admin');
    }
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/workers', label: 'Workers' },
    { path: '/admin/skills', label: 'Skills' },
    { path: '/admin/areas', label: 'Areas' },
    { path: '/admin/ratings', label: 'Ratings' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <Link to="/" className="logo logo-small">HIRE ME FOR</Link>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>Admin Panel</p>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                marginBottom: '0.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#dc2626' : '#374151',
                background: location.pathname === item.path ? '#fee2e2' : 'transparent',
                fontWeight: location.pathname === item.path ? '500' : 'normal'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: '#f5f5f5', padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
