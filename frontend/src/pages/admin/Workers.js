import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from './AdminLayout';

function AdminWorkers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, [pagination.page, search]);

  const loadWorkers = async () => {
    try {
      const response = await adminAPI.getWorkers({ page: pagination.page, limit: pagination.limit, search });
      setWorkers(response.data.workers);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (err) {
      console.error('Failed to load workers:', err);
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name}? This action cannot be undone.`)) return;
    try {
      await adminAPI.removeWorker(id);
      loadWorkers();
    } catch (err) {
      console.error('Failed to remove worker:', err);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: '2rem' }}>Workers</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : workers.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No workers found.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Phone</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Area</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Joined</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(worker => (
                  <tr key={worker.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{worker.first_name} {worker.surname}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{worker.phone_number}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{worker.area_name}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{new Date(worker.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        onClick={() => handleRemove(worker.id, `${worker.first_name} ${worker.surname}`)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.total_pages > 1 && (
              <div className="pagination" style={{ marginTop: '1rem' }}>
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminWorkers;
