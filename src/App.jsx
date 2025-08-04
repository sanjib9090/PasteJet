
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log('Auth state changed:', currentUser ? currentUser.email : 'No user');
    });
    return () => unsubscribe();
  }, []);

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
