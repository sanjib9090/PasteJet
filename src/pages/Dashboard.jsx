
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Eye, 
  Search, 
  Calendar, 
  Globe, 
  EyeOff, 
  Lock, 
  ExternalLink,
  Trash2,
  Filter,
  User,
  Save,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth"; // Add this import for Firebase v9+

export default function Dashboard({ theme = 'dark', user }) {
  const [pastes, setPastes] = useState([]);
  const [filteredPastes, setFilteredPastes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [userDetails, setUserDetails] = useState({
    displayName: user?.displayName || "",
    email: user?.email || ""
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      saveUserDetails();
      loadPastes();
    }
  }, [user]);

  useEffect(() => {
    filterPastes();
  }, [pastes, searchTerm, filterBy]);

  const saveUserDetails = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || user.email.split('@')[0] || "User",
          email: user.email,
          created_at: new Date()
        });
      }
      setUserDetails({
        displayName: user.displayName || user.email.split('@')[0] || "User",
        email: user.email
      });
    } catch (error) {
      console.error("Error saving user details:", error);
      setError("Failed to save user details. Check your permissions and try again.");
    }
  };

  const updateUserDetails = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: userDetails.displayName,
        email: userDetails.email,
        updated_at: new Date()
      }, { merge: true });
      // Use the modular updateProfile function
      await updateProfile(auth.currentUser, { displayName: userDetails.displayName });
      setIsEditingProfile(false);
      setError("");
    } catch (error) {
      console.error("Error updating user details:", error);
      setError("Failed to update profile. Check your permissions and try again.");
    }
  };

  const loadPastes = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "pastes"), where("created_by", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const userPastes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_date: doc.data().created_date?.toDate().toISOString() || new Date().toISOString()
      }));
      setPastes(userPastes);
      setError("");
    } catch (error) {
      console.error("Error loading pastes:", error);
      setError("Failed to load pastes. Check your permissions or try again later.");
    }
  };

  const filterPastes = () => {
    let filtered = pastes;
    if (searchTerm) {
      filtered = filtered.filter(paste => 
        paste.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterBy !== "all") {
      filtered = filtered.filter(paste => {
        switch (filterBy) {
          case "public": return paste.visibility === "public";
          case "unlisted": return paste.visibility === "unlisted";
          case "protected": return !!paste.password;
          default: return true;
        }
      });
    }
    setFilteredPastes(filtered);
  };

  const deletePaste = async (pasteId) => {
    if (!confirm("Are you sure you want to delete this paste?")) return;
    try {
      await deleteDoc(doc(db, "pastes", pasteId));
      setPastes(pastes.filter(p => p.id !== pasteId));
      setError("");
    } catch (error) {
      console.error("Error deleting paste:", error);
      setError("Failed to delete paste. Check your permissions and try again.");
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          cardBg: 'bg-white/80 border-emerald-200/50 shadow-emerald-500/10',
          cardBorder: 'border-emerald-100',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-emerald-600',
          statCard: 'bg-white/80 border-emerald-200/50 shadow-emerald-500/10',
          statText: 'text-emerald-600',
          inputBg: 'bg-white/70 border-emerald-200 text-gray-900 placeholder-gray-500 focus:border-emerald-400 focus:ring-emerald-400/20',
          selectBg: 'bg-white/70 border-emerald-200 text-gray-900',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25',
          itemBorder: 'border-emerald-200 hover:border-emerald-300',
          text: 'text-gray-700',
          mutedText: 'text-gray-600',
          outlineButton: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400',
          errorText: 'text-red-600'
        };
      case 'orange':
        return {
          cardBg: 'bg-white/80 border-orange-200/50 shadow-orange-500/10',
          cardBorder: 'border-orange-100',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-orange-600',
          statCard: 'bg-white/80 border-orange-200/50 shadow-orange-500/10',
          statText: 'text-orange-600',
          inputBg: 'bg-white/70 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-400 focus:ring-orange-400/20',
          selectBg: 'bg-white/70 border-orange-200 text-gray-900',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-orange-500/25',
          itemBorder: 'border-orange-200 hover:border-orange-300',
          text: 'text-gray-700',
          mutedText: 'text-gray-600',
          outlineButton: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400',
          errorText: 'text-red-600'
        };
      default: // dark
        return {
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardBorder: 'border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          statCard: 'bg-gray-800/50 border-gray-700/50',
          statText: 'text-purple-400',
          inputBg: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20',
          selectBg: 'bg-gray-900/50 border-gray-600 text-white',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-purple-500/25',
          itemBorder: 'border-gray-700 hover:border-gray-600',
          text: 'text-white',
          mutedText: 'text-gray-400',
          outlineButton: 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500',
          errorText: 'text-red-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
          <CardContent className="text-center p-8 pt-7">
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.cardTitle}`}>Login Required</h2>
            <p className={`mb-6 ${themeClasses.mutedText}`}>You need to be logged in to view your dashboard</p>
            <Button
              onClick={() => navigate('/')}
              className={`${themeClasses.primaryButton} text-white`}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className={`border-2 backdrop-blur-sm bg-red-50/80 border-red-200`}>
              <CardContent className="p-6 flex items-center space-x-2">
                <AlertCircle className={`w-5 h-5 ${themeClasses.errorText}`} />
                <p className={themeClasses.errorText}>{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
            <CardHeader className={`border-b ${themeClasses.cardBorder}`}>
              <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                <User className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                <span>User Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-sm ${themeClasses.text}`}>Display Name</label>
                    <Input
                      value={userDetails.displayName}
                      onChange={(e) => setUserDetails({ ...userDetails, displayName: e.target.value })}
                      className={themeClasses.inputBg}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${themeClasses.text}`}>Email</label>
                    <Input
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                      className={themeClasses.inputBg}
                      disabled
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={updateUserDetails}
                      className={`${themeClasses.primaryButton} text-white`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      className={themeClasses.outlineButton}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text}`}>Name: {userDetails.displayName}</p>
                    <p className={`text-sm ${themeClasses.mutedText}`}>Email: {userDetails.email}</p>
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className={`${themeClasses.primaryButton} text-white`}
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${themeClasses.cardTitle}`}>Dashboard</h1>
              <p className={themeClasses.mutedText}>Manage your pastes and track their performance</p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className={`${themeClasses.primaryButton} text-white`}
            >
              Create New Paste
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className={`backdrop-blur-md ${themeClasses.statCard}`}>
            <CardContent className="p-6 pt-4">
              <div className="text-center">
                <h3 className={`text-2xl font-bold ${themeClasses.statText}`}>{pastes.length}</h3>
                <p className={`text-sm ${themeClasses.mutedText}`}>Total Pastes</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md ${themeClasses.statCard}`}>
            <CardContent className="p-6 pt-4">
              <div className="text-center">
                <h3 className={`text-2xl font-bold text-blue-500`}>
                  {pastes.reduce((sum, paste) => sum + (paste.views || 0), 0)}
                </h3>
                <p className={`text-sm ${themeClasses.mutedText}`}>Total Views</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md ${themeClasses.statCard}`}>
            <CardContent className="p-6 pt-4">
              <div className="text-center">
                <h3 className={`text-2xl font-bold text-green-500`}>
                  {pastes.filter(p => p.visibility === 'public').length}
                </h3>
                <p className={`text-sm ${themeClasses.mutedText}`}>Public Pastes</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md ${themeClasses.statCard}`}>
            <CardContent className="p-6 pt-4">
              <div className="text-center">
                <h3 className={`text-2xl font-bold text-yellow-500`}>
                  {pastes.filter(p => p.password).length}
                </h3>
                <p className={`text-sm ${themeClasses.mutedText}`}>Protected</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
            <CardContent className="p-6 pt-7">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.mutedText}`} />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search pastes..."
                      className={`pl-10 ${themeClasses.inputBg}`}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className={`w-4 h-4 ${themeClasses.mutedText}`} />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className={`rounded-md px-3 py-2 ${themeClasses.selectBg} border focus:ring-2`}
                  >
                    <option value="all">All Pastes</option>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="protected">Protected</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pastes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`backdrop-blur-md ${themeClasses.cardBg}`}>
            <CardHeader className={`border-b ${themeClasses.cardBorder}`}>
              <CardTitle className={themeClasses.cardTitle}>Your Pastes ({filteredPastes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPastes.length === 0 ? (
                <div className="text-center py-8">
                  <p className={themeClasses.mutedText}>No pastes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPastes.map((paste) => (
                    <motion.div
                      key={paste.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border rounded-lg p-4 transition-colors ${themeClasses.itemBorder}`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className={`font-medium mb-2 ${themeClasses.text}`}>
                            {paste.title || "Untitled Paste"}
                          </h3>
                          <div className={`flex flex-wrap items-center gap-3 text-sm ${themeClasses.mutedText}`}>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(paste.created_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{paste.views || 0} views</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {paste.language}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs flex items-center space-x-1 ${
                                paste.visibility === 'public' ? 'text-green-600' : 'text-yellow-600'
                              }`}
                            >
                              {paste.visibility === 'public' ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{paste.visibility}</span>
                            </Badge>
                            {paste.password && (
                              <Badge variant="outline" className="text-xs text-orange-600 flex items-center space-x-1">
                                <Lock className="w-3 h-3" />
                                <span>Protected</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/view/${paste.custom_url || paste.id}`)}
                            className={`border-2 ${themeClasses.outlineButton}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePaste(paste.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
