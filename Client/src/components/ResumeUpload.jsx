import React, { useState } from 'react';
import { uploadResume } from '../services/api';

const ResumeUpload = () => {
    const [file, setFile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) {
            setError('No file selected');
            return;
        }
        
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Only PDF and DOCX files are allowed');
            return;
        }

        if (selectedFile.size > maxSize) {
            setError('File size should not exceed 5MB');
            return;
        }

        setFile(selectedFile);
        setError('');
        setSuccess('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await uploadResume(file);
            if (response.skills && response.skills.length > 0) {
                setSkills(response.skills);
                setSuccess('Resume uploaded and skills extracted successfully!');
            } else {
                setSuccess('Resume uploaded but no skills were extracted');
            }
        } catch (err) {
            console.error('Resume upload error:', err);
            setError(err.message || 'Failed to upload resume. Please try again.');
            setSkills([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="resume-upload-container glass-morphism">
            <h2>Upload Resume</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            
            <input 
                type="file" 
                accept=".pdf,.docx" 
                onChange={handleFileChange} 
                className="cyber-input"
            />
            
            <button 
                onClick={handleUpload} 
                disabled={!file || isLoading}
                className="cyber-button"
            >
                {isLoading ? <span className="loader"></span> : 'Upload Resume'}
            </button>

            {skills.length > 0 && (
                <div className="skills-section">
                    <h3>Extracted Skills:</h3>
                    <ul>
                        {skills.map((skill, index) => (
                            <li key={index}>{skill}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ResumeUpload;
