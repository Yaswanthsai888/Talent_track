export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data.error || 'Server Error',
      status: error.response.status
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'No response from server',
      status: 503
    };
  } else {
    // Error in request setup
    return {
      message: 'Error setting up request',
      status: 400
    };
  }
};

export const displayError = (error, setError) => {
  const errorDetails = handleApiError(error);
  setError(errorDetails.message);
  
  // Clear error after 5 seconds
  setTimeout(() => setError(null), 5000);
};
