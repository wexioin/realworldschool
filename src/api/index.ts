import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ErpApi, DashboardData, BadgeCounts, Content, Member, Creator, Partner,
  KitProduct, ExperienceProgram, PlanProduct, Settlement, SettlementStatus, BookingStatus,
  ContentAsset, BrandAsset, KnowledgePost, CriterionScore, Advisor, AdvisorAssignment,
  AssetStatus, CreatorPayoutInfo, RevisionRequest, UserAccount,
} from './types';
import { REVIEW_PASS_MARK, REVISION_DEADLINE_DAYS, IN_REVIEW_STATUSES, LoginError } from './types';
import * as mock from './mockData';

// ─────────────────────────────────────────────────────────────
// MockApi: in-memory 데이터를 실제로 변경하는 프로토타입 구현.
// 실데이터 연동 시 HttpApi 클래스로 교체 — 페이지 코드는 무수정.
//   class HttpApi implements ErpApi {
//     listContents() { return fetchJson('/api/contents'); }
//     saveContent(c) { return postJson('/api/contents', c); } ...
//   }
// ─────────────────────────────────────────────────────────────
const delay = <T,>(data: T, ms = 120): Promise<T> =>
  new Promise(res => setTimeout(() => res(data), ms));

const won = (n: number) =>
  n >= 100_000_000 ? `₩${(n / 100_000_000).toFixed(1)}억` :
  n >= 10_000 ? `₩${Math.round(n / 10_000).toLocaleString()}만` : `₩${n.toLocaleString()}`;

