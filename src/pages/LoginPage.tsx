import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { GraduationCap, Eye, EyeOff, AlertCircle, LogIn, ChevronDown } from 'lucide-react';
import { useLogin, useAccounts, DEMO_PASSWORD } from '../api';
import type { UserAccount, UserRole, LoginFailure } from '../api/types';
import { LoginError, ADMIN_EMAIL_DOMAIN } from '../api/types';
import { useSessionMaybe, ROLE_LABEL, ROLE_HOME } from '../session';

// ─────────────────────────────────────────────────────────────
// 로그인 화면.
// 아직 실제 계정 체계가 없어서, 하단에 데모 계정 목록을 접어두고
// 클릭 한 번으로 각 역할에 들어가 볼 수 있게 해두었습니다.
// 실연동 시 <DemoAccounts /> 블록만 지우면 됩니다.
// ─────────────────────────────────────────────────────────────

const FAILURE_MESSAGE: Record<LoginFailure, string> = {
  not_found: '등록되지 않은 이메일입니다.',
  wrong_password: '비밀번호가 일치하지 않습니다.',
  inactive: '비활성화된 계정입니다. 운영팀에 문의해 주세요.',
};

export default function LoginPage() {
  const { signIn } = useSessionMaybe();
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = (nextEmail = email, nextPassword = password) => {
    setError('');
    if (!nextEmail.trim() || !nextPassword) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    login.mutate({ email: nextEmail, password: nextPassword }, {
      onSuccess: (account) => {
        signIn(account);
        navigate(ROLE_HOME[account.role], { replace: true });
      },
      onError: (err) => {
        const reason = err instanceof LoginError
          ? err.reason
          : (err as { reason?: LoginFailure })?.reason;
        setError(reason && reason in FAILURE_MESSAGE
          ? FAILURE_MESSAGE[reason]
          : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      },
    });
  };

  const useDemoAccount = (account: UserAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    submit(account.email, DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-3">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">리얼월드 스쿨</h1>
          <p className="text-xs text-gray-400 mt-0.5">통합 관리 시스템</p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); submit(); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={`name@${ADMIN_EMAIL_DOMAIN}`}
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="mt-px flex-shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            <LogIn size={15} /> {login.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          계정이 없나요?{' '}
          <Link to="/signup" className="text-primary-600 font-medium hover:underline">회원가입</Link>
        </p>

        <DemoAccounts onPick={useDemoAccount} disabled={login.isPending} />
      </div>
    </div>
  );
}

const ROLE_ORDER: UserRole[] = ['admin', 'reviewer', 'creator'];

function DemoAccounts({ onPick, disabled }: { onPick: (a: UserAccount) => void; disabled?: boolean }) {
  const { data: accounts } = useAccounts();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('admin');

  const byRole = useMemo(
    () => (accounts ?? []).filter(a => a.role === role),
    [accounts, role],
  );

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        데모 계정으로 둘러보기
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-[11px] text-gray-400">
            아직 실제 계정 체계가 없어 임시로 열어둔 목록입니다. 비밀번호는 모두 <code className="font-mono text-gray-500">{DEMO_PASSWORD}</code> 입니다.
          </p>

          <div className="flex items-center gap-1">
            {ROLE_ORDER.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={clsx(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  role === r
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                )}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {byRole.map(a => (
              <button
                key={a.id}
                onClick={() => onPick(a)}
                disabled={disabled || a.status !== 'active'}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-100 transition-colors"
              >
                <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                  {a.name}
                  {a.status !== 'active' && (
                    <span className="text-[10px] font-normal text-gray-400">비활성</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {a.affiliation ? `${a.affiliation} · ` : ''}{a.email}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
