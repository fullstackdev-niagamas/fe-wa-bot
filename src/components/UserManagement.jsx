import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, User, Lock, Loader2, ShieldCheck, Shield } from 'lucide-react';

const UserManagement = ({ addLog, showToast }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(false);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            addLog(`Adding new user: ${username}...`, 'info');

            // Hit n8n API Register/Add User
            await axios.post(`${API_BASE_URL}/register`, {
                username,
                password,
                role
            });

            addLog(`User ${username} added successfully!`, 'success');
            showToast(`User ${username} added!`);

            // Reset form
            setUsername('');
            setPassword('');
            setRole('admin');
        } catch (err) {
            addLog(`Failed to add user: ${err.response?.data?.message || err.message}`, 'error');
            showToast('Failed to add user', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade">
            <div className="card-header-with-icon">
                <div className="upload-icon-wrapper" style={{ width: 50, height: 50, marginBottom: 0 }}>
                    <UserPlus size={24} />
                </div>
                <div>
                    <h3>User Management</h3>
                    <p>Create new admin or superadmin accounts</p>
                </div>
            </div>

            <form onSubmit={handleAddUser} style={{ padding: '1.5rem' }}>
                <div className="form-grid">
                    <div className="form-group">
                        <label><User size={14} style={{ marginRight: 4 }} /> Username</label>
                        <input
                            type="text"
                            placeholder="new_username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><Lock size={14} style={{ marginRight: 4 }} /> Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group full">
                        <label>Role</label>
                        <div className="role-selector">
                            <div
                                className={`role-option ${role === 'admin' ? 'active' : ''}`}
                                onClick={() => setRole('admin')}
                            >
                                <Shield size={18} />
                                <div>
                                    <strong>Admin</strong>
                                    <span>Can view messages only</span>
                                </div>
                            </div>
                            <div
                                className={`role-option ${role === 'superadmin' ? 'active' : ''}`}
                                onClick={() => setRole('superadmin')}
                            >
                                <ShieldCheck size={18} />
                                <div>
                                    <strong>Superadmin</strong>
                                    <span>Full access to all features</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={18} />
                            <span>Add User</span>
                        </>
                    )}
                </button>
            </form>

            <style dangerouslySetInnerHTML={{
                __html: `
        .card-header-with-icon {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .card-header-with-icon h3 {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }
        .card-header-with-icon p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .role-option {
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
        }
        .role-option:hover {
          border-color: var(--primary);
          background: rgba(37, 211, 102, 0.02);
        }
        .role-option.active {
          border-color: var(--primary);
          background: rgba(37, 211, 102, 0.05);
          box-shadow: 0 0 0 1px var(--primary);
        }
        .role-option strong {
          display: block;
          font-size: 0.9rem;
        }
        .role-option span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .role-selector {
            grid-template-columns: 1fr;
          }
        }
      `}} />
        </div>
    );
};

export default UserManagement;
