import React, { createContext, useContext, useMemo, useState } from 'react';
import type { UserAccount, UserRole } from './api/types';

// ─────────────────────────────────────────────────────────────
// 로그인 세션.
// 자격 증명 검증은 api.login()이 하고, 이 파일은 "누가 로그인해 있는가"만
// 들고 있습니다. 실서버로 옮길 때 세션 저장 방식(localStorage → 쿠키/토큰)만
// 여기서 바꾸면 화면 코드는 그대로 씁니다.
// ─────────────────────────────────────────────────────────────

export interface SessionUser {
  role: UserRole;
  name: string;
  email: string;
  affiliation?: string;
}

/** 계정 레코드에서 화면이 쓰는 최소 정보만 추립니다 (비밀번호는 세션에 남기지 않음). */
export const toSessionUser = (a: UserAccount): SessionUser => ({
  role: a.role,
  name: a.name,
  email: a.email,
  affiliation: a.affiliation,
});

interface SessionValue {
  user: SessionUser | null;
  signIn: (account: UserAccount) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const STORAGE_KEY = 'erp-session';

// 단일 HTML(파일 공유용) 빌드는 받는 사람이 계정이 없으므로 로그인 없이 열립니다.
const SINGLEFILE = import.meta.env.VITE_SINGLEFILE === '1';
const SHARED_VIEWER: SessionUser = {
  role: 'admin',
  name: '관리자',
  email: 'admin@realworld-school.org',
  affiliation: '리얼월드 스쿨 운영팀',
};

function readStored(): SessionUser | null {
  if (SINGLEFILE) return SHARED_VIEWER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SessionUser;
  } catch {
    // 저장값이 깨졌으면 로그아웃 상태로 시작합니다.
  }
  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStored);

  const value = useMemo<SessionValue>(() => ({
    user,
    signIn: (account) => {
      const next = toSessionUser(account);
      setUser(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* 저장 실패는 무시 */ }
    },
    signOut: () => {
      setUser(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* 무시 */ }
    },
  }), [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** 로그인 이후 화면 전용 — 로그인 게이트를 통과한 곳에서만 호출합니다. */
export function useSession(): SessionValue & { user: SessionUser } {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  if (!ctx.user) throw new Error('useSession requires an authenticated user');
  return ctx as SessionValue & { user: SessionUser };
}

/** 로그인 게이트 자신처럼 비로그인 상태를 다뤄야 하는 곳에서 사용합니다. */
export function useSessionMaybe(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionMaybe must be used within SessionProvider');
  return ctx;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: '관리자',
  reviewer: '검수자',
  creator: '크리에이터',
};

/** 역할별 로그인 후 진입 경로 */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/',
  reviewer: '/review/assignments',
  creator: '/my/contents',
};
