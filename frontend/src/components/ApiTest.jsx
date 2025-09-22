import React, { useState } from 'react';
import authService from '../services/authService';

const ApiTest = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testForgotPassword = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await authService.forgotPassword(email);
      setResult(`Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiConnection = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.text();
      setResult(`API Connection: ${response.status} - ${data}`);
    } catch (error) {
      setResult(`API Connection Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">API Test Component</h2>
      
      <div className="mb-4">
        <button 
          onClick={testApiConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test API Connection
        </button>
      </div>

      <div className="mb-4">
        <input
          type="email"
          placeholder="Enter email to test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded mr-2"
        />
        <button 
          onClick={testForgotPassword}
          disabled={loading || !email}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Forgot Password
        </button>
      </div>

      {loading && <p>Loading...</p>}
      
      {result && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
