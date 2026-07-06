import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ClipboardList, BarChart3, ExternalLink, FileText, FileType2, BookOpenCheck,
  Sparkles, CheckCircle2, XCircle, RotateCcw, Gavel, Pencil, UserRound, Mail, Building2, ArrowRight, ChevronRight,
} from 'lucide-react';
import {
  useContentAssets, useCreators, useSaveContentAsset, useRunAiReview, useSubmitReviewScores,
  useFinalApproveAsset, useRejectAsset, useResubmitAsset,
} from '../api';
import type { ContentAsset, AssetStatus, CriterionScore, AssetGrade, AssetEnvType, AssetGroupType, Creator } from '../api/types';
import { REVIEW_CRITERIA } from '../api/types';
import {
  PageHeader, StatusBadge, Card, SearchInput, Loading, AddButton,
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

const STATUS_META: Record<AssetStatus, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet' }> = {
  ai_review: { label: '1차 검수 (AI)', tone: 'blue' },
  human_review: { label: '2차 검수', tone: 'amber' },
  final_approval: { label: '최종 승인 대기', tone: 'violet' },
  revision: { label: '수정 요청', tone: 'red' },
  approved: { label: '승인 완료', tone: 'green' },
  rejected: { label: '반려', tone: 'gray' },
};

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
  category: ALL_CATEGORY_OPTIONS[0].value, price: 0, status: 'ai_review',
  studioProjectId: '', planPptUrl: '', planDocUrl: '', guideUrl: '',
  mockAiIssues: [],
};

