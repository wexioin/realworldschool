import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSettlements, useUpdateSettlement } from '../api';
import type { SettlementStatus } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow,
  Loading, SearchInput, MonthSelect,
} from '../components/ui';
import { useToast } from '../components/Toast';
import { formatCurrency, formatCompactWon } from '../utils/format';

const STATUS_META: Record<SettlementStatus, { label: string; tone: 'amber' | 'blue' | 'green' | 'red' }> = {
  pending: { label: '확정 대기', tone: 'amber' },
  confirmed: { label: '확정 (지급 대기)', tone: 'blue' },
  paid: { label: '지급 완료', tone: 'green' },
  disputed: { label: '이의 제기', tone: 'red' },
};

const TARGET_LABEL: Record<string, string> = { creator: '크리에이터', partner: '파트너', experience: '체험' };

export default function SettlementsPage() {
  const { data: settlements, isLoading } = useSettlements();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const [month, setMonth] = useState('all');
  const [query, setQuery] = useState('');
  const update = useUpdateSettlement();
  const toast = useToast();

  // 데이터에 존재하는 정산 월 목록 (최신순)
  const months = useMemo(() => {
    if (!settlements) return [];
    return [...new Set(settlements.map(s => s.period))].sort().reverse();
  }, [settlements]);

  const filtered = useMemo(() => {
    if (!settlements) return [];
    return settlements.filter(s =>
      (status === 'all' || s.status === status) &&
      (month === 'all' || s.period === month) &&
      (!query || s.targetName.toLowerCase().includes(query.toLowerCase()))
    );
  }, [settlements, status, month, query]);

  if (isLoading || !settlements) return <Loading />;

  const pending = settlements.filter(s => s.status === 'pending');
  const confirmed = settlements.filter(s => s.status === 'confirmed');
  const disputed = settlements.filter(s => s.status === 'disputed');
  const pendingTotal = pending.reduce((a, s) => a + s.netAmount, 0);
  const paidTotal = settlements.filter(s => s.status === 'paid').reduce((a, s) => a + s.netAmount, 0);

  const changeStatus = (id: string, next: SettlementStatus, message: string) => {
    update.mutate({ id, status: next }, { onSuccess: () => toast.success(message) });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="정산" description="크리에이터·파트너·체험 강사 정산을 관리합니다" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="확정 대기" value={`${pending.length}건`} sub={formatCompactWon(pendingTotal)} to="/settlements?status=pending" tone={pending.length > 0 ? 'warning' : 'default'} />
        <StatCard label="지급 대기 (확정됨)" value={`${confirmed.length}건`} to="/settlements?status=confirmed" />
        <StatCard label="이의 제기" value={`${disputed.length}건`} to="/settlements?status=disputed" tone={disputed.length > 0 ? 'danger' : 'default'} />
        <StatCard label="지급 완료 (누적)" value={formatCompactWon(paidTotal)} to="/settlements?status=paid" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          param="status"
          options={[
            { value: 'all', label: '전체' },
            { value: 'pending', label: '확정 대기' },
            { value: 'confirmed', label: '지급 대기' },
            { value: 'disputed', label: '이의 제기' },
            { value: 'paid', label: '지급 완료' },
          ]}
          counts={{
            all: settlements.length,
            pending: pending.length,
            confirmed: confirmed.length,
            disputed: disputed.length,
            paid: settlements.filter(s => s.status === 'paid').length,
          }}
        />
        <div className="flex items-center gap-2">
          <MonthSelect value={month} onChange={setMonth} months={months} allLabel="전체 기간" />
          <SearchInput value={query} onChange={setQuery} placeholder="대상자 검색" />
        </div>
      </div>

      <Table headers={['대상', '유형', '정산 기간', '총 판매액', '수수료', '정산액', '상태', '처리']}>
        {filtered.length === 0 && <EmptyRow colSpan={8} />}
        {filtered.map(s => (
          <tr key={s.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 font-medium text-gray-900">{s.targetName}</td>
            <td className="px-4 py-3"><StatusBadge label={TARGET_LABEL[s.targetType]} tone="gray" /></td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.period}</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatCurrency(s.grossAmount)}</td>
            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">-{formatCurrency(s.fee)}</td>
            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(s.netAmount)}</td>
            <td className="px-4 py-3"><StatusBadge label={STATUS_META[s.status].label} tone={STATUS_META[s.status].tone} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {s.status === 'pending' && (
                  <button
                    disabled={update.isPending}
                    onClick={() => changeStatus(s.id, 'confirmed', `${s.targetName} ${s.period} 정산이 확정되었습니다.`)}
                    className="px-2.5 py-1 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    정산 확정
                  </button>
                )}
                {s.status === 'confirmed' && (
                  <button
                    disabled={update.isPending}
                    onClick={() => changeStatus(s.id, 'paid', `${s.targetName}에게 ${formatCurrency(s.netAmount)} 지급 처리되었습니다.`)}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    지급 처리
                  </button>
                )}
                {s.status === 'disputed' && (
                  <button
                    disabled={update.isPending}
                    onClick={() => changeStatus(s.id, 'pending', `${s.targetName} 이의가 해결되어 확정 대기로 변경되었습니다.`)}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    이의 해결
                  </button>
                )}
                {s.status === 'paid' && <span className="text-xs text-gray-400">완료</span>}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
