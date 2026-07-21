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
  /** 콘텐츠마스터DB 카테고리맵 기준 "대분류-세부" (예: 역량중심형-정서인성) */
  category?: string;
  price: number;
  saleStatus: SaleStatus;
  devStage: DevStage;
  reviewStage?: ReviewStage;
  views: number;
  purchases: number;
  rating: number;
  reviewCount: number;
  progress?: number;       // 개발 진행률(%) — 미출시 콘텐츠 개발 현황용
  submittedDate?: string;
  tags: string[];
}

// ── 콘텐츠 서식·계약·MOU 문서 ──
export type ContentFormKind = 'template' | 'contract' | 'mou' | 'guide' | 'gov';
export interface ContentForm {
  id: string;
  title: string;
  description: string;
  kind: ContentFormKind;
  updatedDate: string;
  fileType: string;        // 예: DOCX, PDF, XLSX
}

// ── 콘텐츠 카테고리맵 (4 대분류 × 세부) ──
export const CONTENT_CATEGORY_GROUPS: { key: string; label: string; subs: string[] }[] = [
  { key: '교과연계형', label: 'A. 교과 연계형', subs: ['국어', '영어', '수학', '과학', '사회역사', '세계시민', '정보디지털', '도덕', '음악미술'] },
  { key: '역량중심형', label: 'B. 역량 중심형', subs: ['정서인성', '생태환경', '협력소통', '진로경제', '시민참여', '미디어리터러시'] },
  { key: '창의·예술',  label: 'C. 창의·예술형', subs: ['창의융합', '예술체험', '메이커', '디자인씽킹'] },
  { key: '특수목적형', label: 'D. 특수목적형', subs: ['학급경영', '학교행사', '계기교육', '안전교육', '진로체험', '자유학기', '방과후'] },
];

// ── 교육부 6대 핵심역량 (2015/2022 개정 교육과정) ──
export const CORE_COMPETENCIES: { label: string; desc: string }[] = [
  { label: '창의적 사고 역량', desc: '새로운 것을 창출하는 능력' },
  { label: '지식정보처리 역량', desc: '정보를 처리·활용하는 능력' },
  { label: '의사소통 역량', desc: '효과적으로 표현·소통하는 능력' },
  { label: '공동체 역량', desc: '공동체 발전에 참여하는 능력' },
  { label: '자기관리 역량', desc: '자기주도적으로 살아가는 능력' },
  { label: '심미적 감성 역량', desc: '삶의 의미와 가치를 향유하는 능력' },
];

// ─────────────────────────────────────────────────────────────
// 콘텐츠 자산 (검수 파이프라인) — 미출시 디지털 콘텐츠 관리
// 흐름: AI 1차 검수 → 2차 심사(5개 기준 × 20점, 80점 이상 통과)
//       → 최종 승인(대표단) → 승인 완료
// 실패/미달 시 수정 요청 → 크리에이터 재제출 → 1차부터 재검수
// ─────────────────────────────────────────────────────────────
export type AssetStatus =
  | 'ai_review'          // 1차: AI 기술 검수 대기
  | 'human_review'       // 2차: 심사위원 채점 대기
  | 'final_approval'     // 최종: 대표단 승인 대기
  | 'revision'           // 수정 요청 (크리에이터에게 반송)
  | 'payment_scheduled'  // 지급 예정 (검수 완료, 크리에이터 지급 대기)
  | 'release_scheduled'  // 출시 예정 (지급 완료)
  | 'released'           // 출시 완료
  | 'rejected';          // 반려

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
  commentId?: string; // 선택한 고정 코멘트 ID
}

/** 2차 심사 카테고리별 고정 코멘트 (선택 시 점수 자동 반영) */
export const CRITERION_COMMENT_OPTIONS: Record<CriterionKey, { id: string; label: string; score: number }[]> = {
  edu: [
    { id: 'edu-20', label: '교육과정 성취기준과 정확히 연계되어 교육 목표가 명확함', score: 20 },
    { id: 'edu-16', label: '교육과정 연계가 대체로 적절하나 일부 성취기준 보강 필요', score: 16 },
    { id: 'edu-12', label: '교육 목표는 있으나 성취기준 연계가 불명확함', score: 12 },
    { id: 'edu-8',  label: '교육적 목표 설정이 미흡하여 학습 효과 기대 어려움', score: 8 },
    { id: 'edu-4',  label: '교육과정과 무관하거나 교육 목표가 전혀 드러나지 않음', score: 4 },
  ],
  quality: [
    { id: 'quality-20', label: '기획서·가이드·콘텐츠 모두 완성도가 높음', score: 20 },
    { id: 'quality-16', label: '전반적 완성도 양호, 일부 자료 보완 권장', score: 16 },
    { id: 'quality-12', label: '핵심 구성은 갖추었으나 가이드·자료 미완성 부분 있음', score: 12 },
    { id: 'quality-8',  label: '기획서 또는 운영 가이드의 완성도가 현저히 부족함', score: 8 },
    { id: 'quality-4',  label: '출시 수준에 미달하는 미완성 콘텐츠', score: 4 },
  ],
  safety: [
    { id: 'safety-20', label: '개인정보·저작권·윤리 기준을 모두 준수함', score: 20 },
    { id: 'safety-16', label: '안전·윤리 기준 대체로 준수, 경미한 보완 필요', score: 16 },
    { id: 'safety-12', label: '일부 콘텐츠에서 저작권 표기 또는 개인정보 처리 보완 필요', score: 12 },
    { id: 'safety-8',  label: '민감 주제 처리 또는 저작권 이슈가 있어 수정 필요', score: 8 },
    { id: 'safety-4',  label: '안전·윤리 기준 미달로 즉각 수정이 필요함', score: 4 },
  ],
  usability: [
    { id: 'usability-20', label: '교사가 별도 설명 없이 바로 운영 가능한 수준', score: 20 },
    { id: 'usability-16', label: '운영 흐름이 명확하며 교사 부담이 적절함', score: 16 },
    { id: 'usability-12', label: '운영 가능하나 사전 준비 부담이 다소 큼', score: 12 },
    { id: 'usability-8',  label: '가이드만으로 운영하기 어렵고 교사 지원이 필요함', score: 8 },
    { id: 'usability-4',  label: '운영 절차가 불명확하여 현장 적용이 어려움', score: 4 },
  ],
  market: [
    { id: 'market-20', label: '수요·가격·차별성 모두 시장성이 우수함', score: 20 },
    { id: 'market-16', label: '시장 수요가 예상되며 가격이 적정함', score: 16 },
    { id: 'market-12', label: '시장성은 있으나 가격 또는 차별점 보강 필요', score: 12 },
    { id: 'market-8',  label: '유사 콘텐츠 대비 경쟁력이 부족함', score: 8 },
    { id: 'market-4',  label: '시장 수요가 낮거나 가격 대비 가치가 불명확함', score: 4 },
  ],
};

