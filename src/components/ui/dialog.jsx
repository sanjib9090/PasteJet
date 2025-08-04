
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Dialog({ children, open, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black"
            onClick={handleClose}
          />
          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10"
          >
            {React.Children.map(children, child =>
              React.cloneElement(child, { onClose: handleClose })
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogContent({ children, className, onClose }) {
  return (
    <div
      className={`rounded-lg p-6 max-w-lg w-full ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { onClose })
      )}
    </div>
  );
}

export function DialogHeader({ children, className }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}

export function DialogTrigger({ asChild, children }) {
  if (asChild) {
    return React.Children.only(children);
  }
  return <div>{children}</div>;
}
