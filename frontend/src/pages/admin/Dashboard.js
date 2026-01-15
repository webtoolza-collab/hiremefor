import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from './AdminLayout';

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (err.response?.status === 401) {
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Workers</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>{data?.stats?.total_workers || 0}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Ratings</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>{data?.stats?.total_ratings || 0}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Skills</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>{data?.stats?.total_skills || 0}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Areas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>{data?.stats?.total_areas || 0}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Recent Registrations</h2>
          <Link to="/admin/workers" style={{ color: '#dc2626' }}>View All</Link>
        </div>

        {data?.recent_workers?.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No workers registered yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_workers?.map(worker => (
                <tr key={worker.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{worker.first_name} {worker.surname}</td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>{worker.phone_number}</td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {new Date(worker.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
