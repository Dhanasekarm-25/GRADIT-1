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
      className={`fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-[9990] w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border border-purple-300/30 group cursor-pointer ${
        isOpen ? 'hidden sm:flex' : 'flex'
      }`}
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
