
import React, { useState, useEffect, Component } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Clipboard as ClipboardIcon,
  Share,
  Copy,
  Check,
  Search,
  Smartphone,
  Monitor,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

// Error Boundary Component
class ClipboardErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-2 bg-red-900/20 border-red-700/50">
          <CardContent className="p-6">
            <p className="text-red-400">Error: {this.state.error.message}</p>
            <p className="text-gray-400 text-sm mt-2">
              Please try refreshing the page or contact support.
            </p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default function ClipboardPage({ theme = 'dark', user }) {
  const [clipboards, setClipboards] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [retrieveId, setRetrieveId] = useState("");
  const [viewClipboardId, setViewClipboardId] = useState("");
  const [viewedClipboard, setViewedClipboard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("User object:", user);
    setDeviceName(getDeviceName());
    if (user) {
      loadClipboards();
    } else {
      setClipboards([]);
    }
  }, [user]);

  const loadClipboards = async () => {
    if (!user) {
      setClipboards([]);
      return;
    }
    try {
      console.log("Loading clipboards for user:", user.uid);
      const q = query(
        collection(db, "clipboards"),
        where("created_by", "==", user.uid),
        orderBy("created_date", "desc"),
        limit(50)
      );
      console.log("Executing query:", q);
      const querySnapshot = await getDocs(q);
      const clipboardData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Clipboard query results:", clipboardData);
      setClipboards(clipboardData);
      if (querySnapshot.empty) {
        console.log("No clipboards found for user:", user.uid);
        setError("No clipboards found. Create one above!");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Error loading clipboards:", err.code, err.message);
      setError(`Failed to load clipboard history: ${err.message}`);
    }
  };

  const getDeviceName = () => {
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(userAgent)) return "iPhone";
    if (/Android/.test(userAgent)) return "Android";
    if (/Mac/.test(userAgent)) return "Mac";
    if (/Windows/.test(userAgent)) return "Windows PC";
    if (/Linux/.test(userAgent)) return "Linux";
    return "Unknown Device";
  };

  const generateClipboardId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmitClipboard = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setError("Content is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let clipboardId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;
      while (!isUnique && attempts < maxAttempts) {
        clipboardId = generateClipboardId();
        const q = query(collection(db, "clipboards"), where("clipboard_id", "==", clipboardId));
        const querySnapshot = await getDocs(q);
        isUnique = querySnapshot.empty;
        attempts++;
        console.log(`Attempt ${attempts}: clipboard_id ${clipboardId} ${isUnique ? "unique" : "taken"}`);
      }
      if (!isUnique) {
        throw new Error("Failed to generate unique clipboard ID after multiple attempts.");
      }

      const clipboardData = {
        content: newContent,
        device_name: deviceName,
        clipboard_id: clipboardId,
        created_date: Timestamp.fromDate(new Date()), // Use Firestore Timestamp
        created_by: user ? user.uid : "anonymous"
      };

      const docRef = await addDoc(collection(db, "clipboards"), clipboardData);
      console.log("Clipboard created:", docRef.id, clipboardData);

      if (user) {
        setClipboards(prev => [{ id: docRef.id, ...clipboardData }, ...prev.slice(0, 49)]);
      }

      alert(`Clipboard shared! ID: ${clipboardId}`);
      setNewContent("");
    } catch (err) {
      console.error("Error creating clipboard:", err.code, err.message);
      setError("Failed to share clipboard: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrieve = async (e) => {
    e.preventDefault();
    if (!retrieveId.trim() || retrieveId.length !== 6) {
      setError("Enter a valid 6-character Clipboard ID.");
      return;
    }

    setError("");
    try {
      const q = query(collection(db, "clipboards"), where("clipboard_id", "==", retrieveId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      console.log("Retrieve query results:", querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      if (querySnapshot.empty) {
        setError("Clipboard not found with that ID.");
        return;
      }

      const clipboard = querySnapshot.docs[0].data();
      const clipboardId = querySnapshot.docs[0].id;
      await navigator.clipboard.writeText(clipboard.content);
      setCopied({ [clipboardId]: true });
      setTimeout(() => setCopied({}), 2000);
      alert("Clipboard content copied to your device!");
    } catch (err) {
      console.error("Error retrieving clipboard:", err.code, err.message);
      setError("Failed to retrieve clipboard: " + err.message);
    }
  };

  const handleViewClipboard = async (e) => {
    e.preventDefault();
    if (!viewClipboardId.trim() || viewClipboardId.length !== 6) {
      setError("Enter a valid 6-character Clipboard ID.");
      return;
    }

    setError("");
    try {
      const q = query(collection(db, "clipboards"), where("clipboard_id", "==", viewClipboardId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      console.log("View query results:", querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      if (querySnapshot.empty) {
        setError("Clipboard not found with that ID.");
        setViewedClipboard(null);
        return;
      }

      const clipboard = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
      setViewedClipboard(clipboard);
    } catch (err) {
      console.error("Error viewing clipboard:", err.code, err.message);
      setError("Failed to view clipboard: " + err.message);
    }
  };

  const copyToClipboard = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied({ [id]: true });
      setTimeout(() => setCopied({}), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err.code, err.message);
      setError("Failed to copy content: " + err.message);
    }
  };

  // Helper to format created_date
  const formatDate = (createdDate) => {
    if (createdDate instanceof Timestamp) {
      return new Date(createdDate.toDate()).toLocaleString();
    } else if (typeof createdDate === 'string') {
      try {
        return new Date(createdDate).toLocaleString();
      } catch {
        return createdDate; // Fallback to raw string if parsing fails
      }
    }
    return 'Invalid Date';
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          heroIconColor: 'text-emerald-600',
          titleGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent',
          subtitleColor: 'text-gray-600',
          cardBg: 'bg-white/80 border-emerald-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-emerald-600',
          inputBg: 'bg-white/70 border-emerald-200 text-gray-900 placeholder-gray-500 focus:border-emerald-400',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
          secondaryButton: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
          outlineButton: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
          tipBg: 'bg-emerald-50 border border-emerald-200',
          tipText: 'text-emerald-700',
          deviceBg: 'bg-emerald-500/20',
          deviceIcon: 'text-emerald-600',
          clipboardIdBg: 'bg-emerald-500/20',
          clipboardIdText: 'text-emerald-700',
          contentBg: 'bg-gray-50',
          errorText: 'text-red-600'
        };
      case 'orange':
        return {
          heroIconColor: 'text-orange-600',
          titleGradient: 'bg-gradient-to-r from-orange-600 via-pink-600 to-orange-600 bg-clip-text text-transparent',
          subtitleColor: 'text-gray-600',
          cardBg: 'bg-white/80 border-orange-200/50',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-orange-600',
          inputBg: 'bg-white/70 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-400',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600',
          secondaryButton: 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600',
          outlineButton: 'border-orange-200 text-orange-700 hover:bg-orange-50',
          tipBg: 'bg-orange-50 border border-orange-200',
          tipText: 'text-orange-700',
          deviceBg: 'bg-orange-500/20',
          deviceIcon: 'text-orange-600',
          clipboardIdBg: 'bg-orange-500/20',
          clipboardIdText: 'text-orange-700',
          contentBg: 'bg-gray-50',
          errorText: 'text-red-600'
        };
      default: // dark
        return {
          heroIconColor: 'text-purple-400',
          titleGradient: 'bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent',
          subtitleColor: 'text-gray-400',
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          inputBg: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
          secondaryButton: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          outlineButton: 'border-gray-600 text-gray-300 hover:bg-gray-700',
          tipBg: 'bg-gray-900/30',
          tipText: 'text-gray-400',
          deviceBg: 'bg-purple-500/20',
          deviceIcon: 'text-purple-400',
          clipboardIdBg: 'bg-purple-500/20',
          clipboardIdText: 'text-purple-300',
          contentBg: 'bg-gray-900/50',
          errorText: 'text-red-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <ClipboardErrorBoundary>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center space-x-2 mb-4">
              <ClipboardIcon className={`w-8 h-8 ${themeClasses.heroIconColor}`} />
              <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.titleGradient}`}>
                Clipboard Sync
              </h1>
            </div>
            <p className={`text-lg ${themeClasses.subtitleColor}`}>
              Share clipboard content across all your devices instantly
            </p>
            {!user && (
              <div className={`mx-auto max-w-md mt-6 p-4 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-yellow-500/10 border border-yellow-500/30' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-yellow-300' : 'text-blue-700'
                }`}>
                  💡 <strong>Anonymous Mode:</strong> Share and retrieve clipboard content without login. 
                  Login to keep a history of your clipboard data.
                </p>
              </div>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className={`border-2 backdrop-blur-sm ${theme === 'dark' ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50/80 border-red-200'}`}>
                <CardContent className="p-6 pt-5">
                  <p className={themeClasses.errorText}>{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Share Clipboard */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`backdrop-blur-md h-fit ${themeClasses.cardBg}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                    <Share className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                    <span>Share to Clipboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitClipboard} className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-sm ${themeClasses.subtitleColor}`}>Device Name</label>
                      <div className="relative">
                        <Input
                          value={deviceName}
                          onChange={(e) => setDeviceName(e.target.value)}
                          className={`pl-10 ${themeClasses.inputBg}`}
                          placeholder="Your device name"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {deviceName.includes('iPhone') || deviceName.includes('Android') ? (
                            <Smartphone className={`w-4 h-4 ${themeClasses.subtitleColor}`} />
                          ) : (
                            <Monitor className={`w-4 h-4 ${themeClasses.subtitleColor}`} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`text-sm ${themeClasses.subtitleColor}`}>Content</label>
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Paste or type content to share..."
                        rows={6}
                        className={themeClasses.inputBg}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !newContent.trim()}
                      className={`w-full ${themeClasses.primaryButton} text-white`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sharing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Share className="w-4 h-4" />
                          <span>Share to Clipboard</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Retrieve Clipboard */}
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`backdrop-blur-md h-fit ${themeClasses.cardBg}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                    <Search className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                    <span>Retrieve & Copy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRetrieve} className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-sm ${themeClasses.subtitleColor}`}>Clipboard ID</label>
                      <Input
                        value={retrieveId}
                        onChange={(e) => setRetrieveId(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character ID"
                        maxLength={6}
                        className={`font-mono text-center text-lg tracking-widest ${themeClasses.inputBg}`}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!retrieveId.trim() || retrieveId.length !== 6}
                      className={`w-full ${themeClasses.secondaryButton} text-white`}
                    >
                      <div className="flex items-center space-x-2">
                        <Copy className="w-4 h-4" />
                        <span>Retrieve & Copy</span>
                      </div>
                    </Button>
                  </form>

                  <div className={`mt-6 p-4 rounded-lg ${themeClasses.tipBg}`}>
                    <p className={`text-sm ${themeClasses.tipText}`}>
                      💡 <strong>Tip:</strong> Enter the ID to instantly copy content to your device.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* View Clipboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`backdrop-blur-md h-fit ${themeClasses.cardBg}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                    <Eye className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                    <span>View Clipboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleViewClipboard} className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-sm ${themeClasses.subtitleColor}`}>Clipboard ID</label>
                      <Input
                        value={viewClipboardId}
                        onChange={(e) => setViewClipboardId(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character ID"
                        maxLength={6}
                        className={`font-mono text-center text-lg tracking-widest ${themeClasses.inputBg}`}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!viewClipboardId.trim() || viewClipboardId.length !== 6}
                      className={`w-full ${themeClasses.primaryButton} text-white`}
                    >
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>View Content</span>
                      </div>
                    </Button>
                  </form>

                  {viewedClipboard && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${themeClasses.subtitleColor}`}>Found clipboard:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(viewedClipboard.content, viewedClipboard.id)}
                          className={themeClasses.outlineButton}
                        >
                          {copied[viewedClipboard.id] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className={`p-3 rounded ${themeClasses.contentBg}`}>
                        <pre className={`text-sm whitespace-pre-wrap break-words ${themeClasses.subtitleColor}`}>
                          {viewedClipboard.content.length > 150
                            ? viewedClipboard.content.substring(0, 150) + "..."
                            : viewedClipboard.content
                          }
                        </pre>
                      </div>
                      <p className={`text-xs ${themeClasses.subtitleColor}`}>
                        From {viewedClipboard.device_name} • {formatDate(viewedClipboard.created_date)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Clipboards - Only show if user is logged in */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
                <CardHeader>
                  <CardTitle className={themeClasses.cardTitle}>Recent Clipboards</CardTitle>
                </CardHeader>
                <CardContent>
                  {clipboards.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardIcon className={`w-12 h-12 mx-auto mb-4 ${themeClasses.subtitleColor}`} />
                      <p className={themeClasses.subtitleColor}>No clipboard items yet</p>
                      <p className={`text-sm ${themeClasses.subtitleColor}`}>Create your first clipboard sync above</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clipboards.map((clipboard) => (
                        <motion.div
                          key={clipboard.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                            theme === 'dark'
                              ? 'border-gray-700 hover:border-gray-600'
                              : theme === 'green'
                              ? 'border-emerald-200 hover:border-emerald-300'
                              : 'border-orange-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${themeClasses.deviceBg}`}>
                                {clipboard.device_name?.includes('iPhone') || clipboard.device_name?.includes('Android') ? (
                                  <Smartphone className={`w-4 h-4 ${themeClasses.deviceIcon}`} />
                                ) : (
                                  <Monitor className={`w-4 h-4 ${themeClasses.deviceIcon}`} />
                                )}
                              </div>
                              <div>
                                <p className={`font-medium ${themeClasses.cardTitle}`}>{clipboard.device_name}</p>
                                <p className={`text-sm ${themeClasses.subtitleColor}`}>
                                  {formatDate(clipboard.created_date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`px-3 py-1 rounded-full ${themeClasses.clipboardIdBg}`}>
                                <span className={`font-mono text-sm ${themeClasses.clipboardIdText}`}>{clipboard.clipboard_id}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(clipboard.content, clipboard.id)}
                                className={themeClasses.outlineButton}
                              >
                                {copied[clipboard.id] ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className={`rounded p-3 ${themeClasses.contentBg}`}>
                            <pre className={`text-sm whitespace-pre-wrap break-words ${themeClasses.subtitleColor}`}>
                              {clipboard.content.length > 200
                                ? clipboard.content.substring(0, 200) + "..."
                                : clipboard.content
                              }
                            </pre>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </ClipboardErrorBoundary>
  );
}
