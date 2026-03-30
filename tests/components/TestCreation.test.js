import { render, fireEvent, waitFor } from '@testing-library/react';
import TestCreation from '../../Client/src/components/admin/TestCreation';
import axios from 'axios';

jest.mock('axios');

describe('TestCreation Component', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('should render form fields correctly', () => {
    const { getByLabelText } = render(<TestCreation />);
    expect(getByLabelText('Test Type')).toBeInTheDocument();
    expect(getByLabelText('Time Limit (minutes)')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockTest = {
      jobId: '123',
      testType: 'aptitude',
      timeLimit: 60
    };

    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText } = render(<TestCreation />);
    const submitButton = getByText('Create Test');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/tests', expect.any(Object));
    });
  });

  it('should handle errors during submission', async () => {
    axios.post.mockRejectedValueOnce(new Error('Failed to create test'));

    const { getByText } = render(<TestCreation />);
    const submitButton = getByText('Create Test');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Error creating test')).toBeInTheDocument();
    });
  });
});