const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}`;

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** 수정 마감일은 검수일 + 7일로 자동 설정 (docs/rwsadmin-spec.md §3-C) */
const newRevisionRequest = (stage: 'first' | 'second'): RevisionRequest => ({
  requestedDate: today(),
  deadline: addDays(REVISION_DEADLINE_DAYS),
  stage,
  reminderCount: 0,
});

const payoutComplete = (info?: CreatorPayoutInfo) =>
  !!info && !!info.residentId && !!info.address && !!info.bankAccount;

function upsert<T extends { id: string }>(list: T[], item: T, prefix: string): void {
  if (!item.id) {
    list.unshift({ ...item, id: genId(prefix) });
    return;
  }
  const idx = list.findIndex(x => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
}

function removeById<T extends { id: string }>(list: T[], id: string): void {
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) list.splice(idx, 1);
}

class MockApi implements ErpApi {
  // ── 인증 ──
  async login(email: string, password: string) {
    const account = mock.userAccounts.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!account) throw new LoginError('not_found');
    if (account.password !== password) throw new LoginError('wrong_password');
    if (account.status !== 'active') throw new LoginError('inactive');
    return delay(account, 400); // 서버 왕복 시뮬레이션
  }

  listAccounts() { return delay([...mock.userAccounts]); }

  listContents()           { return delay([...mock.contents]); }
  listRoadmap()            { return delay([...mock.roadmap]); }
  listCreators()           { return delay([...mock.creators]); }
  listMembers()            { return delay([...mock.members]); }
  listOrders()             { return delay([...mock.orders]); }
  listSettlements()        { return delay([...mock.settlements]); }
  listBookings()           { return delay([...mock.bookings]); }
  listExperiencePrograms() { return delay([...mock.experiencePrograms]); }
  listPlans()              { return delay([...mock.plans]); }
  listKits()               { return delay([...mock.kits]); }
  listPartners()           { return delay([...mock.partners]); }

  async saveContent(c: Content)              { upsert(mock.contents, c, 'c'); return delay(undefined); }
  async deleteContent(id: string)            { removeById(mock.contents, id); return delay(undefined); }
  async saveMember(m: Member)                { upsert(mock.members, m, 'm'); return delay(undefined); }
  async deleteMember(id: string)             { removeById(mock.members, id); return delay(undefined); }
  async saveCreator(c: Creator)              { upsert(mock.creators, c, 'cr'); return delay(undefined); }
  async deleteCreator(id: string)            { removeById(mock.creators, id); return delay(undefined); }
  async savePartner(p: Partner)              { upsert(mock.partners, p, 'pt'); return delay(undefined); }
  async deletePartner(id: string)            { removeById(mock.partners, id); return delay(undefined); }
  async saveKit(k: KitProduct)               { upsert(mock.kits, k, 'kit'); return delay(undefined); }
  async deleteKit(id: string)                { removeById(mock.kits, id); return delay(undefined); }
  async saveExperienceProgram(p: ExperienceProgram) { upsert(mock.experiencePrograms, p, 'exp'); return delay(undefined); }
  async deleteExperienceProgram(id: string)  { removeById(mock.experiencePrograms, id); return delay(undefined); }
  async savePlan(p: PlanProduct)             { upsert(mock.plans, p, 'pl'); return delay(undefined); }

  async updateSettlementStatus(id: string, status: SettlementStatus) {
    const s = mock.settlements.find(x => x.id === id);
    if (s) s.status = status;
    return delay(undefined);
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const b = mock.bookings.find(x => x.id === id);
    if (b) b.status = status;
    return delay(undefined);
  }

  // ── 콘텐츠 자산 (검수 파이프라인) ──
  listContentAssets() { return delay([...mock.contentAssets]); }

  async saveContentAsset(a: ContentAsset) { upsert(mock.contentAssets, a, 'ca'); return delay(undefined); }

  /** 상태 변경을 한 곳으로 모아 statusChangedAt을 항상 함께 갱신합니다. */
  private transition(a: ContentAsset, status: AssetStatus) {
    a.status = status;
    a.statusChangedAt = new Date().toISOString();
  }

  private mustFind(id: string): ContentAsset {
    const a = mock.contentAssets.find(x => x.id === id);
    if (!a) throw new Error('asset not found');
    return a;
  }

  // ①② AI 1차 검수
  async runAiReview(id: string) {
    const a = this.mustFind(id);
    // 실연동 시: AI 검수 서비스 호출 → 결과 수신. mock에서는 미리 심어둔 이슈 사용.
    const issues = a.mockAiIssues ?? [];
    const passed = issues.length === 0;
    a.aiReview = { date: today(), passed, issues };
    if (passed) {
      this.transition(a, 'reviewer_assignment_pending');
    } else {
      this.transition(a, 'first_revision_requested');
      a.revisionRequest = newRevisionRequest('first');
    }
    // 실연동 시: 실패하면 크리에이터 이메일로 이슈 자동 발송 (BFF에서 처리)
    return delay({ passed, issues }, 900); // AI 검수 소요 시간 시뮬레이션
  }

  // ── 2차 검수자 ──
  listAdvisors() { return delay([...mock.advisors]); }

  // ③ 2차 검수자 배정
  async assignAdvisor(id: string, assignment: AdvisorAssignment) {
    const a = this.mustFind(id);
    // 실연동 시: 검수자 이메일로 배정 안내 메일 자동 발송 (BFF에서 처리)
    a.advisorAssignment = assignment;
    this.transition(a, 'second_review_pending');
    return delay(undefined, 600);
  }

  async sendAdvisorReminder(id: string, _emailSubject: string, _emailBody: string) {
    const a = this.mustFind(id);
    if (!a.advisorAssignment) throw new Error('assignment not found');
    // 실연동 시: 검수자 이메일로 리마인드 메일 자동 발송 (BFF에서 처리)
    a.advisorAssignment = {
      ...a.advisorAssignment,
      reminderSentDate: today(),
      reminderCount: (a.advisorAssignment.reminderCount ?? 0) + 1,
    };
    return delay(undefined, 600);
  }

  // ④⑤ 2차 검수 채점 제출
  async submitReviewScores(id: string, reviewer: string, scores: CriterionScore[], note?: string) {
    const a = this.mustFind(id);
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    const passed = total >= REVIEW_PASS_MARK;
    a.humanReview = { reviewer, date: today(), total, passed, scores, note };
    if (passed) {
      this.transition(a, 'final_approval_pending');
    } else {
      this.transition(a, 'second_revision_requested');
      a.revisionRequest = newRevisionRequest('second');
    }
    // 실연동 시: 점수·검수 의견을 크리에이터 이메일로 자동 발송
    return delay({ total, passed });
  }

  // ⑧⑨ 최종 승인 — 지급 정보 완비 여부로 다음 상태가 갈립니다.
  async finalApproveAsset(id: string, admin: string, note?: string) {
    const a = this.mustFind(id);
    a.finalReview = { admin, date: today(), note };
    const next: AssetStatus = payoutComplete(mock.creatorPayoutByEmail[a.creatorEmail])
      ? 'payment_pending'
      : 'approved';
    this.transition(a, next);
    return delay({ status: next });
  }

  // ⑩ 반려
  async rejectAsset(id: string, admin: string, reason: string) {
    const a = this.mustFind(id);
    a.rejection = { admin, date: today(), reason };
    this.transition(a, 'rejected');
    return delay(undefined);
  }

  async resubmitAsset(id: string) {
    const a = this.mustFind(id);
    this.transition(a, 'first_review_pending');
    a.aiReview = undefined;
    a.advisorAssignment = undefined;
    a.humanReview = undefined;
    a.revisionRequest = undefined;
    a.mockAiIssues = [];
    return delay(undefined);
  }

  // ⑫ 지급 처리
  async completePayment(id: string) {
    const a = this.mustFind(id);
    this.transition(a, 'paid');
    a.paymentCompletedDate = today();
    return delay(undefined, 500);
  }

  // ⑬ 출시 — 입력된 출시 가격으로 콘텐츠 가격을 갱신합니다.
  async releaseContent(id: string, price: number) {
    const a = this.mustFind(id);
    this.transition(a, 'released');
    a.price = price;
    a.releasedDate = today();
    a.releasedUrl = `https://school.realworld.to/content/${a.code.toLowerCase()}`;
    return delay(undefined, 600);
  }

  async sendRevisionReminder(id: string, _emailSubject: string, _emailBody: string) {
    const a = this.mustFind(id);
    if (!a.revisionRequest) throw new Error('revision not found');
    a.revisionRequest = {
      ...a.revisionRequest,
      reminderSentDate: today(),
      reminderCount: (a.revisionRequest.reminderCount ?? 0) + 1,
    };
    return delay(undefined, 600);
  }

  // ⑥⑦ 수정 완료 — 반송된 단계에 따라 복귀 지점이 다릅니다.
  async markRevisionComplete(id: string) {
    const a = this.mustFind(id);
    const stage = a.revisionRequest?.stage
      ?? (a.status === 'first_revision_requested' ? 'first' : 'second');
    this.transition(a, stage === 'first' ? 'reviewer_assignment_pending' : 'final_approval_pending');
    a.revisionRequest = undefined;
    a.mockAiIssues = [];
    return delay(undefined);
  }

  // ⑪ 크리에이터 지급 정보 제출 — 대기 중인 "검수완료(통과)" 건을 지급예정으로 넘깁니다.
  async submitPayoutInfo(creatorEmail: string, info: CreatorPayoutInfo) {
    mock.creatorPayoutByEmail[creatorEmail] = info;
    mock.contentAssets
      .filter(a => a.creatorEmail === creatorEmail && a.status === 'approved')
      .forEach(a => this.transition(a, 'payment_pending'));
    return delay(undefined, 500);
  }

  async getPayoutInfo(creatorEmail: string) {
    return delay(mock.creatorPayoutByEmail[creatorEmail]);
  }

  // ── 브랜드 자산 ──
  listBrandAssets() { return delay([...mock.brandAssets]); }
  async saveBrandAsset(a: BrandAsset)   { upsert(mock.brandAssets, a, 'ba'); return delay(undefined); }
  async deleteBrandAsset(id: string)    { removeById(mock.brandAssets, id); return delay(undefined); }

  // ── 지식 자산 ──
  listKnowledgePosts() { return delay([...mock.knowledgePosts]); }
  async saveKnowledgePost(p: KnowledgePost) { upsert(mock.knowledgePosts, p, 'kp'); return delay(undefined); }
  async deleteKnowledgePost(id: string)     { removeById(mock.knowledgePosts, id); return delay(undefined); }
  async togglePostLike(id: string) {
    const p = mock.knowledgePosts.find(x => x.id === id);
    if (p) { p.likedByMe = !p.likedByMe; p.likes += p.likedByMe ? 1 : -1; }
    return delay(undefined, 50);
  }
  async togglePostBookmark(id: string) {
    const p = mock.knowledgePosts.find(x => x.id === id);
    if (p) p.bookmarkedByMe = !p.bookmarkedByMe;
    return delay(undefined, 50);
  }

  async getBadgeCounts(): Promise<BadgeCounts> {
    return delay({
      contentsReview: mock.contentAssets.filter(a => IN_REVIEW_STATUSES.includes(a.status)).length,
      settlementsPending: mock.settlements.filter(s => s.status === 'pending' || s.status === 'disputed').length,
      bookingsPending: mock.bookings.filter(b => b.status === 'pending').length,
    });
  }

  async getDashboard(): Promise<DashboardData> {
    const reviewCount = mock.contentAssets.filter(a => IN_REVIEW_STATUSES.includes(a.status)).length;
    const settlePending = mock.settlements.filter(s => s.status === 'pending');
    const disputed = mock.settlements.filter(s => s.status === 'disputed').length;
    const bookingPending = mock.bookings.filter(b => b.status === 'pending').length;
    const pendingOrders = mock.orders.filter(o => o.status === 'pending').length;

    const monthRevenueTotal = mock.orders
      .filter(o => o.status === 'paid' && o.orderedAt.startsWith('2026-07'))
      .reduce((a, o) => a + o.amount, 0);
    const newMembers = mock.members.filter(m => m.joinedDate >= '2026-06-06').length;
    const activeCreators = mock.creators.filter(c => c.status === 'active').length;
    const sellingContents = mock.contents.filter(c => c.saleStatus === 'selling' || c.saleStatus === 'free').length;

    const allActions: DashboardData['actionQueue'] = [
      { key: 'review', label: '검수 대기 콘텐츠 자산', count: reviewCount, severity: 'warning', link: '/content-assets' },
      { key: 'settlement', label: '정산 확정 대기', count: settlePending.length, severity: 'warning', link: '/settlements?status=pending' },
      { key: 'disputed', label: '정산 이의 제기', count: disputed, severity: 'danger', link: '/settlements?status=disputed' },
      { key: 'booking', label: '체험 예약 확정 대기', count: bookingPending, severity: 'warning', link: '/experience?status=pending' },
      { key: 'order', label: '입금 대기 주문', count: pendingOrders, severity: 'info', link: '/sales?status=pending' },
    ];
    const actionQueue = allActions.filter(i => i.count > 0);

    return delay({
      actionQueue,
      kpis: [
        { key: 'revenue', label: '이번 달 매출', value: won(monthRevenueTotal), sub: '7월 1일 ~ 오늘 · 결제 완료 기준', link: '/sales' },
        { key: 'members', label: '신규 회원 (30일)', value: `${newMembers}명`, sub: `전체 ${mock.members.length}명`, link: '/members' },
        { key: 'creators', label: '활성 크리에이터', value: `${activeCreators}명`, sub: `전체 ${mock.creators.length}명 등록`, link: '/creators' },
        { key: 'contents', label: '판매 중 콘텐츠', value: `${sellingContents}개`, sub: `전체 ${mock.contents.length}개 등록`, link: '/contents?status=selling' },
      ],
      revenueByMonth: mock.revenueByMonth,
      activity: mock.activity,
      roadmapTop: mock.roadmap
        .filter(r => r.stage !== 'released')
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5),
    });
  }
}

