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
    <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
      <span className="text-slate-400 font-medium px-2 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Role:
      </span>
      <button
        onClick={() => onRoleChange('FACULTY')}
        className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
          currentRole === 'FACULTY'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        Faculty
      </button>
      <button
        onClick={() => onRoleChange('ADMIN')}
        className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
          currentRole === 'ADMIN'
            ? 'bg-purple-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        Admin
      </button>
      <button
        onClick={() => onRoleChange('STUDENT')}
        className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
          currentRole === 'STUDENT'
            ? 'bg-rose-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-700'
        }`}
        title="Test RBAC security block"
      >
        <Lock className="w-3 h-3" /> Student
      </button>
    </div>
  );
};
