import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { History } from "lucide-react";

export default function VersionHistoryModal({
  showVersionHistory,
  setShowVersionHistory,
  versionHistory,
  restoreVersion,
  saveVersion,
  currentRoom,
  user,
  theme,
  themeClasses
}) {
  return (
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
  );
}