// ── 자문단 (2차 검증 외부 자문위원) ──
export interface Advisor {
  id: string;
  name: string;
  email: string;
  affiliation: string;   // 소속 (예: OO대학교 교육학과)
  specialty: string;     // 전문 분야 (예: 초등 수학교육)
  status: 'active' | 'inactive';
}

// ── 2차 검증 배정 (자문단 assign 정보) ──
export interface AdvisorAssignment {
  advisorId: string;
  advisorName: string;
  advisorEmail: string;
  assignedDate: string;        // 배정(이메일 발송)일
  deadline: string;            // 검수 마감일
  emailSubject: string;        // 발송된 이메일 제목
  emailBody: string;           // 발송된 이메일 본문 (지식 자산 양식 기반)
  reminderSentDate?: string;   // 마지막 리마인드 발송일
  reminderCount?: number;      // 리마인드 발송 횟수
}

// ── 수정 요청 추적 (크리에이터 수정 기한·리마인드) ──
export interface RevisionRequest {
  requestedDate: string;       // 수정 요청일
  deadline: string;            // 수정 마감일
  reminderSentDate?: string;
  reminderCount?: number;
}

// ── 크리에이터 지급 정보 (지급 예정 단계에서 표시) ──
export interface CreatorPayoutInfo {
  residentId: string;          // 주민등록번호
  address: string;
  bankAccount: string;         // 입금 계좌
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
  /** 2차 검증 자문단 배정 정보 (assign 시 생성) */
  advisorAssignment?: AdvisorAssignment;
  humanReview?: { reviewer: string; date: string; total: number; scores: CriterionScore[] };
  /** 수정 요청 시 생성 — 수정 현황 모달에서 사용 */
  revisionRequest?: RevisionRequest;
  rejectedReason?: string;
  paymentCompletedDate?: string;  // 지급 완료일
  releasedDate?: string;          // 출시일
  releasedUrl?: string;           // 출시된 콘텐츠 링크
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
  /** 2차 검증 자문단 목록 */
  listAdvisors(): Promise<Advisor[]>;
  /** 2차 검증 자문단 배정 + 자문단에게 배정 이메일 발송 */
  assignAdvisor(id: string, assignment: AdvisorAssignment): Promise<void>;
  /** 마감일 경과 시 자문단에게 리마인드 이메일 발송 */
  sendAdvisorReminder(id: string, emailSubject: string, emailBody: string): Promise<void>;
  /** 2차 심사 점수 제출. 80점 이상 → 최종 승인 대기, 미만 → 수정 요청 + 메일 발송 */
  submitReviewScores(id: string, reviewer: string, scores: CriterionScore[], revisionDeadline?: string): Promise<{ total: number; passed: boolean }>;
  /** 최종 승인 (대표단) → 지급 예정 */
  finalApproveAsset(id: string): Promise<void>;
  rejectAsset(id: string, reason: string): Promise<void>;
  /** 크리에이터 재제출 → 1차 검수부터 재시작 */
  resubmitAsset(id: string): Promise<void>;
  /** 지급 완료 처리 → 출시 예정 */
  completePayment(id: string): Promise<void>;
  /** 콘텐츠 출시 (가격 확정) → 출시 완료 */
  releaseContent(id: string, price: number): Promise<void>;
  /** 수정 마감 경과 시 크리에이터에게 리마인드 이메일 발송 */
  sendRevisionReminder(id: string, emailSubject: string, emailBody: string): Promise<void>;
  /** 관리자 수동 수정 완료 표시 → 1차 검수부터 재시작 */
  markRevisionComplete(id: string): Promise<void>;

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
