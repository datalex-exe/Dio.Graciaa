import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';

function UserManagementModal({ currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Inline delete confirmation: stores userId awaiting confirm
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Ref to scroll form into view when Edit is clicked
  const formRef = useRef(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_C'); // Default to Executive
  const [permittedProjects, setPermittedProjects] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user list');
      setLoading(false);
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        email,
        role,
        permittedProjects: role === 'ROLE_A' ? '' : permittedProjects
      };

      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload);
        setSuccess(`User "${name}" updated successfully.`);
        setEditingUser(null);
      } else {
        if (!password) {
          setError('Password is required for new users.');
          setIsSubmitting(false);
          return;
        }
        const res = await api.post('/users', payload);
        setSuccess(`User "${res.data.user.name}" created successfully.`);
      }

      setName('');
      setEmail('');
      setPassword('');
      setRole('ROLE_C');
      setPermittedProjects('');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (u) => {
    setPendingDeleteId(null); // clear any pending delete
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setPermittedProjects(u.permittedProjects || '');
    setError('');
    setSuccess('');
    // Scroll the form into view so the user sees it switched to Edit mode
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('ROLE_C');
    setPermittedProjects('');
    setError('');
    setSuccess('');
    setPendingDeleteId(null);
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (pendingDeleteId !== userId) {
      // First click: mark as pending, wait for confirmation click
      setPendingDeleteId(userId);
      return;
    }

    // Second click (confirmed): proceed with deletion
    setPendingDeleteId(null);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${userId}`);
      setSuccess(`User "${userEmail}" deleted successfully.`);
      if (editingUser && editingUser.id === userId) {
        handleCancelEdit();
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'ROLE_A':
        return <span className="badge" style={{ background: '#3b82f6', color: '#ffffff' }}>⚙️ Admin</span>;
      case 'ROLE_B':
        return <span className="badge" style={{ background: '#f59e0b', color: '#0f172a' }}>🏗️ Feeder</span>;
      case 'ROLE_C':
        return <span className="badge" style={{ background: '#10b981', color: '#ffffff' }}>👁️ Executive</span>;
      case 'ROLE_D':
        return <span className="badge" style={{ background: '#8b5cf6', color: '#ffffff' }}>🔍 Client</span>;
      default:
        return <span className="badge" style={{ background: '#64748b', color: '#ffffff' }}>Viewer</span>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👥 User Management
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Manage access controls, project permissions, and login roles.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            ✖ Close
          </button>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Add/Edit User Form */}
        <div ref={formRef} style={{
          background: 'var(--bg-primary)',
          padding: '1.25rem',
          borderRadius: '8px',
          border: editingUser ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
          boxShadow: editingUser ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none',
          marginBottom: '1.5rem',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: editingUser ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
            {editingUser ? `✏️ Edit User: ${editingUser.name}` : '➕ Add New Login User'}
          </h3>

          <form onSubmit={handleSubmitUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder={editingUser ? 'Enter new password or leave blank' : 'Enter login password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Permissions & Role *
                </label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="ROLE_A">⚙️ Admin (Full Access & User Management)</option>
                  <option value="ROLE_B">🏗️ Feeder (Read All + Edit Execution Columns)</option>
                  <option value="ROLE_C">👁️ Executive (Read All Data — No Editing)</option>
                  <option value="ROLE_D">🔍 Client (Project-Restricted Read-Only)</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Permitted Project Numbers / Order Numbers (Comma-separated)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ORD-2026-001, ORD-2026-002"
                  value={permittedProjects}
                  onChange={(e) => setPermittedProjects(e.target.value)}
                  disabled={role !== 'ROLE_D'}
                  style={{ opacity: role !== 'ROLE_D' ? 0.6 : 1 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  {role === 'ROLE_D'
                    ? '🔑 Specify comma-separated project codes this Client is authorized to access.'
                    : '⚡ This role automatically has access to all projects — no restrictions needed.'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {editingUser && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '0.5rem 1.25rem' }}
              >
                {isSubmitting
                  ? (editingUser ? 'Saving User...' : 'Creating User...')
                  : (editingUser ? '💾 Save Changes' : '➕ Create Login Account')}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Users Table */}
        <div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Existing System Users ({users.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Loading users...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="billing-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Access Role</th>
                    <th>Project Permissions</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.role === 'ROLE_A' ? (
                          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>🔓 All Projects</span>
                        ) : (
                          <span style={{
                            fontSize: '0.8rem',
                            color: u.permittedProjects ? 'var(--text-primary)' : '#f87171',
                            fontWeight: u.permittedProjects ? 500 : 600
                          }}>
                            {u.permittedProjects ? u.permittedProjects : '🚫 No Projects Assigned'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleEditClick(u)}
                          >
                            ✏️ Edit
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              className="btn btn-danger"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                background: pendingDeleteId === u.id ? '#dc2626' : undefined,
                                borderColor: pendingDeleteId === u.id ? '#b91c1c' : undefined
                              }}
                              onClick={() => handleDeleteUser(u.id, u.email)}
                            >
                              {pendingDeleteId === u.id ? '⚠️ Confirm Delete?' : '🗑️ Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagementModal;
