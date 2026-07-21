import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCreators, useSaveCreator, useDeleteCreator } from '../api';
import type { Creator, CreatorStatus } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow,
  Loading, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, RowActions, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatCompactWon, formatDate } from '../utils/format';

const STATUS_META: Record<CreatorStatus, { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  active: { label: '활동 중', tone: 'green' },
  pending: { label: '승인 대기', tone: 'amber' },
  inactive: { label: '비활성', tone: 'gray' },
};

const TYPE_LABEL: Record<string, string> = {
  creator_teacher: '교사',
  creator_student: '학생',
  creator_institution: '기관',
  creator_partners: '파트너스',
};

const EMPTY_CREATOR: Creator = {
  id: '', name: '', type: 'creator_teacher', institution: '', email: '',
  joinedDate: '2026-07-06', status: 'pending', contentCount: 0,
  totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-07-06',
};

const CREATOR_FIELDS: FieldDef<Creator>[] = [
  { key: 'name', label: '이름', required: true },
  { key: 'email', label: '이메일', required: true },
  { key: 'type', label: '유형', type: 'select', options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })) },
  { key: 'institution', label: '소속' },
  { key: 'status', label: '상태', type: 'select', options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'joinedDate', label: '가입일', type: 'date' },
];

export default function CreatorsPage() {
  const { data: creators, isLoading } = useCreators();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [editing, setEditing] = useState<Creator | null>(null);
  const save = useSaveCreator();
  const remove = useDeleteCreator();
  const toast = useToast();

  const filtered = useMemo(() => {
    if (!creators) return [];
    return creators.filter(c =>
      (status === 'all' || c.status === status) &&
      (!query || `${c.name}${c.email}${c.institution ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [creators, status, query]);

  if (isLoading || !creators) return <Loading />;

  const active = creators.filter(c => c.status === 'active').length;
  const pending = creators.filter(c => c.status === 'pending').length;
  const activeRecently = creators.filter(c => c.lastActiveDate >= '2026-06-06').length;
  const totalPending = creators.reduce((a, c) => a + c.pendingSettlement, 0);

  const approve = (c: Creator) => {
    save.mutate({ ...c, status: 'active' }, {
      onSuccess: () => toast.success(`${c.name} 크리에이터가 승인되었습니다.`),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="크리에이터"
        description="스튜디오에서 콘텐츠를 개발하는 교사·학생·기관·파트너를 관리합니다"
        right={<AddButton label="크리에이터 추가" onClick={() => setEditing(EMPTY_CREATOR)} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="활성 크리에이터" value={`${active}명`} sub={`전체 ${creators.length}명`} to="/creators?status=active" />
        <StatCard label="유동 크리에이터 (30일)" value={`${activeRecently}명`} sub="최근 30일 내 활동" />
        <StatCard label="승인 대기" value={`${pending}명`} to="/creators?status=pending" tone={pending > 0 ? 'warning' : 'default'} />
        <StatCard label="정산 대기 총액" value={formatCompactWon(totalPending)} to="/settlements?status=pending" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          param="status"
          options={[
            { value: 'all', label: '전체' },
            { value: 'active', label: '활동 중' },
            { value: 'pending', label: '승인 대기' },
            { value: 'inactive', label: '비활성' },
          ]}
          counts={{
            all: creators.length,
            active,
            pending,
            inactive: creators.filter(c => c.status === 'inactive').length,
          }}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="이름·이메일·소속 검색" />
      </div>

      <Table headers={['이름', '유형', '소속', '가입일', '콘텐츠', '누적 판매액', '정산 대기', '상태', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={9} />}
        {filtered.map(c => {
          const meta = STATUS_META[c.status];
          return (
            <tr key={c.id} className="hover:bg-gray-50/70">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.email}</p>
              </td>
              <td className="px-4 py-3"><StatusBadge label={TYPE_LABEL[c.type]} tone="violet" /></td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.institution || '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(c.joinedDate)}</td>
              <td className="px-4 py-3">
                <Link to="/contents?tab=digital" className="text-primary-600 hover:underline">{c.contentCount}개</Link>
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.totalRevenue > 0 ? formatCompactWon(c.totalRevenue) : '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {c.pendingSettlement > 0
                  ? <Link to="/settlements?status=pending" className="text-amber-600 font-medium hover:underline">{formatCompactWon(c.pendingSettlement)}</Link>
                  : '—'}
              </td>
              <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditing(c)}
                  onDelete={() => {
                    if (!window.confirm(`${c.name} 크리에이터를 삭제할까요?`)) return;
                    remove.mutate(c.id, { onSuccess: () => toast.success('크리에이터가 삭제되었습니다.') });
                  }}
                  extra={c.status === 'pending' ? (
                    <button
                      onClick={() => approve(c)}
                      className="px-2 py-1 text-xs font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60"
                    >
                      승인
                    </button>
                  ) : undefined}
                />
              </td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `크리에이터 수정 — ${editing.name}` : '새 크리에이터 추가'}
          fields={CREATOR_FIELDS}
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
