import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMembers, useSaveMember, useDeleteMember } from '../api';
import type { Member, MemberStatus } from '../api/types';
import {
  PageHeader, StatCard, FilterChips, StatusBadge, Table, EmptyRow,
  Loading, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, RowActions, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatCompactWon, formatDate } from '../utils/format';

const STATUS_META: Record<MemberStatus, { label: string; tone: 'green' | 'gray' | 'red' }> = {
  active: { label: '활성', tone: 'green' },
  dormant: { label: '휴면', tone: 'gray' },
  suspended: { label: '정지', tone: 'red' },
};

const TYPE_LABEL: Record<string, string> = { teacher: '교사', student: '학생', institution: '기관' };
const PLAN_LABEL: Record<string, string> = { free: '무료', teacher_pro: '티처 프로', school: '스쿨', enterprise: '엔터프라이즈' };

const EMPTY_MEMBER: Member = {
  id: '', name: '', type: 'teacher', school: '', email: '', plan: 'free',
  status: 'active', joinedDate: '2026-07-06', lastActiveDate: '2026-07-06', totalSpent: 0,
};

const MEMBER_FIELDS: FieldDef<Member>[] = [
  { key: 'name', label: '이름', required: true },
  { key: 'email', label: '이메일', required: true },
  { key: 'type', label: '유형', type: 'select', options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })) },
  { key: 'school', label: '소속 학교' },
  { key: 'plan', label: '플랜', type: 'select', options: Object.entries(PLAN_LABEL).map(([value, label]) => ({ value, label })) },
  { key: 'status', label: '상태', type: 'select', options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'joinedDate', label: '가입일', type: 'date' },
];

export default function MembersPage() {
  const { data: members, isLoading } = useMembers();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const type = searchParams.get('type') ?? 'all';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const save = useSaveMember();
  const remove = useDeleteMember();
  const toast = useToast();

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter(m =>
      (status === 'all' || m.status === status) &&
      (type === 'all' || m.type === type) &&
      (!query || `${m.name}${m.email}${m.school ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [members, status, type, query]);

  if (isLoading || !members) return <Loading />;

  const active = members.filter(m => m.status === 'active').length;
  const dormant = members.filter(m => m.status === 'dormant').length;
  const newThisMonth = members.filter(m => m.joinedDate >= '2026-06-06').length;
  const paidPlans = members.filter(m => m.plan !== 'free').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="회원"
        description="리얼월드 스쿨을 이용하는 교사·학교·학생 계정을 관리합니다"
        right={<AddButton label="회원 추가" onClick={() => setEditing(EMPTY_MEMBER)} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="활성 회원" value={`${active}명`} sub={`전체 ${members.length}명`} to="/members?status=active" />
        <StatCard label="신규 가입 (30일)" value={`${newThisMonth}명`} />
        <StatCard label="유료 플랜" value={`${paidPlans}명`} sub={`전환율 ${Math.round((paidPlans / members.length) * 100)}%`} />
        <StatCard label="휴면 회원" value={`${dormant}명`} to="/members?status=dormant" tone={dormant > 0 ? 'warning' : 'default'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            param="status"
            options={[
              { value: 'all', label: '전체' },
              { value: 'active', label: '활성' },
              { value: 'dormant', label: '휴면' },
            ]}
            counts={{ all: members.length, active, dormant }}
          />
          <FilterChips
            param="type"
            options={[
              { value: 'all', label: '전체 유형' },
              { value: 'teacher', label: '교사' },
              { value: 'institution', label: '기관' },
            ]}
          />
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="이름·이메일·학교 검색" />
      </div>

      <Table headers={['이름', '유형', '소속', '플랜', '가입일', '최근 접속', '누적 결제', '상태', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={9} />}
        {filtered.map(m => {
          const meta = STATUS_META[m.status];
          return (
            <tr key={m.id} className="hover:bg-gray-50/70">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </td>
              <td className="px-4 py-3"><StatusBadge label={TYPE_LABEL[m.type]} tone={m.type === 'institution' ? 'blue' : 'gray'} /></td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.school || '—'}</td>
              <td className="px-4 py-3"><StatusBadge label={PLAN_LABEL[m.plan]} tone={m.plan === 'free' ? 'gray' : 'violet'} /></td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.joinedDate)}</td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.lastActiveDate)}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{m.totalSpent > 0 ? formatCompactWon(m.totalSpent) : '—'}</td>
              <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditing(m)}
                  onDelete={() => {
                    if (!window.confirm(`${m.name} 회원을 삭제할까요?\n결제·이용 이력도 함께 삭제됩니다.`)) return;
                    remove.mutate(m.id, { onSuccess: () => toast.success('회원이 삭제되었습니다.') });
                  }}
                />
              </td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `회원 정보 수정 — ${editing.name}` : '새 회원 추가'}
          fields={MEMBER_FIELDS}
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