const ASSET_FIELDS: FieldDef<ContentAsset>[] = [
  { key: 'title', label: '콘텐츠명', required: true, colSpan: 2 },
  { key: 'code', label: '코드', required: true, placeholder: '예: CA-024' },
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
  { key: 'planPptUrl', label: '기획서(PPT) 링크', colSpan: 2 },
  { key: 'planDocUrl', label: '기획서(Word) 링크', colSpan: 2 },
  { key: 'guideUrl', label: '운영 가이드 링크', colSpan: 2 },
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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

export default function ContentAssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? 'pipeline';

  return (
    <div>
      <PageHeader
        title="콘텐츠 자산"
        description="검수 단계에 있는 미출시 디지털 콘텐츠를 관리합니다 — 교구·체험은 포함되지 않습니다"
      />

      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-5">
        {[
          { value: 'pipeline', label: '검수 파이프라인', icon: ClipboardList },
          { value: 'analytics', label: '분석', icon: BarChart3 },
        ].map(t => {
          const Icon = t.icon;
          const active = view === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                const next = new URLSearchParams(view === t.value ? searchParams : undefined);
                if (t.value !== 'pipeline') next.set('view', t.value); else next.delete('view');
                setSearchParams(next, { replace: true });
              }}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                active ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>

      {view === 'pipeline' ? <PipelineTab /> : <AssetAnalyticsTab />}
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
type FlowTone = 'primary' | 'blue' | 'amber' | 'violet' | 'red' | 'green' | 'gray';
const FLOW_STEPS: { value: string; label: string; tone: FlowTone }[] = [
  { value: 'reviewing', label: '검토 중', tone: 'primary' },
  { value: 'ai_review', label: '1차 검수(AI)', tone: 'blue' },
  { value: 'human_review', label: '2차 검수', tone: 'amber' },
  { value: 'final_approval', label: '최종 승인 대기', tone: 'violet' },
  { value: 'revision', label: '수정 요청', tone: 'red' },
  { value: 'approved', label: '승인 완료', tone: 'green' },
  { value: 'rejected', label: '반려', tone: 'gray' },
];
const FLOW_TONE: Record<FlowTone, { bg: string; border: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', ring: 'ring-primary-400' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-400' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-400' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', ring: 'ring-violet-400' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-400' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', ring: 'ring-gray-400' },
};

function ReviewStatusFlow({ assets, current, onSelect }: {
  assets: ContentAsset[]; current: string; onSelect: (value: string) => void;
}) {
  const countBy = (s: AssetStatus) => assets.filter(a => a.status === s).length;
  const count = (v: string) =>
    v === 'reviewing' ? countBy('ai_review') + countBy('human_review') + countBy('final_approval') : countBy(v as AssetStatus);
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {FLOW_STEPS.map((step, i) => {
        const t = FLOW_TONE[step.tone];
        const active = current === step.value;
        return (
          <React.Fragment key={step.value}>
            <button
              onClick={() => onSelect(step.value)}
              className={clsx(
                'flex-shrink-0 min-w-[112px] rounded-xl border px-3 py-2.5 text-left transition-all',
                t.bg, t.border,
                active ? clsx('ring-2 ring-offset-1 shadow-sm', t.ring) : 'hover:shadow-sm'
              )}
            >
              <p className={clsx('text-xs font-semibold whitespace-nowrap', t.text)}>{step.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5 leading-none">
                {count(step.value)}<span className="text-xs font-medium text-gray-400 ml-0.5">건</span>
              </p>
            </button>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 self-center" />
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
  const [query, setQuery] = useState('');
  const toast = useToast();

  const { data: creators } = useCreators();
  const runAi = useRunAiReview();
  const submitScores = useSubmitReviewScores();
  const finalApprove = useFinalApproveAsset();
  const reject = useRejectAsset();
  const resubmit = useResubmitAsset();
  const saveAsset = useSaveContentAsset();

  const [scoring, setScoring] = useState<ContentAsset | null>(null);
  const [editing, setEditing] = useState<ContentAsset | null>(null);
  const [creatorOf, setCreatorOf] = useState<ContentAsset | null>(null);

  const filtered = useMemo(() => {
    if (!assets) return [];
    return assets.filter(a => {
      const statusMatch =
        status === 'all' ? true :
        status === 'reviewing' ? ['ai_review', 'human_review', 'final_approval'].includes(a.status) :
        a.status === status;
      if (!statusMatch) return false;
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
        if (res.passed) toast.success(`「${a.title}」 1차 검수 통과 — 2차 심사 대기로 전환되었습니다.`);
        else toast.error(`「${a.title}」 1차 검수에서 ${res.issues.length}건의 문제가 발견되어 수정 요청되었습니다. (크리에이터 이메일 발송)`);
      },
    });
  };

  const handleFinalApprove = (a: ContentAsset) => {
    if (!window.confirm(`「${a.title}」를 최종 승인할까요?\n승인 시 출시 가능 상태로 전환됩니다.`)) return;
    finalApprove.mutate(a.id, { onSuccess: () => toast.success('최종 승인되었습니다.') });
  };

  const handleReject = (a: ContentAsset) => {
    const reason = window.prompt(`「${a.title}」 반려 사유를 입력해 주세요.`);
    if (!reason) return;
    reject.mutate({ id: a.id, reason }, { onSuccess: () => toast.error('반려 처리되었습니다. (크리에이터 이메일 발송)') });
  };

  const handleResubmit = (a: ContentAsset) => {
    if (!window.confirm(`「${a.title}」를 재제출 처리할까요?\n1차 검수부터 다시 진행됩니다.`)) return;
    resubmit.mutate(a.id, { onSuccess: () => toast.success('재제출 처리되었습니다. 1차 검수부터 재시작합니다.') });
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
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            전체 <span className={clsx('text-xs', status === 'all' ? 'text-white/80' : 'text-gray-400')}>{assets.length}</span>
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
                    <StatusBadge label={meta.label} tone={meta.tone} />
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
                  {a.status === 'ai_review' && (
                    <button
                      onClick={() => handleAiReview(a)}
                      disabled={runAi.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      <Sparkles size={13} /> {runAi.isPending ? 'AI 검수 중...' : 'AI 1차 검수 실행'}
                    </button>
                  )}
                  {a.status === 'human_review' && (
                    <button
                      onClick={() => setScoring(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <BookOpenCheck size={13} /> 2차 심사 진행
                    </button>
                  )}
                  {a.status === 'final_approval' && (
                    <>
                      <button
                        onClick={() => handleFinalApprove(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Gavel size={13} /> 최종 승인
                      </button>
                      <button
                        onClick={() => handleReject(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={13} /> 반려
                      </button>
                    </>
                  )}
                  {a.status === 'revision' && (
                    <button
                      onClick={() => handleResubmit(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw size={13} /> 재제출 처리 (1차부터)
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={13} /> 수정
                  </button>
                </div>
              </div>

              {/* 검수용 문서 링크 */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <DocLink href={a.studioProjectId ? `${STUDIO_BASE}/${a.studioProjectId}` : undefined} label="스튜디오" icon={ExternalLink} />
                <DocLink href={a.planPptUrl} label="기획서(PPT)" icon={FileType2} />
                <DocLink href={a.planDocUrl} label="기획서(Word)" icon={FileText} />
                <DocLink href={a.guideUrl} label="운영 가이드" icon={BookOpenCheck} />
              </div>

              {/* 검수 이력 */}
              {(a.aiReview || a.humanReview || a.rejectedReason) && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
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
                      <span className="font-medium">2차 심사 ({a.humanReview.reviewer}, {formatDate(a.humanReview.date)})</span>{' '}
                      <span className={clsx('font-semibold', a.humanReview.total >= 80 ? 'text-emerald-600' : 'text-red-600')}>
                        {a.humanReview.total}점 / 100점 {a.humanReview.total >= 80 ? '(통과)' : '(미달)'}
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {a.humanReview.scores.map(s => {
                          const c = REVIEW_CRITERIA.find(c => c.key === s.key)!;
                          return (
                            <p key={s.key} className="text-gray-500">
                              <span className="text-gray-700 font-medium">{c.label}</span> {s.score}/20 — {s.feedback}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {a.rejectedReason && (
                    <p className="text-xs text-red-600 font-medium">반려 사유: {a.rejectedReason}</p>
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
          onSubmit={(reviewer, scores) => {
            submitScores.mutate({ id: scoring.id, reviewer, scores }, {
              onSuccess: (res) => {
                setScoring(null);
                if (res.passed) toast.success(`총점 ${res.total}점 — 심사 통과, 최종 승인 대기로 전환되었습니다.`);
                else toast.error(`총점 ${res.total}점 — 80점 미달로 수정 요청되었습니다. (크리에이터 이메일 발송)`);
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
    </div>
  );
}

// ── 2차 심사 채점 모달 ──
function ReviewScoreModal({ asset, submitting, onClose, onSubmit }: {
  asset: ContentAsset; submitting?: boolean;
  onClose: () => void;
  onSubmit: (reviewer: string, scores: CriterionScore[]) => void;
}) {
  const [reviewer, setReviewer] = useState('');
  const [scores, setScores] = useState<CriterionScore[]>(
    REVIEW_CRITERIA.map(c => ({ key: c.key, score: 15, feedback: '' }))
  );

  const total = scores.reduce((a, s) => a + s.score, 0);

  const setScore = (key: string, field: 'score' | 'feedback', value: string) => {
    setScores(prev => prev.map(s => s.key === key
      ? { ...s, [field]: field === 'score' ? Math.max(0, Math.min(20, Number(value) || 0)) : value }
      : s
    ));
  };

  return (
    <Modal title={`2차 심사 — ${asset.title}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">심사위원 이름</label>
          <input
            value={reviewer}
            onChange={e => setReviewer(e.target.value)}
            placeholder="예: 김검수"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="space-y-3">
          {REVIEW_CRITERIA.map(c => {
            const s = scores.find(x => x.key === c.key)!;
            return (
              <div key={c.key} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-gray-900">{c.label} <span className="text-xs text-gray-400 font-normal">({c.desc})</span></p>
                  <input
                    type="number" min={0} max={20} value={s.score}
                    onChange={e => setScore(c.key, 'score', e.target.value)}
                    className="w-16 px-2 py-1 text-sm text-right bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                </div>
                <textarea
                  value={s.feedback}
                  onChange={e => setScore(c.key, 'feedback', e.target.value)}
                  placeholder="피드백 (크리에이터에게 이메일로 발송됩니다)"
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-none"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-sm">
            총점 <span className={clsx('font-bold text-lg ml-1', total >= 80 ? 'text-emerald-600' : 'text-red-600')}>{total}</span>
            <span className="text-gray-400"> / 100 · 80점 이상 통과</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
            <button
              onClick={() => {
                if (!reviewer.trim()) { alert('심사위원 이름을 입력해 주세요.'); return; }
                onSubmit(reviewer, scores);
              }}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? '제출 중...' : '심사 결과 제출'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════ 분석 탭 ═══════════════
const GROUP_STYLES: Record<string, { border: string; headerBg: string; text: string; circle: string }> = {
  blue:    { border: 'border-blue-200',    headerBg: 'bg-blue-50/60',    text: 'text-blue-700',    circle: 'bg-blue-600' },
  violet:  { border: 'border-violet-200',  headerBg: 'bg-violet-50/60',  text: 'text-violet-700',  circle: 'bg-violet-600' },
  rose:    { border: 'border-rose-200',    headerBg: 'bg-rose-50/60',    text: 'text-rose-700',    circle: 'bg-rose-500' },
  emerald: { border: 'border-emerald-200', headerBg: 'bg-emerald-50/60', text: 'text-emerald-700', circle: 'bg-emerald-600' },
};

function CategoryMap({ assets }: { assets: ContentAsset[] }) {
  const countOf = (code: string) => assets.filter(a => a.category === code).length;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                return (
                  <div key={item.code} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700">
                      <span className="text-gray-400 font-mono mr-1.5">{item.code}</span>{item.label}
                    </p>
                    <span className={clsx(
                      'w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0',
                      count > 0 ? style.circle : 'bg-gray-300'
                    )}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 원(도넛) 그래프: 의존성 없이 SVG로 그립니다 ──
type PieDatum = { label: string; value: number; color: string };

function DonutChart({ data, size = 148, unit = '건' }: { data: PieDatum[]; size?: number; unit?: string }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
            {total > 0 && data.map((d, i) => {
              if (d.value <= 0) return null;
              const len = (d.value / total) * C;
              const seg = (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900 leading-none">{total}</span>
          <span className="text-[11px] text-gray-400 mt-0.5">{unit}</span>
        </div>
      </div>
      <ul className="space-y-1.5 flex-1 min-w-[150px]">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-gray-600 flex-1 truncate">{d.label}</span>
              <span className="text-gray-400 tabular-nums whitespace-nowrap">{d.value}{unit} · {pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 심사 현황 버튼: 클릭 시 해당 상태로 필터된 파이프라인 리스트로 이동 ──
const STATUS_NAV_TONE: Record<string, string> = {
  amber: 'text-amber-600', red: 'text-red-600', emerald: 'text-emerald-600', gray: 'text-gray-700',
};
function StatusNavButton({ to, label, count, tone, hint }: {
  to: string; label: string; count: number; tone: keyof typeof STATUS_NAV_TONE; hint?: string;
}) {
  return (
    <Link to={to} className="relative block bg-white border border-gray-200 rounded-xl p-4 group hover:border-primary-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">{label}</p>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className={clsx('text-2xl font-bold mt-1', STATUS_NAV_TONE[tone])}>{count}건</p>
      <p className="text-xs text-gray-400 mt-1">{hint ?? '리스트 보기'}</p>
    </Link>
  );
}

function AssetAnalyticsTab() {
  const { data: assets, isLoading } = useContentAssets();
  if (isLoading || !assets) return <Loading />;

  const reviewing = assets.filter(a => ['ai_review', 'human_review', 'final_approval'].includes(a.status)).length;
  const revision = assets.filter(a => a.status === 'revision').length;
  const approved = assets.filter(a => a.status === 'approved').length;
  const rejected = assets.filter(a => a.status === 'rejected').length;

  const GRADE_COLORS = ['#7800ff', '#a561ff', '#3a8afd', '#10b981', '#f59e0b'];
  const ENV_COLORS = ['#2563eb', '#3a8afd', '#93c5fd'];
  const GROUP_COLORS = ['#7800ff', '#a561ff', '#d9baff'];

  const statusData: PieDatum[] = [
    { label: '검토 중', value: reviewing, color: '#f59e0b' },
    { label: '수정 요청', value: revision, color: '#ef4444' },
    { label: '승인 완료', value: approved, color: '#10b981' },
    { label: '반려', value: rejected, color: '#9ca3af' },
  ];
  const gradeData: PieDatum[] = GRADE_ORDER.map((g, i) => ({ label: g, value: assets.filter(a => a.grade === g).length, color: GRADE_COLORS[i % GRADE_COLORS.length] }));
  const envData: PieDatum[] = (['indoor', 'outdoor', 'mixed'] as AssetEnvType[]).map((e, i) => ({ label: ENV_LABEL[e], value: assets.filter(a => a.envType === e).length, color: ENV_COLORS[i % ENV_COLORS.length] }));
  const groupData: PieDatum[] = (['solo', 'team', 'class'] as AssetGroupType[]).map((g, i) => ({ label: GROUP_LABEL[g], value: assets.filter(a => a.groupType === g).length, color: GROUP_COLORS[i % GROUP_COLORS.length] }));

  return (
    <div className="space-y-5">
      {/* 심사 현황 — 클릭 시 해당 리스트로 이동 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusNavButton to="/content-assets?status=reviewing" label="검토 중" count={reviewing} tone="amber" hint="1차·2차·최종 승인 대기" />
        <StatusNavButton to="/content-assets?status=revision" label="수정 요청" count={revision} tone="red" />
        <StatusNavButton to="/content-assets?status=approved" label="승인 완료" count={approved} tone="emerald" />
        <StatusNavButton to="/content-assets?status=rejected" label="반려" count={rejected} tone="gray" />
      </div>

      <Card title="심사 현황 분포">
        <DonutChart data={statusData} />
      </Card>

      {/* 현황 분석: 학년별 / 유형별 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="학년별 분포">
          <DonutChart data={gradeData} />
        </Card>
        <div className="grid grid-cols-1 gap-4">
          <Card title="유형별 분포 — 환경">
            <DonutChart data={envData} />
          </Card>
          <Card title="유형별 분포 — 참여 규모">
            <DonutChart data={groupData} />
          </Card>
        </div>
      </div>

      {/* 카테고리 분포 (카테고리 맵) */}
      <Card title="카테고리 분포">
        <CategoryMap assets={assets} />
      </Card>
    </div>
  );
}