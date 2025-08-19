import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { ExternalLink, ArrowRight } from "lucide-react";

export default function JoinRoomForm({
  showJoinForm,
  setShowJoinForm,
  joinRoomId,
  setJoinRoomId,
  roomPassword,
  setRoomPassword,
  handleJoinByRoomId,
  theme,
  themeClasses
}) {
  return (
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
  );
}