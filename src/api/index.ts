import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ErpApi, DashboardData, BadgeCounts, Content, Member, Creator, Partner,
  KitProduct, ExperienceProgram, PlanProduct, Settlement, SettlementStatus, BookingStatus,
  ContentAsset, BrandAsset, KnowledgePost, CriterionScore,
} from './types';
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

  async runAiReview(id: string) {
    const a = mock.contentAssets.find(x => x.id === id);
    if (!a) throw new Error('asset not found');
    // 실연동 시: AI 검수 서비스 호출 → 결과 수신. mock에서는 미리 심어둔 이슈 사용.
    const issues = a.mockAiIssues ?? [];
    const passed = issues.length === 0;
    a.aiReview = { date: new Date().toISOString().slice(0, 10), passed, issues };
    a.status = passed ? 'human_review' : 'revision';
    // 실연동 시: 실패하면 크리에이터 이메일로 이슈 자동 발송 (BFF에서 처리)
    return delay({ passed, issues }, 900); // AI 검수 소요 시간 시뮬레이션
  }

  async submitReviewScores(id: string, reviewer: string, scores: CriterionScore[]) {
    const a = mock.contentAssets.find(x => x.id === id);
    if (!a) throw new Error('asset not found');
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    const passed = total >= 80;
    a.humanReview = { reviewer, date: new Date().toISOString().slice(0, 10), total, scores };
    a.status = passed ? 'final_approval' : 'revision';
    // 실연동 시: 점수·피드백을 크리에이터 이메일로 자동 발송
    return delay({ total, passed });
  }

  async finalApproveAsset(id: string) {
    const a = mock.contentAssets.find(x => x.id === id);
    if (a) a.status = 'approved';
    return delay(undefined);
  }

  async rejectAsset(id: string, reason: string) {
    const a = mock.contentAssets.find(x => x.id === id);
    if (a) { a.status = 'rejected'; a.rejectedReason = reason; }
    return delay(undefined);
  }

  async resubmitAsset(id: string) {
    const a = mock.contentAssets.find(x => x.id === id);
    if (a) {
      // 재제출: 1차 검수부터 재시작, 이전 결과 초기화
      a.status = 'ai_review';
      a.aiReview = undefined;
      a.humanReview = undefined;
      a.mockAiIssues = []; // 수정했다고 가정 → 다음 AI 검수는 통과
    }
    return delay(undefined);
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
    const pendingStages = ['ai_review', 'human_review', 'final_approval'];
    return delay({
      contentsReview: mock.contentAssets.filter(a => pendingStages.includes(a.status)).length,
      settlementsPending: mock.settlements.filter(s => s.status === 'pending' || s.status === 'disputed').length,
      bookingsPending: mock.bookings.filter(b => b.status === 'pending').length,
    });
  }

  async getDashboard(): Promise<DashboardData> {
    const pendingStages = ['ai_review', 'human_review', 'final_approval'];
    const reviewCount = mock.contentAssets.filter(a => pendingStages.includes(a.status)).length;
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

// ── 조회 훅 ──
export const useDashboard    = () => useQuery({ queryKey: ['dashboard'],    queryFn: () => api.getDashboard() });
export const useBadgeCounts  = () => useQuery({ queryKey: ['badges'],       queryFn: () => api.getBadgeCounts() });
export const useContents     = () => useQuery({ queryKey: ['contents'],     queryFn: () => api.listContents() });
export const useContentAssets = () => useQuery({ queryKey: ['contentAssets'], queryFn: () => api.listContentAssets() });
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
      ['contentAssets', 'dashboard', 'badges'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export const useSaveContentAsset = () => useInvalidatingMutation((a: ContentAsset) => api.saveContentAsset(a), ['contentAssets']);
export const useRunAiReview = () => useAssetMutation((id: string) => api.runAiReview(id));
export const useSubmitReviewScores = () => useAssetMutation(
  (args: { id: string; reviewer: string; scores: CriterionScore[] }) =>
    api.submitReviewScores(args.id, args.reviewer, args.scores)
);
export const useFinalApproveAsset = () => useAssetMutation((id: string) => api.finalApproveAsset(id));
export const useRejectAsset = () => useAssetMutation(
  (args: { id: string; reason: string }) => api.rejectAsset(args.id, args.reason)
);
export const useResubmitAsset = () => useAssetMutation((id: string) => api.resubmitAsset(id));

// ── 브랜드 자산 변경 훅 ──
export const useSaveBrandAsset   = () => useInvalidatingMutation((a: BrandAsset) => api.saveBrandAsset(a), ['brandAssets']);
export const useDeleteBrandAsset = () => useInvalidatingMutation((id: string) => api.deleteBrandAsset(id), ['brandAssets']);

// ── 지식 자산 변경 훅 ──
export const useSaveKnowledgePost   = () => useInvalidatingMutation((p: KnowledgePost) => api.saveKnowledgePost(p), ['knowledgePosts']);
export const useDeleteKnowledgePost = () => useInvalidatingMutation((id: string) => api.deleteKnowledgePost(id), ['knowledgePosts']);
export const useTogglePostLike      = () => useInvalidatingMutation((id: string) => api.togglePostLike(id), ['knowledgePosts']);
export const useTogglePostBookmark  = () => useInvalidatingMutation((id: string) => api.togglePostBookmark(id), ['knowledgePosts']);