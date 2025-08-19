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
  renderCursor
}) {
  const lineNumbers = code.split('\n').map((_, i) => i + 1).join('\n');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`backdrop-blur-md border-2 ${themeClasses.cardBg}`}>
          <CardHeader>
            <CardTitle className={`flex  sm:flex-row items-start sm:items-center justify-between gap-2 ${themeClasses.cardTitle}`}>
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
              {Object.values(cursors).map((cursor, index) => renderCursor(cursor, index))}
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