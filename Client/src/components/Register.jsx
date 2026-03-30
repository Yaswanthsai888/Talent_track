import React, { useState } from 'react';
import { register } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parsedSkills, setParsedSkills] = useState([]);
    const navigate = useNavigate();

    const validateFile = (file) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            setFileError('Only PDF and DOCX files are allowed');
            return false;
        }

        if (file.size > maxSize) {
            setFileError('File size should not exceed 5MB');
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFileError('');
        
        if (!selectedFile) return;

        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            setFileError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const registrationData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            const response = await register(registrationData);
            
            if (response.success) {
                // Redirect to login after successful registration
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container glass-morphism">
            <h2>Register</h2>
            {error && <p className="error">{error}</p>}
            {fileError && <p className="error">{fileError}</p>}
            
            <form onSubmit={handleSubmit} className="cyber-form">
                <div className="form-group">
                    <label>Name</label>
                    <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        className="cyber-input"
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        className="cyber-input"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        className="cyber-input"
                    />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="cyber-input"
                    >
                        <option value="user">Job Seeker</option>
                        <option value="admin">Company/Admin</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    className="cyber-button"
                    disabled={isLoading}
                >
                    {isLoading ? <span className="loader"></span> : 'Register'}
                </button>
            </form>

            {parsedSkills.length > 0 && (
                <div className="skills-section">
                    <h3>Extracted Skills</h3>
                    <ul>
                        {parsedSkills.map((skill, index) => (
                            <li key={index}>{skill}</li>
                        ))}
                    </ul>
                </div>
            )}

            <p>
                Already have an account? 
                <button onClick={() => navigate('/login')}>Login</button>
            </p>
        </div>
    );
};

export default Register;
