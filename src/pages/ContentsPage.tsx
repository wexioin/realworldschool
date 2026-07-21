import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Layers, BookOpen, Compass, CreditCard, Package,
  GitBranch, ExternalLink, ArrowRight, FileSpreadsheet, FileText, ClipboardCheck,
} from 'lucide-react';
import {
  useContents, useRoadmap, useExperiencePrograms, usePlans, useKits, useOrders, useContentAssets,
  useSaveContent, useDeleteContent, useSaveKit, useDeleteKit,
  useSaveExpProgram, useDeleteExpProgram, useSavePlan,
} from '../api';
import type {
  Content, SaleStatus, ExperienceProgram, PlanProduct, KitProduct, Order, OrderChannel,
} from '../api/types';
import {
  PageHeader, FilterChips, StatusBadge, StatCard, Table, EmptyRow, Loading,
  ProgressBar, Card, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, RowActions, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatCompactWon, formatCurrency, formatDate } from '../utils/format';
import { exportExcel, exportPDF } from '../utils/export';

// ─────────────────────────────────────────────────────────────
// 콘텐츠 페이지: "이미 출시된" 서비스(디지털 콘텐츠 / 체험서비스 / 교구키트 / 요금제)의
// 매출·운영 현황 관리 전용 페이지입니다. (미출시 콘텐츠 검수는 '콘텐츠 자산' 페이지에서 관리)
// 딥링크: /contents?tab=digital&status=selling ...
// ─────────────────────────────────────────────────────────────

const STUDIO_BASE = 'https://studio.realworld.to/project';

const SALE_STATUS_META: Record<SaleStatus, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  selling: { label: '판매 중', tone: 'green' },
  preparing: { label: '준비 중', tone: 'amber' },
  suspended: { label: '판매 중지', tone: 'red' },
  free: { label: '무료', tone: 'blue' },
  internal: { label: '내부용', tone: 'gray' },
};

const OWNER_LABEL: Record<string, string> = {
  original_ug: '유니크굿',
  original_rp: '레드포인트',
  creator_teacher: '교사',
  creator_student: '학생',
  creator_institution: '기관',
  creator_partners: '파트너스',
};

// ── 매출 매칭: 주문의 itemTitle은 접미어(예: " (체험)", " ×12")가 붙는 경우가 있어 정규화 후 비교 ──
const normalizeTitle = (s: string) => s.replace(/\s*\(체험\)\s*$/, '').replace(/\s*[×x]\s*\d+\s*$/i, '').trim();

function revenueFor(orders: Order[] | undefined, channel: OrderChannel, title: string) {
  if (!orders) return { revenue: 0, count: 0 };
  const target = normalizeTitle(title);
  const matched = orders.filter(o => o.status === 'paid' && o.channel === channel && normalizeTitle(o.itemTitle) === target);
  return { revenue: matched.reduce((a, o) => a + o.amount, 0), count: matched.length };
}

// ── 내보내기 버튼 (엑셀/PDF) ──
function ExportButtons({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => exportExcel(title, headers, rows)}
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <FileSpreadsheet size={14} /> 엑셀
      </button>
      <button
        onClick={() => exportPDF(title, headers, rows)}
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <FileText size={14} /> PDF
      </button>
    </div>
  );
}

