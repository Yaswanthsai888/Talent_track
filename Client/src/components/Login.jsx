import React, { useState } from 'react';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import '../styles/global.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log('Attempting login with:', { email, password });
            const response = await login({ email, password });
            
            console.log('Login response:', response);

            if (response.user && response.token) {
                // Dispatch user to Redux store
                dispatch(setUser(response.user));
                
                // Navigate based on user role
                const userRole = response.user.role;
                console.log('User role:', userRole);
                
                if (userRole === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/user-dashboard');
                }
            } else {
                setError('Invalid login response');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container glass-morphism">
            <div className="form-header">
                <h2>Login to Dashboard</h2>
                <div className="glow-line"></div>
            </div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="cyber-form">
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="cyber-input"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="cyber-input"
                    />
                </div>
                <button type="submit" className="cyber-button" disabled={isLoading}>
                    {isLoading ? (
                        <span className="loader"></span>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>
            <p className="switch-form">
                Don't have an account? 
                <button onClick={() => navigate('/register')} className="link-button">
                    Register
                </button>
            </p>
        </div>
    );
};

export default Login;
