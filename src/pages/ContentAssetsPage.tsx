import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ClipboardList, BarChart3, ExternalLink, FileText, FileType2, BookOpenCheck,
  Sparkles, CheckCircle2, XCircle, Gavel, Pencil, UserRound, Mail, Building2, ArrowRight, ChevronRight,
  ShieldCheck, Users, CalendarClock, Send, AlertTriangle, BellRing, Clock,
  Wallet, Rocket, MapPin, CreditCard, FileEdit, CheckSquare,
  Layers, BookOpen, GitBranch, Megaphone, TrendingUp, Star, ShoppingCart, DollarSign,
  Download, Plus, Map as MapIcon, Target, Lightbulb, GraduationCap, Package, PlusCircle,
} from 'lucide-react';
import {
  useContentAssets, useCreators, useSaveContentAsset, useRunAiReview, useSubmitReviewScores,
  useFinalApproveAsset, useRejectAsset,
  useAdvisors, useAssignAdvisor, useSendAdvisorReminder, useKnowledgePosts,
  useCompletePayment, useSkipPayment, useReleaseContent, useSendRevisionReminder, useMarkRevisionComplete,
  useRoadmap,
  creatorPayoutByEmail, contentCatalog, contentForms,
} from '../api';
import type { ContentAsset, AssetStatus, CriterionScore, CriterionKey, AssetGrade, AssetEnvType, AssetGroupType, Creator, Advisor, AdvisorAssignment, RevisionRequest, KnowledgePost, CreatorPayoutInfo, Content, ContentForm, DevStage, SaleStatus, ContentKind } from '../api/types';
import {
  REVIEW_CRITERIA, CRITERION_COMMENT_OPTIONS, CONTENT_CATEGORY_GROUPS, CORE_COMPETENCIES,
  ASSET_STATUS_META, IN_REVIEW_STATUSES, REVIEW_PASS_MARK,
  ASSIGNMENT_DEADLINE_DAYS, REVISION_DEADLINE_DAYS,
  CONTENT_KIND_META, hasPlanDocs, needsPayment,
} from '../api/types';
import { useSession } from '../session';
import {
  PageHeader, StatusBadge, Card, SearchInput, Loading, AddButton,
  Table, EmptyRow, ProgressBar,
} from '../components/ui';
import { Modal, EntityFormModal, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate, formatCurrency, formatCompactWon } from '../utils/format';
import { CATEGORY_GROUPS, categoryLabel, ALL_CATEGORY_OPTIONS } from '../utils/categories';

// ─────────────────────────────────────────────────────────────
// 콘텐츠 자산 페이지: 미출시 디지털 콘텐츠의 검수 파이프라인 전용 관리
// 흐름: AI 1차 검수 → 2차 심사(5개 기준 × 20점, 80점 이상 통과) → 최종 승인(대표단)
// 실패/미달 시 수정 요청 → 재제출 → 1차부터 재검수
// ─────────────────────────────────────────────────────────────

const STUDIO_BASE = 'https://studio.realworld.to/project';

// 지식 자산에 저장된 자문단 이메일 양식(제목으로 매칭). 실연동 시에도 동일 제목 규칙 유지.
const ASSIGN_TEMPLATE_TITLE = '[이메일 양식] 자문단 2차 검증 배정 안내';
const REMINDER_TEMPLATE_TITLE = '[이메일 양식] 자문단 2차 검증 마감 리마인드';
// 검수 페이지 링크는 관리자가 수동 삽입하는 자리표시자로 그대로 둡니다.
const REVIEW_LINK_PLACEHOLDER = '{{검수페이지링크}}';

const DEFAULT_ASSIGN_BODY = `안녕하세요, {{자문위원명}} 위원님.

리얼월드 스쿨 콘텐츠 2차 검증 자문위원으로 선정되어 안내드립니다.

■ 검수 대상: {{콘텐츠명}} ({{콘텐츠코드}})
■ 검수 마감일: {{마감일}}

아래 링크에서 콘텐츠를 확인하시고 검수 의견을 등록해 주시기 바랍니다.
▶ 검수 페이지: {{검수페이지링크}}

교육 현장에 도움이 되는 콘텐츠가 될 수 있도록 위원님의 전문적인 검토를 부탁드립니다.
감사합니다.

리얼월드 스쿨 운영팀 드림`;

const DEFAULT_REMINDER_BODY = `안녕하세요, {{자문위원명}} 위원님.

앞서 요청드린 콘텐츠 2차 검증의 마감일({{마감일}})이 지나 리마인드 안내드립니다.

■ 검수 대상: {{콘텐츠명}} ({{콘텐츠코드}})

아직 검수 의견을 등록하지 못하셨다면, 아래 링크에서 검토를 완료해 주시면 감사하겠습니다.
▶ 검수 페이지: {{검수페이지링크}}

바쁘신 점 양해 부탁드리며, 회신이 어려우신 경우 운영팀으로 알려주시기 바랍니다.
감사합니다.

리얼월드 스쿨 운영팀 드림`;

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const isOverdue = (deadline: string) => !!deadline && deadline < todayISO();

// 템플릿 자리표시자 치환. 검수 페이지 링크({{검수페이지링크}})는 수동 삽입용으로 유지.
function fillTemplate(
  body: string,
  vars: { advisorName: string; title: string; code: string; deadline: string },
): string {
  return body
    .replace(/\{\{자문위원명\}\}/g, vars.advisorName || '위원')
    .replace(/\{\{콘텐츠명\}\}/g, vars.title)
    .replace(/\{\{콘텐츠코드\}\}/g, vars.code)
    .replace(/\{\{마감일\}\}/g, vars.deadline ? formatDate(vars.deadline) : '(마감일 미정)');
}

const REVISION_REMINDER_TEMPLATE_TITLE = '[이메일 양식] 크리에이터 수정 요청 리마인드';

const DEFAULT_REVISION_REMINDER_BODY = `안녕하세요, {{크리에이터명}}님.

「{{콘텐츠명}}」(코드: {{콘텐츠코드}}) 콘텐츠에 대한 수정 요청의 마감일({{마감일}})이 지나 리마인드 안내드립니다.

아직 수정·재제출을 완료하지 못하셨다면, 스튜디오에서 수정 후 재제출해 주시기 바랍니다.

문의 사항이 있으시면 운영팀으로 연락해 주세요.
감사합니다.

리얼월드 스쿨 운영팀 드림`;

function fillRevisionTemplate(
  body: string,
  vars: { creatorName: string; title: string; code: string; deadline: string },
): string {
  return body
    .replace(/\{\{크리에이터명\}\}/g, vars.creatorName)
    .replace(/\{\{콘텐츠명\}\}/g, vars.title)
    .replace(/\{\{콘텐츠코드\}\}/g, vars.code)
    .replace(/\{\{마감일\}\}/g, vars.deadline ? formatDate(vars.deadline) : '(마감일 미정)');
}

const STATUS_META = ASSET_STATUS_META;

const GRADE_ORDER: AssetGrade[] = ['초등 저학년', '초등 고학년', '중학생', '고등학생', '전학년'];
const ENV_LABEL: Record<AssetEnvType, string> = { indoor: '실내형', outdoor: '실외형', mixed: '혼합형' };
const GROUP_LABEL: Record<AssetGroupType, string> = { solo: '1인용', team: '모둠', class: '단체' };

const CREATOR_TYPE_LABEL: Record<string, string> = {
  original_ug: '유니크굿', original_rp: '레드포인트',
  creator_teacher: '교사', creator_student: '학생', creator_institution: '기관', creator_partners: '파트너스',
};
const CREATOR_STATUS_META: Record<string, { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  active: { label: '활동 중', tone: 'green' },
  pending: { label: '승인 대기', tone: 'amber' },
  inactive: { label: '비활성', tone: 'gray' },
};

// ── 콘텐츠 자산 추가/수정 폼 ──
const EMPTY_ASSET: ContentAsset = {
  id: '', code: '', title: '', description: '',
  creatorName: '', creatorEmail: '', institution: '',
  submittedDate: new Date().toISOString().slice(0, 10),
  grade: '초등 고학년', envType: 'indoor', groupType: 'team',
  category: ALL_CATEGORY_OPTIONS[0].value, price: 0, status: 'first_review_pending',
  kind: 'original',
  studioProjectId: '', planPptUrl: '', planDocUrl: '', guideUrl: '',
  mockAiIssues: [],
};

const ASSET_FIELDS: FieldDef<ContentAsset>[] = [
  { key: 'title', label: '콘텐츠명', required: true, colSpan: 2 },
  { key: 'code', label: '코드', required: true, placeholder: '예: CA-024' },
  { key: 'kind', label: '콘텐츠 구분', type: 'select', required: true, options: (['original', 'personal'] as ContentKind[]).map(v => ({ value: v, label: CONTENT_KIND_META[v].label })) },
  { key: 'category', label: '카테고리', type: 'select', required: true, options: ALL_CATEGORY_OPTIONS },
  { key: 'creatorName', label: '크리에이터', required: true },
  { key: 'creatorEmail', label: '크리에이터 이메일', required: true },
  { key: 'institution', label: '소속' },
  { key: 'grade', label: '학년', type: 'select', options: GRADE_ORDER.map(g => ({ value: g, label: g })) },
  { key: 'envType', label: '환경 유형', type: 'select', options: (['indoor', 'outdoor', 'mixed'] as AssetEnvType[]).map(v => ({ value: v, label: ENV_LABEL[v] })) },
  { key: 'groupType', label: '참여 유형', type: 'select', options: (['solo', 'team', 'class'] as AssetGroupType[]).map(v => ({ value: v, label: GROUP_LABEL[v] })) },
  { key: 'price', label: '가격 (원)', type: 'number' },
  { key: 'submittedDate', label: '제출일', type: 'date' },
  { key: 'studioProjectId', label: '스튜디오 프로젝트 ID', colSpan: 2, placeholder: '스튜디오 바로가기 링크에 사용' },
  { key: 'planPptUrl', label: '기획서(PPT) 링크 (오리지널)', colSpan: 2 },
  { key: 'planDocUrl', label: '기획서(Word) 링크 (오리지널)', colSpan: 2 },
  { key: 'guideUrl', label: '운영 가이드 링크 (오리지널)', colSpan: 2 },
  { key: 'description', label: '설명', type: 'textarea', colSpan: 2 },
];

