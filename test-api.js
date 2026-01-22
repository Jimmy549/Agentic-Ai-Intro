// Simple test for deployed API
const testAPI = async () => {
  try {
    // Test health endpoint
    const healthResponse = await fetch('/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    // Test chat endpoint
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is 2 + 2?'
      })
    });
    const chatData = await chatResponse.json();
    console.log('Chat response:', chatData);

  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Run test if in browser
if (typeof window !== 'undefined') {
  testAPI();
}