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
        width: '60px',
        height: '60px',
      }}
      className="rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-indigo-400/30 group"
      aria-label="Toggle GRADit! ERP AI Chatbot"
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
      </div>
    </button>
  );
};
