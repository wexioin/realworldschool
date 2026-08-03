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
// 콘텐츠 자산 (검수 파이프라인)
// 정본: docs/rwsadmin-spec.md §3-C (콘텐츠 자산 플로우 DFD 기준)
//
//   제출 → AI 1차 검수 → 2차 검수자 배정 → 전문가 2차 검수
//        → 최종 승인 → (지급정보) → 지급 → 출시
//
// 미달 시 수정 요청으로 빠졌다가, 크리에이터가 "수정 완료"를 누르면
// 1차 미달이었으면 배정 대기로, 2차 미달이었으면 최종 승인 대기로 복귀합니다.
// ─────────────────────────────────────────────────────────────

/** 사용자 역할 — 화면·권한 분기의 기준 */
export type UserRole = 'admin' | 'reviewer' | 'creator';

/**
 * 로그인 계정.
 * mock에서는 비밀번호를 평문으로 들고 있지만, 실연동 시에는 서버가 검증하고
 * 이 타입에서 password가 사라집니다. 화면은 login() 반환값에만 의존합니다.
 */
export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  /** 소속 — 로그인 화면 계정 목록과 프로필에 표시 */
  affiliation?: string;
  status: 'active' | 'inactive';
}

export type AssetStatus =
  | 'first_review_pending'        // 1차 검수 대기 — AI 검수 미실행
  | 'first_revision_requested'    // 1차 수정 요청 — AI 검수 미통과
  | 'reviewer_assignment_pending' // 2차 검수자 배정 대기
  | 'second_review_pending'       // 2차 검수 대기 — 검수자 배정 완료
  | 'second_revision_requested'   // 2차 수정 요청 — 루브릭 80점 미만
  | 'final_approval_pending'      // 최종 승인 대기
  | 'approved'                    // 검수완료(통과) — 지급정보 미제출
  | 'rejected'                    // 반려
  | 'payment_pending'             // 지급예정
  | 'paid'                        // 지급완료
  | 'released';                   // 출시

type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet';

/**
 * 상태별 표시 메타 — 라벨·배지색·스테퍼 순번의 단일 출처.
 * step: 검수 진행 스테퍼상의 위치(0부터). 수정 요청/반려는 정상 경로 밖이라 -1.
 */
export const ASSET_STATUS_META: Record<AssetStatus, { label: string; tone: BadgeTone; step: number }> = {
  first_review_pending:        { label: '1차 검수 대기',        tone: 'gray',   step: 0 },
  first_revision_requested:    { label: '1차 수정 요청',        tone: 'amber',  step: -1 },
  reviewer_assignment_pending: { label: '2차 검수자 배정 대기', tone: 'violet', step: 1 },
  second_review_pending:       { label: '2차 검수 대기',        tone: 'blue',   step: 2 },
  second_revision_requested:   { label: '2차 수정 요청',        tone: 'amber',  step: -1 },
  final_approval_pending:      { label: '최종 승인 대기',       tone: 'violet', step: 3 },
  approved:                    { label: '검수완료(통과)',       tone: 'blue',   step: 4 },
  rejected:                    { label: '반려',                 tone: 'red',    step: -1 },
  payment_pending:             { label: '지급예정',             tone: 'amber',  step: 5 },
  paid:                        { label: '지급완료',             tone: 'blue',   step: 6 },
  released:                    { label: '출시',                 tone: 'green',  step: 7 },
};

/** 스테퍼에 노출되는 정상 경로 (수정 요청·반려 제외) */
export const ASSET_STATUS_FLOW: AssetStatus[] = [
  'first_review_pending', 'reviewer_assignment_pending', 'second_review_pending',
  'final_approval_pending', 'approved', 'payment_pending', 'paid', 'released',
];

/** "검수 진행중"으로 집계하는 상태 — 사이드바 배지·대시보드 KPI 공통 기준 */
export const IN_REVIEW_STATUSES: AssetStatus[] = [
  'first_review_pending', 'reviewer_assignment_pending', 'second_review_pending', 'final_approval_pending',
];