export const api: ErpApi = new MockApi();

export { creatorPayoutByEmail, contentCatalog, contentForms, DEMO_PASSWORD } from './mockData';

// ── 인증 훅 ──
export const useLogin = () =>
  useMutation({ mutationFn: (args: { email: string; password: string }) => api.login(args.email, args.password) });
export const useAccounts = () => useQuery({ queryKey: ['accounts'], queryFn: () => api.listAccounts() });

// ── 조회 훅 ──
export const useDashboard    = () => useQuery({ queryKey: ['dashboard'],    queryFn: () => api.getDashboard() });
export const useBadgeCounts  = () => useQuery({ queryKey: ['badges'],       queryFn: () => api.getBadgeCounts() });
export const useContents     = () => useQuery({ queryKey: ['contents'],     queryFn: () => api.listContents() });
export const useContentAssets = () => useQuery({ queryKey: ['contentAssets'], queryFn: () => api.listContentAssets() });
export const useAdvisors      = () => useQuery({ queryKey: ['advisors'],      queryFn: () => api.listAdvisors() });
export const useBrandAssets   = () => useQuery({ queryKey: ['brandAssets'],   queryFn: () => api.listBrandAssets() });
export const useKnowledgePosts = () => useQuery({ queryKey: ['knowledgePosts'], queryFn: () => api.listKnowledgePosts() });
export const useRoadmap      = () => useQuery({ queryKey: ['roadmap'],      queryFn: () => api.listRoadmap() });
export const useCreators     = () => useQuery({ queryKey: ['creators'],     queryFn: () => api.listCreators() });
export const useMembers      = () => useQuery({ queryKey: ['members'],      queryFn: () => api.listMembers() });
export const useOrders       = () => useQuery({ queryKey: ['orders'],       queryFn: () => api.listOrders() });
export const useSettlements  = () => useQuery({ queryKey: ['settlements'],  queryFn: () => api.listSettlements() });
export const useBookings     = () => useQuery({ queryKey: ['bookings'],     queryFn: () => api.listBookings() });
export const useExperiencePrograms = () => useQuery({ queryKey: ['expPrograms'], queryFn: () => api.listExperiencePrograms() });
export const usePlans        = () => useQuery({ queryKey: ['plans'],        queryFn: () => api.listPlans() });
export const useKits         = () => useQuery({ queryKey: ['kits'],         queryFn: () => api.listKits() });
export const usePartners     = () => useQuery({ queryKey: ['partners'],     queryFn: () => api.listPartners() });

