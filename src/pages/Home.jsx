
import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Code2,
  Upload,
  Share,
  Lock,
  Globe,
  EyeOff,
  Clock,
  Zap,
  FileText,
  Copy,
  Check,
  Sparkles,
  Palette
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs } from "firebase/firestore";

const languages = [
  { value: "text", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "typescript", label: "TypeScript" }
];

export default function Home({ theme = 'dark', user }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    language: "text",
    visibility: "public",
    password: "",
    custom_url: "",
    expires_at: ""
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPaste, setCreatedPaste] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size <= 10 * 1024 * 1024) { // 10MB limit
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, content: event.target.result }));
      };
      reader.readAsText(selectedFile);
      setFile(selectedFile);
    } else {
      setError("File size must be less than 10MB");
    }
  };

  const calculateExpiry = (timeString) => {
    if (!timeString) return null;
    const regex = /^(\d+)([mhdM])$/;
    const match = timeString.match(regex);
    if (!match) {
      setError("Invalid expiration format. Use e.g., 10m, 1h, 7d, 1M");
      return null;
    }
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();
    switch (unit) {
      case 'm': return Timestamp.fromDate(new Date(now.getTime() + value * 60 * 1000));
      case 'h': return Timestamp.fromDate(new Date(now.getTime() + value * 60 * 60 * 1000));
      case 'd': return Timestamp.fromDate(new Date(now.getTime() + value * 24 * 60 * 60 * 1000));
      case 'M': return Timestamp.fromDate(new Date(now.getTime() + value * 30 * 24 * 60 * 60 * 1000));
      default: return null;
    }
  };

  const validateCustomUrl = async (customUrl) => {
    if (!customUrl) return true;
    const q = query(collection(db, "pastes"), where("custom_url", "==", customUrl));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError("Content is required");
      return;
    }
    if (formData.custom_url && !/^[a-zA-Z0-9_-]+$/.test(formData.custom_url)) {
      setError("Custom URL can only contain letters, numbers, hyphens, or underscores");
      return;
    }
    if (!(await validateCustomUrl(formData.custom_url))) {
      setError("Custom URL is already taken");
      return;
    }
    if (!auth.currentUser && (formData.custom_url || formData.expires_at || formData.visibility === "unlisted")) {
      setError("You must be logged in to set a custom URL, expiration date, or unlisted visibility");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const pasteData = {
        title: formData.title || "Untitled Paste",
        content: formData.content,
        language: formData.language,
        visibility: formData.visibility,
        password: formData.password || null,
        custom_url: auth.currentUser ? formData.custom_url || null : null,
        expires_at: auth.currentUser ? calculateExpiry(formData.expires_at) : null,
        created_date: serverTimestamp(),
        created_by: auth.currentUser ? auth.currentUser.uid : "anonymous",
        views: 0
      };

      const docRef = await addDoc(collection(db, "pastes"), pasteData);

      setCreatedPaste({ id: docRef.id, ...pasteData });

      // Reset form
      setFormData({
        title: "",
        content: "",
        language: "text",
        visibility: "public",
        password: "",
        custom_url: "",
        expires_at: ""
      });
      setFile(null);
       window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error creating paste:", error);
      setError("Failed to create paste. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPasteUrl = (paste) => {
    return paste.custom_url 
      ? `${window.location.origin}/view/${paste.custom_url}`
      : `${window.location.origin}/view/${paste.id}`;
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          heroIcon: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30',
          heroIconColor: 'text-emerald-600',
          titleGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent',
          sparkleColor: 'text-teal-500',
          subtitleColor: 'text-gray-600',
          paletteColor: 'text-emerald-500',
          successBg: 'bg-green-50/80 border-green-200',
          successTitle: 'text-green-700',
          successText: 'text-gray-700',
          successCode: 'bg-gray-100 text-teal-600',
          successHover: 'text-green-600 hover:bg-green-100',
          successButton: 'bg-green-500 hover:bg-green-600',
          cardBg: 'bg-white/80 border-emerald-200/50 shadow-emerald-500/10',
          cardBorder: 'border-emerald-100',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-emerald-600',
          labelColor: 'text-gray-700',
          inputBg: 'bg-white/70 border-emerald-200 text-gray-900 placeholder-gray-500 focus:border-emerald-400 focus:ring-emerald-400/20',
          selectBg: 'bg-white/70 border-emerald-200 text-gray-900',
          selectContent: 'bg-white border-emerald-200',
          selectItem: 'text-gray-900 hover:bg-emerald-50',
          fileBg: 'bg-white/70 border-emerald-200 text-gray-900 file:bg-emerald-500 file:text-white file:border-0 file:rounded',
          submitButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25',
          errorText: 'text-red-600'
        };
      case 'orange':
        return {
          heroIcon: 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30',
          heroIconColor: 'text-orange-600',
          titleGradient: 'bg-gradient-to-r from-orange-600 via-pink-600 to-orange-600 bg-clip-text text-transparent',
          sparkleColor: 'text-pink-500',
          subtitleColor: 'text-gray-600',
          paletteColor: 'text-orange-500',
          successBg: 'bg-orange-50/80 border-orange-200',
          successTitle: 'text-orange-700',
          successText: 'text-gray-700',
          successCode: 'bg-gray-100 text-orange-600',
          successHover: 'text-orange-600 hover:bg-orange-100',
          successButton: 'bg-orange-500 hover:bg-orange-600',
          cardBg: 'bg-white/80 border-orange-200/50 shadow-orange-500/10',
          cardBorder: 'border-orange-100',
          cardTitle: 'text-gray-900',
          cardIcon: 'text-orange-600',
          labelColor: 'text-gray-700',
          inputBg: 'bg-white/70 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-400 focus:ring-orange-400/20',
          selectBg: 'bg-white/70 border-orange-200 text-gray-900',
          selectContent: 'bg-white border-orange-200',
          selectItem: 'text-gray-900 hover:bg-orange-50',
          fileBg: 'bg-white/70 border-orange-200 text-gray-900 file:bg-orange-500 file:text-white file:border-0 file:rounded',
          submitButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-orange-500/25',
          errorText: 'text-red-600'
        };
      default: // dark
        return {
          heroIcon: 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30',
          heroIconColor: 'text-purple-400',
          titleGradient: 'bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent',
          sparkleColor: 'text-blue-400',
          subtitleColor: 'text-gray-400',
          paletteColor: 'text-purple-400',
          successBg: 'bg-green-500/10 border-green-500/30',
          successTitle: 'text-green-400',
          successText: 'text-gray-300',
          successCode: 'bg-gray-800 text-blue-300',
          successHover: 'text-green-400 hover:bg-green-500/20',
          successButton: 'bg-green-500 hover:bg-green-600',
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardBorder: 'border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          labelColor: 'text-gray-300',
          inputBg: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20',
          selectBg: 'bg-gray-900/50 border-gray-600 text-white',
          selectContent: 'bg-gray-800 border-gray-600',
          selectItem: 'text-white hover:bg-gray-700',
          fileBg: 'bg-gray-900/50 border-gray-600 text-white file:bg-purple-500 file:text-white file:border-0 file:rounded',
          submitButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-purple-500/25',
          errorText: 'text-red-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className={`p-3 rounded-2xl ${themeClasses.heroIcon}`}>
              <Zap className={`w-8 h-8 ${themeClasses.heroIconColor}`} />
            </div>
            <h1 className={`text-4xl md:text-6xl font-bold ${themeClasses.titleGradient}`}>
              PasteJet
            </h1>
            <Sparkles className={`w-6 h-6 ${themeClasses.sparkleColor} animate-pulse`} />
          </div>
          <p className={`text-lg md:text-xl mb-8 ${themeClasses.subtitleColor}`}>
            Share code, sync clipboard, collaborate in real-time
          </p>
          <div className="flex justify-center space-x-2 mb-8">
            <Palette className={`w-5 h-5 ${themeClasses.paletteColor}`} />
            <span className={`text-sm ${themeClasses.subtitleColor}`}>
              Beautiful • Fast • Secure • Collaborative
            </span>
          </div>
          {!auth.currentUser && (
            <div className={`mx-auto max-w-md p-4 rounded-lg ${theme === 'dark'
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : 'bg-blue-50 border border-blue-200'
              }`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-blue-700'
                }`}>
                💡 <strong>Anonymous Mode:</strong> You can create public pastes without login!
                Login is required for private pastes, custom URLs, or to track your paste history.
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
            <Card className={`border-2 backdrop-blur-sm bg-red-50/80 border-red-200`}>
              <CardContent className="p-6">
                <p className={themeClasses.errorText}>{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Message */}
        {createdPaste && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className={`border-2 backdrop-blur-sm ${themeClasses.successBg}`}>
              <CardContent className="p-6 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${themeClasses.successTitle}`}>
                      🎉 Paste Created Successfully!
                    </h3>
                    <p className={`text-sm mb-3 ${themeClasses.successText}`}>
                      Your paste is ready to share with the world
                    </p>
                    <div className="flex flex-wrap items-center gap-2 max-w-full">
                      <code className={`px-3 py-1 rounded text-sm break-all overflow-auto ${themeClasses.successCode}`}>
                        {getPasteUrl(createdPaste)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(getPasteUrl(createdPaste))}
                        className={themeClasses.successHover}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => navigate(`/view/${createdPaste.custom_url || createdPaste.id}`)}
                      className={`${themeClasses.successButton} text-white shadow-lg w-full md:w-auto`}
                    >
                      View Paste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border-2 backdrop-blur-md shadow-2xl ${themeClasses.cardBg}`}>
            <CardHeader className={`border-b ${themeClasses.cardBorder}`}>
              <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                <Code2 className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                <span>Create New Paste</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className={themeClasses.labelColor}>
                    Title (optional)
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter a title for your paste"
                    className={`transition-all duration-200 ${themeClasses.inputBg}`}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className={themeClasses.labelColor}>
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Paste your code or text here..."
                    rows={12}
                    className={`font-mono transition-all duration-200 ${themeClasses.inputBg}`}
                    required
                  />
                </div>

                {/* Language and Options Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={themeClasses.labelColor}>
                      Language
                    </Label>
                    <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                      <SelectTrigger className={themeClasses.selectBg}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={themeClasses.selectContent}>
                        {languages.map((lang) => (
                          <SelectItem
                            key={lang.value}
                            value={lang.value}
                            className={themeClasses.selectItem}
                          >
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={themeClasses.labelColor}>
                      Visibility
                    </Label>
                    <Select value={formData.visibility} onValueChange={(value) => handleInputChange("visibility", value)}>
                      <SelectTrigger className={themeClasses.selectBg}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={themeClasses.selectContent}>
                        <SelectItem value="public" className={themeClasses.selectItem}>
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>Public</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="unlisted" className={themeClasses.selectItem} disabled={!auth.currentUser}>
                          <div className="flex items-center space-x-2">
                            <EyeOff className="w-4 h-4" />
                            <span>Unlisted (Login Required)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className={`flex items-center space-x-2 ${themeClasses.labelColor}`}>
                      <Clock className="w-4 h-4" />
                      <span>Expire After (Login Required)</span>
                    </Label>
                    <Input
                      id="expires_at"
                      value={formData.expires_at}
                      onChange={(e) => handleInputChange("expires_at", e.target.value)}
                      placeholder="e.g., 10m, 1h, 7d, 1M"
                      className={themeClasses.inputBg}
                      disabled={!auth.currentUser}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className={`flex items-center space-x-2 ${themeClasses.labelColor}`}>
                      <Lock className="w-4 h-4" />
                      <span>Password (optional)</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Protect with password"
                      className={themeClasses.inputBg}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom_url" className={themeClasses.labelColor}>
                      Custom URL (Login Required)
                    </Label>
                    <Input
                      id="custom_url"
                      value={formData.custom_url}
                      onChange={(e) => handleInputChange("custom_url", e.target.value)}
                      placeholder="my-custom-paste"
                      className={themeClasses.inputBg}
                      disabled={!auth.currentUser}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file" className={`flex items-center space-x-2 ${themeClasses.labelColor}`}>
                      <FileText className="w-4 h-4" />
                      <span>Attach File (optional)</span>
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className={themeClasses.fileBg}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.content.trim()}
                  className={`w-full font-semibold py-3 text-white shadow-xl transition-all duration-300 ${themeClasses.submitButton}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Paste...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Share className="w-4 h-4" />
                      <span>Create Paste</span>
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
