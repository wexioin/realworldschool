import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useBookings, useUpdateBooking } from '../api';
import type { BookingStatus } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow, Loading, SearchInput,
} from '../components/ui';
import { useToast } from '../components/Toast';
import { formatCurrency, formatCompactWon, formatDate } from '../utils/format';

const STATUS_META: Record<BookingStatus, { label: string; tone: 'amber' | 'blue' | 'green' | 'gray' }> = {
  pending: { label: '확정 대기', tone: 'amber' },
  confirmed: { label: '확정', tone: 'blue' },
  done: { label: '진행 완료', tone: 'green' },
  cancelled: { label: '취소', tone: 'gray' },
};

export default function ExperiencePage() {
  const { data: bookings, isLoading } = useBookings();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const [query, setQuery] = useState('');
  const update = useUpdateBooking();
  const toast = useToast();

  const filtered = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b =>
      (status === 'all' || b.status === status) &&
      (!query || `${b.programTitle}${b.schoolName}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [bookings, status, query]);

  if (isLoading || !bookings) return <Loading />;

  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const upcoming = bookings.filter(b => b.status !== 'cancelled' && b.date >= '2026-07-06');
  const monthAmount = bookings
    .filter(b => b.status !== 'cancelled' && b.date.startsWith('2026-07'))
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="체험 운영"
        description="찾아가는 체험 프로그램의 예약과 일정을 관리합니다"
        right={
          <Link to="/contents?tab=experience" className="text-sm text-primary-600 font-medium hover:underline">
            프로그램 관리 →
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="확정 대기 예약" value={`${pending.length}건`} to="/experience?status=pending" tone={pending.length > 0 ? 'warning' : 'default'} />
        <StatCard label="확정 예약" value={`${confirmed.length}건`} to="/experience?status=confirmed" />
        <StatCard label="예정 일정" value={`${upcoming.length}건`} sub="오늘 이후" />
        <StatCard label="7월 예약 금액" value={formatCompactWon(monthAmount)} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          param="status"
          options={[
            { value: 'all', label: '전체' },
            { value: 'pending', label: '확정 대기' },
            { value: 'confirmed', label: '확정' },
            { value: 'done', label: '진행 완료' },
          ]}
          counts={{
            all: bookings.length,
            pending: pending.length,
            confirmed: confirmed.length,
            done: bookings.filter(b => b.status === 'done').length,
          }}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="프로그램·학교 검색" />
      </div>

      <Table headers={['프로그램', '학교', '일정', '인원', '금액', '상태', '']}>
        {filtered.length === 0 && <EmptyRow colSpan={7} />}
        {filtered.map(b => (
          <tr key={b.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 font-medium text-gray-900">{b.programTitle}</td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.schoolName}</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(b.date)}</td>
            <td className="px-4 py-3 text-gray-700">{b.participants}명</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatCurrency(b.amount)}</td>
            <td className="px-4 py-3"><StatusBadge label={STATUS_META[b.status].label} tone={STATUS_META[b.status].tone} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {b.status === 'pending' && (
                  <>
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: b.id, status: 'confirmed' }, {
                        onSuccess: () => toast.success(`${b.schoolName} 예약이 확정되었습니다.`),
                      })}
                      className="px-2.5 py-1 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50">
                      예약 확정
                    </button>
                    <button
                      disabled={update.isPending}
                      onClick={() => {
                        if (!window.confirm(`${b.schoolName}의 예약을 취소할까요?`)) return;
                        update.mutate({ id: b.id, status: 'cancelled' }, {
                          onSuccess: () => toast.success('예약이 취소되었습니다.'),
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      취소
                    </button>
                  </>
                )}
                {b.status === 'confirmed' && (
                  <button
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: b.id, status: 'done' }, {
                      onSuccess: () => toast.success('진행 완료로 처리되었습니다.'),
                    })}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60 disabled:opacity-50">
                    진행 완료
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
