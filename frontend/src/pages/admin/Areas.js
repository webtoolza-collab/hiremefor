import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from './AdminLayout';

function AdminAreas() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newArea, setNewArea] = useState({ name: '', province: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', province: '' });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const response = await adminAPI.getAreas();
      setAreas(response.data);
    } catch (err) {
      console.error('Failed to load areas:', err);
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newArea.name.trim()) return;
    try {
      await adminAPI.addArea(newArea.name.trim(), newArea.province.trim() || null);
      setNewArea({ name: '', province: '' });
      loadAreas();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add area');
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.name.trim()) return;
    try {
      await adminAPI.updateArea(id, editValue.name.trim(), editValue.province.trim() || null);
      setEditingId(null);
      loadAreas();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update area');
    }
  };

  const handleDelete = async (id, name, workerCount) => {
    if (workerCount > 0) {
      alert(`Cannot delete "${name}" - ${workerCount} worker(s) are registered in this area.`);
      return;
    }
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await adminAPI.deleteArea(id);
      loadAreas();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete area');
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: '2rem' }}>Areas Management</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Area</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Area name..."
            value={newArea.name}
            onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
            style={{ flex: 2, minWidth: '200px' }}
          />
          <input
            type="text"
            placeholder="Province (optional)"
            value={newArea.province}
            onChange={(e) => setNewArea(prev => ({ ...prev, province: e.target.value }))}
            style={{ flex: 1, minWidth: '150px' }}
          />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All Areas ({areas.length})</h3>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : areas.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No areas created yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Province</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Workers</th>
                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr key={area.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === area.id ? (
                      <input
                        type="text"
                        value={editValue.name}
                        onChange={(e) => setEditValue(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      area.name
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {editingId === area.id ? (
                      <input
                        type="text"
                        value={editValue.province}
                        onChange={(e) => setEditValue(prev => ({ ...prev, province: e.target.value }))}
                      />
                    ) : (
                      area.province || '-'
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                    {area.worker_count || 0}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {editingId === area.id ? (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                          onClick={() => handleEdit(area.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                          onClick={() => { setEditingId(area.id); setEditValue({ name: area.name, province: area.province || '' }); }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleDelete(area.id, area.name, area.worker_count)}
                        >
                          Delete
                        </button>
                      </>
                    )}
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

export default AdminAreas;
