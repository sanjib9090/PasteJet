import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Zap, Coffee, Plus, ExternalLink, Share, Check, Code2 } from "lucide-react";

export default function ActiveRooms({
  rooms,
  isLoadingRooms,
  setShowCreateForm,
  handleJoinRoom,
  copyRoomUrl,
  copied,
  roomPassword,
  setRoomPassword,
  theme,
  themeClasses,
  languages,
  getLanguageColor
}) {
  return (
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
                  className={`border-2 rounded-xl p-4 sm:p-6 transition-all duration-300 ${theme === 'dark'
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
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
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
                      Room ID: <span className={`font-mono font-bold ${theme === 'dark' ? 'text-purple-300' : theme === 'green' ? 'text-emerald-700' : 'text-orange-700'
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
  );
}