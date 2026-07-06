// ─────────────────────────────────────────────────────────────
// 도메인 타입 정의
// 실데이터 연동 시 이 타입들이 BFF API 응답 스키마와 1:1 매칭됩니다.
// ─────────────────────────────────────────────────────────────

// ── 콘텐츠 ──
export type ContentOwnerType =
  | 'original_ug'          // 유니크굿 오리지널
  | 'original_rp'          // 레드포인트 오리지널
  | 'creator_teacher'      // 크리에이터(교사)
  | 'creator_student'      // 크리에이터(학생)
  | 'creator_institution'  // 크리에이터(기관)
  | 'creator_partners';    // 크리에이터(파트너스)

export type ReviewStage = 'submitted' | 'review_1' | 'review_2' | 'final_approval' | 'released' | 'rejected';
export type SaleStatus = 'selling' | 'preparing' | 'suspended' | 'free' | 'internal';
export type DevStage = 'planning' | 'developing' | 'review_1' | 'review_2' | 'final_approval' | 'released' | 'on_hold';

export interface Content {
  id: string;
  code: string;
  /** 리얼월드 스튜디오 프로젝트 ID — 스튜디오 바로가기 링크에 사용 */
  projectId?: string;
  title: string;
  description: string;
  ownerType: ContentOwnerType;
  company: string;
  creator: string;
  grade: string;
  subject: string;
  topic: string;
  price: number;
  saleStatus: SaleStatus;
  devStage: DevStage;
  reviewStage?: ReviewStage;
  views: number;
  purchases: number;
  rating: number;
  reviewCount: number;
  submittedDate?: string;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────
// 콘텐츠 자산 (검수 파이프라인) — 미출시 디지털 콘텐츠 관리
// 흐름: AI 1차 검수 → 2차 심사(5개 기준 × 20점, 80점 이상 통과)
//       → 최종 승인(대표단) → 승인 완료
// 실패/미달 시 수정 요청 → 크리에이터 재제출 → 1차부터 재검수
// ─────────────────────────────────────────────────────────────
export type AssetStatus =
  | 'ai_review'       // 1차: AI 기술 검수 대기
  | 'human_review'    // 2차: 심사위원 채점 대기
  | 'final_approval'  // 최종: 대표단 승인 대기
  | 'revision'        // 수정 요청 (크리에이터에게 반송)
  | 'approved'        // 승인 완료 (출시 가능)
  | 'rejected';       // 반려

export type AssetGrade = '초등 저학년' | '초등 고학년' | '중학생' | '고등학생' | '전학년';
export type AssetEnvType = 'indoor' | 'outdoor' | 'mixed';       // 실내형/실외형/혼합형
export type AssetGroupType = 'solo' | 'team' | 'class';          // 1인용/모둠/단체

export const REVIEW_CRITERIA = [
  { key: 'edu',       label: '교육적 적합성', desc: '교육과정 연계' },
  { key: 'quality',   label: '콘텐츠 완성도', desc: '기획서·가이드 완성도' },
  { key: 'safety',    label: '안전성·윤리',   desc: '개인정보·저작권 준수' },
  { key: 'usability', label: '사용 편의성',   desc: '교사 운영 용이성' },
  { key: 'market',    label: '시장성',        desc: '수요·가격 적정성' },
] as const;
export type CriterionKey = typeof REVIEW_CRITERIA[number]['key'];

export interface CriterionScore {
  key: CriterionKey;
  score: number;      // 0~20
  feedback: string;
}

export interface ContentAsset {
  id: string;
  code: string;
  title: string;
  description: string;
  creatorName: string;
  creatorEmail: string;
  institution?: string;
  submittedDate: string;
  grade: AssetGrade;
  envType: AssetEnvType;
  groupType: AssetGroupType;
  category: string;              // 카테고리 코드 (예: 'A-03')
  price: number;
  status: AssetStatus;
  // 검수용 문서 링크
  studioProjectId?: string;      // 스튜디오 프로젝트
  planPptUrl?: string;           // 기획서 (PPT)
  planDocUrl?: string;           // 기획서 (Word)
  guideUrl?: string;             // 운영 가이드
  // 검수 이력
  aiReview?: { date: string; passed: boolean; issues: string[] };
  humanReview?: { reviewer: string; date: string; total: number; scores: CriterionScore[] };
  rejectedReason?: string;
  /** mock 전용: AI 검수 실행 시 검출될 이슈 (실연동 시 AI 서비스 응답으로 대체) */
  mockAiIssues?: string[];
}

// ── 브랜드 자산 ──
export type BrandAssetCategory = 'logo' | 'font' | 'template' | 'guide' | 'etc';
export interface BrandAsset {
  id: string;
  name: string;
  category: BrandAssetCategory;
  fileType: string;      // PDF, PPTX, ZIP, TTF ...
  sizeKB: number;
  uploader: string;
  uploadedAt: string;
  version: string;
  description?: string;
}

// ── 지식 자산 ──
export type KnowledgeCategory = 'company' | 'product' | 'ops' | 'faq' | 'marketing';
export interface KnowledgePost {
  id: string;
  title: string;
  body: string;
  category: KnowledgeCategory;
  author: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
}

// ── 개발 로드맵 ──
export interface RoadmapItem {
  id: string;
  title: string;
  company: string;
  stage: DevStage;
  pm: string;
  planStart: string;
  devComplete: string;
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0~100
  targetQ: string;
}

// ── 크리에이터 ──
export type CreatorStatus = 'active' | 'pending' | 'inactive';
export interface Creator {
  id: string;
  name: string;
  type: ContentOwnerType;
  institution?: string;
  email: string;
  joinedDate: string;
  status: CreatorStatus;
  contentCount: number;
  totalRevenue: number;       // 누적 판매액
  pendingSettlement: number;  // 정산 대기액
  lastActiveDate: string;
}

// ── 회원 ──
export type MemberType = 'teacher' | 'student' | 'institution';
export type MemberStatus = 'active' | 'dormant' | 'suspended';
export interface Member {
  id: string;
  name: string;
  type: MemberType;
  school?: string;
  email: string;
  plan: 'free' | 'teacher_pro' | 'school' | 'enterprise';
  status: MemberStatus;
  joinedDate: string;
  lastActiveDate: string;
  totalSpent: number;
}

// ── 주문 ──
export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'cancelled';
export type OrderChannel = 'content' | 'experience' | 'kit' | 'subscription';
export interface Order {
  id: string;
  orderNo: string;
  buyerName: string;
  buyerSchool?: string;
  itemTitle: string;
  channel: OrderChannel;
  amount: number;
  status: OrderStatus;
  orderedAt: string;
}

// ── 정산 ──
export type SettlementStatus = 'pending' | 'confirmed' | 'paid' | 'disputed';
export interface Settlement {
  id: string;
  targetName: string;      // 크리에이터/파트너명
  targetType: 'creator' | 'partner' | 'experience';
  period: string;          // e.g. "2026년 6월"
  grossAmount: number;
  fee: number;
  netAmount: number;
  status: SettlementStatus;
}

// ── 체험 예약 ──
export type BookingStatus = 'pending' | 'confirmed' | 'done' | 'cancelled';
export interface Booking {
  id: string;
  programTitle: string;
  schoolName: string;
  date: string;
  participants: number;
  amount: number;
  status: BookingStatus;
}

// ── 체험서비스 프로그램 ──
export type ExpType = 'EDU' | 'THEME' | 'PARK';
export type ExpProgramStatus = 'active' | 'preparing' | 'suspended';
export interface ExperienceProgram {
  id: string;
  code: string;
  title: string;
  type: ExpType;             // EDU: 교육형 / THEME: 테마형 / PARK: 현장형
  location: string;
  region: string;
  minParticipants: number;
  maxParticipants: number;
  duration: string;
  pricePerStudent: number;
  grade: string;
  instructor: string;
  status: ExpProgramStatus;
  bookingCount: number;
  rating: number;
  description: string;
}

// ── 요금제 ──
export type PlanStatus = 'active' | 'hidden';
export interface PlanProduct {
  id: string;
  code: string;
  name: string;
  target: 'teacher' | 'school' | 'student' | 'institution';
  priceMonthly: number;      // 0 = 무료
  priceYearly: number;
  subscribers: number;
  status: PlanStatus;
  features: string[];
}

// ── 교구키트 ──
export type KitStatus = 'selling' | 'soldout' | 'preparing';
export interface KitProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  status: KitStatus;
  supplier?: string;
  linkedContent?: string;    // 연계 디지털 콘텐츠명
}