// ── 크리에이터 정보 모달 (검수 화면에서 제출자 정보를 바로 확인) ──
function CreatorInfoModal({ asset, creator, onClose }: {
  asset: ContentAsset; creator?: Creator; onClose: () => void;
}) {
  const name = asset.creatorName;
  const email = asset.creatorEmail;
  const institution = creator?.institution ?? asset.institution;
  return (
    <Modal title="크리에이터 정보" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
            <UserRound size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-gray-900">{name}</p>
              {creator && <StatusBadge label={CREATOR_TYPE_LABEL[creator.type] ?? creator.type} tone="violet" />}
              {creator && <StatusBadge label={CREATOR_STATUS_META[creator.status].label} tone={CREATOR_STATUS_META[creator.status].tone} />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Mail size={12} /> {email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoCell icon={Building2} label="소속" value={institution || '—'} />
          {creator ? (
            <>
              <InfoCell label="등록 콘텐츠" value={`${creator.contentCount}개`} />
              <InfoCell label="누적 판매액" value={creator.totalRevenue > 0 ? formatCompactWon(creator.totalRevenue) : '—'} />
              <InfoCell label="정산 대기" value={creator.pendingSettlement > 0 ? formatCompactWon(creator.pendingSettlement) : '—'} />
              <InfoCell label="가입일" value={formatDate(creator.joinedDate)} />
              <InfoCell label="최근 활동" value={formatDate(creator.lastActiveDate)} />
            </>
          ) : (
            <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              크리에이터 목록에 등록되지 않은 제출자입니다. (이메일 기준 미매칭)
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Link
            to={`/creators?q=${encodeURIComponent(name)}`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 transition-colors"
          >
            크리에이터 관리에서 보기 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-400 flex items-center gap-1">{Icon && <Icon size={11} />}{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

// ── 상단 통계 그라데이션 카드 ──
function HubStatCard({ label, value, icon: Icon, gradient }: {
  label: string; value: string; icon: React.ElementType; gradient: string;
}) {
  return (
    <div className={clsx('relative rounded-2xl p-5 text-white overflow-hidden', gradient)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <Icon size={20} className="text-white/70" />
      </div>
      <p className="text-3xl font-bold mt-3 tracking-tight">{value}</p>
    </div>
  );
}

const HUB_TABS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'list',      label: '콘텐츠 목록',   icon: BookOpen },
  { value: 'dev',       label: '콘텐츠 개발',   icon: GitBranch },
  { value: 'review',    label: '심사 관리',     icon: ClipboardList },
  { value: 'roadmap',   label: '개발 로드맵',   icon: TrendingUp },
  { value: 'category',  label: '카테고리 맵',   icon: Layers },
  { value: 'marketing', label: '마케팅·영업',   icon: Megaphone },
  { value: 'analysis',  label: '현황 분석',     icon: BarChart3 },
  { value: 'forms',     label: '서식·계약·MOU', icon: FileText },
];

export default function ContentAssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? 'list';

  const catalog = contentCatalog;
  const total = catalog.length;
  const selling = catalog.filter(c => c.saleStatus === 'selling').length;
  const totalSales = catalog.reduce((a, c) => a + c.purchases, 0);
  const totalRevenue = catalog.reduce((a, c) => a + c.purchases * c.price, 0);
  const rated = catalog.filter(c => c.rating > 0);
  const avgRating = rated.length ? (catalog.reduce((a, c) => a + c.rating, 0) / total) : 0;

  const selectView = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'list') next.delete('view'); else next.set('view', value);
    // 탭 전환 시 하위 필터 파라미터 정리
    ['status', 'q', 'stage', 'sale', 'topic'].forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="콘텐츠 자산 관리"
        description={`디지털 수업콘텐츠 개발·목록·심사·로드맵·서식 통합 관리 · 현재 ${total}개 콘텐츠`}
        right={
          <div className="flex items-center gap-2">
            <Link
              to="/contents"
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen size={15} /> 콘텐츠관리로
            </Link>
            <button
              onClick={() => selectView('dev')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusCircle size={15} /> 신규 개발 등록
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <HubStatCard label="전체 콘텐츠" value={`${total}개`} icon={BookOpen} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <HubStatCard label="판매중" value={`${selling}개`} icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <HubStatCard label="누적 판매" value={`${totalSales.toLocaleString()}건`} icon={ShoppingCart} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <HubStatCard label="누적 매출" value={formatCompactWon(totalRevenue)} icon={DollarSign} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
        <HubStatCard label="평균 평점" value={`⭐ ${avgRating.toFixed(2)}`} icon={Star} gradient="bg-gradient-to-br from-rose-500 to-pink-600" />
      </div>

      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-5 overflow-x-auto">
        {HUB_TABS.map(t => {
          const Icon = t.icon;
          const active = view === t.value;
          return (
            <button
              key={t.value}
              onClick={() => selectView(t.value)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                active ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>

      {view === 'list' && <CatalogListTab catalog={catalog} />}
      {view === 'dev' && <DevProcessTab catalog={catalog} />}
      {view === 'review' && <PipelineTab />}
      {view === 'roadmap' && <RoadmapTab catalog={catalog} />}
      {view === 'category' && <CategoryMapTab catalog={catalog} />}
      {view === 'marketing' && <MarketingTab catalog={catalog} />}
      {view === 'analysis' && <StatusAnalysisTab catalog={catalog} />}
      {view === 'forms' && <FormsTab />}
    </div>
  );
}

// ═══════════════ 콘텐츠 자산 허브 — 공용 상수/헬퍼 ═══════════════
const DEV_STAGE_META: Record<DevStage, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet' }> = {
  planning:       { label: '기획',    tone: 'gray' },
  developing:     { label: '개발중',  tone: 'blue' },
  review_1:       { label: '1차검수', tone: 'violet' },
  review_2:       { label: '2차검수', tone: 'violet' },
  final_approval: { label: '최종승인', tone: 'amber' },
  released:       { label: '출시완료', tone: 'green' },
  on_hold:        { label: '보류',    tone: 'red' },
};
const SALE_STATUS_META: Record<SaleStatus, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  selling:   { label: '판매중',   tone: 'green' },
  preparing: { label: '판매준비', tone: 'amber' },
  suspended: { label: '판매중지', tone: 'red' },
  free:      { label: '무료배포', tone: 'blue' },
  internal:  { label: '내부전용', tone: 'gray' },
};
const TOPIC_OPTIONS = [
  '건강증진/감염병', '기후행동/생태환경', '다문화/세계시민', '민주시민/인권',
  '역사 계기교육', '정보/디지털 리터러시', '학교폭력 예방/인성',
];

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-primary-400"
    >
      {children}
    </select>
  );
}

// ═══════════════ 탭 1: 콘텐츠 목록 ═══════════════
function CatalogListTab({ catalog }: { catalog: Content[] }) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');
  const [sale, setSale] = useState('all');
  const [topic, setTopic] = useState('all');
  const [detail, setDetail] = useState<Content | null>(null);

  const filtered = useMemo(() => catalog.filter(c => {
    if (stage !== 'all' && c.devStage !== stage) return false;
    if (sale !== 'all' && c.saleStatus !== sale) return false;
    if (topic !== 'all' && c.topic !== topic) return false;
    if (query && !`${c.title}${c.code}${c.topic}${c.subject}${c.category ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [catalog, stage, sale, topic, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="콘텐츠명, 코드, 주제, 교과 검색..." className="w-72" />
        <Select value={stage} onChange={setStage}>
          <option value="all">전체 개발단계</option>
          <option value="planning">기획</option>
          <option value="developing">개발중</option>
          <option value="review_1">1차검수</option>
          <option value="review_2">2차검수</option>
          <option value="final_approval">최종승인</option>
          <option value="released">출시완료</option>
        </Select>
        <Select value={sale} onChange={setSale}>
          <option value="all">전체 판매상태</option>
          <option value="selling">판매중</option>
          <option value="preparing">판매준비</option>
          <option value="suspended">판매중지</option>
          <option value="free">무료배포</option>
          <option value="internal">내부전용</option>
        </Select>
        <Select value={topic} onChange={setTopic}>
          <option value="all">전체 주제</option>
          {TOPIC_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ml-auto">
          <Plus size={15} /> 콘텐츠 등록
        </button>
      </div>

      <p className="text-sm text-gray-500">검색 결과: <span className="font-semibold text-gray-800">{filtered.length}개</span></p>

      <Table headers={['코드', '제목', '카테고리', '학년', '가격', '단계', '판매', '판매수', '평점', '액션']}>
        {filtered.length === 0 ? <EmptyRow colSpan={10} /> : filtered.map(c => (
          <tr key={c.id} className="hover:bg-gray-50/60">
            <td className="px-4 py-3 text-xs font-mono text-gray-400 whitespace-nowrap">{c.code}</td>
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{c.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.topic}</p>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.category ?? '—'}</td>
            <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.grade}</td>
            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.price === 0 ? '무료' : formatCurrency(c.price)}</td>
            <td className="px-4 py-3"><StatusBadge label={DEV_STAGE_META[c.devStage].label} tone={DEV_STAGE_META[c.devStage].tone} /></td>
            <td className="px-4 py-3"><StatusBadge label={SALE_STATUS_META[c.saleStatus].label} tone={SALE_STATUS_META[c.saleStatus].tone} /></td>
            <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">{c.purchases.toLocaleString()}</td>
            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.rating > 0 ? `⭐ ${c.rating.toFixed(1)}` : '-'}</td>
            <td className="px-4 py-3">
              <button onClick={() => setDetail(c)} className="px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">상세</button>
            </td>
          </tr>
        ))}
      </Table>

      {detail && <CatalogDetailModal content={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CatalogDetailModal({ content: c, onClose }: { content: Content; onClose: () => void }) {
  return (
    <Modal title={`${c.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">{c.code}</span>
          <StatusBadge label={DEV_STAGE_META[c.devStage].label} tone={DEV_STAGE_META[c.devStage].tone} />
          <StatusBadge label={SALE_STATUS_META[c.saleStatus].label} tone={SALE_STATUS_META[c.saleStatus].tone} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label="카테고리" value={c.category ?? '—'} />
          <InfoCell label="주제" value={c.topic} />
          <InfoCell label="학년" value={c.grade} />
          <InfoCell label="가격" value={c.price === 0 ? '무료' : formatCurrency(c.price)} />
          <InfoCell label="누적 판매" value={`${c.purchases.toLocaleString()}건`} />
          <InfoCell label="평점" value={c.rating > 0 ? `⭐ ${c.rating.toFixed(1)} (${c.reviewCount})` : '—'} />
        </div>
        {typeof c.progress === 'number' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">개발 진행률</span>
              <span className="font-semibold text-gray-800">{c.progress}%</span>
            </div>
            <ProgressBar value={c.progress} />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ═══════════════ 탭 2: 콘텐츠 개발 ═══════════════
const DEV_PROCESS_STEPS = ['기획', '개발', '1차검수(AI)', '2차검수(자문단)', '최종승인', '출시준비', '출시완료'];

function DevProcessTab({ catalog }: { catalog: Content[] }) {
  const inDev = catalog.filter(c => c.devStage !== 'released');
  const stageCount = (s: DevStage) => catalog.filter(c => c.devStage === s).length;

  return (
    <div className="space-y-6">
      <Card title="리얼월드 스쿨 콘텐츠 개발 프로세스 (7단계)">
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
          {DEV_PROCESS_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex-shrink-0 min-w-[110px] rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-3 text-center">
                <p className="text-xs font-bold text-primary-400">STEP {i + 1}</p>
                <p className="text-xs font-semibold text-primary-800 mt-1 whitespace-nowrap">{s}</p>
              </div>
              {i < DEV_PROCESS_STEPS.length - 1 && <ChevronRight size={16} className="text-primary-200 flex-shrink-0 self-center" />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="출시 체크리스트 (35항목)">
          <div className="space-y-2">
            {['기획서·시나리오 최종본 확정', '교육과정 성취기준 매핑 검증', '저작권·개인정보 검토 완료', '교사용 운영 가이드 제작', '베타 테스트 및 피드백 반영'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckSquare size={15} className="text-primary-500 flex-shrink-0" /> {item}
              </div>
            ))}
            <p className="text-xs text-gray-400 pt-1">외 30개 항목 — 서식·계약·MOU 탭에서 전체 확인</p>
          </div>
        </Card>

        <Card title="개발 단계별 현황">
          <div className="space-y-2.5">
            {(['planning', 'developing', 'review_1', 'review_2', 'final_approval'] as DevStage[]).map(s => {
              const n = stageCount(s);
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500 flex-shrink-0">{DEV_STAGE_META[s].label}</span>
                  <ProgressBar value={inDev.length ? (n / Math.max(1, inDev.length)) * 100 : 0} className="flex-1" />
                  <span className="w-8 text-right text-sm font-semibold text-gray-800">{n}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="개발 진행 중 프로젝트 (크리에이터 교류)">
        <div className="space-y-3">
          {inDev.map(c => (
            <div key={c.id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <StatusBadge label={DEV_STAGE_META[c.devStage].label} tone={DEV_STAGE_META[c.devStage].tone} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.code} · {c.topic}</p>
              </div>
              <div className="w-40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">진행률</span>
                  <span className="font-semibold text-gray-700">{c.progress ?? 0}%</span>
                </div>
                <ProgressBar value={c.progress ?? 0} />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 border border-primary-100 text-primary-700 rounded-lg hover:bg-primary-100">
                <Mail size={12} /> 교류
              </button>
            </div>
          ))}
          {inDev.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">개발 진행 중인 프로젝트가 없습니다.</p>}
        </div>
      </Card>

      <a
        href="https://docs.google.com/document" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-primary-300 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">콘텐츠 기획서 샘플 (Google Docs)</p>
          <p className="text-xs text-gray-500 mt-0.5">기획서 샘플을 확인하고 새 콘텐츠 개발에 활용하세요</p>
        </div>
        <ExternalLink size={16} className="text-gray-400" />
      </a>
    </div>
  );
}

// ═══════════════ 탭 4: 개발 로드맵 ═══════════════
const ROADMAP_QUARTERS: { label: string; items: string[] }[] = [
  { label: '2026 Q1 (1~3월)', items: ['수학왕 최후의 도전', 'AI와 함께하는 미래직업탐험'] },
  { label: '2026 Q2 (4~6월)', items: ['AI와 함께하는 미래직업탐험', '기후위기 탐정단', '세계사 탐험대'] },
  { label: '2026 Q3 (7~9월)', items: ['기후위기 탐정단', '세계사 탐험대', '신규 수학 콘텐츠 (예정)'] },
  { label: '2026 Q4 (10~12월)', items: ['세계사 탐험대', '신규 진로 콘텐츠 (예정)', '겨울학기 특집 콘텐츠'] },
];

function RoadmapTab({ catalog }: { catalog: Content[] }) {
  const developing = catalog.filter(c => c.devStage === 'developing').length;
  const planning = catalog.filter(c => c.devStage === 'planning').length;
  const released = catalog.filter(c => c.devStage === 'released').length;

  const pipelineByOwner = [
    { label: '오리지널', desc: '유니크굿·레드포인트 자체 개발', count: catalog.filter(c => c.ownerType.startsWith('original')).length },
    { label: '크리에이터', desc: '교사·학생·기관 크리에이터', count: catalog.filter(c => c.ownerType.startsWith('creator') && c.ownerType !== 'creator_partners').length },
    { label: '파트너스', desc: '외부 파트너 협력 콘텐츠', count: catalog.filter(c => c.ownerType === 'creator_partners').length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="2026년 출시 목표" value="6개" tone="violet" />
        <MiniStat label="현재 개발중" value={`${developing}개`} tone="blue" />
        <MiniStat label="기획 단계" value={`${planning}개`} tone="amber" />
        <MiniStat label="출시 완료 (누적)" value={`${released}개`} tone="green" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ROADMAP_QUARTERS.map(q => (
          <Card key={q.label} title={q.label}>
            <div className="space-y-2">
              {q.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <CalendarClock size={14} className="text-primary-400 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="콘텐츠 유형별 파이프라인">
        <div className="grid sm:grid-cols-3 gap-3">
          {pipelineByOwner.map(p => (
            <div key={p.label} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900">{p.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              <p className="text-2xl font-bold text-primary-700 mt-2">{p.count}<span className="text-sm font-medium text-gray-400 ml-1">건</span></p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'violet' | 'blue' | 'amber' | 'green' }) {
  const toneCls = {
    violet: 'text-violet-700', blue: 'text-blue-700', amber: 'text-amber-700', green: 'text-emerald-700',
  }[tone];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[13px] text-gray-500">{label}</p>
      <p className={clsx('text-2xl font-bold mt-1', toneCls)}>{value}</p>
    </div>
  );
}

// ═══════════════ 탭 5: 카테고리 맵 ═══════════════
function CategoryMapTab({ catalog }: { catalog: Content[] }) {
  const totalSubs = CONTENT_CATEGORY_GROUPS.reduce((a, g) => a + g.subs.length, 0);
  const countFor = (groupKey: string, sub: string) =>
    catalog.filter(c => c.category === `${groupKey}-${sub}` || (groupKey === '창의·예술' && c.category === '창의·예술')).length;
  const groupCount = (groupKey: string) =>
    catalog.filter(c => (c.category ?? '').startsWith(groupKey)).length;

  return (
    <div className="space-y-6">
      <div className="bg-primary-50/60 border border-primary-100 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-primary-900">카테고리 맵 기준: 콘텐츠마스터DB_v3 카테고리맵 시트</p>
        <p className="text-xs text-primary-700/80 mt-0.5">총 {CONTENT_CATEGORY_GROUPS.length}개 대분류 · {totalSubs}개 세부 카테고리 · 현재 {catalog.length}개 콘텐츠 등록</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CONTENT_CATEGORY_GROUPS.map(g => (
          <Card key={g.key} title={g.label} action={<span className="text-xs text-gray-400">{groupCount(g.key)}개</span>}>
            <div className="flex flex-wrap gap-1.5">
              {g.subs.map(sub => {
                const n = g.key === '창의·예술' ? groupCount(g.key) : countFor(g.key, sub);
                return (
                  <span key={sub} className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border',
                    n > 0 ? 'bg-primary-50 border-primary-100 text-primary-700' : 'bg-gray-50 border-gray-100 text-gray-400'
                  )}>
                    {sub}{n > 0 && <span className="font-semibold">{n}</span>}
                  </span>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card title="교육부 6대 핵심역량 (2015/2022 개정 교육과정) 매핑">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CORE_COMPETENCIES.map(comp => (
            <div key={comp.label} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-primary-500" />
                <p className="text-sm font-semibold text-gray-900">{comp.label}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{comp.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════ 탭 6: 마케팅·영업 ═══════════════
function MarketingTab({ catalog }: { catalog: Content[] }) {
  const top10 = [...catalog].sort((a, b) => b.purchases - a.purchases).slice(0, 10);
  const maxSales = top10[0]?.purchases || 1;

  const priceBuckets = [
    { label: '무료', test: (p: number) => p === 0 },
    { label: '~1천원', test: (p: number) => p > 0 && p <= 1000 },
    { label: '~5천원', test: (p: number) => p > 1000 && p <= 5000 },
    { label: '~1만원', test: (p: number) => p > 5000 && p <= 10000 },
    { label: '~2만원', test: (p: number) => p > 10000 && p <= 20000 },
    { label: '2만원+', test: (p: number) => p > 20000 },
  ].map(b => ({ label: b.label, count: catalog.filter(c => b.test(c.price)).length }));
  const maxBucket = Math.max(1, ...priceBuckets.map(b => b.count));

  const byTopic = TOPIC_OPTIONS.map(t => {
    const items = catalog.filter(c => c.topic === t);
    const sales = items.reduce((a, c) => a + c.purchases, 0);
    const avgPrice = items.length ? Math.round(items.reduce((a, c) => a + c.price, 0) / items.length) : 0;
    return { topic: t, count: items.length, sales, avgPrice };
  }).sort((a, b) => b.sales - a.sales);

  return (
    <div className="space-y-6">
      <Card title="TOP 10 판매 콘텐츠">
        <div className="space-y-2.5">
          {top10.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className={clsx('w-6 text-center text-sm font-bold', i < 3 ? 'text-primary-600' : 'text-gray-300')}>{i + 1}</span>
              <span className="w-48 text-sm text-gray-800 truncate flex-shrink-0">{c.title}</span>
              <div className="flex-1"><ProgressBar value={(c.purchases / maxSales) * 100} /></div>
              <span className="w-16 text-right text-sm font-semibold text-gray-700 tabular-nums">{c.purchases.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="가격대별 분포">
          <div className="space-y-2.5">
            {priceBuckets.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-16 text-xs text-gray-500 flex-shrink-0">{b.label}</span>
                <div className="flex-1"><ProgressBar value={(b.count / maxBucket) * 100} /></div>
                <span className="w-8 text-right text-sm font-semibold text-gray-700">{b.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="주제별 평균 단가 · 판매량">
          <div className="space-y-2">
            {byTopic.map(t => (
              <div key={t.topic} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{t.topic}</p>
                  <p className="text-xs text-gray-400">{t.count}개 콘텐츠</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-semibold text-gray-700">{t.avgPrice > 0 ? formatCurrency(t.avgPrice) : '—'}</p>
                  <p className="text-xs text-gray-400">{t.sales.toLocaleString()}건 판매</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════ 탭 7: 현황 분석 ═══════════════
function StatusAnalysisTab({ catalog }: { catalog: Content[] }) {
  const byGrade = groupCountBy(catalog, c => c.grade);
  const byTopic = groupCountBy(catalog, c => c.topic);
  const selling = catalog.filter(c => c.saleStatus === 'selling').length;
  const developing = catalog.filter(c => c.devStage === 'developing').length;
  const planning = catalog.filter(c => c.devStage === 'planning').length;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="학년별 분포">
          <DistributionList data={byGrade} total={catalog.length} />
        </Card>
        <Card title="주제별 분포">
          <DistributionList data={byTopic} total={catalog.length} />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="유형별 현황">
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="판매중" value={selling} />
            <StatBox label="전체" value={catalog.length} />
            <StatBox label="개발중" value={developing} />
            <StatBox label="기획" value={planning} />
          </div>
        </Card>

        <Card title="개발 인사이트">
          <div className="space-y-3">
            <Insight label="수요 높은 주제" text="학교폭력 예방/인성, 정보디지털리터러시 — 우선 개발 추천" />
            <Insight label="주류 형태" text="실내형 (84%) · 1인용 (66%) — 접근성 높아 시장성 우수" />
            <Insight label="학년 기회" text="전학년 대상(44%) 다음으로 초등 특화 콘텐츠 수요 증가 중" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function groupCountBy(items: Content[], keyFn: (c: Content) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach(c => { const k = keyFn(c); map.set(k, (map.get(k) ?? 0) + 1); });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function DistributionList({ data, total }: { data: { label: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 text-xs text-gray-500 flex-shrink-0 truncate">{d.label}</span>
          <div className="flex-1"><ProgressBar value={(d.count / max) * 100} /></div>
          <span className="w-14 text-right text-xs text-gray-500">{d.count}개 · {Math.round((d.count / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function Insight({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

// ═══════════════ 탭 8: 서식·계약·MOU ═══════════════
const FORM_SUBTABS: { value: string; label: string; kinds: ContentForm['kind'][] | null }[] = [
  { value: 'template', label: '서식·템플릿', kinds: null },
  { value: 'mou', label: 'MOU 관리', kinds: ['mou', 'contract'] },
  { value: 'guide', label: '겸직·소득신고 가이드', kinds: ['guide'] },
  { value: 'gov', label: '문서24 공문 연동', kinds: ['gov'] },
];

function FormsTab() {
  const [sub, setSub] = useState('template');
  const active = FORM_SUBTABS.find(s => s.value === sub)!;
  const forms = active.kinds ? contentForms.filter(f => active.kinds!.includes(f.kind)) : contentForms;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {FORM_SUBTABS.map(s => (
          <button
            key={s.value}
            onClick={() => setSub(s.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              sub === s.value ? 'bg-primary-100 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {s.label}
          </button>
        ))}
        <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 ml-auto">
          <Plus size={15} /> 서식 추가
        </button>
      </div>

      <p className="text-sm text-gray-500">총 <span className="font-semibold text-gray-800">{forms.length}개</span> 서식 등록</p>

      <div className="grid md:grid-cols-2 gap-3">
        {forms.map(f => (
          <div key={f.id} className="flex items-start justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                <p className="text-[11px] text-gray-400 mt-1">{f.fileType} · 업데이트 {formatDate(f.updatedDate)}</p>
              </div>
            </div>
            <a
              href="#" onClick={e => e.preventDefault()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex-shrink-0"
            >
              <Download size={13} /> 다운로드
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ 검수 파이프라인 ═══════════════
function DocLink({ href, label, icon: Icon }: { href?: string; label: string; icon: React.ElementType }) {
  if (!href) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gray-50 border border-gray-100 text-gray-300 rounded-lg">
        <Icon size={12} /> {label} 미등록
      </span>
    );
  }
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary-50 border border-primary-100 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
    >
      <Icon size={12} /> {label} <ExternalLink size={10} className="opacity-60" />
    </a>
  );
}

// ── 검수 플로우 스텝 (필터 겸 진행 흐름 시각화) ──
// 색상 원칙: 전 단계 보라 단일 계열, 선택된 단계만 딥퍼플 채움으로 구분
const FLOW_STEPS: { value: string; label: string }[] = [
  { value: 'reviewing', label: '검토 중' },
  { value: 'first_review_pending', label: '1차 검수(AI)' },
  { value: 'reviewer_assignment_pending', label: '검수자 배정' },
  { value: 'second_review_pending', label: '2차 검수' },
  { value: 'revision', label: '수정 요청' },
  { value: 'final_approval_pending', label: '최종 승인 대기' },
  { value: 'approved', label: '검수완료(통과)' },
  { value: 'payment_pending', label: '지급 예정' },
  { value: 'paid', label: '출시 예정' },
  { value: 'released', label: '출시 완료' },
  { value: 'rejected', label: '반려' },
];

/** 1차·2차 수정 요청은 "수정 요청" 하나로 묶어 보여줍니다. */
const REVISION_STATUSES: AssetStatus[] = ['first_revision_requested', 'second_revision_requested'];

const matchesStep = (a: ContentAsset, step: string) =>
  step === 'all' ? true :
  step === 'reviewing' ? IN_REVIEW_STATUSES.includes(a.status) :
  step === 'revision' ? REVISION_STATUSES.includes(a.status) :
  a.status === step;

function ReviewStatusFlow({ assets, current, onSelect }: {
  assets: ContentAsset[]; current: string; onSelect: (value: string) => void;
}) {
  const count = (v: string) => assets.filter(a => matchesStep(a, v)).length;
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {FLOW_STEPS.map((step, i) => {
        const active = current === step.value;
        const n = count(step.value);
        return (
          <React.Fragment key={step.value}>
            <button
              onClick={() => onSelect(step.value)}
              className={clsx(
                'flex-shrink-0 min-w-[112px] rounded-xl border px-3 py-2.5 text-left transition-all',
                active
                  ? 'bg-primary-100 border-primary-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-primary-50/60 hover:border-primary-200'
              )}
            >
              <p className={clsx('text-xs font-semibold whitespace-nowrap', active ? 'text-primary-800' : 'text-gray-600')}>
                {step.label}
              </p>
              <p className={clsx('text-lg font-bold mt-0.5 leading-none', active ? 'text-primary-900' : n > 0 ? 'text-gray-900' : 'text-gray-300')}>
                {n}<span className={clsx('text-xs font-medium ml-0.5', active ? 'text-primary-400' : 'text-gray-400')}>건</span>
              </p>
            </button>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight size={16} className="text-primary-200 flex-shrink-0 self-center" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PipelineTab() {
  const { data: assets, isLoading } = useContentAssets();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  // 분석 탭 등에서 ?q=코드 로 딥링크하면 검색어가 미리 채워집니다
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const toast = useToast();

  const { user } = useSession();
  const { data: creators } = useCreators();
  const { data: advisors } = useAdvisors();
  const { data: knowledgePosts } = useKnowledgePosts();
  const runAi = useRunAiReview();
  const submitScores = useSubmitReviewScores();
  const finalApprove = useFinalApproveAsset();
  const reject = useRejectAsset();
  const saveAsset = useSaveContentAsset();
  const assignAdvisor = useAssignAdvisor();
  const sendReminder = useSendAdvisorReminder();
  const completePayment = useCompletePayment();
  const skipPayment = useSkipPayment();
  const releaseContent = useReleaseContent();
  const sendRevisionReminder = useSendRevisionReminder();
  const markRevisionComplete = useMarkRevisionComplete();

  const [scoring, setScoring] = useState<ContentAsset | null>(null);
  const [editing, setEditing] = useState<ContentAsset | null>(null);
  const [creatorOf, setCreatorOf] = useState<ContentAsset | null>(null);
  const [secondaryOf, setSecondaryOf] = useState<ContentAsset | null>(null);
  const [paymentOf, setPaymentOf] = useState<ContentAsset | null>(null);
  const [releaseOf, setReleaseOf] = useState<ContentAsset | null>(null);
  const [revisionOf, setRevisionOf] = useState<ContentAsset | null>(null);

  const filtered = useMemo(() => {
    if (!assets) return [];
    return assets.filter(a => {
      if (!matchesStep(a, status)) return false;
      if (query && !`${a.title}${a.code}${a.creatorName}${a.institution ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [assets, status, query]);

  if (isLoading || !assets) return <Loading />;

  const selectStatus = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || value === status) next.delete('status');
    else next.set('status', value);
    setSearchParams(next, { replace: true });
  };

  const handleAiReview = (a: ContentAsset) => {
    runAi.mutate(a.id, {
      onSuccess: (res) => {
        if (res.passed) toast.success(`「${a.title}」 1차 검수 통과 — 2차 검수자 배정 대기로 전환되었습니다.`);
        else toast.error(`「${a.title}」 1차 검수에서 ${res.issues.length}건의 문제가 발견되어 수정 요청되었습니다. (크리에이터 이메일 발송)`);
      },
    });
  };

  const handleFinalApprove = (a: ContentAsset, opts?: { skipPayment?: boolean }) => {
    if (a.kind === 'personal') {
      if (!window.confirm(`「${a.title}」를 최종 승인할까요?\n개인 콘텐츠는 지급 단계 없이 출시 예정으로 넘어갑니다.`)) return;
      finalApprove.mutate({ id: a.id, admin: user.name }, {
        onSuccess: () => toast.success('최종 승인되었습니다. 출시 예정으로 이동합니다.'),
      });
      return;
    }

    if (opts?.skipPayment) {
      if (!window.confirm(`「${a.title}」를 최종 승인하고 지급을 스킵할까요?\n(월급 직원 등) 출시 예정으로 바로 넘어갑니다.`)) return;
      finalApprove.mutate({ id: a.id, admin: user.name, skipPayment: true }, {
        onSuccess: () => toast.success('최종 승인·지급 스킵 — 출시 예정으로 이동합니다.'),
      });
      return;
    }

    const hasPayout = !!creatorPayoutByEmail[a.creatorEmail];
    const nextLabel = hasPayout
      ? '지급 정보가 등록되어 있어 바로 지급예정으로 넘어갑니다.'
      : '지급 정보가 없어 검수완료(통과) 상태로 대기하며, 크리에이터에게 개인정보 입력을 요청합니다.';
    if (!window.confirm(`「${a.title}」를 최종 승인할까요?\n${nextLabel}`)) return;
    finalApprove.mutate({ id: a.id, admin: user.name }, {
      onSuccess: (res) => toast.success(
        res.status === 'payment_pending'
          ? '최종 승인되었습니다. 지급 예정 목록으로 이동합니다.'
          : res.status === 'paid'
            ? '최종 승인되었습니다. 출시 예정으로 이동합니다.'
            : '최종 승인되었습니다. 크리에이터 지급 정보 입력을 기다립니다.',
      ),
    });
  };

  const handleSkipPayment = (a: ContentAsset) => {
    const reason = window.prompt(`「${a.title}」 지급 스킵 사유 (선택)\n예: 월급 직원 담당`);
    if (reason === null) return;
    skipPayment.mutate({ id: a.id, admin: user.name, reason: reason.trim() || undefined }, {
      onSuccess: () => toast.success('지급을 스킵하고 출시 예정으로 전환했습니다.'),
    });
  };

  const handleReject = (a: ContentAsset) => {
    const reason = window.prompt(`「${a.title}」 반려 사유를 입력해 주세요.\n입력한 내용은 크리에이터에게 그대로 전달됩니다.`);
    if (!reason) return;
    reject.mutate({ id: a.id, admin: user.name, reason }, {
      onSuccess: () => toast.error('반려 처리되었습니다. (크리에이터 이메일 발송)'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => selectStatus('all')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
              status === 'all'
                ? 'bg-primary-100 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            전체 <span className={clsx('text-xs', status === 'all' ? 'text-primary-500' : 'text-gray-400')}>{assets.length}</span>
          </button>
          <div className="flex items-center gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="제목·코드·크리에이터 검색" />
            <AddButton label="콘텐츠 자산 추가" onClick={() => setEditing({ ...EMPTY_ASSET })} />
          </div>
        </div>
        <ReviewStatusFlow assets={assets} current={status} onSelect={selectStatus} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center text-sm text-gray-400">
            조건에 맞는 검수 건이 없습니다.
          </div>
        )}
        {filtered.map(a => {
          const meta = STATUS_META[a.status];
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <StatusBadge label={CONTENT_KIND_META[a.kind].label} tone={CONTENT_KIND_META[a.kind].tone} />
                    <StatusBadge
                      label={a.status === 'paid' && a.paymentSkipped ? '출시 예정 (지급 없음)' : meta.label}
                      tone={meta.tone}
                    />
                    <StatusBadge label={`${a.category} · ${categoryLabel(a.category)}`} tone="gray" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <button
                      onClick={() => setCreatorOf(a)}
                      className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline"
                    >
                      <UserRound size={11} />{a.creatorName}
                    </button>
                    {a.institution ? ` · ${a.institution}` : ''} · {a.grade} · {ENV_LABEL[a.envType]} · {GROUP_LABEL[a.groupType]} · {formatCurrency(a.price)} · 제출 {formatDate(a.submittedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.status === 'first_review_pending' && (
                    <button
                      onClick={() => handleAiReview(a)}
                      disabled={runAi.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50 transition-colors"
                    >
                      <Sparkles size={13} /> {runAi.isPending ? 'AI 검수 중...' : 'AI 1차 검수 실행'}
                    </button>
                  )}
                  {a.status === 'reviewer_assignment_pending' && (
                    <button
                      onClick={() => setSecondaryOf(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 transition-colors"
                    >
                      <ShieldCheck size={13} /> 2차 검수자 배정
                    </button>
                  )}
                  {a.status === 'second_review_pending' && (
                    <>
                      <button
                        onClick={() => setSecondaryOf(a)}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                          a.advisorAssignment && isOverdue(a.advisorAssignment.deadline)
                            ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50'
                        )}
                      >
                        <ShieldCheck size={13} />
                        {a.advisorAssignment && isOverdue(a.advisorAssignment.deadline) ? '검수 현황 · 마감 경과' : '검수 현황'}
                      </button>
                      {/* 검수자가 직접 채점하는 것이 원칙이며, 여기서는 운영팀 대리 입력용입니다. */}
                      <button
                        onClick={() => setScoring(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <BookOpenCheck size={13} /> 대리 채점
                      </button>
                    </>
                  )}
                  {a.status === 'approved' && needsPayment(a) && (
                    <>
                      <button
                        onClick={() => setPaymentOf(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-200/60 transition-colors"
                      >
                        <CreditCard size={13} /> 지급 정보 현황
                      </button>
                      <button
                        onClick={() => handleSkipPayment(a)}
                        disabled={skipPayment.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Wallet size={13} /> 지급 스킵
                      </button>
                    </>
                  )}
                  {a.status === 'final_approval_pending' && (
                    <>
                      <button
                        onClick={() => handleFinalApprove(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60 transition-colors"
                      >
                        <Gavel size={13} /> {a.kind === 'personal' ? '최종 승인 (지급 없음)' : '최종 승인'}
                      </button>
                      {a.kind === 'original' && (
                        <button
                          onClick={() => handleFinalApprove(a, { skipPayment: true })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                          <Wallet size={13} /> 승인 · 지급 스킵
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={13} /> 반려
                      </button>
                    </>
                  )}
                  {REVISION_STATUSES.includes(a.status) && (
                    <>
                      <button
                        onClick={() => setRevisionOf(a)}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                          a.revisionRequest && isOverdue(a.revisionRequest.deadline)
                            ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-primary-100 border-primary-200 text-primary-700 hover:bg-primary-200/60'
                        )}
                      >
                        <FileEdit size={13} />
                        {a.revisionRequest
                          ? (isOverdue(a.revisionRequest.deadline) ? '수정 현황 · 마감 경과' : '수정 현황')
                          : '수정 현황'}
                      </button>
                    </>
                  )}
                  {a.status === 'payment_pending' && (
                    <>
                      <button
                        onClick={() => setPaymentOf(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 transition-colors"
                      >
                        <Wallet size={13} /> 지급 처리
                      </button>
                      <button
                        onClick={() => handleSkipPayment(a)}
                        disabled={skipPayment.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        지급 스킵
                      </button>
                    </>
                  )}
                  {a.status === 'paid' && (
                    <button
                      onClick={() => setReleaseOf(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60 transition-colors"
                    >
                      <Rocket size={13} /> 출시
                    </button>
                  )}
                  {a.status === 'released' && a.releasedUrl && (
                    <a
                      href={a.releasedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <ExternalLink size={13} /> 출시된 콘텐츠 보기
                    </a>
                  )}
                  {a.status !== 'released' && (
                  <button
                    onClick={() => setEditing(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={13} /> 수정
                  </button>
                  )}
                </div>
              </div>

              {/* 검수용 문서 링크 — 개인 콘텐츠는 기획서·운영가이드 없음 */}
              {a.status !== 'released' ? (
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <DocLink href={a.studioProjectId ? `${STUDIO_BASE}/${a.studioProjectId}` : undefined} label="스튜디오" icon={ExternalLink} />
                {hasPlanDocs(a) && (
                  <>
                    <DocLink href={a.planPptUrl} label="기획서(PPT)" icon={FileType2} />
                    <DocLink href={a.planDocUrl} label="기획서(Word)" icon={FileText} />
                    <DocLink href={a.guideUrl} label="운영 가이드" icon={BookOpenCheck} />
                  </>
                )}
              </div>
              ) : (
              <div className="flex items-center gap-3 flex-wrap mb-3 text-xs text-gray-500">
                <span>출시일 {a.releasedDate ? formatDate(a.releasedDate) : '—'}</span>
                <span>·</span>
                <span>가격 {formatCurrency(a.price)}</span>
                {a.paymentCompletedDate && <><span>·</span><span>지급 완료 {formatDate(a.paymentCompletedDate)}</span></>}
                {a.paymentSkipped && <><span>·</span><span>지급 없음 ({a.kind === 'personal' ? '개인·로열티' : '스킵'})</span></>}
              </div>
              )}

              {/* 검수 이력 */}
              {(a.aiReview || a.advisorAssignment || a.humanReview || a.revisionRequest || a.rejection || a.finalReview) && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {a.advisorAssignment && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium inline-flex items-center gap-1">
                        <ShieldCheck size={12} className="text-primary-500" /> 2차 검수자
                      </span>{' '}
                      <span className="text-gray-700 font-semibold">{a.advisorAssignment.advisorName}</span>
                      <span className="text-gray-400"> · 배정 {formatDate(a.advisorAssignment.assignedDate)}</span>
                      <span className="text-gray-400"> · 마감 {formatDate(a.advisorAssignment.deadline)}</span>
                      {a.status !== 'second_review_pending' ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-gray-500 font-semibold"><CheckCircle2 size={11} /> 검수 완료</span>
                      ) : isOverdue(a.advisorAssignment.deadline) ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle size={11} /> 마감 경과</span>
                      ) : (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-600 font-semibold"><Clock size={11} /> 검수 진행 중</span>
                      )}
                      {a.advisorAssignment.reminderSentDate && (
                        <span className="text-gray-400"> · 리마인드 {formatDate(a.advisorAssignment.reminderSentDate)}{(a.advisorAssignment.reminderCount ?? 0) > 1 ? ` (${a.advisorAssignment.reminderCount}회)` : ''}</span>
                      )}
                    </div>
                  )}
                  {a.revisionRequest && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium inline-flex items-center gap-1">
                        <FileEdit size={12} className="text-red-500" /> 수정 요청
                      </span>{' '}
                      <span className="text-gray-400">요청 {formatDate(a.revisionRequest.requestedDate)}</span>
                      <span className="text-gray-400"> · 마감 {formatDate(a.revisionRequest.deadline)}</span>
                      {isOverdue(a.revisionRequest.deadline) ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle size={11} /> 마감 경과</span>
                      ) : (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-amber-600 font-semibold"><Clock size={11} /> 수정 대기 중</span>
                      )}
                    </div>
                  )}
                  {a.aiReview && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">1차 검수 (AI, {formatDate(a.aiReview.date)})</span>{' '}
                      {a.aiReview.passed
                        ? <span className="text-emerald-600 font-semibold inline-flex items-center gap-1"><CheckCircle2 size={12} /> 통과</span>
                        : <span className="text-red-600 font-semibold inline-flex items-center gap-1"><XCircle size={12} /> 오류 발견</span>}
                      {a.aiReview.issues.length > 0 && (
                        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-500">
                          {a.aiReview.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                  {a.humanReview && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">2차 검수 ({a.humanReview.reviewer}, {formatDate(a.humanReview.date)})</span>{' '}
                      <span className={clsx('font-semibold', a.humanReview.total >= REVIEW_PASS_MARK ? 'text-emerald-600' : 'text-red-600')}>
                        {a.humanReview.total}점 / 100점 {a.humanReview.total >= REVIEW_PASS_MARK ? '(통과)' : '(미달)'}
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {a.humanReview.scores.map(s => {
                          const c = REVIEW_CRITERIA.find(c => c.key === s.key)!;
                          return (
                            <p key={s.key} className="text-gray-500">
                              <span className="text-gray-700 font-medium">{c.label}</span> {s.score}/{c.max} — {s.feedback}
                            </p>
                          );
                        })}
                      </div>
                      {a.humanReview.note && (
                        <p className="mt-1.5 text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                          <span className="font-medium text-gray-700">검수 의견</span> {a.humanReview.note}
                        </p>
                      )}
                    </div>
                  )}
                  {a.finalReview && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">최종 승인</span>{' '}
                      <span className="text-gray-400">{a.finalReview.admin} · {formatDate(a.finalReview.date)}</span>
                      {a.finalReview.note && <span className="text-gray-500"> — {a.finalReview.note}</span>}
                    </p>
                  )}
                  {a.rejection && (
                    <p className="text-xs text-red-600 font-medium">
                      반려 사유: {a.rejection.reason}
                      <span className="text-gray-400 font-normal"> ({a.rejection.admin} · {formatDate(a.rejection.date)})</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scoring && (
        <ReviewScoreModal
          asset={scoring}
          submitting={submitScores.isPending}
          onClose={() => setScoring(null)}
          defaultReviewer={scoring.advisorAssignment?.advisorName}
          onSubmit={(reviewer, scores, note) => {
            submitScores.mutate({ id: scoring.id, reviewer, scores, note }, {
              onSuccess: (res) => {
                setScoring(null);
                if (res.passed) toast.success(`총점 ${res.total}점 — 검수 통과, 최종 승인 대기로 전환되었습니다.`);
                else toast.error(`총점 ${res.total}점 — ${REVIEW_PASS_MARK}점 미달로 수정 요청되었습니다. (크리에이터 이메일 발송)`);
              },
            });
          }}
        />
      )}

      {editing && (
        <EntityFormModal
          title={editing.id ? `콘텐츠 자산 수정 — ${editing.title}` : '콘텐츠 자산 추가'}
          fields={ASSET_FIELDS}
          initial={editing}
          submitting={saveAsset.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) => saveAsset.mutate(values, {
            onSuccess: () => { toast.success(values.id ? '콘텐츠 자산이 수정되었습니다.' : '콘텐츠 자산이 추가되었습니다.'); setEditing(null); },
          })}
        />
      )}

      {creatorOf && (
        <CreatorInfoModal
          asset={creatorOf}
          creator={creators?.find(c => c.email === creatorOf.creatorEmail)}
          onClose={() => setCreatorOf(null)}
        />
      )}

      {secondaryOf && (() => {
        // 배정 후 쿼리 갱신 시 최신 상태를 반영하기 위해 목록에서 다시 조회
        const live = assets.find(a => a.id === secondaryOf.id) ?? secondaryOf;
        return (
          <SecondaryReviewModal
            asset={live}
            advisors={advisors ?? []}
            assignTemplate={knowledgePosts?.find(p => p.title === ASSIGN_TEMPLATE_TITLE)}
            reminderTemplate={knowledgePosts?.find(p => p.title === REMINDER_TEMPLATE_TITLE)}
            assigning={assignAdvisor.isPending}
            reminding={sendReminder.isPending}
            onClose={() => setSecondaryOf(null)}
            onAssign={(assignment) => {
              assignAdvisor.mutate({ id: live.id, assignment }, {
                onSuccess: () => toast.success(`「${live.title}」 2차 검증 자문단(${assignment.advisorName})에게 배정 이메일을 발송했습니다.`),
              });
            }}
            onReminder={(emailSubject, emailBody) => {
              sendReminder.mutate({ id: live.id, emailSubject, emailBody }, {
                onSuccess: () => toast.success(`${live.advisorAssignment?.advisorName ?? '자문단'}에게 리마인드 이메일을 발송했습니다.`),
              });
            }}
          />
        );
      })()}

      {paymentOf && (() => {
        const live = assets.find(a => a.id === paymentOf.id) ?? paymentOf;
        const payout = creatorPayoutByEmail[live.creatorEmail];
        return (
          <PaymentModal
            asset={live}
            payout={payout}
            submitting={completePayment.isPending}
            onClose={() => setPaymentOf(null)}
            onComplete={() => {
              completePayment.mutate(live.id, {
                onSuccess: () => {
                  setPaymentOf(null);
                  toast.success(`「${live.title}」 지급 완료 — 출시 예정으로 전환되었습니다.`);
                },
              });
            }}
          />
        );
      })()}

      {releaseOf && (() => {
        const live = assets.find(a => a.id === releaseOf.id) ?? releaseOf;
        return (
          <ReleaseModal
            asset={live}
            submitting={releaseContent.isPending}
            onClose={() => setReleaseOf(null)}
            onRelease={(price) => {
              releaseContent.mutate({ id: live.id, price }, {
                onSuccess: () => {
                  setReleaseOf(null);
                  toast.success(`「${live.title}」 출시 완료되었습니다.`);
                },
              });
            }}
          />
        );
      })()}

      {revisionOf && (() => {
        const live = assets.find(a => a.id === revisionOf.id) ?? revisionOf;
        return (
          <RevisionStatusModal
            asset={live}
            reminderTemplate={knowledgePosts?.find(p => p.title === REVISION_REMINDER_TEMPLATE_TITLE)}
            reminding={sendRevisionReminder.isPending}
            completing={markRevisionComplete.isPending}
            onClose={() => setRevisionOf(null)}
            onReminder={(emailSubject, emailBody) => {
              sendRevisionReminder.mutate({ id: live.id, emailSubject, emailBody }, {
                onSuccess: () => toast.success(`${live.creatorName}에게 수정 리마인드 이메일을 발송했습니다.`),
              });
            }}
            onMarkComplete={() => {
              if (!window.confirm(`「${live.title}」 수정을 완료 처리할까요?\n1차 검수부터 다시 진행됩니다.`)) return;
              markRevisionComplete.mutate(live.id, {
                onSuccess: () => {
                  setRevisionOf(null);
                  toast.success('수정 완료 처리되었습니다. 1차 검수부터 재시작합니다.');
                },
              });
            }}
          />
        );
      })()}
    </div>
  );
}

// ── 2차 검수 루브릭 채점 모달 (관리자 대리 채점 / 검수자 화면 공용) ──
export function ReviewScoreModal({ asset, submitting, defaultReviewer, lockReviewer, onClose, onSubmit }: {
  asset: ContentAsset; submitting?: boolean;
  /** 검수자 화면에서는 로그인한 검수자 이름으로 고정합니다. */
  defaultReviewer?: string;
  lockReviewer?: boolean;
  onClose: () => void;
  onSubmit: (reviewer: string, scores: CriterionScore[], note: string) => void;
}) {
  const [reviewer, setReviewer] = useState(defaultReviewer ?? '');
  const [selections, setSelections] = useState<Partial<Record<CriterionKey, string>>>({});
  const [note, setNote] = useState('');

  const scores: CriterionScore[] = REVIEW_CRITERIA.map(c => {
    const commentId = selections[c.key];
    const option = commentId
      ? CRITERION_COMMENT_OPTIONS[c.key].find(o => o.id === commentId)
      : undefined;
    return {
      key: c.key,
      score: option?.score ?? 0,
      feedback: option?.label ?? '',
      commentId,
    };
  });

  const total = scores.reduce((a, s) => a + s.score, 0);
  const allSelected = REVIEW_CRITERIA.every(c => !!selections[c.key]);
  const passed = total >= REVIEW_PASS_MARK;

  const selectComment = (key: CriterionKey, commentId: string) => {
    setSelections(prev => ({ ...prev, [key]: commentId }));
  };

  return (
    <Modal title={`2차 검수 — ${asset.title}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">검수자 이름</label>
          <input
            value={reviewer}
            onChange={e => setReviewer(e.target.value)}
            readOnly={lockReviewer}
            placeholder="예: 박준영 선생님"
            className={clsx(
              'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400',
              lockReviewer ? 'bg-gray-50 text-gray-500' : 'bg-white'
            )}
          />
        </div>

        <div className="space-y-4">
          {REVIEW_CRITERIA.map(c => {
            const selectedId = selections[c.key];
            return (
              <div key={c.key} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {c.label} <span className="text-xs text-gray-400 font-normal">({c.desc})</span>
                  </p>
                  <span className={clsx(
                    'text-xs font-semibold px-2 py-0.5 rounded',
                    selectedId ? 'text-primary-700 bg-primary-50' : 'text-gray-400 bg-gray-50'
                  )}>
                    {selectedId ? `${scores.find(s => s.key === c.key)!.score} / ${c.max}점` : `배점 ${c.max}점`}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {CRITERION_COMMENT_OPTIONS[c.key].map(opt => (
                    <label
                      key={opt.id}
                      className={clsx(
                        'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors',
                        selectedId === opt.id
                          ? 'border-primary-300 bg-primary-50/60'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="radio"
                        name={`criterion-${c.key}`}
                        checked={selectedId === opt.id}
                        onChange={() => selectComment(c.key, opt.id)}
                        className="mt-0.5 accent-primary-600"
                      />
                      <span className="flex-1 text-xs text-gray-700 leading-relaxed">{opt.label}</span>
                      <span className={clsx(
                        'text-xs font-medium shrink-0',
                        selectedId === opt.id ? 'text-primary-700' : 'text-gray-400'
                      )}>
                        {opt.score}점
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            검수 의견 <span className="text-gray-400 font-normal">— 이 내용은 크리에이터에게 그대로 전달됩니다.</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="보완이 필요한 부분과 개선 방향을 구체적으로 적어주세요."
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-y"
          />
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          {REVIEW_PASS_MARK}점 이상이면 최종 승인 대기로, 미만이면 크리에이터에게 수정 요청(마감 1주)이 나갑니다.
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-sm">
            총점{' '}
            <span className={clsx('font-bold text-lg ml-1', !allSelected ? 'text-gray-400' : passed ? 'text-emerald-600' : 'text-red-600')}>
              {allSelected ? total : '—'}
            </span>
            <span className="text-gray-400"> / 100</span>
            {allSelected && (
              <span className={clsx('ml-2 font-semibold', passed ? 'text-emerald-600' : 'text-red-600')}>
                {passed ? '통과' : `통과까지 ${REVIEW_PASS_MARK - total}점`}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
            <button
              onClick={() => {
                if (!reviewer.trim()) { alert('검수자 이름을 입력해 주세요.'); return; }
                if (!allSelected) { alert('5개 루브릭 항목 모두 평가를 선택해 주세요.'); return; }
                if (!note.trim()) { alert('검수 의견을 입력해 주세요.'); return; }
                onSubmit(reviewer, scores, note.trim());
              }}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50"
            >
              {submitting ? '처리 중...' : '검수 결과 제출'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── 2차 검증 (자문단 배정 / 리마인드) 모달 ──
function SecondaryReviewModal({
  asset, advisors, assignTemplate, reminderTemplate, assigning, reminding, onClose, onAssign, onReminder,
}: {
  asset: ContentAsset;
  advisors: Advisor[];
  assignTemplate?: KnowledgePost;
  reminderTemplate?: KnowledgePost;
  assigning?: boolean;
  reminding?: boolean;
  onClose: () => void;
  onAssign: (assignment: AdvisorAssignment) => void;
  onReminder: (emailSubject: string, emailBody: string) => void;
}) {
  return (
    <Modal title={`2차 검증 — ${asset.title}`} onClose={onClose} wide>
      <div className="mb-4 flex items-center gap-2 flex-wrap text-xs text-gray-500">
        <StatusBadge label={`${asset.code}`} tone="gray" />
        <span>{asset.creatorName}{asset.institution ? ` · ${asset.institution}` : ''} · {asset.grade}</span>
      </div>
      {asset.advisorAssignment
        ? <AssignedView asset={asset} reminderTemplate={reminderTemplate} reminding={reminding} onReminder={onReminder} onClose={onClose} />
        : <AssignView asset={asset} advisors={advisors} assignTemplate={assignTemplate} assigning={assigning} onAssign={onAssign} onClose={onClose} />}
    </Modal>
  );
}

function EmailNote({ templateTitle }: { templateTitle?: string }) {
  return (
    <p className="text-[11px] text-primary-600 bg-primary-50 border border-primary-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
      <Mail size={12} className="mt-0.5 flex-shrink-0" />
      <span>
        이 본문은 지식 자산의 「{templateTitle ?? '자문단 이메일 양식'}」에서 자동으로 불러왔습니다. 발송 전 수정할 수 있습니다.
      </span>
    </p>
  );
}

// ── 상태 1: 자문단 미배정 → 자문단 선택 + 마감일 + 배정 이메일 ──
function AssignView({ asset, advisors, assignTemplate, assigning, onAssign, onClose }: {
  asset: ContentAsset;
  advisors: Advisor[];
  assignTemplate?: KnowledgePost;
  assigning?: boolean;
  onAssign: (assignment: AdvisorAssignment) => void;
  onClose: () => void;
}) {
  const { data: allAssets } = useContentAssets();
  const [advisorId, setAdvisorId] = useState('');
  const [deadline, setDeadline] = useState(addDaysISO(ASSIGNMENT_DEADLINE_DAYS));

  // 담당 카테고리가 겹치는 검수자를, 진행 중인 배정이 적은 순서로 먼저 보여줍니다.
  const assetGroup = asset.category.charAt(0);
  const activeAdvisors = useMemo(() => {
    const load = (advisorId: string) => (allAssets ?? []).filter(
      x => x.status === 'second_review_pending' && x.advisorAssignment?.advisorId === advisorId
    ).length;
    return advisors
      .filter(a => a.status === 'active')
      .map(a => ({ ...a, load: load(a.id), recommended: a.categories.includes(assetGroup) }))
      .sort((x, y) =>
        Number(y.recommended) - Number(x.recommended) || x.load - y.load || x.name.localeCompare(y.name)
      );
  }, [advisors, allAssets, assetGroup]);
  const [subject, setSubject] = useState(`[리얼월드 스쿨] 「${asset.title}」 콘텐츠 2차 검증 요청`);
  const [body, setBody] = useState('');

  const advisor = activeAdvisors.find(a => a.id === advisorId);
  const templateBody = assignTemplate?.body ?? DEFAULT_ASSIGN_BODY;

  // 자문단·마감일·양식이 바뀌면 이메일 본문을 양식 기준으로 다시 채웁니다.
  useEffect(() => {
    setBody(fillTemplate(templateBody, {
      advisorName: advisor?.name ?? '', title: asset.title, code: asset.code, deadline,
    }));
  }, [advisorId, deadline, templateBody, advisor?.name, asset.title, asset.code]);

  const handleAssign = () => {
    if (!advisor) { alert('배정할 검수자를 선택해 주세요.'); return; }
    if (!deadline) { alert('검수 마감일을 입력해 주세요.'); return; }
    onAssign({
      advisorId: advisor.id,
      advisorName: advisor.name,
      advisorEmail: advisor.email,
      assignedDate: todayISO(),
      deadline,
      emailSubject: subject,
      emailBody: body,
      reminderCount: 0,
    });
  };

  return (
    <div className="space-y-5">
      {/* 자문단 선택 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
          <Users size={13} className="text-primary-500" /> 2차 검수자 선택
        </p>
        <p className="text-[11px] text-gray-400 mb-2">
          {CATEGORY_GROUPS.find(g => g.key === assetGroup)?.name ?? assetGroup} 담당 검수자 중 진행 중인 배정이 적은 순서로 추천했습니다.
        </p>
        {activeAdvisors.length === 0 ? (
          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-6 text-center">
            배정 가능한 검수자가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
            {activeAdvisors.map(adv => {
              const sel = adv.id === advisorId;
              return (
                <button
                  key={adv.id}
                  onClick={() => setAdvisorId(adv.id)}
                  className={clsx(
                    'text-left rounded-xl border px-3 py-2.5 transition-all',
                    sel ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-200' : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-primary-50/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      {adv.name}
                      {adv.recommended && (
                        <span className="text-[10px] font-medium text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">추천</span>
                      )}
                    </p>
                    {sel && <CheckCircle2 size={15} className="text-primary-600 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{adv.affiliation}</p>
                  <p className="text-[11px] text-primary-600 mt-0.5 truncate">{adv.specialty}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 truncate">
                    <Mail size={10} /> {adv.email}
                    <span className="ml-auto flex-shrink-0">진행중 {adv.load}건</span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 마감일 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <CalendarClock size={13} className="text-primary-500" /> 검수 마감일
        </label>
        <input
          type="date"
          value={deadline}
          min={todayISO()}
          onChange={e => setDeadline(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
        />
        <p className="text-[11px] text-gray-400 mt-1">마감일은 배정일 기준 2주가 기본값입니다.</p>
      </div>

      {/* 이메일 미리보기 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <Send size={13} className="text-primary-500" /> 자문단에게 보낼 배정 이메일
          {advisor && <span className="text-gray-400 font-normal">→ {advisor.email}</span>}
        </p>
        <EmailNote templateTitle={assignTemplate?.title} />
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="이메일 제목"
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 text-[13px] leading-relaxed bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-none font-mono"
        />
        <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>검수 페이지 링크(<code className="font-mono">{REVIEW_LINK_PLACEHOLDER}</code>)는 관리자가 직접 삽입하는 자리표시자입니다. 발송 전 실제 링크로 교체하세요.</span>
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
        <button
          onClick={handleAssign}
          disabled={assigning || !advisor}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50"
        >
          <Send size={14} /> {assigning ? '발송 중...' : '배정하고 안내 메일 발송'}
        </button>
      </div>
    </div>
  );
}

// ── 상태 2: 자문단 배정됨 → 배정 정보 + (마감 경과 시) 리마인드 이메일 ──
function AssignedView({ asset, reminderTemplate, reminding, onReminder, onClose }: {
  asset: ContentAsset;
  reminderTemplate?: KnowledgePost;
  reminding?: boolean;
  onReminder: (emailSubject: string, emailBody: string) => void;
  onClose: () => void;
}) {
  const a = asset.advisorAssignment!;
  const overdue = isOverdue(a.deadline);
  const daysLeft = Math.round((new Date(a.deadline).getTime() - new Date(todayISO()).getTime()) / 86_400_000);

  const templateBody = reminderTemplate?.body ?? DEFAULT_REMINDER_BODY;
  const [subject, setSubject] = useState(`[리마인드] 「${asset.title}」 콘텐츠 2차 검증 마감 안내`);
  const [body, setBody] = useState(fillTemplate(templateBody, {
    advisorName: a.advisorName, title: asset.title, code: asset.code, deadline: a.deadline,
  }));

  return (
    <div className="space-y-5">
      {/* 배정된 자문단 */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{a.advisorName}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><Mail size={11} /> {a.advisorEmail}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-primary-100">
            <p className="text-[11px] text-gray-400">배정일</p>
            <p className="text-sm font-semibold text-gray-800">{formatDate(a.assignedDate)}</p>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-primary-100">
            <p className="text-[11px] text-gray-400">검수 마감일</p>
            <p className="text-sm font-semibold text-gray-800">{formatDate(a.deadline)}</p>
          </div>
        </div>
        <div className="mt-3">
          {overdue ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle size={13} /> 마감 {Math.abs(daysLeft)}일 경과 — 리마인드가 필요합니다
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Clock size={13} /> 검수 진행 중 · 마감까지 D-{daysLeft}
            </span>
          )}
          {a.reminderSentDate && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-gray-400">
              <BellRing size={11} /> 최근 리마인드 {formatDate(a.reminderSentDate)}{(a.reminderCount ?? 0) > 1 ? ` (총 ${a.reminderCount}회)` : ''}
            </span>
          )}
        </div>
      </div>

      {/* 발송된 배정 이메일 */}
      <details className="rounded-xl border border-gray-200 bg-gray-50/60 group">
        <summary className="px-3 py-2.5 text-xs font-medium text-gray-600 cursor-pointer flex items-center gap-1.5 select-none">
          <Mail size={13} className="text-gray-400" /> 발송된 배정 이메일 보기
          <ChevronRight size={13} className="ml-auto text-gray-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="px-3 pb-3">
          <p className="text-[11px] text-gray-500 mb-1 font-medium">{a.emailSubject}</p>
          <div className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap bg-white border border-gray-100 rounded-lg p-3">{a.emailBody}</div>
        </div>
      </details>

      {/* 리마인드 이메일 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <BellRing size={13} className="text-primary-500" /> 리마인드 이메일
          <span className="text-gray-400 font-normal">→ {a.advisorEmail}</span>
        </p>
        {!overdue ? (
          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-3 flex items-center gap-1.5">
            <Clock size={13} /> 마감일({formatDate(a.deadline)})이 지난 후에 리마인드 이메일을 보낼 수 있습니다.
          </p>
        ) : (
          <>
            <EmailNote templateTitle={reminderTemplate?.title} />
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="이메일 제목"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={11}
              className="w-full px-3 py-2 text-[13px] leading-relaxed bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-none font-mono"
            />
            <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>검수 페이지 링크(<code className="font-mono">{REVIEW_LINK_PLACEHOLDER}</code>)는 발송 전 실제 링크로 교체하세요.</span>
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">닫기</button>
        <button
          onClick={() => onReminder(subject, body)}
          disabled={!overdue || reminding}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BellRing size={14} /> {reminding ? '발송 중...' : '리마인드 이메일 발송'}
        </button>
      </div>
    </div>
  );
}

// ── 지급 예정 모달 ──
function PaymentModal({ asset, payout, submitting, onClose, onComplete }: {
  asset: ContentAsset;
  payout?: CreatorPayoutInfo;
  submitting?: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <Modal title={`지급 처리 — ${asset.title}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
          <p className="text-sm font-bold text-gray-900">{asset.creatorName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{asset.institution ?? asset.creatorEmail} · {asset.code}</p>
          <p className="text-sm font-semibold text-primary-700 mt-2">지급 예정액 {formatCurrency(asset.price)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Wallet size={13} className="text-primary-500" /> 크리에이터 지급 정보
          </p>
          {payout ? (
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><CreditCard size={11} /> 주민등록번호</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 font-mono">{payout.residentId}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={11} /> 주소</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{payout.address}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><Building2 size={11} /> 입금 계좌</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{payout.bankAccount}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-3 mt-2">
              등록된 지급 정보가 없습니다. 크리에이터 관리에서 정보를 확인해 주세요.
            </p>
          )}
        </div>

        <p className="text-[11px] text-gray-400">
          실제 계좌 이체 후 아래 버튼을 눌러 지급 완료를 기록하세요. (현재 mock — 실제 이체는 수동 처리)
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
          <button
            onClick={onComplete}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60 disabled:opacity-50"
          >
            <CheckSquare size={14} /> {submitting ? '처리 중...' : '지급 완료'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── 출시 예정 모달 ──
function ReleaseModal({ asset, submitting, onClose, onRelease }: {
  asset: ContentAsset;
  submitting?: boolean;
  onClose: () => void;
  onRelease: (price: number) => void;
}) {
  const [price, setPrice] = useState(asset.price);

  return (
    <Modal title={`콘텐츠 출시 — ${asset.title}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-sm font-bold text-gray-900">{asset.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{asset.code} · {asset.creatorName} · {asset.grade}</p>
          {asset.paymentSkipped && (
            <p className="text-xs text-gray-500 mt-2">지급 없음 — {asset.kind === 'personal' ? '개인 콘텐츠(실적 로열티)' : '운영자 스킵'}</p>
          )}
          {asset.paymentCompletedDate && (
            <p className="text-xs text-emerald-700 mt-2">지급 완료일 {formatDate(asset.paymentCompletedDate)}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Wallet size={13} className="text-primary-500" /> 출시 가격 (원)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={e => setPrice(Number(e.target.value) || 0)}
            className="w-full sm:w-56 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">출시 전 최종 판매 가격을 확인·수정하세요.</p>
        </div>

        <p className="text-[11px] text-gray-400">
          출시 시 콘텐츠 스토어에 등록되며 출시 완료 상태로 전환됩니다. (현재 mock)
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
          <button
            onClick={() => onRelease(price)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-200/60 disabled:opacity-50"
          >
            <Rocket size={14} /> {submitting ? '출시 중...' : '출시'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── 수정 현황 모달 ──
function RevisionStatusModal({ asset, reminderTemplate, reminding, completing, onClose, onReminder, onMarkComplete }: {
  asset: ContentAsset;
  reminderTemplate?: KnowledgePost;
  reminding?: boolean;
  completing?: boolean;
  onClose: () => void;
  onReminder: (emailSubject: string, emailBody: string) => void;
  onMarkComplete: () => void;
}) {
  const rev: RevisionRequest = asset.revisionRequest ?? {
    requestedDate: asset.humanReview?.date ?? asset.aiReview?.date ?? todayISO(),
    deadline: addDaysISO(REVISION_DEADLINE_DAYS),
    stage: asset.status === 'first_revision_requested' ? 'first' : 'second',
  };
  const overdue = isOverdue(rev.deadline);
  const daysLeft = Math.round((new Date(rev.deadline).getTime() - new Date(todayISO()).getTime()) / 86_400_000);

  const templateBody = reminderTemplate?.body ?? DEFAULT_REVISION_REMINDER_BODY;
  const [subject, setSubject] = useState(`[리마인드] 「${asset.title}」 수정 요청 마감 안내`);
  const [body, setBody] = useState(fillRevisionTemplate(templateBody, {
    creatorName: asset.creatorName, title: asset.title, code: asset.code, deadline: rev.deadline,
  }));

  return (
    <Modal title={`수정 현황 — ${asset.title}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <FileEdit size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{asset.creatorName}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><Mail size={11} /> {asset.creatorEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-white rounded-lg px-3 py-2 border border-red-100">
              <p className="text-[11px] text-gray-400">수정 요청일</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(rev.requestedDate)}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 border border-red-100">
              <p className="text-[11px] text-gray-400">수정 마감일</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(rev.deadline)}</p>
            </div>
          </div>
          <div className="mt-3">
            {overdue ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle size={13} /> 마감 {Math.abs(daysLeft)}일 경과 — 리마인드가 필요합니다
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                <Clock size={13} /> 수정 대기 중 · 마감까지 D-{daysLeft}
              </span>
            )}
            {rev.reminderSentDate && (
              <span className="ml-2 text-[11px] text-gray-400">
                최근 리마인드 {formatDate(rev.reminderSentDate)}{(rev.reminderCount ?? 0) > 1 ? ` (총 ${rev.reminderCount}회)` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 수정 요청 사유 */}
        {(asset.humanReview || asset.aiReview) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">수정 요청 사유</p>
            {asset.humanReview && asset.humanReview.total < 80 && (
              <p>2차 심사 미달 ({asset.humanReview.total}점) — 기준별 피드백이 크리에이터에게 전달되었습니다.</p>
            )}
            {asset.aiReview && !asset.aiReview.passed && asset.aiReview.issues.length > 0 && (
              <ul className="list-disc ml-4 space-y-0.5">
                {asset.aiReview.issues.map((iss, i) => <li key={i}>{iss}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* 리마인드 이메일 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <BellRing size={13} className="text-primary-500" /> 리마인드 이메일
            <span className="text-gray-400 font-normal">→ {asset.creatorEmail}</span>
          </p>
          {!overdue ? (
            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-3 flex items-center gap-1.5">
              <Clock size={13} /> 마감일({formatDate(rev.deadline)})이 지난 후에 리마인드 이메일을 보낼 수 있습니다.
            </p>
          ) : (
            <>
              <EmailNote templateTitle={reminderTemplate?.title ?? '크리에이터 수정 요청 리마인드'} />
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-[13px] leading-relaxed bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-none font-mono"
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={onMarkComplete}
            disabled={completing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 disabled:opacity-50"
          >
            <CheckSquare size={14} /> {completing ? '처리 중...' : '수정 완료 (수동 표시)'}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">닫기</button>
            <button
              onClick={() => onReminder(subject, body)}
              disabled={!overdue || reminding}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BellRing size={14} /> {reminding ? '발송 중...' : '리마인드 이메일 발송'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════ 분석 탭 ═══════════════
// 구조: 좌측 = 분포 차트(세그먼트 클릭 가능) / 우측 = 선택된 항목의 콘텐츠 리스트 패널
// 색상 원칙: 상태 = 시맨틱 색(항상 라벨 동반), 서열형(학년·참여 규모) = 보라 단일 색조 램프

type DimKey = 'status' | 'grade' | 'env' | 'group' | 'category';
type Selection = { dim: DimKey; key: string; label: string } | null;
type Slice = { key: string; label: string; value: number; color: string };

const DIM_LABEL: Record<DimKey, string> = {
  status: '심사 현황', grade: '학년', env: '환경 유형', group: '참여 규모', category: '카테고리',
};

// 상태 4분류 (검토중 = 1차·2차·최종 대기 통합)
type StatusGroup = 'reviewing' | 'revision' | 'released' | 'rejected';
const statusGroupOf = (a: ContentAsset): StatusGroup =>
  REVISION_STATUSES.includes(a.status) ? 'revision'
  : a.status === 'rejected' ? 'rejected'
  : (['released', 'paid', 'payment_pending', 'approved'] as AssetStatus[]).includes(a.status) ? 'released'
  : 'reviewing';

const STATUS_GROUP_META: Record<StatusGroup, { label: string; color: string }> = {
  reviewing: { label: '검토 중', color: '#f59e0b' },
  revision:  { label: '수정 요청', color: '#ef4444' },
  released:  { label: '출시 완료', color: '#10b981' },
  rejected:  { label: '반려', color: '#9ca3af' },
};

const matchSelection = (a: ContentAsset, sel: NonNullable<Selection>): boolean => {
  switch (sel.dim) {
    case 'status': return statusGroupOf(a) === sel.key;
    case 'grade': return a.grade === sel.key;
    case 'env': return a.envType === sel.key;
    case 'group': return a.groupType === sel.key;
    case 'category': return a.category === sel.key;
  }
};

// ── 도넛 차트 (SVG, 세그먼트 클릭 가능) ──
function DonutChart({ data, selection, dim, onSelect, size = 132 }: {
  data: Slice[]; selection: Selection; dim: DimKey;
  onSelect: (sel: Selection) => void; size?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const stroke = 20;
  const r = (size - stroke) / 2 - 4; // 선택 시 스트로크 확장(+4)이 잘리지 않도록 여백 확보
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const dimmed = selection !== null && selection.dim === dim;

  return (
    <div className="relative flex-shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
          {total > 0 && data.map(d => {
            if (d.value <= 0) return null;
            const len = (d.value / total) * C;
            const isSel = selection?.dim === dim && selection.key === d.key;
            const seg = (
              <circle
                key={d.key}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={isSel ? stroke + 4 : stroke}
                strokeDasharray={`${Math.max(len - 2, 1)} ${C - Math.max(len - 2, 1)}`}
                strokeDashoffset={-offset}
                className="cursor-pointer transition-all"
                opacity={dimmed && !isSel ? 0.3 : 1}
                onClick={() => onSelect(isSel ? null : { dim, key: d.key, label: d.label })}
              />
            );
            offset += len;
            return seg;
          })}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-gray-900 leading-none">{total}</span>
        <span className="text-[11px] text-gray-400 mt-0.5">건</span>
      </div>
    </div>
  );
}

// ── 세그먼트 상세 행: 건수·비중·승인 완료 수 + 미니 바 (클릭 = 선택) ──
function BreakdownRows({ data, assets, dim, selection, onSelect }: {
  data: Slice[]; assets: ContentAsset[]; dim: DimKey;
  selection: Selection; onSelect: (sel: Selection) => void;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-1 mt-3">
      {data.map(d => {
        const isSel = selection?.dim === dim && selection.key === d.key;
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const releasedCount = assets.filter(a => matchSelection(a, { dim, key: d.key, label: d.label }) && a.status === 'released').length;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(isSel ? null : { dim, key: d.key, label: d.label })}
            className={clsx(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
              isSel ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-gray-50'
            )}
          >
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-gray-700 w-24 truncate">{d.label}</span>
            <span className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
            </span>
            <span className="text-xs text-gray-900 font-semibold tabular-nums w-8 text-right">{d.value}건</span>
            <span className="text-[11px] text-gray-400 tabular-nums w-9 text-right">{pct}%</span>
            <span className="text-[11px] text-emerald-600 tabular-nums w-12 text-right whitespace-nowrap">출시 {releasedCount}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChartCard({ title, data, assets, dim, selection, onSelect }: {
  title: string; data: Slice[]; assets: ContentAsset[]; dim: DimKey;
  selection: Selection; onSelect: (sel: Selection) => void;
}) {
  return (
    <Card title={title}>
      <DonutChart data={data} selection={selection} dim={dim} onSelect={onSelect} />
      <BreakdownRows data={data} assets={assets} dim={dim} selection={selection} onSelect={onSelect} />
    </Card>
  );
}

// ── 우측 패널: 선택된 세그먼트의 콘텐츠 리스트 ──
function SelectionPanel({ assets, selection, onClear }: {
  assets: ContentAsset[]; selection: Selection; onClear: () => void;
}) {
  if (!selection) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
        <BarChart3 size={22} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 font-medium">항목을 선택해 보세요</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          좌측 차트의 조각이나 행, 카테고리 맵의 분류를 클릭하면<br />해당하는 콘텐츠 목록이 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  const matched = assets
    .filter(a => matchSelection(a, selection))
    .sort((x, y) => y.submittedDate.localeCompare(x.submittedDate));
  const byGroup = (g: StatusGroup) => matched.filter(a => statusGroupOf(a) === g).length;
  const priced = matched.filter(a => a.price > 0);
  const avgPrice = priced.length ? Math.round(priced.reduce((s, a) => s + a.price, 0) / priced.length) : 0;
  const scored = matched.filter(a => a.humanReview);
  const avgScore = scored.length ? Math.round(scored.reduce((s, a) => s + (a.humanReview?.total ?? 0), 0) / scored.length) : null;

  return (
    <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-primary-50/60 border-b border-primary-100 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-primary-600 font-semibold">{DIM_LABEL[selection.dim]}</p>
          <p className="text-sm font-bold text-gray-900">{selection.label} <span className="text-gray-400 font-medium">· {matched.length}건</span></p>
        </div>
        <button onClick={onClear} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/70" title="선택 해제">
          <XCircle size={15} />
        </button>
      </div>

      {/* 요약 통계 */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">검토 중 {byGroup('reviewing')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 font-medium">수정 요청 {byGroup('revision')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">출시 완료 {byGroup('released')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">반려 {byGroup('rejected')}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>평균 가격 <b className="text-gray-800">{avgPrice > 0 ? formatCurrency(avgPrice) : '—'}</b></span>
          <span>평균 2차 점수 <b className="text-gray-800">{avgScore !== null ? `${avgScore}점` : '—'}</b></span>
        </div>
      </div>

      {/* 콘텐츠 리스트 */}
      <div className="divide-y divide-gray-50 max-h-[460px] overflow-y-auto">
        {matched.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-gray-400">해당하는 콘텐츠가 없습니다.</p>
        )}
        {matched.map(a => {
          const meta = STATUS_META[a.status];
          return (
            <Link
              key={a.id}
              to={`/content-assets?q=${encodeURIComponent(a.code)}`}
              className="block px-4 py-2.5 hover:bg-gray-50/80 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-gray-900 truncate group-hover:text-primary-700">{a.title}</p>
                <StatusBadge label={meta.label} tone={meta.tone} />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                {a.code} · {a.creatorName} · {a.grade} · 제출 {formatDate(a.submittedDate)}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[11px] text-gray-400">항목을 클릭하면 검수 파이프라인에서 열립니다</p>
      </div>
    </div>
  );
}

// ── 카테고리 맵 (분류 클릭 = 선택) ──
const GROUP_STYLES: Record<string, { border: string; headerBg: string; text: string; circle: string }> = {
  blue:    { border: 'border-blue-200',    headerBg: 'bg-blue-50/60',    text: 'text-blue-700',    circle: 'bg-blue-600' },
  violet:  { border: 'border-violet-200',  headerBg: 'bg-violet-50/60',  text: 'text-violet-700',  circle: 'bg-violet-600' },
  rose:    { border: 'border-rose-200',    headerBg: 'bg-rose-50/60',    text: 'text-rose-700',    circle: 'bg-rose-500' },
  emerald: { border: 'border-emerald-200', headerBg: 'bg-emerald-50/60', text: 'text-emerald-700', circle: 'bg-emerald-600' },
};

function CategoryMap({ assets, selection, onSelect }: {
  assets: ContentAsset[]; selection: Selection; onSelect: (sel: Selection) => void;
}) {
  const countOf = (code: string) => assets.filter(a => a.category === code).length;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {CATEGORY_GROUPS.map(group => {
        const style = GROUP_STYLES[group.color];
        return (
          <div key={group.key} className={clsx('rounded-2xl border p-4', style.border, style.headerBg)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={clsx('w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center', style.circle)}>
                  {group.key}
                </span>
                <p className={clsx('text-sm font-bold', style.text)}>{group.key}. {group.name}</p>
              </div>
              <span className="text-xs text-gray-400">{group.items.length}개 분류</span>
            </div>
            <div className="space-y-1.5">
              {group.items.map(item => {
                const count = countOf(item.code);
                const isSel = selection?.dim === 'category' && selection.key === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => onSelect(isSel ? null : { dim: 'category', key: item.code, label: `${item.code} ${item.label}` })}
                    className={clsx(
                      'w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all',
                      isSel ? 'bg-white ring-2 ring-primary-300 shadow-sm' : 'bg-white/70 hover:bg-white hover:shadow-sm'
                    )}
                  >
                    <p className="text-xs text-gray-700">
                      <span className="text-gray-400 font-mono mr-1.5">{item.code}</span>{item.label}
                    </p>
                    <span className={clsx(
                      'w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0',
                      count > 0 ? style.circle : 'bg-gray-300'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 심사 현황 요약 버튼 (클릭 = 파이프라인으로 이동) ──
function StatusNavButton({ to, label, count, hint }: {
  to: string; label: string; count: number; hint?: string;
}) {
  return (
    <Link to={to} className="relative block bg-white border border-gray-200 rounded-xl p-4 group hover:border-primary-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">{label}</p>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-2xl font-bold mt-1 text-gray-900">{count}건</p>
      <p className="text-xs text-gray-400 mt-1">{hint ?? '파이프라인에서 보기'}</p>
    </Link>
  );
}

function AssetAnalyticsTab() {
  const { data: assets, isLoading } = useContentAssets();
  const [selection, setSelection] = useState<Selection>(null);

  if (isLoading || !assets) return <Loading />;

  const byGroup = (g: StatusGroup) => assets.filter(a => statusGroupOf(a) === g).length;

  const statusData: Slice[] = (Object.keys(STATUS_GROUP_META) as StatusGroup[]).map(g => ({
    key: g, label: STATUS_GROUP_META[g].label, value: byGroup(g), color: STATUS_GROUP_META[g].color,
  }));

  // 학년·참여 규모는 서열형 → 보라 단일 색조 램프 (전학년은 중립 회색)
  const GRADE_COLORS = ['#ddc0ff', '#a561ff', '#8c30ff', '#6200cc', '#9ca3af'];
  const gradeData: Slice[] = GRADE_ORDER.map((g, i) => ({
    key: g, label: g, value: assets.filter(a => a.grade === g).length, color: GRADE_COLORS[i],
  }));

  const ENV_COLORS: Record<AssetEnvType, string> = { indoor: '#7800ff', outdoor: '#ff6b35', mixed: '#3a8afd' };
  const envData: Slice[] = (['indoor', 'outdoor', 'mixed'] as AssetEnvType[]).map(e => ({
    key: e, label: ENV_LABEL[e], value: assets.filter(a => a.envType === e).length, color: ENV_COLORS[e],
  }));

  const GROUP_COLORS: Record<AssetGroupType, string> = { solo: '#ddc0ff', team: '#a561ff', class: '#7800ff' };
  const groupData: Slice[] = (['solo', 'team', 'class'] as AssetGroupType[]).map(g => ({
    key: g, label: GROUP_LABEL[g], value: assets.filter(a => a.groupType === g).length, color: GROUP_COLORS[g],
  }));

  return (
    <div className="space-y-5">
      {/* 심사 현황 요약 — 클릭 시 파이프라인으로 이동 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusNavButton to="/content-assets?status=reviewing" label="검토 중" count={byGroup('reviewing')} hint="1차·2차·최종 승인 대기" />
        <StatusNavButton to="/content-assets?status=revision" label="수정 요청" count={byGroup('revision')} />
        <StatusNavButton to="/content-assets?status=released" label="출시 완료" count={byGroup('released')} />
        <StatusNavButton to="/content-assets?status=rejected" label="반려" count={byGroup('rejected')} />
      </div>

      {/* 좌: 분포 차트 / 우: 선택 리스트 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="심사 현황 분포" data={statusData} assets={assets} dim="status" selection={selection} onSelect={setSelection} />
            <ChartCard title="학년별 분포" data={gradeData} assets={assets} dim="grade" selection={selection} onSelect={setSelection} />
            <ChartCard title="유형별 분포 — 환경" data={envData} assets={assets} dim="env" selection={selection} onSelect={setSelection} />
            <ChartCard title="유형별 분포 — 참여 규모" data={groupData} assets={assets} dim="group" selection={selection} onSelect={setSelection} />
          </div>

          <Card title="카테고리 분포 — 분류를 클릭하면 해당 콘텐츠가 우측에 표시됩니다">
            <CategoryMap assets={assets} selection={selection} onSelect={setSelection} />
          </Card>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-4">
          <SelectionPanel assets={assets} selection={selection} onClear={() => setSelection(null)} />
        </div>
      </div>
    </div>
  );
}