/** 크리에이터 검수 현황 화면에 노출되는 상태별 안내문 (DFD 기준) */
export const CREATOR_STATUS_MESSAGE: Record<AssetStatus, string> = {
  first_review_pending:        '1차 AI 검수가 진행될 예정입니다.',
  first_revision_requested:    'AI 1차 검수에서 보완이 필요한 항목이 확인됐습니다. 수정 후 “수정 완료”를 눌러주세요.',
  reviewer_assignment_pending: '2차 검수자가 매칭될 예정입니다.',
  second_review_pending:       '검수자가 2차 검수를 진행 중입니다.',
  second_revision_requested:   '2차 검수 의견을 반영해 수정한 뒤 “수정 완료”를 눌러주세요.',
  final_approval_pending:      '모든 검수가 완료되어 최종 승인을 대기 중인 콘텐츠입니다.',
  approved:                    '크리에이터 페이지에서 요청된 개인정보를 입력해 주시기 바랍니다.',
  rejected:                    '아쉽게도 반려된 콘텐츠입니다. 사유를 확인해 주세요.',
  payment_pending:             '검수를 완료하여 지급이 예정인 콘텐츠입니다.',
  paid:                        '지급이 완료된 콘텐츠입니다.',
  released:                    '출시된 콘텐츠입니다.',
};

export type AssetGrade = '초등 저학년' | '초등 고학년' | '중학생' | '고등학생' | '전학년';
export type AssetEnvType = 'indoor' | 'outdoor' | 'mixed';       // 실내형/실외형/혼합형
export type AssetGroupType = 'solo' | 'team' | 'class';          // 1인용/모둠/단체

/** 2차 검수 통과 기준 (총점 100점 만점) */
export const REVIEW_PASS_MARK = 80;
/** 미통과 시 수정 마감일 = 검수일 + N일 */
export const REVISION_DEADLINE_DAYS = 7;
/** 2차 검수 마감일 기본값 = 배정일 + N일 */
export const ASSIGNMENT_DEADLINE_DAYS = 14;

/** 2차 검수 루브릭 — 가중 배점 합계 100점 */
export const REVIEW_CRITERIA = [
  { key: 'edu',          label: '교육과정 적합성',      desc: '성취기준 연계·학습 목표 명확성', max: 25 },
  { key: 'quality',      label: '콘텐츠 완성도',        desc: '기획서·가이드·콘텐츠 완성도',    max: 25 },
  { key: 'safety',       label: '저작권·개인정보 처리', desc: '저작권 표기·개인정보 처리 준수', max: 20 },
  { key: 'usability',    label: '운영 용이성',          desc: '교사가 현장에서 운영하기 쉬운가', max: 15 },
  { key: 'market',       label: '시장성',               desc: '수요·가격 적정성·차별성',        max: 15 },
] as const;
export type CriterionKey = typeof REVIEW_CRITERIA[number]['key'];

export interface CriterionScore {
  key: CriterionKey;
  score: number;      // 0 ~ 해당 항목 max
  feedback: string;
  commentId?: string; // 선택한 고정 코멘트 ID
}

/**
 * 항목별 고정 코멘트 (선택 시 점수 자동 반영).
 * 5단계는 각 항목 배점의 100/80/60/40/20% 로 환산합니다.
 */
