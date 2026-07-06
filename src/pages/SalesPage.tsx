import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrders } from '../api';
import type { OrderStatus, OrderChannel } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow, Loading,
  SearchInput, MonthSelect,
} from '../components/ui';
import { formatCurrency, formatCompactWon } from '../utils/format';

const STATUS_META: Record<OrderStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'gray' }> = {
  paid: { label: '결제 완료', tone: 'green' },
  pending: { label: '입금 대기', tone: 'amber' },
  refunded: { label: '환불', tone: 'red' },
  cancelled: { label: '취소', tone: 'gray' },
};

const CHANNEL_META: Record<OrderChannel, { label: string; tone: 'blue' | 'violet' | 'amber' | 'green' }> = {
  content: { label: '콘텐츠', tone: 'blue' },
  experience: { label: '체험', tone: 'violet' },
  kit: { label: '교구', tone: 'amber' },
  subscription: { label: '구독', tone: 'green' },
};

export default function SalesPage() {
  const { data: orders, isLoading } = useOrders();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const channel = searchParams.get('channel') ?? 'all';
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('all');

  // 주문일시(YYYY-MM-DD hh:mm)에서 월 목록 추출
  const months = useMemo(() => {
    if (!orders) return [];
    return [...new Set(orders.map(o => o.orderedAt.slice(0, 7)))].sort().reverse()
      .map(m => m); // 'YYYY-MM'
  }, [orders]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o =>
      (status === 'all' || o.status === status) &&
      (channel === 'all' || o.channel === channel) &&
      (month === 'all' || o.orderedAt.startsWith(month)) &&
      (!query || `${o.orderNo}${o.buyerName}${o.buyerSchool ?? ''}${o.itemTitle}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [orders, status, channel, month, query]);

  if (isLoading || !orders) return <Loading />;

  const paid = orders.filter(o => o.status === 'paid');
  const totalPaid = paid.reduce((a, o) => a + o.amount, 0);
  const pending = orders.filter(o => o.status === 'pending').length;
  const refunded = orders.filter(o => o.status === 'refunded').length;

  return (
    <div className="space-y-5">
      <PageHeader title="판매" description="콘텐츠·체험·교구·구독 주문과 결제를 관리합니다" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="결제 완료 매출 (7월)" value={formatCompactWon(totalPaid)} sub={`${paid.length}건`} />
        <StatCard label="입금 대기" value={`${pending}건`} to="/sales?status=pending" tone={pending > 0 ? 'warning' : 'default'} />
        <StatCard label="환불" value={`${refunded}건`} to="/sales?status=refunded" tone={refunded > 0 ? 'danger' : 'default'} />
        <StatCard label="평균 주문 금액" value={formatCompactWon(paid.length ? Math.round(totalPaid / paid.length) : 0)} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          param="status"
          options={[
            { value: 'all', label: '전체' },
            { value: 'paid', label: '결제 완료' },
            { value: 'pending', label: '입금 대기' },
            { value: 'refunded', label: '환불' },
          ]}
          counts={{ all: orders.length, paid: paid.length, pending, refunded }}
        />
        <FilterChips
          param="channel"
          options={[
            { value: 'all', label: '전체 채널' },
            { value: 'content', label: '콘텐츠' },
            { value: 'experience', label: '체험' },
            { value: 'kit', label: '교구' },
            { value: 'subscription', label: '구독' },
          ]}
        />
        <div className="flex items-center gap-2 ml-auto">
          <MonthSelect value={month} onChange={setMonth} months={months} allLabel="전체 기간" />
          <SearchInput value={query} onChange={setQuery} placeholder="주문번호·구매자·상품 검색" />
        </div>
      </div>

      <Table headers={['주문번호', '구매자', '상품', '채널', '금액', '주문일시', '상태']}>
        {filtered.length === 0 && <EmptyRow colSpan={7} />}
        {filtered.map(o => (
          <tr key={o.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{o.orderNo}</td>
            <td className="px-4 py-3">
              <p className="font-medium text-gray-900">{o.buyerName}</p>
              {o.buyerSchool && <p className="text-xs text-gray-400">{o.buyerSchool}</p>}
            </td>
            <td className="px-4 py-3 text-gray-700">{o.itemTitle}</td>
            <td className="px-4 py-3"><StatusBadge label={CHANNEL_META[o.channel].label} tone={CHANNEL_META[o.channel].tone} /></td>
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatCurrency(o.amount)}</td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{o.orderedAt}</td>
            <td className="px-4 py-3"><StatusBadge label={STATUS_META[o.status].label} tone={STATUS_META[o.status].tone} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
