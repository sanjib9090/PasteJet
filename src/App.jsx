import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import PasteView from './pages/PasteView';
import Dashboard from './pages/Dashboard';
import Clipboard from './pages/Clipboard';
import CodeLab from './pages/CodeLab';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Auth check started:', new Date().toISOString());
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Authentication check timed out. Please try again.');
        console.error('Auth state check timed out after 10 seconds');
      }
    }, 10000); // 10-second timeout

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state resolved:', new Date().toISOString(), currentUser ? currentUser.email : 'No user');
      setUser(currentUser);
      setLoading(false);
      clearTimeout(timeout);
    }, (error) => {
      console.error('Error in onAuthStateChanged:', error.code, error.message);
      setError('Failed to check authentication state. Please try again.');
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a', // Dark theme background
          margin: 0
        }}
      >
        <div
          style={{
            border: '4px solid #ffffff33', // Light gray for contrast
            borderTop: '4px solid #ffffff', // White spinner for visibility
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              background-color: #1a1a1a; /* Ensure body matches dark theme */
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#1a1a1a', // Match dark theme
          color: '#ffffff', // White text for readability
          minHeight: '100vh'
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout user={user}><Home /></Layout>} />
        <Route path="/view/:id" element={<Layout user={user}><PasteView /></Layout>} />
        <Route path="/dashboard" element={<Layout user={user}><Dashboard /></Layout>} />
        <Route path="/clipboard" element={<Layout user={user}><Clipboard /></Layout>} />
        <Route path="/codelab" element={<Layout user={user}><CodeLab /></Layout>} />
        <Route path="/login" element={<Layout user={user}><Login /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;