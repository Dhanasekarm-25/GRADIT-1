'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { MessageItem, ChatMessage } from './MessageItem';
import { UserRole } from '@/lib/db/types';
import { ReportData } from '@/lib/reports/pdf';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [role, setRole] = useState<UserRole>('FACULTY');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      content: 'Hello! How can I help you today?\nSelect a quick suggestion below or ask any attendance/fee query.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastReportData, setLastReportData] = useState<ReportData | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          role,
          userId: 'usr-1',
          lastReportData,
        }),
      });

      const data = await res.json();

      if (data.type === 'ERROR') {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: 'assistant',
            content: data.content,
            isError: true,
          },
        ]);
      } else {
        if (data.reportMetadata) {
          setLastReportData(data.reportMetadata);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: 'assistant',
            content: data.content,
            tableData: data.tableData,
            matches: data.matches,
            reportMetadata: data.reportMetadata,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          content: 'Failed to connect to GRADit! AI server. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (format: 'pdf' | 'xlsx' | 'docx', reportMetadata: ReportData) => {
    try {
      const res = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          reportData: reportMetadata,
          role,
        }),
      });

      if (!res.ok) {
        alert('Unable to generate the requested report right now.');
        return;
      }

      const mimeType =
        format === 'pdf'
          ? 'application/pdf'
          : format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // Extract filename from Content-Disposition header if present
      let filename = `GRADit_Report_${Date.now()}.${format}`;
      const disposition = res.headers.get('content-disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      // Open PDF in a new tab for instant browser viewing/opening
      if (format === 'pdf') {
        window.open(url, '_blank');
      }

      // Save file with exact sanitized filename
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      alert('Unable to generate the requested report right now.');
    }
  };

  return (
    <div
      className="fixed bottom-[90px] right-[24px] w-[390px] h-[600px] bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden z-[9999] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      {/* Header */}
      <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">GRADit! AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-400 font-medium">ERP Connected</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector */}
        <RoleSelector currentRole={role} onRoleChange={(r) => setRole(r)} />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto chat-scroll bg-slate-900/50">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onSelectClarification={(q) => handleSendMessage(q)}
            onDownloadReport={handleDownloadReport}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 rounded-xl mb-4 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Assistant is checking ERP data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => handleSendMessage('Show attendance of 23CS101')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded-lg whitespace-nowrap transition-all"
        >
          [ Attendance 23CS101 ]
        </button>
        <button
          onClick={() => handleSendMessage('Which CSE students are below 75%')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded-lg whitespace-nowrap transition-all"
        >
          [ Low Attendance ]
        </button>
        <button
          onClick={() => handleSendMessage('Who has pending fees?')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded-lg whitespace-nowrap transition-all"
        >
          [ Pending Fees ]
        </button>
      </div>

      {/* Input Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask attendance, fees, student search..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