// ── 파트너/거래처 ──
export type PartnerType = 'supplier' | 'logistics' | 'content' | 'experience';
export type PartnerStatus = 'active' | 'expiring' | 'ended';
export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contact: string;           // 담당자
  email: string;
  phone?: string;
  contractStart: string;
  contractEnd: string;
  status: PartnerStatus;
  note?: string;
}

// ── 대시보드 ──
export interface ActionQueueItem {
  key: string;
  label: string;
  count: number;
  severity: 'danger' | 'warning' | 'info';
  link: string; // 딥링크 (필터 포함)
}

export interface Kpi {
  key: string;
  label: string;
  value: string;
  sub?: string;
  link?: string;
}

export interface MonthRevenue {
  month: string;
  content: number;      // 단위: 만원
  experience: number;
  kit: number;
  subscription: number;
}

export interface ActivityItem {
  id: string;
  icon: string;
  message: string;
  time: string;
  link?: string;
}

export interface DashboardData {
  actionQueue: ActionQueueItem[];
  kpis: Kpi[];
  revenueByMonth: MonthRevenue[];
  activity: ActivityItem[];
  roadmapTop: RoadmapItem[];
}

export interface BadgeCounts {
  contentsReview: number;   // 검수 대기
  settlementsPending: number;
  bookingsPending: number;
}

