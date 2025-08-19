import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, Users, Volume2, Settings } from "lucide-react";
import { db } from "../../firebase";
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc, addDoc, getDocs, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function AudioChat({ roomId, userId, theme, themeClasses }) {
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [forcedMuted, setForcedMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [volumes, setVolumes] = useState({});
  const [showManageModal, setShowManageModal] = useState(false);
  const localAudioRef = useRef(null);
  const remoteAudioRefs = useRef({});
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const initiatedCallsRef = useRef(new Set());
  const candidateQueueRef = useRef({});
  const callStartTimeRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing. Please sign in again.");
      return;
    }

    console.log("AudioChat useEffect - roomId:", roomId, "userId:", userId);

    let unsubscribePresence, unsubscribeSignaling, unsubscribeRoom;

    // Check if user is admin
    getDoc(doc(db, "rooms", roomId)).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.created_by === userId) {
          setIsAdmin(true);
        }
      }
    }).catch((err) => {
      setError("Failed to fetch room data: " + err.message);
      console.error("Room fetch error:", err);
    });

    // Listen for mutedUsers updates
    unsubscribeRoom = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      const data = doc.data();
      setMutedUsers(data.mutedUsers || []);
      if (data.mutedUsers?.includes(userId)) {
        setForcedMuted(true);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          setIsMuted(true);
        }
      } else {
        setForcedMuted(false);
      }
    }, (err) => {
      setError("Failed to listen to room data: " + err.message);
      console.error("Room snapshot error:", err);
    });

    const presenceRef = doc(db, "rooms", roomId, "presence", userId);
    console.log("Setting presence for userId:", userId);
    setDoc(presenceRef, { lastActive: Date.now(), userId, audioActive: false, displayName: userId }, { merge: true }).catch((err) => {
      setError("Failed to set presence: " + err.message);
      console.error("Presence set error:", err);
    });

    const presenceInterval = setInterval(() => {
      console.log("Updating presence for userId:", userId);
      setDoc(presenceRef, { lastActive: Date.now() }, { merge: true }).catch((err) => {
        setError("Failed to update presence: " + err.message);
        console.error("Presence update error:", err);
      });
    }, 30000);

    unsubscribePresence = onSnapshot(
      collection(db, "rooms", roomId, "presence"),
      (snapshot) => {
        console.log("Presence snapshot received for roomId:", roomId, "changes:", snapshot.docChanges().length);
        const users = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== userId) {
            users.push({ id: doc.id, ...data });
          }
        });
        setActiveUsers(users);
        snapshot.docChanges().forEach((change) => {
          const remoteUserId = change.doc.id;
          const remoteData = change.doc.data();
          console.log("Presence change:", change.type, "remoteUserId:", remoteUserId, "remoteAudioActive:", remoteData.audioActive);
          if (remoteUserId !== userId && isAudioActive && remoteData.audioActive && !initiatedCallsRef.current.has(remoteUserId)) {
            console.log("Initiating call to:", remoteUserId);
            initiatedCallsRef.current.add(remoteUserId);
            initiateCall(remoteUserId);
          }
        });
      },
      (err) => {
        setError("Failed to listen to presence: " + err.message);
        console.error("Presence snapshot error:", err);
      }
    );

    const signalingQuery = query(
      collection(db, "rooms", roomId, "signaling"),
      where("to", "==", userId)
    );
    unsubscribeSignaling = onSnapshot(signalingQuery, (snapshot) => {
      console.log("Signaling snapshot received for userId:", userId, "changes:", snapshot.docChanges().length);
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const { type, from, data } = change.doc.data();
          console.log("Signaling message:", type, "from:", from, "data:", data);
          if (from === userId) {
            console.log("Ignoring signaling message from self");
            return;
          }

          try {
            let peerConnection = peerConnectionsRef.current[from];
            if (!peerConnection) {
              console.log("Creating new peer connection for:", from);
              peerConnection = new RTCPeerConnection(configuration);
              peerConnectionsRef.current[from] = peerConnection;
              candidateQueueRef.current[from] = candidateQueueRef.current[from] || [];
              setupPeerConnection(peerConnection, from);
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                  console.log("Adding track to peer connection for:", from, "track:", track);
                  peerConnection.addTrack(track, localStreamRef.current);
                });
              } else if (type === "offer") {
                console.log("No local stream, starting audio for offer from:", from);
                await startAudio();
              }
            }

            if (type === "offer") {
              console.log("Processing offer from:", from, "signalingState:", peerConnection.signalingState);
              if (peerConnection.signalingState !== "stable") {
                console.warn("Ignoring offer in non-stable state:", peerConnection.signalingState);
                return;
              }

              await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
              if (candidateQueueRef.current[from]?.length > 0) {
                console.log("Applying queued candidates for:", from, "count:", candidateQueueRef.current[from].length);
                for (const candidateData of candidateQueueRef.current[from]) {
                  await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
                  console.log("Applied queued candidate for:", from, "candidate:", candidateData.candidate);
                  await deleteDoc(doc(db, "rooms", roomId, "signaling", candidateData.docId));
                }
                candidateQueueRef.current[from] = [];
              }

              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);

              console.log("Sending answer to:", from);
              await addDoc(collection(db, "rooms", roomId, "signaling"), {
                type: "answer",
                from: userId,
                to: from,
                data: { sdp: answer.sdp, type: answer.type },
                timestamp: Date.now(),
              });

              console.log("Deleting processed offer:", change.doc.id);
              await deleteDoc(change.doc.ref);
            } else if (type === "answer") {
              console.log("Processing answer from:", from, "signalingState:", peerConnection.signalingState);
              if (peerConnection.signalingState !== "have-local-offer") {
                console.warn("Ignoring answer in wrong state:", peerConnection.signalingState);
                return;
              }
              await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
              if (candidateQueueRef.current[from]?.length > 0) {
                console.log("Applying queued candidates for:", from, "count:", candidateQueueRef.current[from].length);
                for (const candidateData of candidateQueueRef.current[from]) {
                  await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
                  console.log("Applied queued candidate for:", from, "candidate:", candidateData.candidate);
                  await deleteDoc(doc(db, "rooms", roomId, "signaling", candidateData.docId));
                }
                candidateQueueRef.current[from] = [];
              }
              console.log("Deleting processed answer:", change.doc.id);
              await deleteDoc(change.doc.ref);
            } else if (type === "candidate") {
              if (peerConnection && data) {
                if (!peerConnection.remoteDescription) {
                  console.log("Queuing ICE candidate for:", from, "candidate:", data);
                  candidateQueueRef.current[from] = candidateQueueRef.current[from] || [];
                  candidateQueueRef.current[from].push({ candidate: data, docId: change.doc.id });
                } else {
                  console.log("Adding ICE candidate from:", from, "candidate:", data);
                  try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    console.log("Deleting processed candidate:", change.doc.id);
                    await deleteDoc(change.doc.ref);
                  } catch (err) {
                    setError("Failed to add ICE candidate: " + err.message);
                    console.error("ICE candidate error:", err);
                  }
                }
              }
            }
          } catch (err) {
            setError(`Failed to process ${type}: ${err.message}`);
            console.error(`Signaling error for ${type}:`, err);
          }
        }
      });
    }, (err) => {
      setError("Failed to listen to signaling: " + err.message);
      console.error("Signaling snapshot error:", err);
    });

    return () => {
      console.log("Cleaning up AudioChat for userId:", userId);
      clearInterval(presenceInterval);
      deleteDoc(presenceRef).catch((err) => {
        console.error("Failed to delete presence:", err);
      });
      if (isAudioActive) {
        stopAudio();
      }
      unsubscribePresence && unsubscribePresence();
      unsubscribeSignaling && unsubscribeSignaling();
      unsubscribeRoom && unsubscribeRoom();
    };
  }, [roomId, userId]);

  // Track call duration
  useEffect(() => {
    let timer;
    if (isAudioActive) {
      callStartTimeRef.current = Date.now();
      timer = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAudioActive]);

  const setupPeerConnection = (peerConnection, remoteUserId) => {
    if (!peerConnection) {
      console.error("Peer connection not initialized for:", remoteUserId);
      return;
    }

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate from userId:", userId, "to:", remoteUserId);
        try {
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment,
          };
          await addDoc(collection(db, "rooms", roomId, "signaling"), {
            type: "candidate",
            from: userId,
            to: remoteUserId,
            data: candidateData,
            timestamp: Date.now(),
          });
        } catch (err) {
          setError("Failed to send ICE candidate: " + err.message);
          console.error("ICE candidate send error:", err);
        }
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote track for userId:", userId, "from:", remoteUserId, "streams:", event.streams.length);
      if (event.streams[0]) {
        if (!remoteAudioRefs.current[remoteUserId]) {
          remoteAudioRefs.current[remoteUserId] = new Audio();
          remoteAudioRefs.current[remoteUserId].autoPlay = true;
          remoteAudioRefs.current[remoteUserId].volume = volumes[remoteUserId] || 1.0;
        }
        remoteAudioRefs.current[remoteUserId].srcObject = event.streams[0];
        remoteAudioRefs.current[remoteUserId].play().catch((err) => {
          setError("Failed to play remote audio: " + err.message);
          console.error("Remote audio play error:", err);
        });
        setActiveConnections((prev) => [...new Set([...prev, remoteUserId])]);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log("ICE connection state for userId:", userId, "remoteUserId:", remoteUserId, "state:", state);
      if (["disconnected", "failed", "closed"].includes(state)) {
        if (remoteAudioRefs.current[remoteUserId]) {
          remoteAudioRefs.current[remoteUserId].srcObject = null;
          delete remoteAudioRefs.current[remoteUserId];
        }
        setError(`ICE connection ${state} for ${remoteUserId}`);
        console.warn("ICE connection issue:", state, "for:", remoteUserId);
        delete peerConnectionsRef.current[remoteUserId];
        delete candidateQueueRef.current[remoteUserId];
        initiatedCallsRef.current.delete(remoteUserId);
        setActiveConnections((prev) => prev.filter((id) => id !== remoteUserId));
        setVolumes((prev) => {
          const newVolumes = { ...prev };
          delete newVolumes[remoteUserId];
          return newVolumes;
        });
      } else if (state === "connected") {
        setActiveConnections((prev) => [...new Set([...prev, remoteUserId])]);
      }
    };
  };

  const startAudio = async () => {
    try {
      console.log("Starting audio for userId:", userId);
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true },
      });

      localAudioRef.current.srcObject = localStreamRef.current;
      localAudioRef.current.play().catch((err) => {
        setError("Failed to play local audio: " + err.message);
        console.error("Local audio play error:", err);
      });

      Object.keys(peerConnectionsRef.current).forEach((remoteUserId) => {
        const peerConnection = peerConnectionsRef.current[remoteUserId];
        if (peerConnection && peerConnection.signalingState !== "closed") {
          localStreamRef.current.getTracks().forEach((track) => {
            console.log("Adding track to existing peer connection for:", remoteUserId, "track:", track);
            peerConnection.addTrack(track, localStreamRef.current);
          });
        }
      });

      setIsAudioActive(true);
      setError(null);

      const presenceRef = doc(db, "rooms", roomId, "presence", userId);
      console.log("Updating presence to audioActive: true for userId:", userId);
      await setDoc(presenceRef, { lastActive: Date.now(), audioActive: true, displayName: userId }, { merge: true }).catch((err) => {
        setError("Failed to update presence on start: " + err.message);
        console.error("Presence update error on start:", err);
      });

      const presenceSnapshot = await getDocs(collection(db, "rooms", roomId, "presence"));
      console.log("Presence snapshot size:", presenceSnapshot.size);
      presenceSnapshot.forEach((doc) => {
        const remoteUserId = doc.id;
        const remoteData = doc.data();
        console.log("Checking remote user:", remoteUserId, "audioActive:", remoteData.audioActive);
        if (remoteUserId !== userId && remoteData.audioActive && !initiatedCallsRef.current.has(remoteUserId)) {
          console.log("Initiating call to existing user:", remoteUserId);
          initiatedCallsRef.current.add(remoteUserId);
          initiateCall(remoteUserId);
        }
      });
    } catch (err) {
      setError("Failed to start audio: " + err.message);
      console.error("Start audio error:", err);
    }
  };

  const initiateCall = async (remoteUserId) => {
    try {
      console.log("Initiating call from", userId, "to", remoteUserId);
      let peerConnection = peerConnectionsRef.current[remoteUserId];
      if (!peerConnection || peerConnection.signalingState === "closed") {
        console.log("Creating new peer connection for:", remoteUserId);
        peerConnection = new RTCPeerConnection(configuration);
        peerConnectionsRef.current[remoteUserId] = peerConnection;
        candidateQueueRef.current[remoteUserId] = candidateQueueRef.current[remoteUserId] || [];
        setupPeerConnection(peerConnection, remoteUserId);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            console.log("Adding track to peer connection for:", remoteUserId, "track:", track);
            peerConnection.addTrack(track, localStreamRef.current);
          });
        }
      } else if (peerConnection.signalingState !== "stable") {
        console.warn("Cannot initiate call, peer connection not in stable state:", peerConnection.signalingState);
        return;
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log("Sending offer to:", remoteUserId);
      await addDoc(collection(db, "rooms", roomId, "signaling"), {
        type: "offer",
        from: userId,
        to: remoteUserId,
        data: { sdp: offer.sdp, type: offer.type },
        timestamp: Date.now(),
      });
    } catch (err) {
      setError("Failed to initiate call: " + err.message);
      console.error("Initiate call error:", err);
      initiatedCallsRef.current.delete(remoteUserId);
    }
  };

  const stopAudio = async () => {
    console.log("Stopping audio for userId:", userId);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    Object.keys(peerConnectionsRef.current).forEach((remoteUserId) => {
      if (peerConnectionsRef.current[remoteUserId]) {
        peerConnectionsRef.current[remoteUserId].close();
        delete peerConnectionsRef.current[remoteUserId];
      }
    });
    Object.keys(remoteAudioRefs.current).forEach((remoteUserId) => {
      if (remoteAudioRefs.current[remoteUserId]) {
        remoteAudioRefs.current[remoteUserId].srcObject = null;
        delete remoteAudioRefs.current[remoteUserId];
      }
    });
    Object.keys(candidateQueueRef.current).forEach((remoteUserId) => {
      delete candidateQueueRef.current[remoteUserId];
    });
    initiatedCallsRef.current.clear();
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    setIsAudioActive(false);
    setIsMuted(false);
    setForcedMuted(false);
    setActiveConnections([]);
    setVolumes({});
    setCallDuration(0);
    setShowManageModal(false);

    const presenceRef = doc(db, "rooms", roomId, "presence", userId);
    console.log("Updating presence to audioActive: false for userId:", userId);
    await setDoc(presenceRef, { audioActive: false }, { merge: true }).catch((err) => {
      setError("Failed to update presence on stop: " + err.message);
      console.error("Presence update error on stop:", err);
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current && !forcedMuted) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        console.log("Toggling mute, track enabled:", track.enabled);
      });
      setIsMuted(!isMuted);
    }
  };

  const muteAllUsers = async () => {
    if (!isAdmin) return;
    try {
      const presenceSnapshot = await getDocs(collection(db, "rooms", roomId, "presence"));
      const usersToMute = [];
      presenceSnapshot.forEach((doc) => {
        if (doc.id !== userId) {
          usersToMute.push(doc.id);
        }
      });
      await updateDoc(doc(db, "rooms", roomId), {
        mutedUsers: usersToMute,
      });
      console.log("Muted all users:", usersToMute);
    } catch (err) {
      setError("Failed to mute all users: " + err.message);
      console.error("Mute all error:", err);
    }
  };

  const unmuteAllUsers = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        mutedUsers: [],
      });
      console.log("Unmuted all users");
    } catch (err) {
      setError("Failed to unmute all users: " + err.message);
      console.error("Unmute all error:", err);
    }
  };

  const toggleMuteUser = async (targetUserId) => {
    if (!isAdmin) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
      if (mutedUsers.includes(targetUserId)) {
        await updateDoc(roomRef, {
          mutedUsers: arrayRemove(targetUserId),
        });
        console.log("Unmuted user:", targetUserId);
      } else {
        await updateDoc(roomRef, {
          mutedUsers: arrayUnion(targetUserId),
        });
        console.log("Muted user:", targetUserId);
      }
    } catch (err) {
      setError(`Failed to toggle mute for ${targetUserId}: ${err.message}`);
      console.error("Toggle mute user error:", err);
    }
  };

  const handleVolumeChange = (remoteUserId, value) => {
    setVolumes((prev) => ({
      ...prev,
      [remoteUserId]: value / 100,
    }));
    if (remoteAudioRefs.current[remoteUserId]) {
      remoteAudioRefs.current[remoteUserId].volume = value / 100;
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (error === "User ID is missing. Please sign in again.") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${themeClasses.cardTitle}`}>
              <Mic className={`w-5 h-5 ${themeClasses.cardIcon}`} />
              <span>Audio Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className={`mb-4 text-sm text-red-500 bg-red-100/50 p-3 rounded-lg ${themeClasses.subtitleColor}`}>
              {error}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${themeClasses.cardTitle}`}>
            <Mic className={`w-5 h-5 ${themeClasses.cardIcon}`} />
            <span>Audio Chat {isAdmin ? "(Admin)" : ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className={`text-sm text-red-500 bg-red-100/50 p-3 rounded-lg ${themeClasses.subtitleColor}`}>
              {error}
            </div>
          )}
          {activeConnections.length > 0 && (
            <div className={`text-sm text-green-500 bg-green-100/50 p-3 rounded-lg ${themeClasses.subtitleColor}`}>
              <Users className="w-4 h-4 inline mr-2" />
              Connected: {activeConnections.join(", ")}
            </div>
          )}
          <div className={`text-sm ${themeClasses.subtitleColor}`}>
            Call Duration: {formatDuration(callDuration)}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              onClick={isAudioActive ? stopAudio : startAudio}
              className={`flex-1 px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg hover:bg-opacity-90 transition-all duration-200`}
            >
              {isAudioActive ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Audio
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Audio
                </>
              )}
            </Button>
            <Button
              onClick={toggleMute}
              disabled={!isAudioActive || forcedMuted}
              className={`px-4 py-2 text-sm ${isMuted || forcedMuted ? themeClasses.secondaryButton : themeClasses.outlineButton} hover:bg-opacity-90 transition-all duration-200`}
            >
              {isMuted || forcedMuted ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  {forcedMuted ? "Force Muted" : "Unmute"}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Mute
                </>
              )}
            </Button>
            {isAdmin && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowManageModal(true)}
                  className={`px-4 py-2 text-sm ${themeClasses.outlineButton} hover:bg-opacity-80 transition-all duration-200`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  
                </Button>
              </motion.div>
            )}
          </div>
          {activeConnections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h4 className={`text-sm font-semibold ${themeClasses.subtitleColor}`}>Volume Controls</h4>
              {activeConnections.map((remoteUserId) => (
                <motion.div
                  key={remoteUserId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 group relative p-2 rounded-lg bg-gray-900/30"
                >
                  <Volume2 className={`w-4 h-4 ${themeClasses.cardIcon}`} />
                  <span className={`text-sm truncate max-w-[120px] ${themeClasses.cardTitle}`}>{remoteUserId}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(volumes[remoteUserId] || 1.0) * 100}
                    onChange={(e) => handleVolumeChange(remoteUserId, e.target.value)}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${themeClasses.inputBg} transition-all duration-200 
                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500 
                      [&::-webkit-slider-thumb]:shadow-md 
                      hover:[&::-webkit-slider-thumb]:scale-110 
                      focus:outline-none`}
                  />
                  <span className="absolute left-0 top-8 hidden group-hover:block text-xs bg-gray-800 text-white px-2 py-1 rounded-md shadow-lg">
                    {Math.round((volumes[remoteUserId] || 1.0) * 100)}%
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
          <div className="flex flex-col gap-2">
            <audio ref={localAudioRef} muted autoPlay className="hidden" />
            {Object.keys(remoteAudioRefs.current).map((remoteUserId) => (
              <audio key={remoteUserId} ref={(el) => (remoteAudioRefs.current[remoteUserId] = el)} autoPlay className="hidden" />
            ))}
          </div>
        </CardContent>
      </Card>
      <AnimatePresence>
        {isAdmin && showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50"
          >
            <Card className={`w-full max-w-md backdrop-blur-md ${themeClasses.cardBg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                  <Users className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                  <span>Manage Audio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      onClick={muteAllUsers}
                      className={`w-full px-4 py-2 text-sm ${themeClasses.dangerButton} text-white shadow-md hover:bg-opacity-90 transition-all duration-200`}
                    >
                      Mute All Users
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      onClick={unmuteAllUsers}
                      className={`w-full px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-md hover:bg-opacity-90 transition-all duration-200`}
                    >
                      Unmute All Users
                    </Button>
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <h4 className={`text-sm font-semibold ${themeClasses.subtitleColor}`}>Current Members</h4>
                  {activeUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-900/30"
                    >
                      <div>
                        <p className={`text-sm ${themeClasses.cardTitle}`}>{user.displayName}</p>
                        <p className={`text-xs ${themeClasses.subtitleColor}`}>
                          {mutedUsers.includes(user.id) ? "Muted" : "Unmuted"}
                        </p>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => toggleMuteUser(user.id)}
                          className={`px-3 py-1 text-xs border-red-500/50 ${mutedUsers.includes(user.id) ? themeClasses.secondaryButton : 'text-red-500 hover:bg-red-500/10'}`}
                        >
                          {mutedUsers.includes(user.id) ? "Unmute" : "Mute"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setShowManageModal(false)}
                    className={`w-full px-4 py-2 text-sm ${themeClasses.outlineButton} hover:bg-opacity-80 transition-all duration-200`}
                  >
                    Close
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}