import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { Users, Plus, Code2, Copy, Check, ExternalLink, Coffee, Zap, Share, ArrowRight, Sparkles, Settings, MessageSquare, UserPlus, UserMinus, Trash2, Play, History, ChevronLeft, ChevronRight, Mic, MicOff } from "lucide-react";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import axios from "axios";
import Header from "./lab/Header";
import CodeEditor from "./lab/CodeEditor";
import Chat from "./lab/Chat";
import ManageMembersModal from "./lab/ManageMembersModal";
import RoomSettingsModal from "./lab/RoomSettingsModal";
import VersionHistoryModal from "./lab/VersionhistoryModal";
import CreateRoomForm from "./lab/CreateRoomForm";
import JoinRoomForm from "./lab/JoinRoomForm";
import ActiveRooms from "./lab/ActiveRooms";
import AuthPrompt from "./lab/AuthPrompt";
import AudioChat from "./lab/AudioChat"; // Import AudioChat component

const languages = [
  { value: "javascript", label: "JavaScript", color: "text-yellow-300", version: "18.15.0" },
  { value: "python", label: "Python", color: "text-blue-300", version: "3.10.0" },
  { value: "java", label: "Java", color: "text-orange-300", version: "15.0.2" },
  { value: "cpp", label: "C++", color: "text-purple-300", version: "10.2.0" },
  { value: "html", label: "HTML", color: "text-red-300", version: null },
  { value: "css", label: "CSS", color: "text-green-300", version: null },
  { value: "typescript", label: "TypeScript", color: "text-blue-400", version: "5.0.3" },
  { value: "csharp", label: "C#", color: "text-blue-400", version: "5.0.201" },
  { value: "go", label: "Go", color: "text-cyan-300", version: "1.16.2" },
  { value: "ruby", label: "Ruby", color: "text-red-400", version: "3.0.1" },
  { value: "php", label: "PHP", color: "text-indigo-300", version: "8.0.3" },
  { value: "swift", label: "Swift", color: "text-orange-400", version: "5.3.3" },
  { value: "kotlin", label: "Kotlin", color: "text-purple-400", version: "1.8.20" },
  { value: "rust", label: "Rust", color: "text-orange-500", version: "1.68.2" },
  { value: "sql", label: "SQL (SQLite)", color: "text-blue-500", version: "3.45.1" },
  { value: "bash", label: "Bash", color: "text-gray-300", version: "5.2.0" },
  { value: "perl", label: "Perl", color: "text-pink-300", version: "5.36.0" },
  { value: "lua", label: "Lua", color: "text-blue-600", version: "5.4.4" },
  { value: "haskell", label: "Haskell", color: "text-purple-500", version: "9.0.1" },
  { value: "scala", label: "Scala", color: "text-red-500", version: "3.1.0" },
  { value: "elixir", label: "Elixir", color: "text-indigo-400", version: "1.13.3" },
  { value: "dart", label: "Dart", color: "text-teal-300", version: "2.16.2" },
  { value: "r", label: "R", color: "text-blue-200", version: "4.1.3" },
  { value: "clojure", label: "Clojure", color: "text-green-500", version: "1.10.3" },
  { value: "fortran", label: "Fortran", color: "text-gray-400", version: "11.1.0" },
  { value: "lisp", label: "Lisp", color: "text-yellow-400", version: "2.1.2" }
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
  const navigate = useNavigate();

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
        timeout: 15000
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
    return <AuthPrompt theme={theme} themeClasses={themeClasses} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {currentRoom ? (
          <>
            <Header
              currentRoom={currentRoom}
              user={user}
              theme={theme}
              themeClasses={themeClasses}
              copied={copied}
              showChat={showChat}
              setShowChat={setShowChat}
              showVersionHistory={showVersionHistory}
              setShowVersionHistory={setShowVersionHistory}
              showManageMembers={showManageMembers}
              setShowManageMembers={setShowManageMembers}
              showRoomSettings={showRoomSettings}
              setShowRoomSettings={setShowRoomSettings}
              copyRoomId={copyRoomId}
              copyRoomUrl={copyRoomUrl}
              leaveRoom={leaveRoom}
              languages={languages}
              getLanguageColor={getLanguageColor}
            />
            <div className="">
              <div className={`lg:col-span-${showChat ? 2 : 3}`}>
                <CodeEditor
                  code={code}
                  currentRoom={currentRoom}
                  theme={theme}
                  themeClasses={themeClasses}
                  textareaRef={textareaRef}
                  lineNumbersRef={lineNumbersRef}
                  cursors={cursors}
                  isExecuting={isExecuting}
                  executionOutput={executionOutput}
                  handleCodeChange={handleCodeChange}
                  handleCursorChange={handleCursorChange}
                  syncScroll={syncScroll}
                  executeCode={executeCode}
                  languages={languages}
                  getLanguageColor={getLanguageColor}
                  renderCursor={renderCursor}
                />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-4">
                <Chat
                  showChat={showChat}
                  chatMessages={chatMessages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  sendMessage={sendMessage}
                  user={user}
                  theme={theme}
                  themeClasses={themeClasses}
                />
                <AudioChat
                  roomId={currentRoom.room_id}
                  userId={user.email}
                  theme={theme}
                  themeClasses={themeClasses}
                />
              </div>
            </div>
            <ManageMembersModal
              showManageMembers={showManageMembers}
              setShowManageMembers={setShowManageMembers}
              members={members}
              newMemberEmail={newMemberEmail}
              setNewMemberEmail={setNewMemberEmail}
              addMember={addMember}
              removeMember={removeMember}
              currentRoom={currentRoom}
              user={user}
              theme={theme}
              themeClasses={themeClasses}
            />
            <RoomSettingsModal
              showRoomSettings={showRoomSettings}
              setShowRoomSettings={setShowRoomSettings}
              roomSettings={roomSettings}
              setRoomSettings={setRoomSettings}
              roomPassword={roomPassword}
              setRoomPassword={setRoomPassword}
              updateRoomSettings={updateRoomSettings}
              deleteRoom={deleteRoom}
              currentRoom={currentRoom}
              user={user}
              theme={theme}
              themeClasses={themeClasses}
            />
            <VersionHistoryModal
              showVersionHistory={showVersionHistory}
              setShowVersionHistory={setShowVersionHistory}
              versionHistory={versionHistory}
              restoreVersion={restoreVersion}
              saveVersion={saveVersion}
              currentRoom={currentRoom}
              user={user}
              theme={theme}
              themeClasses={themeClasses}
            />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 sm:mb-12"
            >
              <div className="inline-flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl ${theme === 'dark'
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
                <Sparkles className={`w-5 sm:w-6 h-5 sm:h-6 ${theme === 'dark' ? 'text-blue-400' : theme === 'green' ? 'text-teal-500' : 'text-pink-500'
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
              <CreateRoomForm
                showCreateForm={showCreateForm}
                setShowCreateForm={setShowCreateForm}
                newRoomName={newRoomName}
                setNewRoomName={setNewRoomName}
                newRoomLanguage={newRoomLanguage}
                setNewRoomLanguage={setNewRoomLanguage}
                roomSettings={roomSettings}
                setRoomSettings={setRoomSettings}
                roomPassword={roomPassword}
                setRoomPassword={setRoomPassword}
                isSubmitting={isSubmitting}
                handleCreateRoom={handleCreateRoom}
                theme={theme}
                themeClasses={themeClasses}
                languages={languages}
                languageSliderRef={languageSliderRef}
                scrollLanguageSlider={scrollLanguageSlider}
                getLanguageColor={getLanguageColor}
              />
              <JoinRoomForm
                showJoinForm={showJoinForm}
                setShowJoinForm={setShowJoinForm}
                joinRoomId={joinRoomId}
                setJoinRoomId={setJoinRoomId}
                roomPassword={roomPassword}
                setRoomPassword={setRoomPassword}
                handleJoinByRoomId={handleJoinByRoomId}
                theme={theme}
                themeClasses={themeClasses}
              />
            </div>
            <ActiveRooms
              rooms={rooms}
              isLoadingRooms={isLoadingRooms}
              setShowCreateForm={setShowCreateForm}
              handleJoinRoom={handleJoinRoom}
              copyRoomUrl={copyRoomUrl}
              copied={copied}
              roomPassword={roomPassword}
              setRoomPassword={setRoomPassword}
              theme={theme}
              themeClasses={themeClasses}
              languages={languages}
              getLanguageColor={getLanguageColor}
            />
          </>
        )}
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