// ─────────────────────────────────────────────────────────────
// API 인터페이스: mock ↔ real HTTP 구현체 교체 지점
// ─────────────────────────────────────────────────────────────
export interface ErpApi {
  getDashboard(): Promise<DashboardData>;
  getBadgeCounts(): Promise<BadgeCounts>;
  listContents(): Promise<Content[]>;
  listRoadmap(): Promise<RoadmapItem[]>;
  listCreators(): Promise<Creator[]>;
  listMembers(): Promise<Member[]>;
  listOrders(): Promise<Order[]>;
  listSettlements(): Promise<Settlement[]>;
  listBookings(): Promise<Booking[]>;
  listExperiencePrograms(): Promise<ExperienceProgram[]>;
  listPlans(): Promise<PlanProduct[]>;
  listKits(): Promise<KitProduct[]>;
  listPartners(): Promise<Partner[]>;

  // ── 쓰기 (Phase 2에서 BFF의 mutation 엔드포인트와 매칭) ──
  saveContent(c: Content): Promise<void>;        // id 없으면 생성
  deleteContent(id: string): Promise<void>;
  saveMember(m: Member): Promise<void>;
  deleteMember(id: string): Promise<void>;
  saveCreator(c: Creator): Promise<void>;
  deleteCreator(id: string): Promise<void>;
  savePartner(p: Partner): Promise<void>;
  deletePartner(id: string): Promise<void>;
  saveKit(k: KitProduct): Promise<void>;
  deleteKit(id: string): Promise<void>;
  saveExperienceProgram(p: ExperienceProgram): Promise<void>;
  deleteExperienceProgram(id: string): Promise<void>;
  savePlan(p: PlanProduct): Promise<void>;
  updateSettlementStatus(id: string, status: SettlementStatus): Promise<void>;
  updateBookingStatus(id: string, status: BookingStatus): Promise<void>;

  // ── 콘텐츠 자산 (검수 파이프라인) ──
  listContentAssets(): Promise<ContentAsset[]>;
  /** 콘텐츠 자산 생성/수정 (id 없으면 생성) */
  saveContentAsset(a: ContentAsset): Promise<void>;
  /** AI 1차 검수 실행. 통과 → 2차 대기, 실패 → 수정 요청 + 크리에이터 메일 발송 */
  runAiReview(id: string): Promise<{ passed: boolean; issues: string[] }>;
  /** 2차 심사 점수 제출. 80점 이상 → 최종 승인 대기, 미만 → 수정 요청 + 메일 발송 */
  submitReviewScores(id: string, reviewer: string, scores: CriterionScore[]): Promise<{ total: number; passed: boolean }>;
  /** 최종 승인 (대표단) */
  finalApproveAsset(id: string): Promise<void>;
  rejectAsset(id: string, reason: string): Promise<void>;
  /** 크리에이터 재제출 → 1차 검수부터 재시작 */
  resubmitAsset(id: string): Promise<void>;

  // ── 브랜드 자산 ──
  listBrandAssets(): Promise<BrandAsset[]>;
  saveBrandAsset(a: BrandAsset): Promise<void>;
  deleteBrandAsset(id: string): Promise<void>;

  // ── 지식 자산 ──
  listKnowledgePosts(): Promise<KnowledgePost[]>;
  saveKnowledgePost(p: KnowledgePost): Promise<void>;
  deleteKnowledgePost(id: string): Promise<void>;
  togglePostLike(id: string): Promise<void>;
  togglePostBookmark(id: string): Promise<void>;
}
