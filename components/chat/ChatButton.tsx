'use client';

import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 9999,
        width: '56px',
        height: '56px',
      }}
      className="rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border border-purple-300/30 group"
      aria-label="Toggle GRADit! ERP AI Chatbot"
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-200 text-white" />
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
        </span>
      </div>
    </button>
  );
};