// ── 변경 훅: 성공 시 관련 쿼리 무효화 ──
function useInvalidatingMutation<TArgs>(
  fn: (args: TArgs) => Promise<void>,
  keys: string[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // 대시보드·배지는 대부분의 변경에 영향을 받으므로 함께 갱신
      [...keys, 'dashboard', 'badges'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export const useSaveContent   = () => useInvalidatingMutation((c: Content) => api.saveContent(c), ['contents']);
export const useDeleteContent = () => useInvalidatingMutation((id: string) => api.deleteContent(id), ['contents']);
export const useSaveMember    = () => useInvalidatingMutation((m: Member) => api.saveMember(m), ['members']);
export const useDeleteMember  = () => useInvalidatingMutation((id: string) => api.deleteMember(id), ['members']);
export const useSaveCreator   = () => useInvalidatingMutation((c: Creator) => api.saveCreator(c), ['creators']);
export const useDeleteCreator = () => useInvalidatingMutation((id: string) => api.deleteCreator(id), ['creators']);
export const useSavePartner   = () => useInvalidatingMutation((p: Partner) => api.savePartner(p), ['partners']);
export const useDeletePartner = () => useInvalidatingMutation((id: string) => api.deletePartner(id), ['partners']);
export const useSaveKit       = () => useInvalidatingMutation((k: KitProduct) => api.saveKit(k), ['kits']);
export const useDeleteKit     = () => useInvalidatingMutation((id: string) => api.deleteKit(id), ['kits']);
export const useSaveExpProgram   = () => useInvalidatingMutation((p: ExperienceProgram) => api.saveExperienceProgram(p), ['expPrograms']);
export const useDeleteExpProgram = () => useInvalidatingMutation((id: string) => api.deleteExperienceProgram(id), ['expPrograms']);
export const useSavePlan      = () => useInvalidatingMutation((p: PlanProduct) => api.savePlan(p), ['plans']);
export const useUpdateSettlement = () =>
  useInvalidatingMutation(
    ({ id, status }: { id: string; status: SettlementStatus }) => api.updateSettlementStatus(id, status),
    ['settlements'],
  );
export const useUpdateBooking = () =>
  useInvalidatingMutation(
    ({ id, status }: { id: string; status: BookingStatus }) => api.updateBookingStatus(id, status),
    ['bookings'],
  );

// ── 콘텐츠 자산 (검수 파이프라인) 변경 훅 ──
// 반환값(합격 여부, 총점 등)이 필요하므로 useInvalidatingMutation과 별도로 정의합니다.
function useAssetMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      ['contentAssets', 'payout', 'dashboard', 'badges'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export const useSaveContentAsset = () => useInvalidatingMutation((a: ContentAsset) => api.saveContentAsset(a), ['contentAssets']);
export const useRunAiReview = () => useAssetMutation((id: string) => api.runAiReview(id));
export const useAssignAdvisor = () => useAssetMutation(
  (args: { id: string; assignment: AdvisorAssignment }) => api.assignAdvisor(args.id, args.assignment)
);
export const useSendAdvisorReminder = () => useAssetMutation(
  (args: { id: string; emailSubject: string; emailBody: string }) =>
    api.sendAdvisorReminder(args.id, args.emailSubject, args.emailBody)
);
export const useSubmitReviewScores = () => useAssetMutation(
  (args: { id: string; reviewer: string; scores: CriterionScore[]; note?: string }) =>
    api.submitReviewScores(args.id, args.reviewer, args.scores, args.note)
);
export const useFinalApproveAsset = () => useAssetMutation(
  (args: { id: string; admin: string; note?: string }) => api.finalApproveAsset(args.id, args.admin, args.note)
);
export const useRejectAsset = () => useAssetMutation(
  (args: { id: string; admin: string; reason: string }) => api.rejectAsset(args.id, args.admin, args.reason)
);
export const useResubmitAsset = () => useAssetMutation((id: string) => api.resubmitAsset(id));
export const useCompletePayment = () => useAssetMutation((id: string) => api.completePayment(id));
export const useReleaseContent = () => useAssetMutation(
  (args: { id: string; price: number }) => api.releaseContent(args.id, args.price)
);
export const useSendRevisionReminder = () => useAssetMutation(
  (args: { id: string; emailSubject: string; emailBody: string }) =>
    api.sendRevisionReminder(args.id, args.emailSubject, args.emailBody)
);
export const useMarkRevisionComplete = () => useAssetMutation((id: string) => api.markRevisionComplete(id));
export const useSubmitPayoutInfo = () => useAssetMutation(
  (args: { creatorEmail: string; info: CreatorPayoutInfo }) => api.submitPayoutInfo(args.creatorEmail, args.info)
);
export const usePayoutInfo = (creatorEmail: string) =>
  useQuery({ queryKey: ['payout', creatorEmail], queryFn: () => api.getPayoutInfo(creatorEmail) });

// ── 브랜드 자산 변경 훅 ──
export const useSaveBrandAsset   = () => useInvalidatingMutation((a: BrandAsset) => api.saveBrandAsset(a), ['brandAssets']);
export const useDeleteBrandAsset = () => useInvalidatingMutation((id: string) => api.deleteBrandAsset(id), ['brandAssets']);

// ── 지식 자산 변경 훅 ──
export const useSaveKnowledgePost   = () => useInvalidatingMutation((p: KnowledgePost) => api.saveKnowledgePost(p), ['knowledgePosts']);
export const useDeleteKnowledgePost = () => useInvalidatingMutation((id: string) => api.deleteKnowledgePost(id), ['knowledgePosts']);
export const useTogglePostLike      = () => useInvalidatingMutation((id: string) => api.togglePostLike(id), ['knowledgePosts']);
export const useTogglePostBookmark  = () => useInvalidatingMutation((id: string) => api.togglePostBookmark(id), ['knowledgePosts']);