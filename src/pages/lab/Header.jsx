import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Users, Share, Copy, Check, MessageSquare, History, Settings } from "lucide-react";

export default function Header({
  currentRoom,
  user,
  theme,
  themeClasses,
  copied,
  showChat,
  setShowChat,
  showVersionHistory,
  setShowVersionHistory,
  showManageMembers,
  setShowManageMembers,
  showRoomSettings,
  setShowRoomSettings,
  copyRoomId,
  copyRoomUrl,
  leaveRoom,
  languages,
  getLanguageColor
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
        <CardContent className="p-4 sm:p-6 pt-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold mb-2 flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                <Users className={`w-5 sm:w-6 h-5 sm:h-6 ${themeClasses.cardIcon}`} />
                <span>{currentRoom.room_name}</span>
                <div className={`flex items-center space-x-1 text-xs sm:text-sm px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
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
  );
}