export default function ContentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // tab 미지정 + status 필터가 있으면 디지털 콘텐츠 탭으로 (대시보드 딥링크 호환)
  const tab = searchParams.get('tab') ?? (searchParams.get('status') ? 'digital' : 'overview');

  const { data: contents } = useContents();
  const { data: expPrograms } = useExperiencePrograms();
  const { data: plans } = usePlans();
  const { data: kits } = useKits();

  const launchedContents = contents?.filter(c => c.devStage === 'released') ?? [];
  const launchedExp = expPrograms?.filter(p => p.status === 'active') ?? [];
  const launchedKits = kits?.filter(k => k.status !== 'preparing') ?? [];

  const TABS = [
    { value: 'overview', label: '서비스별 매출 현황', icon: Layers },
    { value: 'digital', label: '디지털 콘텐츠', icon: BookOpen, count: launchedContents.length },
    { value: 'experience', label: '체험서비스', icon: Compass, count: launchedExp.length },
    { value: 'plan', label: '요금제', icon: CreditCard, count: plans?.length },
    { value: 'kit', label: '교구키트', icon: Package, count: launchedKits.length },
    { value: 'roadmap', label: '로드맵', icon: GitBranch },
  ];

  return (
    <div>
      <PageHeader title="콘텐츠" description="이미 출시된 디지털 콘텐츠 · 체험서비스 · 요금제 · 교구키트의 매출과 운영 현황을 관리합니다" />

      {/* 탭 바 */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                const next = new URLSearchParams();
                if (t.value !== 'overview') next.set('tab', t.value);
                setSearchParams(next, { replace: true });
              }}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              <Icon size={15} />
              {t.label}
              {t.count !== undefined && (
                <span className={clsx(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'digital' && <DigitalTab />}
      {tab === 'experience' && <ExperienceServiceTab />}
      {tab === 'plan' && <PlanTab />}
      {tab === 'kit' && <KitTab />}
      {tab === 'roadmap' && <RoadmapTab />}
    </div>
  );
}

// ═══════════════ 탭 0: 서비스별 매출 현황 (개요) ═══════════════
function OverviewTab() {
  const { data: contents } = useContents();
  const { data: expPrograms } = useExperiencePrograms();
  const { data: plans } = usePlans();
  const { data: kits } = useKits();
  const { data: orders } = useOrders();
  const { data: contentAssets } = useContentAssets();

  if (!contents || !expPrograms || !plans || !kits || !orders || !contentAssets) return <Loading />;

  const launchedContents = contents.filter(c => c.devStage === 'released');
  const launchedExp = expPrograms.filter(p => p.status === 'active');
  const launchedKits = kits.filter(k => k.status !== 'preparing');

  const contentRevenue = launchedContents.reduce((a, c) => a + revenueFor(orders, 'content', c.title).revenue, 0);
  const expRevenue = launchedExp.reduce((a, p) => a + revenueFor(orders, 'experience', p.title).revenue, 0);
  const kitRevenue = launchedKits.reduce((a, k) => a + revenueFor(orders, 'kit', k.name).revenue, 0);
  const subRevenue = orders.filter(o => o.status === 'paid' && o.channel === 'subscription').reduce((a, o) => a + o.amount, 0);
  const totalRevenue = contentRevenue + expRevenue + kitRevenue + subRevenue;

  const cards = [
    {
      tab: 'digital', icon: BookOpen, title: '디지털 콘텐츠',
      stats: [
        { label: '출시 완료', value: `${launchedContents.length}개` },
        { label: '매출 합계', value: formatCompactWon(contentRevenue) },
        { label: '누적 판매', value: `${launchedContents.reduce((a, c) => a + c.purchases, 0).toLocaleString()}건` },
      ],
    },
    {
      tab: 'experience', icon: Compass, title: '체험서비스',
      stats: [
        { label: '운영 중', value: `${launchedExp.length}개` },
        { label: '매출 합계', value: formatCompactWon(expRevenue) },
        { label: '누적 예약', value: `${launchedExp.reduce((a, p) => a + p.bookingCount, 0)}건` },
      ],
    },
    {
      tab: 'plan', icon: CreditCard, title: '요금제',
      stats: [
        { label: '판매 중', value: `${plans.filter(p => p.status === 'active').length}개` },
        { label: '매출 합계', value: formatCompactWon(subRevenue) },
        { label: '구독자 합계', value: `${plans.reduce((a, p) => a + p.subscribers, 0).toLocaleString()}명` },
      ],
    },
    {
      tab: 'kit', icon: Package, title: '교구키트',
      stats: [
        { label: '판매 중/품절', value: `${launchedKits.length}종` },
        { label: '매출 합계', value: formatCompactWon(kitRevenue) },
        { label: '누적 판매', value: `${launchedKits.reduce((a, k) => a + k.sold, 0).toLocaleString()}개` },
      ],
    },
  ];

  const pendingAssets = contentAssets.filter(a => a.status !== 'released' && a.status !== 'rejected');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="전체 매출 합계 (누적)" value={formatCompactWon(totalRevenue)} sub="콘텐츠·체험·교구·구독 결제 완료 기준" />
        <StatCard label="출시 완료 서비스" value={`${launchedContents.length + launchedExp.length + launchedKits.length}개`} sub="콘텐츠·체험·교구" />
        <StatCard label="판매 중 요금제" value={`${plans.filter(p => p.status === 'active').length}개`} sub={`구독자 ${plans.reduce((a, p) => a + p.subscribers, 0).toLocaleString()}명`} />
        <StatCard label="검수 대기 콘텐츠 자산" value={`${pendingAssets.length}건`} to="/content-assets" tone={pendingAssets.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.tab}
              to={`/contents?tab=${card.tab}`}
              className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg">
                    <Icon size={15} className="text-primary-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1.5">
                {card.stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      <Card
        title={`콘텐츠 자산 검수 현황 (진행 중 ${pendingAssets.length}건)`}
        action={
          <Link to="/content-assets" className="text-xs text-primary-600 font-medium hover:text-primary-800 flex items-center gap-0.5">
            콘텐츠 자산 관리 <ArrowRight size={12} />
          </Link>
        }
      >
        {pendingAssets.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">진행 중인 검수가 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingAssets.slice(0, 5).map(a => (
              <Link key={a.id} to={`/content-assets?status=${a.status}`} className="flex items-center justify-between py-2.5 hover:bg-gray-50/70 -mx-2 px-2 rounded-lg group">
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.creatorName} · 제출 {formatDate(a.submittedDate)}</p>
                </div>
                <StatusBadge
                  label={({ ai_review: '1차 검수(AI)', human_review: '2차 검수', final_approval: '최종 승인 대기', revision: '수정 요청' } as Record<string, string>)[a.status] ?? a.status}
                  tone={a.status === 'revision' ? 'red' : a.status === 'final_approval' ? 'violet' : 'amber'}
                />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════ 탭 1: 디지털 콘텐츠 ═══════════════
const EMPTY_CONTENT: Content = {
  id: '', code: '', projectId: '', title: '', description: '',
  ownerType: 'original_rp', company: '레드포인트', creator: '',
  grade: '', subject: '', topic: '', price: 0,
  saleStatus: 'preparing', devStage: 'planning',
  views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: [],
};

const CONTENT_FIELDS: FieldDef<Content>[] = [
  { key: 'title', label: '제목', required: true },
  { key: 'code', label: '콘텐츠 코드', placeholder: 'RWS-000', required: true },
  { key: 'description', label: '설명', type: 'textarea' },
  { key: 'creator', label: '크리에이터', required: true },
  { key: 'company', label: '소속/회사' },
  { key: 'ownerType', label: '소유 유형', type: 'select', options: Object.entries(OWNER_LABEL).map(([value, label]) => ({ value, label })) },
  { key: 'grade', label: '대상 학년', placeholder: '초등 고학년' },
  { key: 'subject', label: '과목' },
  { key: 'price', label: '가격 (원)', type: 'number' },
  { key: 'saleStatus', label: '판매 상태', type: 'select', options: Object.entries(SALE_STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'projectId', label: '스튜디오 프로젝트 ID', placeholder: '스튜디오 링크 연결용', colSpan: 2 },
];

function DigitalTab() {
  const { data: contents, isLoading } = useContents();
  const { data: orders } = useOrders();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Content | null>(null);
  const saveContent = useSaveContent();
  const deleteContent = useDeleteContent();
  const toast = useToast();

  const launched = useMemo(() => (contents ?? []).filter(c => c.devStage === 'released'), [contents]);

  const filtered = useMemo(() => {
    return launched.filter(c => {
      if (status !== 'all' && c.saleStatus !== status) return false;
      if (query && !`${c.title}${c.code}${c.creator}${c.subject}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [launched, status, query]);

  if (isLoading || !contents) return <Loading />;

  const countBy = (s: SaleStatus) => launched.filter(c => c.saleStatus === s).length;
  const totalRevenue = filtered.reduce((a, c) => a + revenueFor(orders, 'content', c.title).revenue, 0);

  const handleDelete = (c: Content) => {
    if (!window.confirm(`「${c.title}」 콘텐츠를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;
    deleteContent.mutate(c.id, { onSuccess: () => toast.success('콘텐츠가 삭제되었습니다.') });
  };

  const exportRows = () => filtered.map(c => {
    const rev = revenueFor(orders, 'content', c.title);
    return [c.code, c.title, OWNER_LABEL[c.ownerType], c.creator, c.price, c.purchases, rev.revenue, SALE_STATUS_META[c.saleStatus].label];
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="출시 완료 콘텐츠" value={`${launched.length}개`} />
        <StatCard label="매출 합계 (표시된 항목)" value={formatCompactWon(totalRevenue)} />
        <StatCard label="누적 판매" value={`${filtered.reduce((a, c) => a + c.purchases, 0).toLocaleString()}건`} />
        <StatCard label="평균 평점" value={filtered.length ? `★ ${(filtered.reduce((a, c) => a + c.rating, 0) / filtered.length).toFixed(1)}` : '—'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          param="status"
          options={[
            { value: 'all', label: '전체' },
            { value: 'selling', label: '판매 중' },
            { value: 'suspended', label: '판매 중지' },
            { value: 'free', label: '무료' },
            { value: 'internal', label: '내부용' },
          ]}
          counts={{ all: launched.length, selling: countBy('selling'), suspended: countBy('suspended'), free: countBy('free'), internal: countBy('internal') }}
        />
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="제목·코드·크리에이터 검색" />
          <ExportButtons
            title="디지털_콘텐츠_매출현황"
            headers={['코드', '제목', '소유', '크리에이터', '가격', '누적판매', '매출', '상태']}
            rows={exportRows()}
          />
          <AddButton label="콘텐츠 추가" onClick={() => setEditing(EMPTY_CONTENT)} />
        </div>
      </div>

      <Table headers={['코드', '제목', '소유', '크리에이터', '가격', '구매', '매출', '평점', '상태', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={10} />}
        {filtered.map(c => {
          const meta = SALE_STATUS_META[c.saleStatus];
          const rev = revenueFor(orders, 'content', c.title);
          return (
            <tr key={c.id} className="hover:bg-gray-50/70">
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{c.code}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {c.projectId ? (
                    <a
                      href={`${STUDIO_BASE}/${c.projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-primary-600 hover:underline flex items-center gap-1"
                      title="리얼월드 스튜디오에서 열기"
                    >
                      {c.title}
                      <ExternalLink size={11} className="text-gray-300" />
                    </a>
                  ) : (
                    <p className="font-medium text-gray-900">{c.title}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate max-w-[260px]">{c.grade} · {c.subject}</p>
              </td>
              <td className="px-4 py-3"><StatusBadge label={OWNER_LABEL[c.ownerType]} tone={c.ownerType.startsWith('original') ? 'blue' : 'violet'} /></td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.creator}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.price === 0 ? '무료' : formatCompactWon(c.price)}</td>
              <td className="px-4 py-3 text-gray-700">{c.purchases.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatCompactWon(rev.revenue)}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.rating > 0 ? `★ ${c.rating}` : '—'}</td>
              <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditing(c)}
                  onDelete={() => handleDelete(c)}
                  extra={c.projectId ? (
                    <a
                      href={`${STUDIO_BASE}/${c.projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs font-medium bg-primary-50 border border-primary-100 text-primary-600 rounded-lg hover:bg-primary-100 flex items-center gap-1"
                    >
                      스튜디오 <ExternalLink size={10} />
                    </a>
                  ) : undefined}
                />
              </td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `콘텐츠 수정 — ${editing.title}` : '새 콘텐츠 추가'}
          fields={CONTENT_FIELDS}
          initial={editing}
          submitting={saveContent.isPending}
          onClose={() => setEditing(null)}
          onSubmit={values => {
            saveContent.mutate(values, {
              onSuccess: () => {
                toast.success(editing.id ? '콘텐츠가 수정되었습니다.' : '콘텐츠가 추가되었습니다.');
                setEditing(null);
              },
            });
          }}
        />
      )}
    </div>
  );
}

// ═══════════════ 탭 2: 체험서비스 ═══════════════
const EXP_TYPE_META: Record<string, { label: string; tone: 'blue' | 'violet' | 'green' }> = {
  EDU: { label: '교육형', tone: 'blue' },
  THEME: { label: '테마형', tone: 'violet' },
  PARK: { label: '현장형', tone: 'green' },
};

const EXP_STATUS_META: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  active: { label: '운영 중', tone: 'green' },
  preparing: { label: '준비 중', tone: 'amber' },
  suspended: { label: '중단', tone: 'red' },
};

const EMPTY_EXP: ExperienceProgram = {
  id: '', code: '', title: '', type: 'EDU', location: '교실 방문', region: '전국',
  minParticipants: 15, maxParticipants: 35, duration: '90분', pricePerStudent: 0,
  grade: '', instructor: '', status: 'preparing', bookingCount: 0, rating: 0, description: '',
};

const EXP_FIELDS: FieldDef<ExperienceProgram>[] = [
  { key: 'title', label: '프로그램명', required: true },
  { key: 'code', label: '코드', placeholder: 'EDU-000', required: true },
  { key: 'description', label: '설명', type: 'textarea' },
  { key: 'type', label: '유형', type: 'select', options: [
    { value: 'EDU', label: '교육형 (교실 방문)' },
    { value: 'THEME', label: '테마형 (테마 공간)' },
    { value: 'PARK', label: '현장형 (야외)' },
  ] },
  { key: 'status', label: '상태', type: 'select', options: [
    { value: 'active', label: '운영 중' },
    { value: 'preparing', label: '준비 중' },
    { value: 'suspended', label: '중단' },
  ] },
  { key: 'location', label: '장소' },
  { key: 'region', label: '지역' },
  { key: 'grade', label: '대상 학년' },
  { key: 'instructor', label: '담당 강사' },
  { key: 'duration', label: '소요 시간' },
  { key: 'pricePerStudent', label: '학생 1인당 가격 (원)', type: 'number' },
  { key: 'minParticipants', label: '최소 인원', type: 'number' },
  { key: 'maxParticipants', label: '최대 인원', type: 'number' },
];

function ExperienceServiceTab() {
  const { data: programs, isLoading } = useExperiencePrograms();
  const { data: orders } = useOrders();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ExperienceProgram | null>(null);
  const save = useSaveExpProgram();
  const remove = useDeleteExpProgram();
  const toast = useToast();

  const launched = useMemo(() => (programs ?? []).filter(p => p.status === 'active'), [programs]);

  if (isLoading || !programs) return <Loading />;

  const filtered = launched.filter(p =>
    !query || `${p.title}${p.code}${p.instructor}${p.region}`.toLowerCase().includes(query.toLowerCase())
  );
  const totalRevenue = filtered.reduce((a, p) => a + revenueFor(orders, 'experience', p.title).revenue, 0);

  const exportRows = () => filtered.map(p => {
    const rev = revenueFor(orders, 'experience', p.title);
    return [p.code, p.title, EXP_TYPE_META[p.type].label, p.region, p.pricePerStudent, p.bookingCount, rev.revenue, EXP_STATUS_META[p.status].label];
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="운영 중 프로그램" value={`${launched.length}개`} />
        <StatCard label="매출 합계 (표시된 항목)" value={formatCompactWon(totalRevenue)} />
        <StatCard label="누적 예약" value={`${filtered.reduce((a, p) => a + p.bookingCount, 0).toLocaleString()}건`} />
        <StatCard label="평균 평점" value={filtered.length ? `★ ${(filtered.reduce((a, p) => a + p.rating, 0) / filtered.length).toFixed(1)}` : '—'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          예약·일정 관리는 <Link to="/experience" className="text-primary-600 font-medium hover:underline">체험 운영</Link> 페이지에서 진행합니다.
        </p>
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="프로그램·강사 검색" />
          <ExportButtons
            title="체험서비스_매출현황"
            headers={['코드', '프로그램', '유형', '지역', '1인가격', '누적예약', '매출', '상태']}
            rows={exportRows()}
          />
          <AddButton label="프로그램 추가" onClick={() => setEditing(EMPTY_EXP)} />
        </div>
      </div>

      <Table headers={['코드', '프로그램', '유형', '지역', '인원', '1인 가격', '누적 예약', '매출', '평점', '상태', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={11} />}
        {filtered.map(p => {
          const rev = revenueFor(orders, 'experience', p.title);
          return (
          <tr key={p.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{p.code}</td>
            <td className="px-4 py-3">
              <p className="font-medium text-gray-900">{p.title}</p>
              <p className="text-xs text-gray-400">{p.grade} · {p.duration} · {p.instructor}</p>
            </td>
            <td className="px-4 py-3"><StatusBadge label={EXP_TYPE_META[p.type].label} tone={EXP_TYPE_META[p.type].tone} /></td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.region}</td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.minParticipants}~{p.maxParticipants}명</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatCurrency(p.pricePerStudent)}</td>
            <td className="px-4 py-3 text-gray-700">{p.bookingCount}건</td>
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatCompactWon(rev.revenue)}</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.rating > 0 ? `★ ${p.rating}` : '—'}</td>
            <td className="px-4 py-3"><StatusBadge label={EXP_STATUS_META[p.status].label} tone={EXP_STATUS_META[p.status].tone} /></td>
            <td className="px-4 py-3">
              <RowActions
                onEdit={() => setEditing(p)}
                onDelete={() => {
                  if (!window.confirm(`「${p.title}」 프로그램을 삭제할까요?`)) return;
                  remove.mutate(p.id, { onSuccess: () => toast.success('프로그램이 삭제되었습니다.') });
                }}
              />
            </td>
          </tr>
          );
        })}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `체험 프로그램 수정 — ${editing.title}` : '새 체험 프로그램'}
          fields={EXP_FIELDS}
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

// ═══════════════ 탭 3: 요금제 ═══════════════
const PLAN_TARGET_LABEL: Record<string, string> = {
  teacher: '교사', school: '학교', student: '학생', institution: '기관',
};

const PLAN_FIELDS: FieldDef<PlanProduct>[] = [
  { key: 'name', label: '요금제명', required: true },
  { key: 'code', label: '코드', required: true },
  { key: 'target', label: '대상', type: 'select', options: Object.entries(PLAN_TARGET_LABEL).map(([value, label]) => ({ value, label })) },
  { key: 'status', label: '상태', type: 'select', options: [
    { value: 'active', label: '판매 중' },
    { value: 'hidden', label: '숨김' },
  ] },
  { key: 'priceMonthly', label: '월 가격 (원, 0=미판매)', type: 'number' },
  { key: 'priceYearly', label: '연 가격 (원, 0=미판매)', type: 'number' },
];

function PlanTab() {
  const { data: plans, isLoading } = usePlans();
  const [editing, setEditing] = useState<PlanProduct | null>(null);
  const save = useSavePlan();
  const toast = useToast();

  if (isLoading || !plans) return <Loading />;

  const totalSubscribers = plans.reduce((a, p) => a + p.subscribers, 0);
  const exportRows = () => plans.map(p => [
    p.code, p.name, PLAN_TARGET_LABEL[p.target], p.priceMonthly, p.priceYearly, p.subscribers, p.status === 'active' ? '판매 중' : '숨김',
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          전체 구독자 <span className="font-semibold text-gray-900">{totalSubscribers.toLocaleString()}명</span> ·
          구독 주문은 <Link to="/sales?channel=subscription" className="text-primary-600 font-medium hover:underline">판매 페이지</Link>에서 확인합니다.
        </p>
        <ExportButtons
          title="요금제_현황"
          headers={['코드', '요금제명', '대상', '월가격', '연가격', '구독자수', '상태']}
          rows={exportRows()}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-900">{p.name}</p>
              <div className="flex items-center gap-1.5">
                <StatusBadge label={PLAN_TARGET_LABEL[p.target]} tone="gray" />
                <StatusBadge label={p.status === 'active' ? '판매 중' : '숨김'} tone={p.status === 'active' ? 'green' : 'gray'} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {p.priceMonthly > 0 ? `${formatCurrency(p.priceMonthly)}/월`
                : p.priceYearly > 0 ? `${formatCurrency(p.priceYearly)}/년`
                : p.target === 'institution' ? '맞춤 견적' : '무료'}
            </p>
            <p className="text-xs text-gray-400 mb-2">구독자 {p.subscribers.toLocaleString()}명</p>
            <ul className="text-xs text-gray-500 space-y-0.5 flex-1">
              {p.features.map(f => <li key={f}>· {f}</li>)}
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setEditing(p)}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                수정
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EntityFormModal
          title={`요금제 수정 — ${editing.name}`}
          fields={PLAN_FIELDS}
          initial={editing}
          submitting={save.isPending}
          onClose={() => setEditing(null)}
          onSubmit={values => save.mutate(values, {
            onSuccess: () => { toast.success('요금제가 수정되었습니다.'); setEditing(null); },
          })}
        />
      )}
    </div>
  );
}

// ═══════════════ 탭 4: 교구키트 ═══════════════
const KIT_STATUS_META: Record<string, { label: string; tone: 'green' | 'red' | 'amber' }> = {
  selling: { label: '판매 중', tone: 'green' },
  soldout: { label: '품절', tone: 'red' },
  preparing: { label: '준비 중', tone: 'amber' },
};

const EMPTY_KIT: KitProduct = {
  id: '', code: '', name: '', price: 0, stock: 0, sold: 0, status: 'preparing', supplier: '', linkedContent: '',
};

const KIT_FIELDS: FieldDef<KitProduct>[] = [
  { key: 'name', label: '교구명', required: true },
  { key: 'code', label: '코드', placeholder: 'KIT-000', required: true },
  { key: 'price', label: '가격 (원)', type: 'number' },
  { key: 'stock', label: '재고', type: 'number' },
  { key: 'status', label: '상태', type: 'select', options: Object.entries(KIT_STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'supplier', label: '공급 거래처' },
  { key: 'linkedContent', label: '연계 디지털 콘텐츠', colSpan: 2 },
];

function KitTab() {
  const { data: kits, isLoading } = useKits();
  const { data: orders } = useOrders();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<KitProduct | null>(null);
  const save = useSaveKit();
  const remove = useDeleteKit();
  const toast = useToast();

  const launched = useMemo(() => (kits ?? []).filter(k => k.status !== 'preparing'), [kits]);

  if (isLoading || !kits) return <Loading />;

  const filtered = launched.filter(k =>
    !query || `${k.name}${k.code}${k.supplier ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const lowStock = launched.filter(k => k.status === 'selling' && k.stock < 50).length;
  const totalRevenue = filtered.reduce((a, k) => a + revenueFor(orders, 'kit', k.name).revenue, 0);

  const exportRows = () => filtered.map(k => {
    const rev = revenueFor(orders, 'kit', k.name);
    return [k.code, k.name, k.price, k.stock, k.sold, rev.revenue, k.supplier ?? '—', KIT_STATUS_META[k.status].label];
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="판매 중/품절 교구" value={`${launched.length}종`} />
        <StatCard label="매출 합계 (표시된 항목)" value={formatCompactWon(totalRevenue)} />
        <StatCard label="누적 판매" value={`${filtered.reduce((a, k) => a + k.sold, 0).toLocaleString()}개`} />
        <StatCard label="재고 부족 (50개 미만)" value={`${lowStock}종`} tone={lowStock > 0 ? 'warning' : 'default'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          공급처 관리는 <Link to="/partners" className="text-primary-600 font-medium hover:underline">파트너/거래처</Link>에서 합니다.
        </p>
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="교구·공급처 검색" />
          <ExportButtons
            title="교구키트_매출현황"
            headers={['코드', '교구명', '가격', '재고', '누적판매', '매출', '공급처', '상태']}
            rows={exportRows()}
          />
          <AddButton label="교구 추가" onClick={() => setEditing(EMPTY_KIT)} />
        </div>
      </div>

      <Table headers={['코드', '교구명', '가격', '재고', '누적 판매', '매출', '공급처', '연계 콘텐츠', '상태', '관리']}>
        {filtered.length === 0 && <EmptyRow colSpan={10} />}
        {filtered.map(k => {
          const rev = revenueFor(orders, 'kit', k.name);
          return (
          <tr key={k.id} className="hover:bg-gray-50/70">
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{k.code}</td>
            <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatCurrency(k.price)}</td>
            <td className="px-4 py-3">
              <span className={clsx(
                'font-semibold',
                k.stock === 0 ? 'text-red-500' : k.stock < 50 ? 'text-amber-600' : 'text-gray-900'
              )}>
                {k.stock.toLocaleString()}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-700">{k.sold.toLocaleString()}</td>
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatCompactWon(rev.revenue)}</td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{k.supplier ?? '—'}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{k.linkedContent ?? '—'}</td>
            <td className="px-4 py-3"><StatusBadge label={KIT_STATUS_META[k.status].label} tone={KIT_STATUS_META[k.status].tone} /></td>
            <td className="px-4 py-3">
              <RowActions
                onEdit={() => setEditing(k)}
                onDelete={() => {
                  if (!window.confirm(`「${k.name}」 교구를 삭제할까요?`)) return;
                  remove.mutate(k.id, { onSuccess: () => toast.success('교구가 삭제되었습니다.') });
                }}
              />
            </td>
          </tr>
          );
        })}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? `교구 수정 — ${editing.name}` : '새 교구 추가'}
          fields={KIT_FIELDS}
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

function RoadmapTab() {
  const { data: roadmap, isLoading } = useRoadmap();
  if (isLoading || !roadmap) return <Loading />;

  const STAGE_META: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'gray' | 'violet' }> = {
    planning: { label: '기획', tone: 'gray' },
    developing: { label: '개발 중', tone: 'blue' },
    review_1: { label: '1차 검수', tone: 'amber' },
    review_2: { label: '2차 검수', tone: 'amber' },
    final_approval: { label: '최종 승인', tone: 'violet' },
    released: { label: '출시', tone: 'green' },
    on_hold: { label: '보류', tone: 'gray' },
  };
  const PRIORITY_META = {
    high: { label: '높음', tone: 'red' as const },
    medium: { label: '중간', tone: 'amber' as const },
    low: { label: '낮음', tone: 'gray' as const },
  };

  const byQuarter = roadmap.reduce<Record<string, typeof roadmap>>((acc, item) => {
    (acc[item.targetQ] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(byQuarter).sort(([a], [b]) => a.localeCompare(b)).map(([quarter, items]) => (
        <Card key={quarter} title={`${quarter} 출시 목표 (${items.length}건)`}>
          <div className="space-y-4">
            {items.map(item => {
              const stage = STAGE_META[item.stage];
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <StatusBadge label={stage.label} tone={stage.tone} />
                      <StatusBadge label={`우선순위 ${PRIORITY_META[item.priority].label}`} tone={PRIORITY_META[item.priority].tone} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {item.company} · {item.pm} · {formatDate(item.planStart)} ~ {formatDate(item.devComplete)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={item.progress} className="flex-1" />
                    <span className="text-xs text-gray-500 w-9 text-right">{item.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}