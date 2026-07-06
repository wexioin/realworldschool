import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, BookOpen, UserSquare2, Users, ShoppingCart,
  DollarSign, FlaskConical, BarChart3, Settings, GraduationCap, Handshake,
  ClipboardCheck, Palette, Lightbulb,
} from 'lucide-react';
import { useBadgeCounts } from '../api';

// ─────────────────────────────────────────────────────────────
// v2 정보 구조: 31개 라우트 → 9개 메뉴.
// 배지는 하드코딩이 아니라 API(useBadgeCounts)에서 파생됩니다.
// ─────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/contents': '콘텐츠',
  '/content-assets': '콘텐츠 자산',
  '/brand-assets': '브랜드 자산',
  '/knowledge-assets': '지식 자산',
  '/creators': '크리에이터',
  '/partners': '파트너/거래처',
  '/members': '회원',
  '/sales': '판매',
  '/settlements': '정산',
  '/experience': '체험 운영',
  '/analytics': '분석',
  '/settings': '설정',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: badges } = useBadgeCounts();
  const location = useLocation();

  const nav: { group?: string; items: { to: string; icon: React.ElementType; label: string; badge?: number }[] }[] = [
    {
      items: [{ to: '/', icon: LayoutDashboard, label: '대시보드' }],
    },
    {
      group: '서비스',
      items: [
        { to: '/contents', icon: BookOpen, label: '콘텐츠' },
        { to: '/creators', icon: UserSquare2, label: '크리에이터' },
        { to: '/members', icon: Users, label: '회원' },
        { to: '/partners', icon: Handshake, label: '파트너/거래처' },
      ],
    },
    {
      group: '거래',
      items: [
        { to: '/sales', icon: ShoppingCart, label: '판매' },
        { to: '/settlements', icon: DollarSign, label: '정산', badge: badges?.settlementsPending },
        { to: '/experience', icon: FlaskConical, label: '체험 운영', badge: badges?.bookingsPending },
      ],
    },
    {
      group: '브랜드 & 자산',
      items: [
        { to: '/content-assets', icon: ClipboardCheck, label: '콘텐츠 자산', badge: badges?.contentsReview },
        { to: '/brand-assets', icon: Palette, label: '브랜드 자산' },
        { to: '/knowledge-assets', icon: Lightbulb, label: '지식 자산' },
      ],
    },
    {
      group: '시스템',
      items: [
        { to: '/analytics', icon: BarChart3, label: '분석' },
        { to: '/settings', icon: Settings, label: '설정' },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── 사이드바 ── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">리얼월드 스쿨</p>
            <p className="text-[11px] text-gray-400 leading-tight">통합 관리자</p>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.group && (
                <p className="px-4 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {group.group}
                </p>
              )}
              {group.items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">v2.0 · mock 데이터</p>
        </div>
      </aside>

      {/* ── 메인 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-13 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">
            {PAGE_TITLES[location.pathname] ?? '리얼월드 스쿨 ERP'}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">plusu0617@gmail.com</span>
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
              관
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
