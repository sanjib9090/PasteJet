import React, { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const cursorColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500"
];

export default function CursorManager({
  code,
  currentRoom,
  user,
  cursors,
  textareaRef,
  theme,
  handleCursorChange
}) {
  // Handle cursor updates to Firestore
  const updateCursor = async (e) => {
    if (!currentRoom || !textareaRef.current) return;
    const { selectionStart } = e.target;
    const lines = code.substring(0, selectionStart).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1]?.length + 1 || 1;

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

  // Render individual cursor
  const renderCursor = (cursor, index) => {
    if (!textareaRef.current || !cursor?.position || !code) return null;
    const lines = code.split('\n');
    let charCount = 0;
    for (let i = 0; i < cursor.position.line - 1; i++) {
      charCount += (lines[i]?.length || 0) + 1;
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

  // Call handleCursorChange to update cursor position
  const handleChange = (e) => {
    handleCursorChange(e);
    updateCursor(e);
  };

  return (
    <>
      <textarea
        onSelect={handleChange}
        style={{ display: 'none' }} // Hidden textarea to capture events
      />
      {Object.values(cursors).map((cursor, index) => renderCursor(cursor, index))}
    </>
  );
}