// Debug component untuk menampilkan informasi autentikasi
// Tambahkan ke dashboard untuk debugging

import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import apiClient from '../services/api';

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      const user = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();
      const role = authService.getUserRole();
      
      setDebugInfo({
        user,
        isAuthenticated: isAuth,
        role,
        localStorage: localStorage.getItem('user'),
        timestamp: new Date().toISOString()
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const testApiCall = async () => {
    try {
      setTestResult({ loading: true });
      const response = await apiClient.get('/event/');
      setTestResult({ 
        success: true, 
        data: response.data,
        status: response.status 
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error.message,
        details: error.response?.data || error
      });
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 z-50"
        title="Toggle Auth Debug"
      >
        🔍
      </button>
      
      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-md max-h-96 overflow-auto text-xs z-40">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">🔍 Auth Debug</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
      
      <div className="space-y-2">
        <div>
          <strong>Authenticated:</strong> 
          <span className={debugInfo.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.isAuthenticated ? ' ✅ Yes' : ' ❌ No'}
          </span>
        </div>
        
        <div>
          <strong>Role:</strong> 
          <span className="ml-1 px-1 bg-blue-100 rounded">
            {debugInfo.role || 'None'}
          </span>
        </div>
        
        <div>
          <strong>User Data:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-x-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>LocalStorage Raw:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-x-auto">
            {debugInfo.localStorage || 'Empty'}
          </pre>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={testApiCall}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Test API
          </button>
          <button 
            onClick={clearStorage}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Clear Storage
          </button>
        </div>
        
        {testResult && (
          <div>
            <strong>API Test:</strong>
            {testResult.loading ? (
              <span className="text-blue-600"> Loading...</span>
            ) : testResult.success ? (
              <div className="text-green-600">
                ✅ Success (Status: {testResult.status})
                <pre className="bg-green-50 p-1 rounded text-xs mt-1">
                  {JSON.stringify(testResult.data, null, 2).substring(0, 200)}...
                </pre>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Failed: {testResult.error}
                <pre className="bg-red-50 p-1 rounded text-xs mt-1">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
          <div className="text-xs text-gray-500">
            Last update: {debugInfo.timestamp?.substring(11, 19)}
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default AuthDebug;