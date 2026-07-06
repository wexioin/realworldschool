import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePartners, useSavePartner, useDeletePartner, useKits } from '../api';
import type { Partner, PartnerStatus, PartnerType } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow,
  Loading, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, RowActions, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/format';

const TYPE_META: Record<PartnerType, { label: string; tone: 'blue' | 'amber' | 'violet' | 'green' }> = {
  supplier: { label: '교구 제조', tone: 'amber' },
  logistics: { label: '물류', tone: 'blue' },
  content: { label: '콘텐츠 협력', tone: 'violet' },
  experience: { label: '체험 운영', tone: 'green' },
};

const STATUS_META: Record<PartnerStatus, { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  active: { label: '계약 중', tone: 'green' },
  expiring: { label: '만료 임박', tone: 'amber' },
  ended: { label: '계약 종료', tone: 'gray' },
};

const EMPTY_PARTNER: Partner = {
  id: '', name: '', type: 'supplier', contact: '', email: '', phone: '',
  contractStart: '', contractEnd: '', status: 'active', note: '',
};

const PARTNER_FIELDS: FieldDef<Partner>[] = [
  { key: 'name', label: '업체명', required: true },
  { key: 'type', label: '유형', type: 'select', options: Object.entries(TYPE_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'contact', label: '담당자', required: true },
  { key: 'email', label: '이메일', required: true },
  { key: 'phone', label: '전화번호' },
  { key: 'status', label: '계약 상태', type: 'select', options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'contractStart', label: '계약 시작일', type: 'date' },
  { key: 'contractEnd', label: '계약 종료일', type: 'date' },
  { key: 'note', label: '메모 (결제조건·수익셰어 등)', type: 'textarea' },
];

export default function PartnersPage() {
  const { data: partners, isLoading } = usePartners();
  const { data: kits } = useKits();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const type = searchParams.get('type') ?? 'all';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Partner | null>(null);
  const save = useSavePartner();
  const remove = useDeletePartner();
  const toast = useToast();

  const filtered = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p =>
      (status === 'all' || p.status === status) &&
      (type === 'all' || p.type === type) &&
      (!query || `${p.name}${p.contact}${p.email}${p.note ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [partners, status, type, query]);

  if (isLoading || !partners) return <Loading />;

  const active = partners.filter(p => p.status === 'active').length;
  const expiring = partners.filter(p => p.status === 'expiring').length;
  const kitSuppliers = new Set(kits?.map(k => k.supplier).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      <PageHeader
        title="파트너/거래처"
        description="교구 제조·물류·콘텐츠 협력·체험 운영 파트너를 관리합니다"
        right={<AddButton label="거래처 추가" onClick={() => setEditing(EMPTY_PARTNER)} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="계약 중" value={`${active}곳`} sub={`전체 ${partners.length}곳`} to="/partners?status=active" />
        <StatCard label="만료 임박" value={`${expiring}곳`} to="/partners?status=expiring" tone={expiring > 0 ? 'warning' : 'default'} />
        <StatCard label="교구 공급처" value={`${kitSuppliers}곳`} to="/contents?tab=kit" />
        <StatCard label="정산 관리" value="정산 페이지" sub="파트너 정산 내역 보기" to="/settlements" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            param="status"
            options={[
              { value: 'all', label: '전체' },
              { value: 'active', label: '계약 중' },
              { value: 'expiring', label: '만료 임박' },
              { value: 'ended', label: '종료' },
            ]}
            counts={{
              all: partners.length,
              active,
              expiring,
              ended: partners.filter(p => p.status === 'ended').length,
            }}
          />
          <FilterChips
            param="type"
            options={[
              { value: 'all', label: '전체 유형' },
              { value: 'supplier', label: '교구 제조' },
              { value: 'logistics', label: '물류' },
              { value: 'content', label: '콘텐츠' },
              { value: 'experience', label: '체험' },
            ]}
          />
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="업체·담당자 검색" />
      </div>

      <Table headers={['업체명', '유형', '담당자', '연락처', '계약 기간', '상태', '메모', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={8} />}
        {filtered.map(p => (
          <tr key={p.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
            <td className="px-4 py-3"><StatusBadge label={TYPE_META[p.type].label} tone={TYPE_META[p.type].tone} /></td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.contact}</td>
            <td className="px-4 py-3">
              <p className="text-xs text-gray-600">{p.email}</p>
              {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
              {formatDate(p.contractStart)} ~ {formatDate(p.contractEnd)}
            </td>
            <td className="px-4 py-3"><StatusBadge label={STATUS_META[p.status].label} tone={STATUS_META[p.status].tone} /></td>
            <td className="px-4 py-3 text-xs text-gray-500 max-w-[220px] truncate">{p.note ?? '—'}</td>
            <td className="px-4 py-3">
              <RowActions
                onEdit={() => setEditing(p)}
                onDelete={() => {
                  if (!window.confirm(`「${p.name}」 거래처를 삭제할까요?`)) return;
                  remove.mutate(p.id, { onSuccess: () => toast.success('거래처가 삭제되었습니다.') });
                }}
              />
            </td>
          </tr>
        ))}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `거래처 수정 — ${editing.name}` : '새 거래처 추가'}
          fields={PARTNER_FIELDS}
          initial={editing}
          submitting={save.isPending}
          onClose={() => setEditing(null)}
          onSubmit={values => save.mutate(values, {
            onSuccess: () => { toast.success('저장되었습니다.'); setEditing(null); },
          })}
        />
      )}
    </div>
  );
}
