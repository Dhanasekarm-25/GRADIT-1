'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Maximize2, Minimize2, Minus } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { MessageItem, ChatMessage } from './MessageItem';
import { UserRole } from '@/lib/db/types';
import { ReportData } from '@/lib/reports/pdf';
import { PendingQuery } from '@/lib/validation/deterministicFormatter';

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
  const [pendingQuery, setPendingQuery] = useState<PendingQuery | undefined>(undefined);
  const [isMaximized, setIsMaximized] = useState(false);

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
          pendingQuery,
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
        setPendingQuery(undefined);
      } else {
        if (data.reportMetadata) {
          setLastReportData(data.reportMetadata);
        }

        if (data.pendingQuery) {
          setPendingQuery(data.pendingQuery);
        } else {
          setPendingQuery(undefined);
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
      setPendingQuery(undefined);
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
      className={`fixed transition-all duration-300 z-[9999] bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 ${
        isMaximized
          ? 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[calc(100vw-48px)] sm:max-w-5xl sm:h-[calc(100vh-48px)] sm:max-h-[880px] rounded-none sm:rounded-[24px] sm:shadow-2xl sm:border sm:border-[#E2E8F0]'
          : 'inset-0 sm:inset-auto sm:bottom-[90px] sm:right-[24px] w-full sm:w-[420px] h-full sm:h-[640px] sm:max-w-[calc(100vw-32px)] sm:max-h-[calc(100vh-120px)] rounded-none sm:rounded-[24px] sm:shadow-2xl sm:border sm:border-[#E2E8F0]'
      }`}
    >
      {/* Header */}
      <div className="bg-white px-3.5 sm:px-4 py-3 sm:py-4 border-b border-[#F1F5F9] flex flex-col gap-2.5 sm:gap-3 shrink-0 pt-[max(env(safe-area-inset-top),12px)] sm:pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shadow-2xs shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#1E293B] tracking-tight">GRADit! AI Assistant</h3>
              <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-none mt-0.5">AI-powered ERP Assistant</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] text-[#64748B] font-semibold">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={onClose}
              className="hidden sm:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-all cursor-pointer"
              title="Minimize chat"
              aria-label="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              className="hidden sm:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-all cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize window'}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all cursor-pointer"
              title="Close chat"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <RoleSelector currentRole={role} onRoleChange={(r) => setRole(r)} />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto chat-scroll bg-[#F8FAFC]/50">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onSelectClarification={(q) => handleSendMessage(q)}
            onDownloadReport={handleDownloadReport}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl mb-4 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
            <span className="font-semibold">Assistant is checking ERP data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (shown on start) */}
      {messages.length <= 1 && (
        <div className="px-3 sm:px-3.5 py-2 bg-white/90 backdrop-blur-xs border-t border-[#F1F5F9] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shrink-0">
          <button
            onClick={() => handleSendMessage('Show attendance of 23CS101')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] rounded-full whitespace-nowrap transition-all font-semibold shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            Attendance 23CS101
          </button>
          <button
            onClick={() => handleSendMessage('100% attendance list')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] rounded-full whitespace-nowrap transition-all font-semibold shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            100% Attendance
          </button>
          <button
            onClick={() => handleSendMessage('Which CSE students are below 75%')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] rounded-full whitespace-nowrap transition-all font-semibold shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            Low Attendance
          </button>
          <button
            onClick={() => handleSendMessage('overall fee paid list')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] rounded-full whitespace-nowrap transition-all font-semibold shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            Fee Paid List
          </button>
          <button
            onClick={() => handleSendMessage('Who has pending fees?')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] rounded-full whitespace-nowrap transition-all font-semibold shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            Pending Fees
          </button>
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3 sm:p-3.5 bg-white border-t border-[#F1F5F9] shrink-0 pb-[max(env(safe-area-inset-bottom),12px)] sm:pb-3.5">
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
            placeholder="Ask about attendance, fees, students..."
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#7C3AED] focus:bg-white rounded-full px-4 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-purple-500/25 shrink-0 cursor-pointer"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
