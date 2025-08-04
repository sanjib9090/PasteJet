import React from 'react';
import { Badge } from './ui/badge';

const CodeBlock = ({ content, language, theme = 'dark' }) => {
  const getLanguageColor = (lang) => {
    const colors = {
      javascript: theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600',
      python: theme === 'dark' ? 'text-blue-300' : 'text-blue-600',
      java: theme === 'dark' ? 'text-orange-300' : 'text-orange-600',
      cpp: theme === 'dark' ? 'text-purple-300' : 'text-purple-600',
      html: theme === 'dark' ? 'text-red-300' : 'text-red-600',
      css: theme === 'dark' ? 'text-green-300' : 'text-green-600',
      json: theme === 'dark' ? 'text-blue-300' : 'text-blue-600',
      xml: theme === 'dark' ? 'text-red-300' : 'text-red-600',
      sql: theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600',
      bash: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
      php: theme === 'dark' ? 'text-purple-300' : 'text-purple-600',
      ruby: theme === 'dark' ? 'text-red-300' : 'text-red-600',
      go: theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600',
      rust: theme === 'dark' ? 'text-orange-300' : 'text-orange-600',
      typescript: theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
    };
    return colors[lang] || (theme === 'dark' ? 'text-gray-300' : 'text-gray-600');
  };

  const getBgClasses = () => {
    switch (theme) {
      case 'green':
        return 'bg-gray-50 border border-emerald-200';
      case 'orange':
        return 'bg-gray-50 border border-orange-200';
      default:
        return 'bg-gray-900 border border-gray-700';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          {language || 'text'}
        </Badge>
      </div>
      <pre className={`overflow-x-auto p-4 rounded-lg ${getBgClasses()} ${getLanguageColor(language)}`}>
        <code className="text-sm font-mono whitespace-pre-wrap break-words">
          {content}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;