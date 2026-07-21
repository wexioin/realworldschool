import React from 'react';
import { clsx } from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Search, Plus } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 공용 UI. 원칙:
//  - 그라데이션 없음, 흰 카드 + 회색 보더 + 프라이머리 포인트만
//  - 숫자가 있는 카드는 전부 클릭 가능 (to prop)
//  - 증감률 등 비교 지표는 실데이터가 생기기 전까지 표시하지 않음
// ─────────────────────────────────────────────────────────────

export function PageHeader({ title, description, right }: {
  title: string; description?: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {right}
    </div>
  );
}

// ── KPI 카드: 클릭 시 딥링크 이동 ──
export function StatCard({ label, value, sub, to, tone = 'default' }: {
  label: string; value: string | number; sub?: string; to?: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const inner = (
    <>
      <p className="text-[13px] text-gray-500">{label}</p>
      <p className={clsx(
        'text-2xl font-bold mt-1',
        tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-gray-900'
      )}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {to && (
        <ChevronRight size={15} className="absolute top-4 right-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </>
  );
  const cls = 'relative block bg-white border border-gray-200 rounded-xl p-4 group';
  if (to) {
    return (
      <Link to={to} className={clsx(cls, 'hover:border-primary-300 hover:shadow-sm transition-all')}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

// ── 필터 칩: 리스트 상단에서 URL 쿼리와 연동 ──
export function FilterChips<T extends string>({ param, options, counts }: {
  param: string;
  options: { value: T | 'all'; label: string }[];
  counts?: Partial<Record<T | 'all', number>>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = (searchParams.get(param) ?? 'all') as T | 'all';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map(opt => {
        const active = current === opt.value;
        const count = counts?.[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              if (opt.value === 'all') next.delete(param);
              else next.set(param, opt.value);
              setSearchParams(next, { replace: true });
            }}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
              active
                ? 'bg-primary-100 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            {opt.label}
            {count !== undefined && (
              <span className={clsx('ml-1.5 text-xs', active ? 'text-primary-500' : 'text-gray-400')}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 상태 배지: 흰 배경 라벨 + 상태를 나타내는 컬러 점 ──
export function StatusBadge({ label, tone }: {
  label: string;
  tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet';
}) {
  const dots = {
    green:  'bg-emerald-500',
    blue:   'bg-blue-500',
    amber:  'bg-amber-500',
    red:    'bg-red-500',
    gray:   'bg-gray-400',
    violet: 'bg-violet-500',
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 whitespace-nowrap">
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[tone])} />
      {label}
    </span>
  );
}

// ── 카드 컨테이너 ──
export function Card({ title, action, children, className }: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={clsx('bg-white border border-gray-200 rounded-xl', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5 pt-3">{children}</div>
    </div>
  );
}

// ── 테이블 ──
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {headers.map(h => (
              <th key={h} className="text-left font-medium text-gray-500 text-xs px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, message = '조건에 맞는 항목이 없습니다.' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-400">{message}</td>
    </tr>
  );
}

// ── 진행률 바 ──
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('w-full bg-gray-100 rounded-full h-1.5', className)}>
      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

// ── 검색 입력 ──
export function SearchInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={clsx('relative', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '검색'}
        className="pl-8 pr-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg w-56 focus:outline-none focus:border-primary-400"
      />
    </div>
  );
}

// ── 추가 버튼 ──
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 transition-colors"
    >
      <Plus size={14} /> {label}
    </button>
  );
}

// ── 월 선택 (데이터에 존재하는 월 목록에서 선택) ──
export function MonthSelect({ value, onChange, months, allLabel = '전체 기간' }: {
  value: string; onChange: (v: string) => void; months: string[]; allLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
    >
      <option value="all">{allLabel}</option>
      {months.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

// ── 로딩 ──
export function Loading() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
