import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { MessageSquare } from "lucide-react";

export default function Chat({
  showChat,
  chatMessages,
  newMessage,
  setNewMessage,
  sendMessage,
  user,
  theme,
  themeClasses
}) {
  return (
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
                    <div className={`inline-block p-2 rounded-lg text-sm ${msg.sender === user.email
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
  );
}