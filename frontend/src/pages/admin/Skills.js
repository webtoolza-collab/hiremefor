import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from './AdminLayout';

function AdminSkills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await adminAPI.getSkills();
      setSkills(response.data);
    } catch (err) {
      console.error('Failed to load skills:', err);
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await adminAPI.addSkill(newSkill.trim());
      setNewSkill('');
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      await adminAPI.updateSkill(id, editValue.trim());
      setEditingId(null);
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update skill');
    }
  };

  const handleDelete = async (id, name, workerCount) => {
    if (workerCount > 0) {
      alert(`Cannot delete "${name}" - it is assigned to ${workerCount} worker(s).`);
      return;
    }
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await adminAPI.deleteSkill(id);
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete skill');
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: '2rem' }}>Skills Management</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Skill</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Skill name..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All Skills ({skills.length})</h3>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : skills.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No skills created yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Workers</th>
                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => (
                <tr key={skill.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === skill.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      skill.name
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                    {skill.worker_count || 0}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {editingId === skill.id ? (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                          onClick={() => handleEdit(skill.id)}
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
                          onClick={() => { setEditingId(skill.id); setEditValue(skill.name); }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleDelete(skill.id, skill.name, skill.worker_count)}
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

export default AdminSkills;