export const CRITERION_COMMENT_OPTIONS: Record<CriterionKey, { id: string; label: string; score: number }[]> = {
  edu: [
    { id: 'edu-5', label: '교육과정 성취기준과 정확히 연계되어 교육 목표가 명확함', score: 25 },
    { id: 'edu-4', label: '교육과정 연계가 대체로 적절하나 일부 성취기준 보강 필요', score: 20 },
    { id: 'edu-3', label: '교육 목표는 있으나 성취기준 연계가 불명확함', score: 15 },
    { id: 'edu-2', label: '교육적 목표 설정이 미흡하여 학습 효과 기대 어려움', score: 10 },
    { id: 'edu-1', label: '교육과정과 무관하거나 교육 목표가 전혀 드러나지 않음', score: 5 },
  ],
  quality: [
    { id: 'quality-5', label: '기획서·가이드·콘텐츠 모두 완성도가 높음', score: 25 },
    { id: 'quality-4', label: '전반적 완성도 양호, 일부 자료 보완 권장', score: 20 },
    { id: 'quality-3', label: '핵심 구성은 갖추었으나 가이드·자료 미완성 부분 있음', score: 15 },
    { id: 'quality-2', label: '기획서 또는 운영 가이드의 완성도가 현저히 부족함', score: 10 },
    { id: 'quality-1', label: '출시 수준에 미달하는 미완성 콘텐츠', score: 5 },
  ],
  safety: [
    { id: 'safety-5', label: '개인정보·저작권·윤리 기준을 모두 준수함', score: 20 },
    { id: 'safety-4', label: '기준 대체로 준수, 경미한 출처 표기 보완 필요', score: 16 },
    { id: 'safety-3', label: '일부 자료의 저작권 표기 또는 개인정보 처리 보완 필요', score: 12 },
    { id: 'safety-2', label: '민감 주제 처리 또는 저작권 이슈가 있어 수정 필요', score: 8 },
    { id: 'safety-1', label: '저작권·개인정보 기준 미달로 즉각 수정이 필요함', score: 4 },
  ],
  usability: [
    { id: 'usability-5', label: '교사가 별도 설명 없이 바로 운영 가능한 수준', score: 15 },
    { id: 'usability-4', label: '운영 흐름이 명확하며 교사 부담이 적절함', score: 12 },
    { id: 'usability-3', label: '운영 가능하나 사전 준비 부담이 다소 큼', score: 9 },
    { id: 'usability-2', label: '가이드만으로 운영하기 어렵고 교사 지원이 필요함', score: 6 },
    { id: 'usability-1', label: '운영 절차가 불명확하여 현장 적용이 어려움', score: 3 },
  ],
  market: [
    { id: 'market-5', label: '수요·가격·차별성 모두 시장성이 우수함', score: 15 },
    { id: 'market-4', label: '시장 수요가 예상되며 가격이 적정함', score: 12 },
    { id: 'market-3', label: '시장성은 있으나 가격 또는 차별점 보강 필요', score: 9 },
    { id: 'market-2', label: '유사 콘텐츠 대비 경쟁력이 부족함', score: 6 },
    { id: 'market-1', label: '시장 수요가 낮거나 가격 대비 가치가 불명확함', score: 3 },
  ],
};

// ── 검수자 (2차 검수를 수행하는 외부 전문가) ──
export type AdvisorType = 'professor' | 'teacher' | 'researcher' | 'industry';
export interface Advisor {
  id: string;
  name: string;
  email: string;
  affiliation: string;   // 소속 (예: OO대학교 교육학과)
  specialty: string;     // 전문 분야 (예: 초등 수학교육)
  type: AdvisorType;
  /** 담당 카테고리 대분류 — 배정 시 추천 순위에 사용 */
  categories: string[];
  status: 'active' | 'inactive';
}

// ── 2차 검수 내용 (DFD: 배정 + 채점을 하나의 레코드로 관리) ──
export interface AdvisorAssignment {
  advisorId: string;
  advisorName: string;
  advisorEmail: string;
  assignedDate: string;        // 배정(이메일 발송)일
  deadline: string;            // 검수 마감일 = 배정일 + 2주 기본값
  emailSubject: string;        // 발송된 이메일 제목
  emailBody: string;           // 발송된 이메일 본문 (지식 자산 양식 기반)
  reminderSentDate?: string;   // 마지막 리마인드 발송일
  reminderCount?: number;      // 리마인드 발송 횟수
}

