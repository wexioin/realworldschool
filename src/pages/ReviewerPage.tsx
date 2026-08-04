import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  ExternalLink, FileText, FileType2, BookOpenCheck, CalendarClock,
  AlertTriangle, CheckCircle2, XCircle, ClipboardCheck,
} from 'lucide-react';
import { useContentAssets, useSubmitReviewScores } from '../api';
import type { ContentAsset } from '../api/types';
import { REVIEW_CRITERIA, REVIEW_PASS_MARK, ASSET_STATUS_META, CONTENT_KIND_META, hasPlanDocs } from '../api/types';
import { PageHeader, StatusBadge, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { useSession } from '../session';
import { formatDate, formatCurrency } from '../utils/format';
import { categoryLabel } from '../utils/categories';
import { ReviewScoreModal } from './ContentAssetsPage';

// ─────────────────────────────────────────────────────────────
// 검수자 화면 — 본인에게 배정된 2차 검수만 보입니다.
// 채점 폼은 관리자 대리 채점과 같은 ReviewScoreModal을 재사용하되,
// 검수자 이름을 로그인 계정으로 고정합니다.
// ─────────────────────────────────────────────────────────────

const STUDIO_BASE = 'https://studio.realworld.to/project';

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (date: string) =>
  Math.ceil((new Date(date).getTime() - new Date(todayISO()).getTime()) / 86_400_000);

export default function ReviewerPage() {
  const { user } = useSession();
  const { data: assets, isLoading } = useContentAssets();
  const submitScores = useSubmitReviewScores();
  const toast = useToast();
  const [scoring, setScoring] = useState<ContentAsset | null>(null);

  const mine = useMemo(
    () => (assets ?? []).filter(a => a.advisorAssignment?.advisorEmail === user.email),
    [assets, user.email],
  );
  const pending = mine.filter(a => a.status === 'second_review_pending');
  const done = mine.filter(a => a.status !== 'second_review_pending');

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="배정된 검수"
        description={`루브릭 항목별로 채점하면 총점 100점 중 ${REVIEW_PASS_MARK}점 이상일 때 통과 처리됩니다.`}
      />

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">진행할 검수 ({pending.length}건)</h2>
        {pending.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center text-sm text-gray-400">
            지금 진행할 검수가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(a => (
              <AssignmentCard key={a.id} asset={a} onStart={() => setScoring(a)} />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">완료한 검수 ({done.length}건)</h2>
          <div className="space-y-2">
            {done.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <StatusBadge label={ASSET_STATUS_META[a.status].label} tone={ASSET_STATUS_META[a.status].tone} />
                  </div>
                  {a.humanReview && (
                    <p className="text-xs">
                      <span className={clsx('font-semibold', a.humanReview.passed ? 'text-emerald-600' : 'text-red-600')}>
                        {a.humanReview.passed
                          ? <><CheckCircle2 size={12} className="inline mr-1" />통과</>
                          : <><XCircle size={12} className="inline mr-1" />미통과</>}
                        {' '}{a.humanReview.total}점
                      </span>
                      <span className="text-gray-400"> · 검수 {formatDate(a.humanReview.date)}</span>
                    </p>
                  )}
                </div>
                {a.humanReview?.note && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{a.humanReview.note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {scoring && (
        <ReviewScoreModal
          asset={scoring}
          submitting={submitScores.isPending}
          defaultReviewer={user.name}
          lockReviewer
          onClose={() => setScoring(null)}
          onSubmit={(reviewer, scores, note) => {
            submitScores.mutate({ id: scoring.id, reviewer, scores, note }, {
              onSuccess: (res) => {
                setScoring(null);
                if (res.passed) toast.success(`총점 ${res.total}점 — 통과 처리되어 최종 승인 대기로 넘어갔습니다.`);
                else toast.error(`총점 ${res.total}점 — 크리에이터에게 수정 요청(마감 1주)이 발송되었습니다.`);
              },
            });
          }}
        />
      )}
    </div>
  );
}

function AssignmentCard({ asset: a, onStart }: { asset: ContentAsset; onStart: () => void }) {
  const deadline = a.advisorAssignment?.deadline;
  const left = deadline ? daysUntil(deadline) : null;
  const overdue = left !== null && left < 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{a.title}</p>
            <StatusBadge label={CONTENT_KIND_META[a.kind].label} tone={CONTENT_KIND_META[a.kind].tone} />
            <StatusBadge label={`${a.category} · ${categoryLabel(a.category)}`} tone="gray" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {a.creatorName}{a.institution ? ` · ${a.institution}` : ''} · {a.grade} · {formatCurrency(a.price)} · 제출 {formatDate(a.submittedDate)}
          </p>
          {deadline && (
            <p className={clsx('text-xs mt-1.5 inline-flex items-center gap-1 font-medium', overdue ? 'text-red-600' : 'text-gray-500')}>
              {overdue ? <AlertTriangle size={12} /> : <CalendarClock size={12} />}
              마감 {formatDate(deadline)}
              <span className="text-gray-400">· {overdue ? `${Math.abs(left!)}일 경과` : `${left}일 남음`}</span>
            </p>
          )}
        </div>
        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 transition-colors"
        >
          <ClipboardCheck size={13} /> 검수하기
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <ResourceLink href={a.studioProjectId ? `${STUDIO_BASE}/${a.studioProjectId}` : undefined} label="스튜디오" icon={ExternalLink} />
        {hasPlanDocs(a) && (
          <>
            <ResourceLink href={a.planPptUrl} label="기획서(PPT)" icon={FileType2} />
            <ResourceLink href={a.planDocUrl} label="기획서(Word)" icon={FileText} />
            <ResourceLink href={a.guideUrl} label="운영 가이드" icon={BookOpenCheck} />
          </>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 space-y-2">
        <p className="text-xs text-gray-600">{a.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {REVIEW_CRITERIA.map(c => (
            <span key={c.key} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
              {c.label} <span className="text-gray-400">{c.max}점</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResourceLink({ href, label, icon: Icon }: { href?: string; label: string; icon: React.ElementType }) {
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
