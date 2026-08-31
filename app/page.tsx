'use client';

import React, { useState } from 'react';
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatPanel } from '@/components/chat/ChatPanel';
import {
  GraduationCap,
  Users,
  CreditCard,
  Building2,
  BarChart3,
  Search,
  LayoutDashboard,
  FolderKanban,
  Network,
  Contact,
  Send,
  CalendarCheck,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  LogOut,
  Sparkles,
  UserCheck,
  UserX,
  FileCheck2,
  Tag,
  Stethoscope,
  Building,
} from 'lucide-react';

export default function GraditERPPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, hasSubmenu: false },
    { name: 'Manage Master', icon: FolderKanban, hasSubmenu: true },
    { name: 'Allocations', icon: Network, hasSubmenu: true },
    { name: 'ID Card Detail Generator', icon: Contact, hasSubmenu: true },
    { name: 'Communication', icon: Send, hasSubmenu: true },
    { name: 'Attendance', icon: CalendarCheck, hasSubmenu: true },
    { name: 'Staff - Geo Metric', icon: MapPin, hasSubmenu: false },
  ];

  const courseDistribution = [
    { name: 'Architecture', count: 11, color: '#2563EB' },
    { name: 'B.Com Accounts', count: 13, color: '#16A34A' },
    { name: 'B.Com Finance', count: 9, color: '#F59E0B' },
    { name: 'B.E. CSE', count: 18, color: '#EF4444' },
    { name: 'B.E. IT', count: 5, color: '#7C3AED' },
    { name: 'Production Man...', count: 9, color: '#06B6D4' },
    { name: 'MBA. HR', count: 8, color: '#F97316' },
    { name: 'MBA HR EVS', count: 7, color: '#14B8A6' },
  ];

  const maxCount = Math.max(...courseDistribution.map((c) => c.count));

  return (
    <div className="flex h-screen bg-[#F0F4F9] text-[#1E293B] font-sans overflow-hidden">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col p-4 shrink-0 shadow-xs justify-between z-10">
        <div className="flex flex-col">
          {/* Savyasasy Logo Header */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              S
            </div>
            <span className="font-extrabold text-sm tracking-wider text-[#1E293B]">SAVYASASY</span>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-[#E9EFF6] rounded-2xl p-3.5 shadow-2xs flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-emerald-600 font-bold text-sm">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#1E293B] leading-tight">tech</span>
              <span className="text-xs text-[#64748B] font-medium">College Admin</span>
            </div>
          </div>

          {/* Search Menu Input */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
            />
          </div>

          {/* Navigation Menu */}
          <nav className="mt-5 flex flex-col gap-1.5">
            {menuItems
              .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-sm shadow-purple-500/20'
                        : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-4 border-t border-[#F1F5F9] px-2 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>GRADit! ERP v2.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-2xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black tracking-tight text-[#1E293B]">GRADit!</span>
              <span className="text-xs font-semibold text-[#64748B]">Technical Team College</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="border border-[#BFDBFE] bg-white text-[#2563EB] font-semibold text-xs rounded-full px-4 py-1.5 shadow-2xs">
              Current Sem : Odd
            </div>
            <button className="border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#EF4444] font-semibold text-xs rounded-full px-4 py-1.5 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top 5 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Total Staff */}
            <div className="bg-[#FDF2F4] border border-[#FCE7F3] rounded-[22px] p-4 flex items-center justify-between shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F43F5E] flex items-center justify-center text-white shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#1E293B]">35</h4>
                  <p className="text-[11px] font-semibold text-[#F43F5E]">Total Staff</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-rose-200/30 absolute -right-4 -bottom-4 pointer-events-none" />
            </div>

            {/* 2. Total Students */}
            <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-[22px] p-4 flex items-center justify-between shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#1E293B]">200</h4>
                  <p className="text-[11px] font-semibold text-[#6366F1]">Total Students</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-indigo-200/30 absolute -right-4 -bottom-4 pointer-events-none" />
            </div>

            {/* 3. Total Boys */}
            <div className="bg-[#FEF9EE] border border-[#FEF3C7] rounded-[22px] p-4 flex items-center justify-between shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#1E293B]">100</h4>
                  <p className="text-[11px] font-semibold text-[#F59E0B]">Total Boys</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-200/30 absolute -right-4 -bottom-4 pointer-events-none" />
            </div>

            {/* 4. Total Girls */}
            <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-[22px] p-4 flex items-center justify-between shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981] flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#1E293B]">100</h4>
                  <p className="text-[11px] font-semibold text-[#10B981]">Total Girls</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-emerald-200/30 absolute -right-4 -bottom-4 pointer-events-none" />
            </div>

            {/* 5. Pending / Not Specified */}
            <div className="bg-[#FFF1F2] border border-[#FFE4E6] rounded-[22px] p-4 flex items-center justify-between shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#EF4444] flex items-center justify-center text-white shadow-xs">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#1E293B]">28</h4>
                  <p className="text-[11px] font-semibold text-[#EF4444]">Not Specified</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-rose-200/30 absolute -right-4 -bottom-4 pointer-events-none" />
            </div>
          </div>

          {/* Two-Column Grid: Courses Overview Chart & Featured Partners Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Courses Overview Card */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">Courses Overview</h3>
                    <p className="text-xs text-[#64748B]">Student distribution across courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-xs font-bold border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span> Live
                </div>
              </div>

              {/* Chart Visual Representation */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4 pt-6 border-t border-[#F1F5F9]">
                <div className="md:col-span-3 flex items-end justify-between h-56 gap-2 px-4 pb-2 border-b border-[#E2E8F0]">
                  {courseDistribution.map((course) => {
                    const heightPercent = Math.round((course.count / maxCount) * 100);
                    return (
                      <div key={course.name} className="flex flex-col items-center flex-1 group">
                        <span className="text-[10px] font-bold text-[#64748B] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {course.count}
                        </span>
                        <div
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: course.color,
                          }}
                          className="w-full max-w-[28px] rounded-t-md transition-all group-hover:brightness-110 shadow-xs"
                          title={`${course.name}: ${course.count} students`}
                        />
                        <span className="text-[9px] text-[#64748B] font-medium mt-2 truncate w-14 text-center">
                          {course.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Legend */}
                <div className="flex flex-col gap-1.5 text-xs text-[#475569] pl-2 border-l border-[#F1F5F9]">
                  <span className="text-xs font-bold text-[#1E293B] mb-1">Course</span>
                  {courseDistribution.slice(0, 6).map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Featured Partners / Insurance Card */}
            <div className="bg-white rounded-[24px] border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">Featured Partners</h3>
                    <p className="text-xs text-[#64748B]">Exclusive institutional benefits</p>
                  </div>
                </div>
                <span className="bg-[#EDE9FE] text-[#7C3AED] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
                  New
                </span>
              </div>

              {/* Inner Insurance Card */}
              <div className="bg-[#F8FAFC] border border-[#E9EFF6] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#DBEAFE]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1E293B]">Student / Staff Insurance</h4>
                    <p className="text-[11px] text-[#64748B] leading-tight">Comprehensive coverage & safety</p>
                  </div>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  Institutional safety benefits covering accident, health, and academic continuity for enrolled students and active faculty.
                </p>

                {/* 4 Feature Benefit Pills */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5 text-[#7C3AED]" /> Free Staff Cover
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    <Tag className="w-3.5 h-3.5 text-[#7C3AED]" /> Exclusive Pricing
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    <Stethoscope className="w-3.5 h-3.5 text-[#7C3AED]" /> Medical Benefits
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    <Building className="w-3.5 h-3.5 text-[#7C3AED]" /> Royal Sundaram
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. STICKY AI CHATBOT OVERLAY */}
      <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen((prev) => !prev)} />
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
