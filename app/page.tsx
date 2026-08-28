'use client';

import React, { useState } from 'react';
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { GraduationCap, Users, CalendarCheck, CreditCard, Building2, BarChart3, ShieldCheck } from 'lucide-react';

export default function StandalonePage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top ERP Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-white">GRADit! College ERP</h1>
            <p className="text-xs text-indigo-400 font-semibold">Standalone Chatbot Development & Testing Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Standalone Phase 0–26 Environment
          </span>
        </div>
      </header>

      {/* Main ERP Mock Dashboard */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-2">Standalone ERP Chatbot Suite</h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            This standalone application tests all natural language tools for Attendance, Fees, Student lookup, and PDF/XLSX/DOCX Report Generation independently prior to final ERP target integration.
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-950 text-indigo-400 rounded-lg border border-indigo-800/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Total Students</p>
              <h3 className="text-xl font-bold text-white">1,247</h3>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/40">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Avg Attendance</p>
              <h3 className="text-xl font-bold text-white">84.2%</h3>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-950 text-amber-400 rounded-lg border border-amber-800/40">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Pending Fees</p>
              <h3 className="text-xl font-bold text-white">₹2,55,000</h3>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-950 text-purple-400 rounded-lg border border-purple-800/40">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Departments</p>
              <h3 className="text-xl font-bold text-white">3 Active</h3>
            </div>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Chatbot Capabilities Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-indigo-300 block mb-1">Attendance Intelligence</span>
              <p className="text-slate-400">Query individual student percentage (23CS101), class summaries, department totals, or threshold filtering (&lt;75%).</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-purple-300 block mb-1">Fee & Payment Tracking</span>
              <p className="text-slate-400">Fetch paid amounts, pending fee balances, and identify unpaid fee lists across departments.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-1">Multi-Format Reporting</span>
              <p className="text-slate-400">Export verified database outputs instantly into formatted PDF, XLSX, or DOCX document downloads.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chatbot Overlay Components */}
      <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen((prev) => !prev)} />
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
