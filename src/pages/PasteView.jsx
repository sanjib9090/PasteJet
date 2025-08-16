import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Copy,
  Download,
  Eye,
  Lock,
  Calendar,
  User,
  FileText,
  Check,
  Globe,
  EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import CodeBlock from "../components/CodeBlock";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function PasteView({ theme = 'dark' }) {
  const { id } = useParams();
  const [paste, setPaste] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPaste();
  }, [id]);

  const loadPaste = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching paste with ID or custom_url:", id);

    try {
      // Try fetching by document ID first
      let pasteRef = doc(db, "pastes", id);
      let pasteSnap = await getDoc(pasteRef);
      let pasteData = null;

      // If document ID doesn't exist, try fetching by custom_url
      if (!pasteSnap.exists()) {
        console.log("Paste not found by ID, trying custom_url");
        const q = query(collection(db, "pastes"), where("custom_url", "==", id));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          console.log("No paste found with custom_url:", id);
          setError("Paste not found or has been deleted.");
          setLoading(false);
          return;
        }
        pasteSnap = querySnapshot.docs[0];
        pasteRef = doc(db, "pastes", pasteSnap.id);
        pasteData = { id: pasteSnap.id, ...pasteSnap.data() };
      } else {
        pasteData = { id: pasteSnap.id, ...pasteSnap.data() };
      }

      // Filter out sensitive data before logging
      const { password: _, content: __, ...safePasteData } = pasteData;
      console.log("Paste metadata:", safePasteData);

      // Check expiration
      if (pasteData.expires_at && pasteData.expires_at.toDate() < new Date()) {
        setError("This paste has expired.");
        setLoading(false);
        return;
      }

      // Check password protection
      if (pasteData.password && !password) {
        console.log("Password required, showing prompt");
        setShowPasswordPrompt(true);
        setPaste(pasteData);
        setLoading(false);
        return;
      }

      // Handle content retrieval
      if (pasteData.password) {
        if (password !== pasteData.password) {
          console.log("Password verification failed");
          setError("Incorrect password.");
          setLoading(false);
          return;
        }
        console.log("Password verified, accessing content");
        setContent(pasteData.content);
      } else {
        // No password required
        setContent(pasteData.content);
      }

      // Increment views
      try {
        await updateDoc(pasteRef, { views: (pasteData.views || 0) + 1 });
        console.log("Views incremented");
      } catch (updateError) {
        console.warn("Failed to increment views:", updateError.message);
      }

      setPaste(pasteData);
      setShowPasswordPrompt(false);
      setLoading(false);
    } catch (error) {
      console.error("Error loading paste:", error);
      setError("Failed to load paste: " + error.message);
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    console.log("Password submitted (not logging actual password)");
    await loadPaste();
  };

  const copyToClipboard = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPaste = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paste.title || 'paste'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          cardBg: 'bg-white/80 border-emerald-200/50',
          cardTitle: 'text-gray-900',
          mutedText: 'text-gray-600',
          outlineButton: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
        };
      case 'orange':
        return {
          cardBg: 'bg-white/80 border-orange-200/50',
          cardTitle: 'text-gray-900',
          mutedText: 'text-gray-600',
          outlineButton: 'border-orange-200 text-orange-700 hover:bg-orange-50'
        };
      default:
        return {
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardTitle: 'text-white',
          mutedText: 'text-gray-400',
          outlineButton: 'border-gray-600 text-gray-300 hover:bg-gray-700'
        };
    }
  };

  const themeClasses = getThemeClasses();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-white"
        ></div>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 ">
        <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
          <CardContent className="text-center p-8">
            <div className={`w-16 h-16 mx-auto mb-4 ${
              theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
            } rounded-full flex items-center justify-center`}>
              <FileText className={`w-8 h-8 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${themeClasses.cardTitle}`}>
              {error || "Paste Not Found"}
            </h2>
            <p className={themeClasses.mutedText}>
              The paste you're looking for doesn't exist, has expired, or requires a password.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 ">
        <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
          <CardContent className="p-6">
            <CardTitle className={`mb-4 ${themeClasses.cardTitle}`}>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Enter Password</span>
              </div>
            </CardTitle>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className={themeClasses.mutedText}>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter paste password"
                  className={themeClasses.outlineButton}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                className={`w-full ${theme === 'dark' ? 'bg-purple-500 hover:bg-purple-600' : theme === 'green' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
              >
                Unlock Paste
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className={`text-xl mb-2 ${themeClasses.cardTitle}`}>
                    {paste.title || "Untitled Paste"}
                  </CardTitle>
                  <div className={`flex flex-wrap items-center gap-3 text-sm ${themeClasses.mutedText}`}>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{paste.created_by === "anonymous" ? "Anonymous" : paste.created_by}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(paste.created_date.toDate()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{paste.views || 0} views</span>
                    </div>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {paste.visibility === 'public' ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{paste.visibility}</span>
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className={themeClasses.outlineButton}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPaste}
                    className={themeClasses.outlineButton}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
            <CardContent className="p-6">
              <CodeBlock content={content} language={paste.language} theme={theme} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}