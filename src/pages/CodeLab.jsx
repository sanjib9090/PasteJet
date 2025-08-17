import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { 
  Users, 
  Plus, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink,
  Coffee,
  Zap,
  Share,
  ArrowRight,
  Sparkles,
  Settings,
  MessageSquare,
  UserPlus,
  UserMinus,
  Trash2,
  Play,
  History,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import axios from "axios";

const languages = [
  { value: "javascript", label: "JavaScript", color: "text-yellow-300", version: "18.15.0" },
  { value: "python", label: "Python", color: "text-blue-300", version: "3.10.0" },
  { value: "java", label: "Java", color: "text-orange-300", version: "15.0.2" },
  { value: "cpp", label: "C++", color: "text-purple-300", version: "10.2.0" },
  { value: "html", label: "HTML", color: "text-red-300", version: null },
  { value: "css", label: "CSS", color: "text-green-300", version: null },
  { value: "typescript", label: "TypeScript", color: "text-blue-400", version: "5.0.3" }
];

const cursorColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500"
];

export default function CodeLab({ theme = 'dark', user }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [code, setCode] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [copied, setCopied] = useState({});
  const [roomSettings, setRoomSettings] = useState({ isPrivate: false, password: "" });
  const [cursors, setCursors] = useState({});
  const [executionOutput, setExecutionOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const languageSliderRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  useEffect(() => {
    let unsubscribeRoom, unsubscribeChat, unsubscribeMembers, unsubscribePresence, unsubscribeCursors, unsubscribeVersions;
    if (currentRoom) {
      unsubscribeRoom = onSnapshot(doc(db, "rooms", currentRoom.room_id), (doc) => {
        if (doc.exists()) {
          setCode(doc.data().content || "");
        }
      });

      unsubscribeChat = onSnapshot(collection(db, "rooms", currentRoom.room_id, "messages"), (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(messages.sort((a, b) => a.timestamp - b.timestamp));
      });

      unsubscribeMembers = onSnapshot(collection(db, "rooms", currentRoom.room_id, "members"), (snapshot) => {
        const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersList);
      });

      const presenceRef = doc(db, "rooms", currentRoom.room_id, "presence", user.email);
      setDoc(presenceRef, { lastActive: Date.now(), displayName: user.displayName || user.email });

      const presenceInterval = setInterval(() => {
        updateDoc(presenceRef, { lastActive: Date.now() });
      }, 30000);

      unsubscribeCursors = onSnapshot(collection(db, "rooms", currentRoom.room_id, "cursors"), (snapshot) => {
        const cursorData = {};
        snapshot.docs.forEach(doc => {
          if (doc.id !== user.email) {
            cursorData[doc.id] = { ...doc.data(), email: doc.id };
          }
        });
        setCursors(cursorData);
      });

      unsubscribeVersions = onSnapshot(collection(db, "rooms", currentRoom.room_id, "version_history"), (snapshot) => {
        const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVersionHistory(versions.sort((a, b) => b.timestamp - a.timestamp));
      });

      const versionInterval = setInterval(() => {
        if (currentRoom.created_by === user.email) {
          saveVersion();
        }
      }, 300000);

      return () => {
        clearInterval(presenceInterval);
        clearInterval(versionInterval);
        deleteDoc(presenceRef);
        unsubscribeRoom && unsubscribeRoom();
        unsubscribeChat && unsubscribeChat();
        unsubscribeMembers && unsubscribeMembers();
        unsubscribeCursors && unsubscribeCursors();
        unsubscribeVersions && unsubscribeVersions();
      };
    }
  }, [currentRoom, user]);

  const retryOperation = async (operation, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const loadRooms = async () => {
    if (!user) return;
    setIsLoadingRooms(true);
    try {
      await retryOperation(async () => {
        const roomsRef = collection(db, "rooms");
        const roomsSnapshot = await getDocs(query(roomsRef, where("is_active", "==", true)));
        const userRooms = [];
        const memberQueries = [];

        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = { id: roomDoc.id, ...roomDoc.data() };
          if (roomData.created_by === user.email) {
            userRooms.push(roomData);
          } else {
            memberQueries.push(getDoc(doc(db, "rooms", roomDoc.id, "members", user.email)));
          }
        }

        const memberDocs = await Promise.all(memberQueries);
        memberDocs.forEach((memberDoc, index) => {
          if (memberDoc.exists()) {
            const roomData = roomsSnapshot.docs[index].data();
            userRooms.push({ id: memberDoc.ref.parent.parent.id, ...roomData });
          }
        });

        setRooms(userRooms);
      });
    } catch (error) {
      console.error("Error loading rooms:", error);
      alert("Failed to load rooms. Please try again.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsSubmitting(true);
    try {
      const roomId = generateRoomId();
      const roomData = {
        room_name: newRoomName,
        room_id: roomId,
        language: newRoomLanguage,
        content: `// Welcome to ${newRoomName}!\n// Start coding together...\n\n`,
        is_active: true,
        created_date: new Date().toISOString(),
        created_by: user.email,
        isPrivate: roomSettings.isPrivate,
        password: roomSettings.isPrivate ? roomPassword : null
      };

      await setDoc(doc(db, "rooms", roomId), roomData);
      await setDoc(doc(db, "rooms", roomId, "members", user.email), {
        email: user.email,
        role: "admin",
        joined_at: new Date().toISOString()
      });

      setCurrentRoom(roomData);
      setCode(roomData.content);
      setShowCreateForm(false);
      setNewRoomName("");
      setRoomPassword("");
      setRooms(prev => [roomData, ...prev]);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (room) => {
    if (!room || !room.room_id) {
      alert("Invalid room data. Please try again.");
      return;
    }

    if (room.isPrivate && !roomPassword) {
      alert("Please enter the room password.");
      return;
    }
    if (room.isPrivate && room.password !== roomPassword) {
      alert("Incorrect password.");
      setRoomPassword("");
      return;
    }

    try {
      await setDoc(doc(db, "rooms", room.room_id, "members", user.email), {
        email: user.email,
        role: "member",
        joined_at: new Date().toISOString()
      });
      setCurrentRoom(room);
      setCode(room.content || `// Welcome to ${room.room_name}!\n// Collaborative coding session\n\n`);
      setShowJoinForm(false);
      setJoinRoomId("");
      setRoomPassword("");
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please try again.");
    }
  };

  const handleJoinByRoomId = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim() || joinRoomId.length !== 6) {
      alert("Please enter a valid 6-character Room ID.");
      return;
    }

    try {
      const roomDoc = await getDoc(doc(db, "rooms", joinRoomId.toUpperCase()));
      if (roomDoc.exists()) {
        const roomData = { id: roomDoc.id, ...roomDoc.data() };
        if (roomData.isPrivate && roomData.password !== roomPassword) {
          alert("Incorrect password.");
          setRoomPassword("");
          return;
        }
        await handleJoinRoom(roomData);
      } else {
        alert("Room not found. Please check the Room ID.");
      }
    } catch (error) {
      console.error("Error checking room:", error);
      alert("Error checking room. Please try again.");
    }
  };

  const handleCodeChange = async (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (currentRoom) {
      try {
        await updateDoc(doc(db, "rooms", currentRoom.room_id), { content: newCode });
      } catch (error) {
        console.error("Error syncing code:", error);
      }
    }
  };

  const handleCursorChange = async (e) => {
    if (!currentRoom || !textareaRef.current) return;
    const { selectionStart } = e.target;
    const lines = code.substring(0, selectionStart).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    try {
      await setDoc(doc(db, "rooms", currentRoom.room_id, "cursors", user.email), {
        position: { line, column },
        displayName: user.displayName || user.email,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error("Error updating cursor:", error);
    }
  };

  const executeCode = async () => {
    if (!currentRoom || isExecuting) return;
    const language = languages.find(l => l.value === currentRoom.language);
    if (!language.version) {
      setExecutionOutput("Execution not supported for this language.");
      return;
    }

    setIsExecuting(true);
    try {
      const response = await axios.post("https://pastejetbackend.onrender.com/execute", {
        language: currentRoom.language,
        version: language.version,
        code,
        input: ""
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000 // 15-second timeout
      });

      setExecutionOutput(response.data.stdout || response.data.stderr || "No output");
      await setDoc(doc(collection(db, "rooms", currentRoom.room_id, "execution_results")), {
        output: response.data.stdout || response.data.stderr || "No output",
        executed_by: user.email,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error executing code:", error);
      setExecutionOutput("Error executing code: " + (error.response?.data?.details || error.message));
    } finally {
      setIsExecuting(false);
    }
  };

  const saveVersion = async () => {
    if (!currentRoom || currentRoom.created_by !== user.email) return;
    try {
      await setDoc(doc(collection(db, "rooms", currentRoom.room_id, "version_history")), {
        content: code,
        saved_by: user.email,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error saving version:", error);
    }
  };

  const restoreVersion = async (version) => {
    if (!currentRoom || currentRoom.created_by !== user.email) return;
    try {
      await updateDoc(doc(db, "rooms", currentRoom.room_id), { content: version.content });
      setCode(version.content);
      setShowVersionHistory(false);
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom) return;

    try {
      await setDoc(doc(collection(db, "rooms", currentRoom.room_id, "messages")), {
        content: newMessage,
        sender: user.email,
        displayName: user.displayName || user.email,
        timestamp: Date.now()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const addMember = async () => {
    if (!newMemberEmail.trim() || !currentRoom) return;

    try {
      await setDoc(doc(db, "rooms", currentRoom.room_id, "members", newMemberEmail), {
        email: newMemberEmail,
        role: "member",
        joined_at: new Date().toISOString()
      });
      setNewMemberEmail("");
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please check the email and try again.");
    }
  };

  const removeMember = async (memberEmail) => {
    if (currentRoom.created_by === user.email && memberEmail !== user.email) {
      try {
        await deleteDoc(doc(db, "rooms", currentRoom.room_id, "members", memberEmail));
      } catch (error) {
        console.error("Error removing member:", error);
        alert("Failed to remove member. Please try again.");
      }
    }
  };

  const updateRoomSettings = async () => {
    if (!currentRoom || currentRoom.created_by !== user.email) return;

    try {
      await updateDoc(doc(db, "rooms", currentRoom.room_id), {
        isPrivate: roomSettings.isPrivate,
        password: roomSettings.isPrivate ? roomPassword : null
      });
      setCurrentRoom(prev => ({ ...prev, ...roomSettings, password: roomSettings.isPrivate ? roomPassword : null }));
      setShowRoomSettings(false);
      setRoomPassword("");
    } catch (error) {
      console.error("Error updating room settings:", error);
      alert("Failed to update room settings. Please try again.");
    }
  };

  const deleteRoom = async () => {
    if (!currentRoom || currentRoom.created_by !== user.email) return;

    try {
      await updateDoc(doc(db, "rooms", currentRoom.room_id), { is_active: false });
      setCurrentRoom(null);
      setCode("");
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room. Please try again.");
    }
  };

  const copyRoomId = async (roomId) => {
    await navigator.clipboard.writeText(roomId);
    setCopied({ [roomId]: true });
    setTimeout(() => setCopied({}), 2000);
  };

  const copyRoomUrl = async (roomId) => {
    const url = `${window.location.origin}/codelab?room=${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied({ [`url_${roomId}`]: true });
    setTimeout(() => setCopied({}), 2000);
  };

  const leaveRoom = async () => {
    if (currentRoom) {
      await deleteDoc(doc(db, "rooms", currentRoom.room_id, "members", user.email));
      await deleteDoc(doc(db, "rooms", currentRoom.room_id, "cursors", user.email));
    }
    setCurrentRoom(null);
    setCode("");
    setChatMessages([]);
    setMembers([]);
    setCursors({});
    setExecutionOutput("");
    setVersionHistory([]);
  };

  const getLanguageColor = (lang) => {
    const colors = {
      javascript: theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600',
      python: theme === 'dark' ? 'text-blue-300' : 'text-blue-600',
      java: theme === 'dark' ? 'text-orange-300' : 'text-orange-600',
      cpp: theme === 'dark' ? 'text-purple-300' : 'text-purple-600',
      html: theme === 'dark' ? 'text-red-300' : 'text-red-600',
      css: theme === 'dark' ? 'text-green-300' : 'text-green-600',
      typescript: theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
    };
    return colors[lang] || (theme === 'dark' ? 'text-gray-300' : 'text-gray-600');
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
          languageSliderBg: 'bg-white/70 border-emerald-200',
          languageItemBg: 'text-gray-900 hover:bg-emerald-50',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
          secondaryButton: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
          outlineButton: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
          textareaBg: 'bg-gray-50 text-gray-900 border-emerald-200 focus:ring-emerald-400/20',
          spinnerColor: 'border-emerald-500'
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
          languageSliderBg: 'bg-white/70 border-orange-200',
          languageItemBg: 'text-gray-900 hover:bg-orange-50',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600',
          secondaryButton: 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600',
          outlineButton: 'border-orange-200 text-orange-700 hover:bg-orange-50',
          textareaBg: 'bg-gray-50 text-gray-900 border-orange-200 focus:ring-orange-400/20',
          spinnerColor: 'border-orange-500'
        };
      default:
        return {
          heroIconColor: 'text-purple-400',
          titleGradient: 'bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent',
          subtitleColor: 'text-gray-400',
          cardBg: 'bg-gray-800/50 border-gray-700/50',
          cardTitle: 'text-white',
          cardIcon: 'text-purple-400',
          inputBg: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400',
          languageSliderBg: 'bg-gray-900/50 border-gray-600',
          languageItemBg: 'text-white hover:bg-gray-700',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
          secondaryButton: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          outlineButton: 'border-gray-600 text-gray-300 hover:bg-gray-700',
          textareaBg: 'bg-gray-900 text-white border-gray-600 focus:ring-purple-400/20',
          spinnerColor: 'border-purple-500'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const scrollLanguageSlider = (direction) => {
    if (languageSliderRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      languageSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderCursor = (cursor, index) => {
    if (!textareaRef.current || !cursor.position) return null;
    const lines = code.split('\n');
    let charCount = 0;
    for (let i = 0; i < cursor.position.line - 1; i++) {
      charCount += lines[i].length + 1;
    }
    charCount += cursor.position.column - 1;
    
    const lineHeight = 20;
    const charWidth = 8;
    const top = (cursor.position.line - 1) * lineHeight;
    const left = (cursor.position.column - 1) * charWidth;

    return (
      <div
        key={cursor.email}
        className={`absolute pointer-events-none ${cursorColors[index % cursorColors.length]}`}
        style={{ top: `${top}px`, left: `${left + 48}px` }}
      >
        <div className="w-0.5 h-5 bg-current" />
        <div className={`text-xs px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          {cursor.displayName}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className={`w-full max-w-md backdrop-blur-md ${themeClasses.cardBg}`}>
          <CardContent className="text-center p-6 sm:p-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-500/20' : theme === 'green' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
            }`}>
              <Users className={`w-8 h-8 ${themeClasses.heroIconColor}`} />
            </div>
            <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${themeClasses.cardTitle}`}>
              Login Required
            </h2>
            <p className={`mb-6 text-sm sm:text-base ${themeClasses.subtitleColor}`}>
              You need to be logged in to join CodeLab rooms
            </p>
            <Button
              onClick={() => window.location.reload()}
              className={`w-full sm:w-auto px-6 py-2 text-base ${themeClasses.primaryButton} text-white shadow-lg`}
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentRoom) {
    const lineNumbers = code.split('\n').map((_, i) => i + 1).join('\n');
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className={`text-xl sm:text-2xl font-bold mb-2 flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                      <Users className={`w-5 sm:w-6 h-5 sm:h-6 ${themeClasses.cardIcon}`} />
                      <span>{currentRoom.room_name}</span>
                      <div className={`flex items-center space-x-1 text-xs sm:text-sm px-2 py-1 rounded-full ${
                        theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
                        }`}></div>
                        <span>Live</span>
                      </div>
                    </h1>
                    <div className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm ${themeClasses.subtitleColor}`}>
                      <Badge variant="outline" className={`border-2 ${getLanguageColor(currentRoom.language)}`}>
                        {languages.find(l => l.value === currentRoom.language)?.label || currentRoom.language}
                      </Badge>
                      <span>Room ID: <span className="font-mono font-bold">{currentRoom.room_id}</span></span>
                      <span>Created {new Date(currentRoom.created_date).toLocaleString()}</span>
                      {currentRoom.isPrivate && (
                        <Badge variant="outline" className="border-2 text-yellow-400">Private</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => copyRoomUrl(currentRoom.room_id)}
                      className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                    >
                      {copied[`url_${currentRoom.room_id}`] ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          URL Copied!
                        </>
                      ) : (
                        <>
                          <Share className="w-4 h-4 mr-2" />
                          Share Room
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRoomId(currentRoom.room_id)}
                      className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                    >
                      {copied[currentRoom.room_id] ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy ID
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChat(!showChat)}
                      className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {showChat ? "Hide Chat" : "Show Chat"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVersionHistory(true)}
                      className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Version History
                    </Button>
                    {currentRoom.created_by === user.email && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowManageMembers(true)}
                          className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage Members
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRoomSettings(true)}
                          className={`px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Room Settings
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={leaveRoom}
                      className={`px-4 py-2 text-sm border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500`}
                    >
                      Leave Room
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="">
            <div className={`lg:col-span-${showChat ? 3 : 4}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
                  <CardHeader>
                    <CardTitle className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${themeClasses.cardTitle}`}>
                      <div className="flex items-center space-x-2">
                        <Code2 className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                        <span>Collaborative Code Editor</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={executeCode}
                          disabled={isExecuting || !languages.find(l => l.value === currentRoom.language)?.version}
                          className={`px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                        >
                          {isExecuting ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Running...</span>
                            </div>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run Code
                            </>
                          )}
                        </Button>
                        <div className={`flex items-center space-x-2 text-xs sm:text-sm px-3 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
                          }`}></div>
                          <span>Auto-sync enabled</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative flex">
                      <div
                        ref={lineNumbersRef}
                        className={`w-12 min-h-[500px] bg-gray-800/50 text-right pr-3 py-3 font-mono text-sm leading-5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                        style={{ lineHeight: '20px', overflowY: 'hidden' }}
                      >
                        <pre className="select-none">{lineNumbers}</pre>
                      </div>
                      <Textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => {
                          handleCodeChange(e);
                          handleCursorChange(e);
                          syncScroll();
                        }}
                        onScroll={syncScroll}
                        onSelect={handleCursorChange}
                        className={`min-h-[500px] border-0 rounded-none font-mono text-sm leading-5 resize-none transition-all duration-200 flex-1 ${themeClasses.textareaBg} ${getLanguageColor(currentRoom.language)}`}
                        placeholder="Start coding together..."
                        style={{ lineHeight: '20px', paddingLeft: '12px' }}
                      />
                      {Object.values(cursors).map((cursor, index) => renderCursor(cursor, index))}
                      <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                        theme === 'dark' ? 'bg-gray-800/80 text-gray-400' : 'bg-white/80 text-gray-600'
                      }`}>
                        💡 Changes sync automatically
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              {executionOutput && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 sm:mt-6"
                >
                  <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                        <Play className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                        <span>Execution Output</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className={`p-4 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-900/50 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {executionOutput}
                      </pre>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-1"
                >
                  <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                        <MessageSquare className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                        <span>Chat</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-[300px] sm:h-[400px] overflow-y-auto mb-4 p-4 rounded-lg bg-gray-900/30">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`mb-3 ${msg.sender === user.email ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 rounded-lg text-sm ${
                              msg.sender === user.email 
                                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-700')
                                : (theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700')
                            }`}>
                              <p className="text-xs font-medium">{msg.displayName}</p>
                              <p>{msg.content}</p>
                              <p className="text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className={`text-sm ${themeClasses.inputBg}`}
                        />
                        <Button
                          onClick={sendMessage}
                          className={`w-full px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                        >
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showManageMembers && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50"
              >
                <Card className={`w-full max-w-md backdrop-blur-md ${themeClasses.cardBg}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                      <Users className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                      <span>Manage Members</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Add Member</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Enter email"
                          type="email"
                          className={`text-sm ${themeClasses.inputBg}`}
                        />
                        <Button
                          onClick={addMember}
                          className={`px-4 py-2 ${themeClasses.primaryButton} text-white`}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Current Members</Label>
                      {members.map((member) => (
                        <div key={member.email} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/30">
                          <div>
                            <p className={`text-sm ${themeClasses.cardTitle}`}>{member.email}</p>
                            <p className={`text-xs ${themeClasses.subtitleColor}`}>{member.role}</p>
                          </div>
                          {currentRoom.created_by === user.email && member.email !== user.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(member.email)}
                              className="px-3 py-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => setShowManageMembers(false)}
                      className={`w-full px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRoomSettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50"
              >
                <Card className={`w-full max-w-md backdrop-blur-md ${themeClasses.cardBg}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                      <Settings className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                      <span>Room Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={roomSettings.isPrivate}
                          onChange={(e) => setRoomSettings({ ...roomSettings, isPrivate: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label className={themeClasses.subtitleColor}>Private Room</Label>
                      </div>
                      {roomSettings.isPrivate && (
                        <div className="space-y-2">
                          <Label className={themeClasses.subtitleColor}>Room Password</Label>
                          <Input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Enter room password"
                            className={`text-sm ${themeClasses.inputBg}`}
                          />
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowRoomSettings(false)}
                          className={`flex-1 px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={updateRoomSettings}
                          className={`flex-1 px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                        >
                          Save Settings
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={deleteRoom}
                      className={`w-full px-4 py-2 text-sm border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-red-500`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Room
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showVersionHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50"
              >
                <Card className={`w-full max-w-lg backdrop-blur-md ${themeClasses.cardBg}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                      <History className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                      <span>Version History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {versionHistory.length === 0 ? (
                      <p className={`text-sm ${themeClasses.subtitleColor}`}>No versions saved yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {versionHistory.map((version) => (
                          <div key={version.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/30">
                            <div>
                              <p className={`text-sm ${themeClasses.cardTitle}`}>
                                Saved by {version.saved_by}
                              </p>
                              <p className={`text-xs ${themeClasses.subtitleColor}`}>
                                {new Date(version.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {currentRoom.created_by === user.email && (
                              <Button
                                onClick={() => restoreVersion(version)}
                                className={`px-4 py-1 text-sm ${themeClasses.primaryButton} text-white`}
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={saveVersion}
                        disabled={currentRoom.created_by !== user.email}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                      >
                        Save Version
                      </Button>
                      <Button
                        onClick={() => setShowVersionHistory(false)}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30' 
                : theme === 'green'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30'
                : 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30'
            }`}>
              <Users className={`w-6 sm:w-8 h-6 sm:h-8 ${themeClasses.heroIconColor}`} />
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold ${themeClasses.titleGradient}`}>
              CodeLab
            </h1>
            <Sparkles className={`w-5 sm:w-6 h-5 sm:h-6 ${
              theme === 'dark' ? 'text-blue-400' : theme === 'green' ? 'text-teal-500' : 'text-pink-500'
            } animate-pulse`} />
          </div>
          <p className={`text-base sm:text-lg md:text-xl mb-4 ${themeClasses.subtitleColor}`}>
            Real-time collaborative coding spaces for teams
          </p>
          <div className="flex justify-center gap-2">
            <Code2 className={`w-4 sm:w-5 h-4 sm:h-5 ${themeClasses.heroIconColor}`} />
            <span className={`text-xs sm:text-sm ${themeClasses.subtitleColor}`}>
              Live • Collaborative • Instant • Shareable
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`backdrop-blur-md border-2 transition-all duration-300 hover:shadow-xl ${themeClasses.cardBg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeClasses.cardTitle}`}>
                  <Plus className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                  <span>Create New Room</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {showCreateForm ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Room Name</Label>
                      <Input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="My Awesome Project"
                        className={`text-sm ${themeClasses.inputBg}`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Language</Label>
                      <div className="relative flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => scrollLanguageSlider('left')}
                          className={`flex-shrink-0 z-10 ${themeClasses.outlineButton}`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div
                          ref={languageSliderRef}
                          className={`flex overflow-x-auto space-x-2 p-2 border rounded-md ${themeClasses.languageSliderBg} scrollbar-hide`}
                          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                        >
                          {languages.map((lang) => (
                            <div
                              key={lang.value}
                              onClick={() => setNewRoomLanguage(lang.value)}
                              className={`flex-shrink-0 px-4 py-2 rounded-md cursor-pointer text-sm transition-all duration-200 ${themeClasses.languageItemBg} ${
                                newRoomLanguage === lang.value
                                  ? theme === 'dark'
                                    ? 'bg-purple-500/20 border-purple-500'
                                    : theme === 'green'
                                    ? 'bg-emerald-500/20 border-emerald-500'
                                    : 'bg-orange-500/20 border-orange-500'
                                  : ''
                              }`}
                              style={{ scrollSnapAlign: 'center', minWidth: '100px' }}
                            >
                              <span className={getLanguageColor(lang.value)}>{lang.label}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => scrollLanguageSlider('right')}
                          className={`flex-shrink-0 z-10 ${themeClasses.outlineButton}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roomSettings.isPrivate}
                        onChange={(e) => setRoomSettings({ ...roomSettings, isPrivate: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label className={themeClasses.subtitleColor}>Private Room</Label>
                    </div>
                    {roomSettings.isPrivate && (
                      <div className="space-y-2">
                        <Label className={themeClasses.subtitleColor}>Room Password</Label>
                        <Input
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          placeholder="Enter room password"
                          className={`text-sm ${themeClasses.inputBg}`}
                          required
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowCreateForm(false)}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateRoom}
                        disabled={isSubmitting}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </div>
                        ) : (
                          "Create Room"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className={`text-sm ${themeClasses.subtitleColor}`}>
                      Start a new collaborative coding session with your team
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className={`w-full px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Room
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`backdrop-blur-md border-2 transition-all duration-300 hover:shadow-xl ${themeClasses.cardBg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeClasses.cardTitle}`}>
                  <ExternalLink className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                  <span>Join Existing Room</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {showJoinForm ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Room ID</Label>
                      <Input
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character Room ID"
                        maxLength={6}
                        className={`font-mono text-center text-sm sm:text-base tracking-widest ${themeClasses.inputBg}`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={themeClasses.subtitleColor}>Password (if private)</Label>
                      <Input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="Enter room password"
                        className={`text-sm ${themeClasses.inputBg}`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowJoinForm(false)}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.outlineButton}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleJoinByRoomId}
                        disabled={!joinRoomId.trim() || joinRoomId.length !== 6}
                        className={`flex-1 px-4 py-2 text-sm ${themeClasses.secondaryButton} text-white shadow-lg`}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Join Room
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className={`text-sm ${themeClasses.subtitleColor}`}>
                      Enter a Room ID to join an existing collaboration session
                    </p>
                    <Button
                      onClick={() => setShowJoinForm(true)}
                      className={`w-full px-4 py-2 text-sm ${themeClasses.secondaryButton} text-white shadow-lg`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Room by ID
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${themeClasses.cardTitle}`}>
                <Zap className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                <span>Active Rooms ({rooms.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoadingRooms ? (
                <div className="text-center py-12">
                  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${themeClasses.spinnerColor} mx-auto mb-4`}></div>
                  <p className={`text-sm ${themeClasses.subtitleColor}`}>Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-12">
                  <Coffee className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 ${themeClasses.subtitleColor}`} />
                  <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${themeClasses.cardTitle}`}>
                    No Active Rooms
                  </h3>
                  <p className={`mb-6 text-sm ${themeClasses.subtitleColor}`}>
                    Be the first to create a collaborative coding room!
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className={`px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {rooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`border-2 rounded-xl p-4 sm:p-6 transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'border-gray-700 hover:border-purple-500/50 bg-gray-900/30 hover:shadow-lg hover:shadow-purple-500/20' 
                          : theme === 'green'
                          ? 'border-emerald-200 hover:border-emerald-400/50 bg-gradient-to-br from-white/50 to-emerald-50/30 hover:shadow-lg hover:shadow-emerald-500/20'
                          : 'border-orange-200 hover:border-orange-400/50 bg-gradient-to-br from-white/50 to-orange-50/30 hover:shadow-lg hover:shadow-orange-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`font-semibold mb-2 text-sm sm:text-base ${themeClasses.cardTitle}`}>
                            {room.room_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge 
                              variant="outline" 
                              className={`text-xs border-2 ${getLanguageColor(room.language)}`}
                            >
                              {languages.find(l => l.value === room.language)?.label || room.language}
                            </Badge>
                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
                              }`}></div>
                              <span>Live</span>
                            </div>
                            {room.isPrivate && (
                              <Badge variant="outline" className="text-xs border-2 text-yellow-400">
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Code2 className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                      </div>
                      <div className={`text-xs sm:text-sm mb-4 space-y-1 ${themeClasses.subtitleColor}`}>
                        <p>
                          Room ID: <span className={`font-mono font-bold ${
                            theme === 'dark' ? 'text-purple-300' : theme === 'green' ? 'text-emerald-700' : 'text-orange-700'
                          }`}>{room.room_id}</span>
                        </p>
                        <p>Created {new Date(room.created_date).toLocaleString()}</p>
                        <p>By {room.created_by}</p>
                      </div>
                      {room.isPrivate && (
                        <div className="mb-4">
                          <Input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Enter room password"
                            className={`text-sm ${themeClasses.inputBg}`}
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleJoinRoom(room)}
                          disabled={room.isPrivate && !roomPassword}
                          className={`flex-1 px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Join Room
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyRoomUrl(room.room_id)}
                          className={`px-3 py-1 ${themeClasses.outlineButton}`}
                        >
                          {copied[`url_${room.room_id}`] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Share className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}