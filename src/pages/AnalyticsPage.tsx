import React from 'react';
import { useDashboard } from '../api';
import { PageHeader, StatCard, Card, Loading } from '../components/ui';

// ─────────────────────────────────────────────────────────────
// 분석 페이지: 심화 지표(MRR/ARR/LTV 등)는 대시보드가 아니라 여기로.
// 실데이터 연동 전에는 지표를 "—" 로 표시합니다 (가짜 숫자 노출 금지).
// ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <Loading />;

  const maxRevenue = Math.max(
    ...data.revenueByMonth.map(m => m.content + m.experience + m.kit + m.subscription)
  );

  const saasMetrics = [
    { label: 'MRR (월 반복 매출)', hint: '구독 매출 기준' },
    { label: 'ARR (연 반복 매출)', hint: 'MRR × 12' },
    { label: '이탈률 (Churn)', hint: '월간 구독 해지율' },
    { label: 'LTV (고객 생애 가치)', hint: '평균 단가 ÷ 이탈률' },
    { label: 'NPS (순추천지수)', hint: '설문 기반' },
    { label: '구독 전환율', hint: '무료 → 유료' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="분석"
        description="구독·성장 지표 심화 분석 — 실데이터 연동(Phase 3) 후 활성화됩니다"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {saasMetrics.map(m => (
          <StatCard key={m.label} label={m.label} value="—" sub={m.hint} />
        ))}
      </div>

      <Card title="월별 채널 매출 상세 (단위: 만원)">
        <div className="flex items-end gap-3 h-52 pt-2">
          {data.revenueByMonth.map(m => {
            const total = m.content + m.experience + m.kit + m.subscription;
            const h = (total / maxRevenue) * 180;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-gray-500">{total.toLocaleString()}</span>
                <div className="w-full max-w-[64px] flex flex-col-reverse rounded-md overflow-hidden" style={{ height: `${h}px` }}>
                  <div className="bg-primary-500" style={{ height: `${(m.content / total) * 100}%` }} title={`콘텐츠 ${m.content}`} />
                  <div className="bg-primary-300" style={{ height: `${(m.experience / total) * 100}%` }} title={`체험 ${m.experience}`} />
                  <div className="bg-gray-400" style={{ height: `${(m.kit / total) * 100}%` }} title={`교구 ${m.kit}`} />
                  <div className="bg-gray-200" style={{ height: `${(m.subscription / total) * 100}%` }} title={`구독 ${m.subscription}`} />
                </div>
                <p className="text-xs font-medium text-gray-600">{m.month}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-primary-500" />콘텐츠</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-primary-300" />체험</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-gray-400" />교구</span>
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-gray-200" />구독</span>
        </div>
      </Card>
    </div>
  );
}
