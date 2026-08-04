import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  ExternalLink, FileText, FileType2, BookOpenCheck, CheckSquare, CreditCard,
  AlertTriangle, Clock, ShieldCheck, Sparkles, Lock,
} from 'lucide-react';
import {
  useContentAssets, useMarkRevisionComplete, useSubmitPayoutInfo, usePayoutInfo,
} from '../api';
import type { ContentAsset, CreatorPayoutInfo, AssetStatus } from '../api/types';
import {
  ASSET_STATUS_META, ASSET_STATUS_FLOW, ASSET_STATUS_FLOW_PERSONAL,
  CREATOR_STATUS_MESSAGE, REVIEW_CRITERIA, CONTENT_KIND_META, hasPlanDocs, needsPayment,
} from '../api/types';
import { PageHeader, StatusBadge, Loading } from '../components/ui';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useSession } from '../session';
import { formatDate, formatCurrency } from '../utils/format';
import { categoryLabel } from '../utils/categories';

// ─────────────────────────────────────────────────────────────
// 크리에이터 검수 현황 — 본인이 제출한 콘텐츠만 보입니다.
// 상태별 안내문과 "처리" 버튼은 docs/rwsadmin-spec.md §3-C 를 따릅니다.
//   1차·2차 수정 요청 → 수정 완료 / 검수완료(통과) → 개인정보 입력 / 반려 → 버튼 없음
// ─────────────────────────────────────────────────────────────

const STUDIO_BASE = 'https://studio.realworld.to/project';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MyContentsPage() {
  const { user } = useSession();
  const { data: assets, isLoading } = useContentAssets();
  const { data: payout } = usePayoutInfo(user.email);
  const markComplete = useMarkRevisionComplete();
  const toast = useToast();
  const [payoutOpen, setPayoutOpen] = useState(false);

  const mine = useMemo(
    () => (assets ?? []).filter(a => a.creatorEmail === user.email),
    [assets, user.email],
  );
  const showPayoutEntry = mine.some(a => a.kind === 'original');

  if (isLoading) return <Loading />;

  const handleRevisionComplete = (a: ContentAsset) => {
    if (!window.confirm(`「${a.title}」 수정을 완료하셨나요?\n제출하면 운영팀 검토 단계로 다시 넘어갑니다.`)) return;
    markComplete.mutate(a.id, { onSuccess: () => toast.success('수정 완료로 제출했습니다.') });
  };

  return (
    <div>
      <PageHeader
        title="내 콘텐츠 검수 현황"
        description="제출한 콘텐츠의 검수 단계와 해야 할 일을 확인할 수 있습니다."
        right={showPayoutEntry ? (
          <button
            onClick={() => setPayoutOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCard size={14} /> 지급 정보 {payout ? '수정' : '입력'}
          </button>
        ) : undefined}
      />

      {mine.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center text-sm text-gray-400">
          제출한 콘텐츠가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map(a => (
            <MyContentCard
              key={a.id}
              asset={a}
              busy={markComplete.isPending}
              onRevisionComplete={() => handleRevisionComplete(a)}
              onPayout={() => setPayoutOpen(true)}
            />
          ))}
        </div>
      )}

      {payoutOpen && (
        <PayoutModal
          initial={payout}
          onClose={() => setPayoutOpen(false)}
          onSaved={() => setPayoutOpen(false)}
        />
      )}
    </div>
  );
}

