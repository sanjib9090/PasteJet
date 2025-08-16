import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { auth, googleProvider, githubProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login({ theme = 'dark', user }) {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    return null; // Layout.jsx handles redirect to /dashboard
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          cardBg: 'bg-white/80 border-emerald-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-emerald-600',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
          secondaryButton: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
          tertiaryButton: 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black',
          subtitleColor: 'text-gray-600',
        };
      case 'orange':
        return {
          cardBg: 'bg-white/80 border-orange-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-orange-600',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600',
          secondaryButton: 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600',
          tertiaryButton: 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black',
          subtitleColor: 'text-gray-600',
        };
      default: // dark
        return {
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
          secondaryButton: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          tertiaryButton: 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black',
          subtitleColor: 'text-gray-400',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log('Attempting Google login');
      await signInWithPopup(auth, googleProvider);
      console.log('Google login successful');
      navigate("/dashboard");
    } catch (error) {
      console.error('Google login error:', error.code, error.message);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Google login cancelled.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Failed to sign in with Google. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log('Attempting GitHub login');
      await signInWithPopup(auth, githubProvider);
      console.log('GitHub login successful');
      navigate("/dashboard");
    } catch (error) {
      console.error('GitHub login error:', error.code, error.message);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('GitHub login cancelled.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Failed to sign in with GitHub. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background-color)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
              <Users className={`w-6 h-6 ${themeClasses.cardIcon}`} />
              <span>Login to PasteJet</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className={`w-full ${themeClasses.secondaryButton} text-white shadow-lg flex items-center justify-center space-x-2`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.82 2.9 30.29.5 24 .5 14.82.5 7.01 6.48 3.68 14.44l7.98 6.2C13.52 14.52 18.38 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24.5c0-1.54-.14-3.02-.4-4.5H24v9h12.7c-.54 2.76-2.11 5.1-4.45 6.7l6.87 5.34C43.68 37.07 46.5 31.28 46.5 24.5z" />
                    <path fill="#FBBC05" d="M11.66 28.66a14.52 14.52 0 0 1 0-9.32l-7.98-6.2a23.96 23.96 0 0 0 0 21.72l7.98-6.2z" />
                    <path fill="#34A853" d="M24 47.5c6.29 0 11.62-2.07 15.5-5.63l-6.87-5.34c-2 1.35-4.59 2.14-8.63 2.14-5.62 0-10.48-5.02-12.34-11.14l-7.98 6.2C7.01 41.52 14.82 47.5 24 47.5z" />
                  </svg>

                  <span>Login with Google</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleGithubLogin}
              disabled={isSubmitting}
              className={`w-full ${themeClasses.tertiaryButton} text-white shadow-lg flex items-center justify-center space-x-2`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.165c-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.24 1.838 1.24 1.07 1.835 2.805 1.305 3.492.998.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.335-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.305-.54-1.53.105-3.185 0 0 1.005-.325 3.3 1.235.96-.265 1.98-.4 3-.405 1.02.005 2.04.14 3 .405 2.28-1.56 3.285-1.235 3.285-1.235.645 1.655.24 2.88.12 3.185.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.925.435.375.81 1.11.81 2.235v3.31c0 .32.225.695.825.575C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Login with GitHub</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}