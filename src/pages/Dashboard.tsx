import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../api';
import { PageHeader, StatCard, Card, Loading, ProgressBar, StatusBadge } from '../components/ui';

// ─────────────────────────────────────────────────────────────
// 대시보드 v2 설계 원칙
//  1. 최상단 = "오늘 처리할 일" (액션 큐) — 전부 딥링크
//  2. 핵심 KPI 4개만 — 나머지 지표는 /analytics 로
//  3. 화면 전체 숫자 12개 내외 (v1: 70+)
// ─────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'gray' | 'violet' }> = {
  planning: { label: '기획', tone: 'gray' },
  developing: { label: '개발 중', tone: 'blue' },
  review_1: { label: '1차 검수', tone: 'amber' },
  review_2: { label: '2차 검수', tone: 'amber' },
  final_approval: { label: '최종 승인', tone: 'violet' },
  released: { label: '출시', tone: 'green' },
  on_hold: { label: '보류', tone: 'gray' },
};

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <Loading />;

  const maxRevenue = Math.max(
    ...data.revenueByMonth.map(m => m.content + m.experience + m.kit + m.subscription)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description="리얼월드 스튜디오 · 스쿨 · 어드민 통합 현황"
      />

      {/* ── 1. 오늘 처리할 일 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
          <AlertCircle size={15} className="text-amber-500" />
          처리가 필요한 항목
        </h2>
        {data.actionQueue.length === 0 ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} /> 모든 항목이 처리되었습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.actionQueue.map(item => (
              <Link
                key={item.key}
                to={item.link}
                className={clsx(
                  'group rounded-xl border p-3.5 transition-all hover:shadow-sm',
                  item.severity === 'danger'
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : item.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                )}
              >
                <p className={clsx(
                  'text-2xl font-bold',
                  item.severity === 'danger' ? 'text-red-600'
                  : item.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                )}>
                  {item.count}<span className="text-sm font-medium ml-0.5">건</span>
                </p>
                <p className="text-[13px] text-gray-700 mt-1 flex items-center justify-between">
                  {item.label}
                  <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. 핵심 KPI 4개 ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.kpis.map(kpi => (
          <StatCard key={kpi.key} label={kpi.label} value={kpi.value} sub={kpi.sub} to={kpi.link} />
        ))}
      </section>

      {/* ── 3. 매출 추이 + 개발 현황 ── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card
          title="월별 채널 매출 (단위: 만원)"
          className="lg:col-span-3"
          action={
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-primary-500" />콘텐츠</span>
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-primary-300" />체험</span>
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-gray-400" />교구</span>
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-gray-200" />구독</span>
            </div>
          }
        >
          <div className="flex items-end gap-3 h-44 pt-2">
            {data.revenueByMonth.map(m => {
              const total = m.content + m.experience + m.kit + m.subscription;
              const h = (total / maxRevenue) * 150;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] text-gray-500">{total.toLocaleString()}</span>
                  <div className="w-full max-w-[52px] flex flex-col-reverse rounded-md overflow-hidden" style={{ height: `${h}px` }}>
                    <div className="bg-primary-500" style={{ height: `${(m.content / total) * 100}%` }} />
                    <div className="bg-primary-300" style={{ height: `${(m.experience / total) * 100}%` }} />
                    <div className="bg-gray-400" style={{ height: `${(m.kit / total) * 100}%` }} />
                    <div className="bg-gray-200" style={{ height: `${(m.subscription / total) * 100}%` }} />
                  </div>
                  <p className="text-xs font-medium text-gray-600">{m.month}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="콘텐츠 개발 현황"
          className="lg:col-span-2"
          action={
            <Link to="/contents?tab=roadmap" className="text-xs text-primary-600 font-medium hover:text-primary-800 flex items-center gap-0.5">
              전체 보기 <ArrowRight size={12} />
            </Link>
          }
        >
          <div className="space-y-3.5">
            {data.roadmapTop.map(item => {
              const stage = STAGE_LABEL[item.stage];
              return (
                <Link key={item.id} to="/contents?tab=roadmap" className="block group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[13px] font-medium text-gray-800 truncate group-hover:text-primary-700">
                      {item.title}
                    </p>
                    <StatusBadge label={stage.label} tone={stage.tone} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={item.progress} className="flex-1" />
                    <span className="text-[11px] text-gray-400 w-8 text-right">{item.progress}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      {/* ── 4. 최근 활동 ── */}
      <Card title="최근 활동">
        <div className="divide-y divide-gray-50">
          {data.activity.map(act => {
            const inner = (
              <div className="flex items-start gap-3 py-2.5 group">
                <span className="text-base mt-0.5">{act.icon}</span>
                <p className="flex-1 text-[13px] text-gray-700 leading-relaxed group-hover:text-gray-900">
                  {act.message}
                </p>
                <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">{act.time}</span>
              </div>
            );
            return act.link
              ? <Link key={act.id} to={act.link} className="block hover:bg-gray-50/70 -mx-2 px-2 rounded-lg">{inner}</Link>
              : <div key={act.id}>{inner}</div>;
          })}
        </div>
      </Card>
    </div>
  );
}
