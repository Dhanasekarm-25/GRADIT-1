'use client';

import React from 'react';
import { UserRole } from '@/lib/db/types';
import { ShieldCheck, UserCheck, Lock } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="flex items-center justify-between bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E2E8F0] text-xs">
      <span className="text-[#64748B] font-semibold px-2 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" /> Role:
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onRoleChange('FACULTY')}
          className={`px-3 py-1 rounded-lg transition-all font-semibold ${
            currentRole === 'FACULTY'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
          }`}
        >
          Faculty
        </button>
        <button
          onClick={() => onRoleChange('ADMIN')}
          className={`px-3 py-1 rounded-lg transition-all font-semibold ${
            currentRole === 'ADMIN'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
          }`}
        >
          Admin
        </button>
        <button
          onClick={() => onRoleChange('STUDENT')}
          className={`px-3 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
            currentRole === 'STUDENT'
              ? 'bg-[#EF4444] text-white shadow-xs'
              : 'text-[#94A3B8] hover:text-[#EF4444] hover:bg-white'
          }`}
          title="Test RBAC security block"
        >
          <Lock className="w-3 h-3" /> Student
        </button>
      </div>
    </div>
  );
};
