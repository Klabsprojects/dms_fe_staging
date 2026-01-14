// apiInterceptor.js
// This file should be imported in your App.js or index.js

// Store the original fetch function
const originalFetch = window.fetch;

// Override the global fetch function
window.fetch = async (...args) => {
  try {
    // Call the original fetch
    const response = await originalFetch(...args);
    
    // Clone the response to read it without consuming it
    const responseClone = response.clone();
    
    // Only intercept JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await responseClone.json();
        
        // Check for session expiration
        if (data.error === "Session expired, please login again") {
          handleSessionExpiration();
          // Return the original response so your existing error handling still works
          return response;
        }
      } catch (jsonError) {
        // If JSON parsing fails, just return the original response
        console.log('Non-JSON response, skipping session check');
      }
    }
    
    // Return the original response
    return response;
    
  } catch (error) {
    // If fetch itself fails, just throw the original error
    throw error;
  }
};

// Function to handle session expiration
const handleSessionExpiration = () => {
  console.log('Session expired detected. Cleaning up and redirecting...');
  
  // Clear all authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Clear any other session-related data you might have
  // localStorage.removeItem('userPreferences');
  // sessionStorage.clear();
  
  // Show a brief notification (optional)
  if (window.confirm) {
    setTimeout(() => {
      alert('Your session has expired. You will be redirected to the login page.');
    }, 100);
  }
  
  // Redirect to login page
  // Use replace to prevent going back to the protected page
  window.location.replace('/login');
};

// Export for manual use if needed
export { handleSessionExpiration };