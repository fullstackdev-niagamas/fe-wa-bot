import React, { useState } from 'react';
import axios from 'axios';
import { Send, Lock, User, Loader2 } from 'lucide-react';

const Login = ({ onLogin }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Hit n8n API Login
            const response = await axios.post(`${API_BASE_URL}/login`, {
                username,
                password
            });

            if (response.data.status === 'success') {
                onLogin(response.data.user);
            } else {
                setError(response.data.message || 'Invalid username or password');
            }
        } catch (err) {
            setError('Connection failed. Please check your backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-fade">
                <div className="login-header">
                    <div className="logo">
                        <Send size={40} />
                        <span>WHATSAPP BOT</span>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Please enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>
                            <User size={14} style={{ marginRight: 8 }} />
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Lock size={14} style={{ marginRight: 8 }} />
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Logging in...</span>
                            </>
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
