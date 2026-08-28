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
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
            : message.isError
            ? 'bg-rose-600 text-white'
            : 'bg-gradient-to-tr from-slate-900 to-slate-800 text-indigo-400 border border-slate-700'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : message.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-none'
          : message.isError
          ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
      }`}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

        {/* Tabular Data View */}
        {message.tableData && message.tableData.rows.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  {message.tableData.columns.map((col, idx) => (
                    <th key={idx} className="px-3 py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {message.tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-100/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 font-medium text-slate-800">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ambiguity Resolution Matches */}
        {message.matches && message.matches.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {message.matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectClarification && onSelectClarification(`Show attendance of ${m.code}`)}
                className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2 rounded-lg font-medium transition-all flex justify-between items-center"
              >
                <span>{m.name} ({m.code})</span>
                <span className="text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200 font-semibold">{m.class}</span>
              </button>
            ))}
          </div>
        )}

        {/* Report Download Toolbar */}
        {message.reportMetadata && onDownloadReport && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" /> Download Report:
            </span>
            <button
              onClick={() => onDownloadReport('pdf', message.reportMetadata!)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-md transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={() => onDownloadReport('xlsx', message.reportMetadata!)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Excel
            </button>
            <button
              onClick={() => onDownloadReport('docx', message.reportMetadata!)}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Word
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
