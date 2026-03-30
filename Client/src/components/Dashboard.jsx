import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/jobs')
            .then(res => setJobs(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h1>Job Dashboard</h1>
            {jobs.map(job => (
                <div key={job._id}>
                    <h2>{job.title}</h2>
                    <p>{job.description}</p>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;