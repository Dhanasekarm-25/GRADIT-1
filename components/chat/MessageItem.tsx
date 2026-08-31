'use client';

import React from 'react';
import { Bot, User, FileText, Download, AlertTriangle } from 'lucide-react';
import { ReportData } from '@/lib/reports/types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  tableData?: {
    columns: string[];
    rows: (string | number)[][];
  };
  matches?: { id: string; code: string; name: string; class: string; dept: string }[];
  reportMetadata?: ReportData;
  isError?: boolean;
}

interface MessageItemProps {
  message: ChatMessage;
  onSelectClarification?: (selectedQuery: string) => void;
  onDownloadReport?: (format: 'pdf' | 'xlsx' | 'docx', reportMetadata: ReportData) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectClarification,
  onDownloadReport,
}) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
          isUser
            ? 'bg-[#7C3AED] text-white'
            : message.isError
            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
            : 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : message.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs transition-all ${
          isUser
            ? 'bg-[#7C3AED] text-white rounded-tr-xs shadow-purple-500/10'
            : message.isError
            ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-tl-xs'
            : 'bg-white border border-[#E9EFF6] text-[#1E293B] rounded-tl-xs shadow-slate-100'
        }`}
      >
        <p className="whitespace-pre-wrap font-normal leading-relaxed">{message.content}</p>

        {/* Tabular ERP Data View */}
        {message.tableData && message.tableData.rows.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F1F5F9] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  {message.tableData.columns.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 text-[11px] uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {message.tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F8FAFC] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 font-medium text-[#1E293B] whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ambiguity Resolution Matches */}
        {message.matches && message.matches.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {message.matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectClarification && onSelectClarification(m.code)}
                className="text-left text-xs bg-white hover:bg-[#F5F3FF] text-[#1E293B] border border-[#E2E8F0] hover:border-[#DDD6FE] p-3 rounded-xl font-medium transition-all flex justify-between items-center group shadow-xs hover:shadow-sm cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[#1E293B] group-hover:text-[#7C3AED] transition-colors">{m.name}</span>
                  <span className="text-[11px] text-[#64748B] font-mono mt-0.5">{m.code}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7C3AED] bg-[#F5F3FF] px-2.5 py-1 rounded-md border border-[#DDD6FE] font-bold text-[11px]">{m.class}</span>
                  {m.dept && (
                    <span className="text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E2E8F0] text-[11px] font-semibold">{m.dept}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Report Download Toolbar */}
        {message.reportMetadata && onDownloadReport && (
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#64748B] font-bold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#7C3AED]" /> Download Report:
            </span>
            <button
              onClick={() => onDownloadReport('pdf', message.reportMetadata!)}
              className="px-3 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-xs font-semibold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={() => onDownloadReport('xlsx', message.reportMetadata!)}
              className="px-3 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] text-xs font-semibold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3 h-3" /> Excel
            </button>
            <button
              onClick={() => onDownloadReport('docx', message.reportMetadata!)}
              className="px-3 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3 h-3" /> Word
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
