import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRankedCandidates, selectCandidates } from '../../services/rankingService';

const CandidateRanking = () => {
  const { testId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState('auto'); // 'auto' or 'manual'

  useEffect(() => {
    loadCandidates();
  }, [testId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await getRankedCandidates(testId);
      setCandidates(data.candidates);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = async () => {
    try {
      setLoading(true);
      const payload = selectionMode === 'auto' 
        ? { count: selectedCount }
        : { candidateIds: Array.from(selectedIds) };
      
      await selectCandidates(testId, payload);
      await loadCandidates(); // Refresh list
    } catch (error) {
      console.error('Error selecting candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div className="ranking-container">
      <div className="selection-controls">
        <div className="mode-switch">
          <label>
            <input
              type="radio"
              value="auto"
              checked={selectionMode === 'auto'}
              onChange={e => setSelectionMode(e.target.value)}
            />
            Auto Select Top N
          </label>
          <label>
            <input
              type="radio"
              value="manual"
              checked={selectionMode === 'manual'}
              onChange={e => setSelectionMode(e.target.value)}
            />
            Manual Selection
          </label>
        </div>

        {selectionMode === 'auto' && (
          <div className="auto-select">
            <input
              type="number"
              value={selectedCount}
              onChange={e => setSelectedCount(e.target.value)}
              min="1"
              max={candidates.length}
            />
            <button onClick={handleSelection}>
              Select Top {selectedCount}
            </button>
          </div>
        )}

        {selectionMode === 'manual' && (
          <button 
            onClick={handleSelection}
            disabled={selectedIds.size === 0}
          >
            Select {selectedIds.size} Candidates
          </button>
        )}
      </div>

      <table className="candidates-table">
        <thead>
          <tr>
            {selectionMode === 'manual' && <th>Select</th>}
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Time Taken</th>
            <th>Submitted At</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => (
            <tr key={candidate._id} className={candidate.selected ? 'selected' : ''}>
              {selectionMode === 'manual' && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(candidate._id)}
                    onChange={e => {
                      const newIds = new Set(selectedIds);
                      if (e.target.checked) {
                        newIds.add(candidate._id);
                      } else {
                        newIds.delete(candidate._id);
                      }
                      setSelectedIds(newIds);
                    }}
                  />
                </td>
              )}
              <td>{index + 1}</td>
              <td>{candidate.candidateName}</td>
              <td>{candidate.score}%</td>
              <td>{candidate.timeTaken} mins</td>
              <td>{new Date(candidate.submittedAt).toLocaleString()}</td>
              <td>{candidate.selected ? 'Selected' : 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateRanking;
