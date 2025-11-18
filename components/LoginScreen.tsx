
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const handleLogin = () => {
    // In a real app, this would come from the Google Identity Services library
    const mockGoogleToken = 'mock-google-id-token';
    login(mockGoogleToken);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-white mb-4">Content Catalyst</h1>
        <p className="text-lg text-slate-400 mb-8">
          Your AI-powered assistant for creating and managing social media content.
          Generate ideas, write posts, and design visuals, all in one place.
        </p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.06 6.21C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.6 28.71c-.48-1.45-.76-2.99-.76-4.6s.28-3.15.76-4.6L2.56 13.22C1 16.01 0 19.88 0 24s1 7.99 2.56 10.78l8.04-6.07z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-8.06 6.21C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
