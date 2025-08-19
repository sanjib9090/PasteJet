import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function CreateRoomForm({
  showCreateForm,
  setShowCreateForm,
  newRoomName,
  setNewRoomName,
  newRoomLanguage,
  setNewRoomLanguage,
  roomSettings,
  setRoomSettings,
  roomPassword,
  setRoomPassword,
  isSubmitting,
  handleCreateRoom,
  theme,
  themeClasses,
  languages,
  languageSliderRef,
  scrollLanguageSlider,
  getLanguageColor
}) {
  return (
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
                {!newRoomName.trim() && (
                  <p className="text-xs text-gray-500">Required field</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={themeClasses.subtitleColor}>Language</Label>
                <div className="relative flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollLanguageSlider("left")}
                    className={`flex-shrink-0 z-10 ${themeClasses.outlineButton}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div
                    ref={languageSliderRef}
                    className={`flex overflow-x-auto space-x-2 p-2 border rounded-md ${themeClasses.languageSliderBg} scrollbar-hide`}
                    style={{
                      scrollSnapType: "x mandatory",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {languages.map((lang) => (
                      <div
                        key={lang.value}
                        onClick={() => setNewRoomLanguage(lang.value)}
                        className={`flex-shrink-0 px-4 py-2 rounded-md cursor-pointer text-sm transition-all duration-200 ${themeClasses.languageItemBg} ${
                          newRoomLanguage === lang.value
                            ? theme === "dark"
                              ? "bg-purple-500/20 border-purple-500"
                              : theme === "green"
                              ? "bg-emerald-500/20 border-emerald-500"
                              : "bg-orange-500/20 border-orange-500"
                            : ""
                        }`}
                        style={{ scrollSnapAlign: "center", minWidth: "100px" }}
                      >
                        <span className={getLanguageColor(lang.value)}>
                          {lang.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollLanguageSlider("right")}
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
                  onChange={(e) =>
                    setRoomSettings({ ...roomSettings, isPrivate: e.target.checked })
                  }
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
                  {!roomPassword.trim() && (
                    <p className="text-xs text-gray-500">Required field</p>
                  )}
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
  );
}