function MyContentCard({ asset: a, busy, onRevisionComplete, onPayout }: {
  asset: ContentAsset;
  busy?: boolean;
  onRevisionComplete: () => void;
  onPayout: () => void;
}) {
  const meta = ASSET_STATUS_META[a.status];
  const needsRevision = a.status === 'first_revision_requested' || a.status === 'second_revision_requested';
  const overdue = !!a.revisionRequest && a.revisionRequest.deadline < todayISO();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
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
            {a.grade} · {formatCurrency(a.price)} · 제출 {formatDate(a.submittedDate)}
          </p>
        </div>

        {/* 처리 컬럼 — 상태별로 버튼이 하나만 뜨거나, 반려면 뜨지 않습니다. */}
        <div className="flex items-center gap-2">
          {needsRevision && (
            <button
              onClick={onRevisionComplete}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50 transition-colors"
            >
              <CheckSquare size={13} /> 수정 완료
            </button>
          )}
          {a.status === 'approved' && needsPayment(a) && (
            <button
              onClick={onPayout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-200/60 transition-colors"
            >
              <CreditCard size={13} /> 개인정보 입력
            </button>
          )}
          {a.status === 'released' && a.releasedUrl && (
            <a
              href={a.releasedUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <ExternalLink size={13} /> 출시된 콘텐츠 보기
            </a>
          )}
        </div>
      </div>

      <StatusStepper asset={a} />

      <p className={clsx(
        'text-xs mt-3 px-3 py-2 rounded-lg border',
        needsRevision ? 'bg-amber-50 border-amber-100 text-amber-800'
          : a.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-700'
          : 'bg-gray-50 border-gray-100 text-gray-600'
      )}>
        {a.status === 'paid' && a.paymentSkipped
          ? (a.kind === 'personal'
            ? '검수가 완료되었습니다. 출시 후 실적에 따라 로열티가 정산됩니다.'
            : '검수가 완료되었습니다. 지급 없이 출시를 기다리고 있습니다.')
          : CREATOR_STATUS_MESSAGE[a.status]}
      </p>

      {needsRevision && a.revisionRequest && (
        <p className={clsx('text-xs mt-2 inline-flex items-center gap-1 font-medium', overdue ? 'text-red-600' : 'text-gray-500')}>
          {overdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
          수정 마감 {formatDate(a.revisionRequest.deadline)}
          {overdue && ' — 마감이 지났습니다'}
        </p>
      )}

      {/* 받은 피드백 */}
      {(a.aiReview?.issues.length || a.humanReview || a.rejection) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
          {a.status === 'first_revision_requested' && !!a.aiReview?.issues.length && (
            <div className="text-xs">
              <p className="font-medium text-gray-700 inline-flex items-center gap-1">
                <Sparkles size={12} className="text-primary-500" /> AI 1차 검수 지적 사항
              </p>
              <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-600">
                {a.aiReview!.issues.map((iss, i) => <li key={i}>{iss}</li>)}
              </ul>
            </div>
          )}
          {a.humanReview && (
            <div className="text-xs">
              <p className="font-medium text-gray-700 inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-primary-500" /> 2차 검수 결과
                <span className={clsx('ml-1 font-semibold', a.humanReview.passed ? 'text-emerald-600' : 'text-red-600')}>
                  {a.humanReview.total}점 / 100점
                </span>
              </p>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-500">
                {a.humanReview.scores.map(s => {
                  const c = REVIEW_CRITERIA.find(c => c.key === s.key)!;
                  return (
                    <p key={s.key}>
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
          {a.rejection && (
            <p className="text-xs text-red-600">
              <span className="font-medium">반려 사유</span> {a.rejection.reason}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <MiniLink href={a.studioProjectId ? `${STUDIO_BASE}/${a.studioProjectId}` : undefined} label="스튜디오" icon={ExternalLink} />
        {hasPlanDocs(a) && (
          <>
            <MiniLink href={a.planPptUrl} label="기획서(PPT)" icon={FileType2} />
            <MiniLink href={a.planDocUrl} label="기획서(Word)" icon={FileText} />
            <MiniLink href={a.guideUrl} label="운영 가이드" icon={BookOpenCheck} />
          </>
        )}
      </div>
    </div>
  );
}

/** 정상 경로 스테퍼. 개인은 지급 단계를 빼고, 수정 요청·반려는 경로 밖 뱃지로 표시합니다. */
function StatusStepper({ asset }: { asset: ContentAsset }) {
  const status = asset.status;
  const flow: AssetStatus[] = asset.kind === 'personal' ? ASSET_STATUS_FLOW_PERSONAL : ASSET_STATUS_FLOW;
  const metaStep = ASSET_STATUS_META[status].step;
  const offPath = metaStep < 0;
  const reached = offPath
    ? flow.indexOf(status === 'rejected' ? 'final_approval_pending' : 'second_review_pending')
    : Math.max(0, flow.indexOf(status));

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {flow.map((s, i) => {
        const done = i < reached;
        const current = !offPath && i === reached;
        return (
          <React.Fragment key={s}>
            {i > 0 && <span className={clsx('h-px w-3 flex-shrink-0', done ? 'bg-primary-300' : 'bg-gray-200')} />}
            <span className={clsx(
              'text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded font-medium flex-shrink-0',
              current ? 'bg-primary-600 text-white'
                : done ? 'bg-primary-50 text-primary-600'
                : 'bg-gray-50 text-gray-300'
            )}>
              {ASSET_STATUS_META[s].label}
            </span>
          </React.Fragment>
        );
      })}
      {offPath && (
        <span className={clsx(
          'text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-1',
          status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
        )}>
          {ASSET_STATUS_META[status].label}
        </span>
      )}
    </div>
  );
}

const EMPTY_PAYOUT: CreatorPayoutInfo = { residentId: '', address: '', bankAccount: '' };

function PayoutModal({ initial, onClose, onSaved }: {
  initial?: CreatorPayoutInfo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const submit = useSubmitPayoutInfo();
  const toast = useToast();
  const [form, setForm] = useState<CreatorPayoutInfo>(initial ?? EMPTY_PAYOUT);

  const set = (key: keyof CreatorPayoutInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.residentId.trim() || !form.address.trim() || !form.bankAccount.trim()) {
      alert('세 항목을 모두 입력해 주세요.');
      return;
    }
    submit.mutate({ creatorEmail: user.email, info: form }, {
      onSuccess: () => {
        toast.success('지급 정보를 저장했습니다. 승인된 콘텐츠는 지급예정으로 넘어갑니다.');
        onSaved();
      },
    });
  };

  return (
    <Modal title="개인정보 입력" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <Lock size={12} className="mt-0.5 flex-shrink-0" />
          <span>원고료·정산금 지급에만 사용되며, 암호화해서 보관합니다. 운영자 화면에서도 마스킹된 형태로만 보입니다.</span>
        </p>

        <Field label="주민등록번호" value={form.residentId} onChange={set('residentId')} placeholder="000000-0000000" />
        <Field label="주소" value={form.address} onChange={set('address')} placeholder="도로명 주소" />
        <Field label="입금될 계좌번호" value={form.bankAccount} onChange={set('bankAccount')} placeholder="은행명 000-000-000000 (예금주)" />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">취소</button>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50"
          >
            {submit.isPending ? '저장 중...' : '제출'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
      />
    </div>
  );
}

function MiniLink({ href, label, icon: Icon }: { href?: string; label: string; icon: React.ElementType }) {
  if (!href) return null;
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon size={12} /> {label}
    </a>
  );
}
