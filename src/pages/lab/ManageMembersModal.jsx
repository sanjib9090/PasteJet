import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Users, UserPlus, UserMinus } from "lucide-react";

export default function ManageMembersModal({
  showManageMembers,
  setShowManageMembers,
  members,
  newMemberEmail,
  setNewMemberEmail,
  addMember,
  removeMember,
  currentRoom,
  user,
  theme,
  themeClasses
}) {
  return (
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
  );
}