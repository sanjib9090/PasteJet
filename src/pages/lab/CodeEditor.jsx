import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Code2, Play } from "lucide-react";

export default function CodeEditor({
  code,
  currentRoom,
  theme,
  themeClasses,
  textareaRef,
  lineNumbersRef,
  cursors,
  isExecuting,
  executionOutput,
  handleCodeChange,
  handleCursorChange,
  syncScroll,
  executeCode,
  languages,
  getLanguageColor,
  renderCursor,
}) {
  const lineNumbers = code.split('\n').map((_, i) => i + 1).join('\n');

  // Wrapper to add viewport hiding logic to renderCursor
  const renderCursorWithViewportCheck = (cursor, index) => {
    if (!textareaRef.current) {
      console.warn("textareaRef is not available, skipping cursor render");
      return null;
    }

    // Validate cursor data
    if (!cursor.position || typeof cursor.position.line !== 'number' || typeof cursor.position.column !== 'number') {
      console.warn(`Invalid cursor data for index ${index}:`, cursor);
      return null; // Skip rendering invalid cursors
    }

    // Get textarea dimensions and scroll position
    const textarea = textareaRef.current;
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = textarea;

    // Convert line and column to pixel coordinates
    const lineHeight = 20; // Matches lineHeight in style (20px)
    const charWidth = 7.2; // Approximate character width for monospaced font
    const paddingLeft = 12; // Matches textarea's padding-left (12px)
    const cursorTop = cursor.position.line * lineHeight; // Pixel Y position
    const cursorLeft = cursor.position.column * charWidth + paddingLeft; // Pixel X position

    // Check if cursor is outside the viewport
    const isOutsideViewport =
      cursorTop < scrollTop ||
      cursorTop >= scrollTop + clientHeight ||
      cursorLeft < scrollLeft ||
      cursorLeft >= scrollLeft + clientWidth;

    // Debug cursor position and viewport
    console.log(`Cursor ${index}:`, {
      line: cursor.position.line,
      column: cursor.position.column,
      top: cursorTop,
      left: cursorLeft,
      isOutside: isOutsideViewport,
      scrollTop,
      scrollLeft,
      clientHeight,
      clientWidth,
      cursorData: cursor,
    });

    // Call the original renderCursor prop
    const cursorElement = renderCursor(cursor, index);
    if (!cursorElement) return null;

    // Wrap the cursor element to apply viewport hiding
    return (
      <div
        key={index}
        style={{
          display: isOutsideViewport ? 'none' : 'block',
          position: 'absolute',
          zIndex: 10, // Ensure cursor is above other elements
        }}
        title={cursor.displayName || 'Unknown user'}
      >
        {cursorElement}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
          <CardHeader>
            <CardTitle className={`flex sm:flex-row items-start sm:items-center justify-between gap-2 ${themeClasses.cardTitle}`}>
              <div className="flex items-center space-x-2">
                <Code2 className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                <span>Collaborative Code Editor</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={executeCode}
                  disabled={isExecuting || !languages.find(l => l.value === currentRoom.language)?.version}
                  className={`px-4 py-2 text-sm ${themeClasses.primaryButton} text-white shadow-lg`}
                >
                  {isExecuting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Running...</span>
                    </div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Code
                    </>
                  )}
                </Button>
                <div className={`flex items-center space-x-2 text-xs sm:text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-green-400' : 'bg-emerald-500'
                    }`}></div>
                  <span>Auto-sync enabled</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative flex">
              <div
                ref={lineNumbersRef}
                className={`w-12 min-h-[500px] bg-gray-800/50 text-right pr-3 py-3 font-mono text-sm leading-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                style={{ lineHeight: '20px', overflowY: 'hidden' }}
              >
                <pre className="select-none">{lineNumbers}</pre>
              </div>
              <Textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => {
                  handleCodeChange(e);
                  handleCursorChange(e);
                  syncScroll();
                }}
                onScroll={syncScroll}
                onSelect={handleCursorChange}
                className={`min-h-[500px] border-0 rounded-none font-mono text-sm leading-5 resize-none transition-all duration-200 flex-1 ${themeClasses.textareaBg} ${getLanguageColor(currentRoom.language)}`}
                placeholder="Start coding together..."
                style={{ lineHeight: '20px', paddingLeft: '12px' }}
              />
              {Object.values(cursors).map((cursor, index) => renderCursorWithViewportCheck(cursor, index))}
              <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800/80 text-gray-400' : 'bg-white/80 text-gray-600'
                }`}>
                💡 Changes sync automatically
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {executionOutput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 sm:mt-6"
        >
          <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${themeClasses.cardTitle}`}>
                <Play className={`w-5 h-5 ${themeClasses.cardIcon}`} />
                <span>Execution Output</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre
                className={`p-4 rounded-lg text-sm overflow-auto max-h-64 ${theme === 'dark'
                  ? 'bg-gray-900/50 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                {executionOutput}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}