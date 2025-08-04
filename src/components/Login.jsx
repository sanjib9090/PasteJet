import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { auth, provider } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login({ theme = 'dark', user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    return null; // Layout.jsx already handles redirect to /dashboard
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          cardBg: 'bg-white/80 border-emerald-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-emerald-600',
          inputBg: 'bg-white/70 border-emerald-200 text-gray-900 placeholder-gray-500 focus:border-emerald-400',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
          secondaryButton: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
          subtitleColor: 'text-gray-600',
        };
      case 'orange':
        return {
          cardBg: 'bg-white/80 border-orange-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-orange-600',
          inputBg: 'bg-white/70 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-400',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600',
          secondaryButton: 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600',
          subtitleColor: 'text-gray-600',
        };
      default: // dark
        return {
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          inputBg: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
          secondaryButton: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          subtitleColor: 'text-gray-400',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className={themeClasses.subtitleColor}>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={themeClasses.inputBg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={themeClasses.subtitleColor}>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={themeClasses.inputBg}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${themeClasses.primaryButton} text-white shadow-lg`}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "Login with Email"
                )}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${themeClasses.subtitleColor} bg-opacity-50`}>Or</span>
              </div>
            </div>
            <Button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className={`w-full ${themeClasses.secondaryButton} text-white shadow-lg`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.24 10.4V14h3.4c-.1 1-.6 2.6-2.4 3.6l3.9 3c2.3-2.1 3.6-5.2 3.6-8.6 0-.9-.1-1.7-.3-2.4h-4.2v-1.6h7.1c.1.7.1 1.5.1 2.3 0 4.7-3.2 8.1-7.1 9.4l-4-3.1c1.2-.9 2-2.3 2.3-3.9h-4.4z"
                />
                <path
                  fill="currentColor"
                  d="M12 4.4c1.6 0 3 .6 4.1 1.6l3-3C16.7 1.2 14.1 0 12 0 7.3 0 3.2 2.7 1.4 6.6l3.9 3c1-2.8 3.5-4.8 6.7-4.8z"
                />
                <path
                  fill="currentColor"
                  d="M1.4 17.4c1.8 3.9 5.9 6.6 10.6 6.6 2.1 0 4.1-.6 5.8-1.6l-4-3.1c-1.1.7-2.4 1.1-3.8 1.1-3.2 0-5.7-2-6.7-4.8l-3.9 3z"
                />
              </svg>
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login with Google"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}