// ── 수정 요청 추적 (크리에이터 수정 기한·리마인드) ──
export interface RevisionRequest {
  requestedDate: string;       // 수정 요청일 = 검수일
  deadline: string;            // 수정 마감일 = 검수일 + 7일 (자동)
  /** 어느 단계에서 반송됐는지 — "수정 완료" 시 복귀 상태를 결정 */
  stage: 'first' | 'second';
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
  /** 상태 변경 시각 — 목록 정렬·상세 헤더에 사용 */
  statusChangedAt?: string;
  // 검수용 문서 링크
  studioProjectId?: string;      // 스튜디오 프로젝트
  planPptUrl?: string;           // 기획서 (PPT)
  planDocUrl?: string;           // 기획서 (Word)
  guideUrl?: string;             // 운영 가이드
  // ── 검수 이력 (DFD의 4개 엔티티에 대응) ──
  /** 1차 검수 내용 */
  aiReview?: { date: string; passed: boolean; issues: string[] };
  /** 2차 검수 내용 — 배정부 */
  advisorAssignment?: AdvisorAssignment;
  /** 2차 검수 내용 — 채점부 */
  humanReview?: {
    reviewer: string;
    date: string;
    total: number;
    passed: boolean;
    scores: CriterionScore[];
    /** 검수 의견 — 크리에이터에게 그대로 전달 */
    note?: string;
  };
  /** 검수 완료 내용 */
  finalReview?: { admin: string; date: string; note?: string };
  /** 반려 내용 */
  rejection?: { admin: string; date: string; reason: string };
  /** 수정 요청 시 생성 — 수정 현황 모달에서 사용 */
  revisionRequest?: RevisionRequest;
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
/** 로그인 실패 사유 — 화면에서 문구를 고르는 데 사용 */
export type LoginFailure = 'not_found' | 'wrong_password' | 'inactive';

export class LoginError extends Error {
  constructor(public reason: LoginFailure) {
    super(reason);
    this.name = 'LoginError';
  }
}

export interface ErpApi {
  // ── 인증 ──
  /** 로그인. 실패 시 LoginError를 던집니다. */
  login(email: string, password: string): Promise<UserAccount>;
  /** 로그인 화면의 데모 계정 목록 (실연동 시 제거) */
  listAccounts(): Promise<UserAccount[]>;

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
  /** ①② AI 1차 검수 실행. 통과 → 배정 대기, 미통과 → 1차 수정 요청 */
  runAiReview(id: string): Promise<{ passed: boolean; issues: string[] }>;
  /** 2차 검수자 목록 */
  listAdvisors(): Promise<Advisor[]>;
  /** ③ 2차 검수자 배정 + 배정 안내 메일 발송 → 2차 검수 대기 */
  assignAdvisor(id: string, assignment: AdvisorAssignment): Promise<void>;
  /** 마감일 경과 시 검수자에게 리마인드 이메일 발송 */
  sendAdvisorReminder(id: string, emailSubject: string, emailBody: string): Promise<void>;
  /** ④⑤ 루브릭 채점 제출. 80점 이상 → 최종 승인 대기, 미만 → 2차 수정 요청(마감 +7일) */
  submitReviewScores(id: string, reviewer: string, scores: CriterionScore[], note?: string): Promise<{ total: number; passed: boolean }>;
  /** ⑧⑨ 최종 승인. 지급정보 완비 → 지급예정, 미완비 → 검수완료(통과) */
  finalApproveAsset(id: string, admin: string, note?: string): Promise<{ status: AssetStatus }>;
  /** ⑩ 반려 */
  rejectAsset(id: string, admin: string, reason: string): Promise<void>;
  /** 크리에이터 재제출 → 1차 검수부터 재시작 */
  resubmitAsset(id: string): Promise<void>;
  /** ⑫ 지급 처리 → 지급완료 (지급일 = 당일) */
  completePayment(id: string): Promise<void>;
  /** ⑬ 출시 (가격 확정) → 출시 */
  releaseContent(id: string, price: number): Promise<void>;
  /** 수정 마감 경과 시 크리에이터에게 리마인드 이메일 발송 */
  sendRevisionReminder(id: string, emailSubject: string, emailBody: string): Promise<void>;
  /** ⑥⑦ 수정 완료. 1차 반송 → 배정 대기, 2차 반송 → 최종 승인 대기 */
  markRevisionComplete(id: string): Promise<void>;
  /** ⑪ 크리에이터 지급 정보 제출 → 검수완료(통과) 콘텐츠를 지급예정으로 전환 */
  submitPayoutInfo(creatorEmail: string, info: CreatorPayoutInfo): Promise<void>;
  /** 크리에이터 지급 정보 조회 (미입력이면 undefined) */
  getPayoutInfo(creatorEmail: string): Promise<CreatorPayoutInfo | undefined>;

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
