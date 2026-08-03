import React from 'react';
import { LogOut } from 'lucide-react';
import { useSession, ROLE_LABEL } from '../session';

// ─────────────────────────────────────────────────────────────
// 사이드바 하단 프로필 · 로그아웃.
// 역할 전환은 로그인 화면의 데모 계정 목록으로 옮겼습니다.
// 실제 사용에서는 각자 로그인하고, 여기서는 로그아웃만 합니다.
// ─────────────────────────────────────────────────────────────

export function RoleSwitcher() {
  const { user, signOut } = useSession();

  return (
    <div className="space-y-2">
      <div className="px-1">
        <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
        <p className="text-[11px] text-gray-400 truncate">
          {ROLE_LABEL[user.role]}
          {user.affiliation ? ` · ${user.affiliation}` : ''}
        </p>
      </div>
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <LogOut size={12} /> 로그아웃
      </button>
    </div>
  );
}
