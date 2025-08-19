import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Settings, Trash2 } from "lucide-react";

export default function RoomSettingsModal({
  showRoomSettings,
  setShowRoomSettings,
  roomSettings,
  setRoomSettings,
  roomPassword,
  setRoomPassword,
  updateRoomSettings,
  deleteRoom,
  currentRoom,
  user,
  theme,
  themeClasses
}) {
  return (
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
  );
}