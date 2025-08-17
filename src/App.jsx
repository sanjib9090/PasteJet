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

  // Get theme from localStorage, default to 'dark'
  const theme = localStorage.getItem('theme') && ['dark', 'orange', 'green'].includes(localStorage.getItem('theme'))
    ? localStorage.getItem('theme')
    : 'dark';

  // Define theme styles matching Layout.jsx
  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          background: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100',
          spinnerBorder: 'border-emerald-200/50',
          spinnerTop: 'border-t-emerald-600',
          text: 'text-gray-600',
          errorBg: 'bg-emerald-50',
          errorText: 'text-red-600'
        };
      case 'orange':
        return {
          background: 'bg-gradient-to-br from-rose-50 via-orange-50 to-pink-100',
          spinnerBorder: 'border-orange-200/50',
          spinnerTop: 'border-t-orange-600',
          text: 'text-gray-600',
          errorBg: 'bg-orange-50',
          errorText: 'text-red-600'
        };
      default: // dark
        return {
          background: 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900',
          spinnerBorder: 'border-gray-700/50',
          spinnerTop: 'border-t-purple-400',
          text: 'text-white',
          errorBg: 'bg-gray-900',
          errorText: 'text-red-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

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
        className={`flex justify-center items-center h-screen m-0 ${themeClasses.background}`}
      >
        <div
          className={`border-4 ${themeClasses.spinnerBorder} ${themeClasses.spinnerTop} rounded-full w-12 h-12 animate-spin`}
        ></div>
        <style>
          {`
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`text-center p-5 ${themeClasses.errorBg} ${themeClasses.text} min-h-screen`}
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