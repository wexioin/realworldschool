// v1 프로토타입에서 가져온 실제 콘텐츠 데이터 기반 mock.
// 실데이터 연동 시 이 파일은 삭제되고 HttpApi가 BFF에서 조회합니다.
import type {
  Content, RoadmapItem, Creator, Member, Order,
  Settlement, Booking, MonthRevenue, ActivityItem,
  ExperienceProgram, PlanProduct, KitProduct, Partner,
  ContentAsset, BrandAsset, KnowledgePost,
} from './types';

export const contents: Content[] = [
  { id: 'c001', code: 'RWS-001', projectId: 'sU6RJR2-OncvMz9qRCZU9A', title: '윤익고등학교', description: '나와 다른 사람의 생각과 입장을 이해하고 공감하는 활동', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '초등 고학년', subject: '도덕', topic: '학교폭력 예방/인성', price: 3000, saleStatus: 'selling', devStage: 'released', views: 8900, purchases: 456, rating: 4.6, reviewCount: 89, tags: ['도덕', '초등', '인성교육'] },
  { id: 'c002', projectId: '3lpulCfZ-3uHHq7iKiqG1w', code: 'RWS-002', title: '울면 안 돼?', description: '고마운 마음을 표현하고 나누는 생활의 아름다움을 느끼는 활동', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '초등 저학년', subject: '도덕', topic: '학교폭력 예방/인성', price: 3000, saleStatus: 'selling', devStage: 'released', views: 4500, purchases: 234, rating: 4.7, reviewCount: 67, tags: ['도덕', '감정교육'] },
  { id: 'c003', projectId: 'e0VD_XwrJQjilbJSBSmqVA', code: 'RWS-003', title: '바람을 버티고 싶어', description: '모든 폭력의 심각성을 인식하고 평화로운 학교생활을 위한 활동', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '전학년', subject: '도덕', topic: '학교폭력 예방/인성', price: 3000, saleStatus: 'selling', devStage: 'released', views: 5200, purchases: 312, rating: 4.5, reviewCount: 78, tags: ['학폭예방'] },
  { id: 'c004', projectId: 'XSZJkM9vIWVUvbOGFXSejA', code: 'RWS-006', title: '암호학개론', description: '규칙을 찾아 여러 가지 방법으로 문제를 해결하는 활동', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '전학년', subject: '수학·정보', topic: '정보/디지털 리터러시', price: 5000, saleStatus: 'selling', devStage: 'released', views: 12400, purchases: 890, rating: 4.8, reviewCount: 134, tags: ['수학', '암호'] },
  { id: 'c005', projectId: 'Lc-0xpoMuEML0OTMtLkQhQ', code: 'RWS-009', title: '세자저하가 사라졌다!', description: '조선의 건국과 통치 체제의 정비 과정을 탐색하는 야외 활동', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '전학년', subject: '역사', topic: '역사 계기교육', price: 9000, saleStatus: 'selling', devStage: 'released', views: 7800, purchases: 345, rating: 4.9, reviewCount: 98, tags: ['역사', '야외'] },
  { id: 'c006', projectId: 'u3AYXC5NQFp9ifrvVX6SEg', code: 'RWS-010', title: '트레저 넘버스', description: '네 자리 이하의 수의 범위에서 덧셈과 뺄셈 규칙 탐구', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '초등 고학년', subject: '수학', topic: '정보/디지털 리터러시', price: 20000, saleStatus: 'selling', devStage: 'released', views: 15600, purchases: 678, rating: 4.9, reviewCount: 142, tags: ['수학', '모둠'] },
  { id: 'c007', projectId: 'og2O6WpVAaQK9hmX1Vdxyg', code: 'RWS-012', title: '히든 보스', description: '절차적 사고에 의한 문제 해결 과정을 게임으로 체험', ownerType: 'original_ug', company: '유니크굿컴퍼니', creator: '콘텐츠팀', grade: '전학년', subject: '정보·수학', topic: '정보/디지털 리터러시', price: 25000, saleStatus: 'selling', devStage: 'released', views: 9200, purchases: 521, rating: 4.7, reviewCount: 110, tags: ['코딩', '모둠'] },
  { id: 'c011', projectId: 'redpoint_edu_001', code: 'RP-001', title: '기후위기 탈출 프로젝트', description: '기후 위기의 원인과 해결책을 탐구하는 인터랙티브 콘텐츠', ownerType: 'original_rp', company: '레드포인트', creator: '레드포인트 개발팀', grade: '중학생', subject: '과학', topic: '기후행동/생태환경', price: 8000, saleStatus: 'preparing', devStage: 'developing', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['기후', '과학'] },
  { id: 'c012', projectId: 'redpoint_edu_002', code: 'RP-002', title: '미래도시 설계사', description: '지속가능한 미래 도시를 협력하여 설계하는 STEM 융합 프로젝트', ownerType: 'original_rp', company: '레드포인트', creator: '레드포인트 개발팀', grade: '고등학생', subject: '사회·수학', topic: '직업/진로', price: 12000, saleStatus: 'preparing', devStage: 'planning', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['STEM'] },
  { id: 'c013', projectId: 'teacher_cr_001', code: 'CR-T-001', title: '나만의 태양계 키트', description: '태양계 행성을 직접 만들며 배우는 창의적 과학 교구 수업', ownerType: 'creator_teacher', company: '이준혁', creator: '이준혁', grade: '초등 3-6학년', subject: '과학', topic: '과학 탐구', price: 32000, saleStatus: 'selling', devStage: 'released', reviewStage: 'released', views: 8900, purchases: 456, rating: 4.6, reviewCount: 89, tags: ['교구키트', '과학'] },
  { id: 'c015', projectId: 'teacher_cr_003', code: 'CR-T-003', title: '로봇 코딩 스타터 키트', description: '실물 로봇으로 블록 코딩을 처음 배우는 초보자용 교구 패키지', ownerType: 'creator_teacher', company: '김희율', creator: '김희율', grade: '초등 5학년~중등', subject: '정보', topic: '정보/디지털 리터러시', price: 55000, saleStatus: 'selling', devStage: 'released', reviewStage: 'released', views: 15600, purchases: 678, rating: 4.9, reviewCount: 142, tags: ['코딩', '로봇'] },
  { id: 'c016', projectId: 'teacher_cr_004', code: 'CR-T-004', title: '감정 날씨 일기 프로젝트', description: '매일의 감정을 날씨로 표현하고 공유하는 정서 교육 프로그램', ownerType: 'creator_teacher', company: '박영수', creator: '박영수', grade: '초등 전학년', subject: '도덕', topic: '학교폭력 예방/인성', price: 5000, saleStatus: 'preparing', devStage: 'review_1', reviewStage: 'review_1', submittedDate: '2026-06-15', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['감정교육'] },
  { id: 'c017', projectId: 'student_cr_001', code: 'CR-S-001', title: '우리 마을 역사 탐험대', description: '지역 역사를 직접 조사하고 디지털 스토리텔링으로 제작한 학생 작품', ownerType: 'creator_student', company: '서울고등학교', creator: '김민재 외 4명', grade: '고등학생', subject: '역사', topic: '역사 계기교육', price: 0, saleStatus: 'free', devStage: 'review_2', reviewStage: 'review_2', submittedDate: '2026-06-20', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['학생작품', '무료'] },
  { id: 'c018', projectId: 'institution_cr_001', code: 'CR-I-001', title: '생태 감수성 교육 패키지', description: '국립생태원과 협력하여 개발한 생태 교육 현장 체험 프로그램', ownerType: 'creator_institution', company: '국립생태원', creator: '국립생태원 교육팀', grade: '중학생', subject: '과학', topic: '기후행동/생태환경', price: 15000, saleStatus: 'preparing', devStage: 'final_approval', reviewStage: 'final_approval', submittedDate: '2026-05-10', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['생태', '기관연계'] },
  { id: 'c019', projectId: 'partners_cr_001', code: 'CR-P-001', title: 'AI 미래탐험대', description: 'AI 스타트업과 협력한 인공지능 개념 이해 및 체험 교육 콘텐츠', ownerType: 'creator_partners', company: '(주)에듀AI', creator: '에듀AI 콘텐츠팀', grade: '고등학생', subject: '정보', topic: '정보/디지털 리터러시', price: 20000, saleStatus: 'preparing', devStage: 'review_1', reviewStage: 'review_1', submittedDate: '2026-06-28', views: 0, purchases: 0, rating: 0, reviewCount: 0, tags: ['AI', '파트너스'] },
];

// ── 콘텐츠 자산 (검수 파이프라인, 디지털 콘텐츠만) ──
export const contentAssets: ContentAsset[] = [
  {
    id: 'ca001', code: 'CA-2026-012', title: '수학 퍼즐 마스터',
    description: '규칙 추론과 패턴 해독을 게임화한 중학 수학 미션형 콘텐츠',
    creatorName: '최민서', creatorEmail: 'minseo@busan.edu', institution: '부산중학교',
    submittedDate: '2026-07-01', grade: '중학생', envType: 'indoor', groupType: 'solo',
    category: 'A-03', price: 5000, status: 'ai_review',
    studioProjectId: 'math_puzzle_master_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca001', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca001', guideUrl: 'https://drive.google.com/mock/guide-ca001',
    mockAiIssues: [],
  },
  {
    id: 'ca002', code: 'CA-2026-011', title: 'AI 미래탐험대',
    description: 'AI 개념 이해와 윤리적 활용을 다루는 고등 정보 콘텐츠',
    creatorName: '에듀AI 콘텐츠팀', creatorEmail: 'content@eduai.kr', institution: '(주)에듀AI',
    submittedDate: '2026-06-28', grade: '고등학생', envType: 'indoor', groupType: 'team',
    category: 'A-09', price: 20000, status: 'ai_review',
    studioProjectId: 'partners_cr_001', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca002', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca002', guideUrl: 'https://drive.google.com/mock/guide-ca002',
    mockAiIssues: ['미션 3-2에서 정답 입력 후 다음 단계로 진행되지 않음 (분기 오류)', '이미지 자산 2개 로딩 실패 (경로 오류)'],
  },
  {
    id: 'ca003', code: 'CA-2026-010', title: '감정 날씨 일기 프로젝트',
    description: '매일의 감정을 날씨로 표현하고 공유하는 정서 교육 프로그램',
    creatorName: '박영수', creatorEmail: 'park@edu.kr', institution: '서울초등학교',
    submittedDate: '2026-06-15', grade: '초등 저학년', envType: 'indoor', groupType: 'solo',
    category: 'B-01', price: 5000, status: 'human_review',
    studioProjectId: 'teacher_cr_004', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca003', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca003', guideUrl: 'https://drive.google.com/mock/guide-ca003',
    aiReview: { date: '2026-06-18', passed: true, issues: [] },
  },
  {
    id: 'ca004', code: 'CA-2026-009', title: '우리 마을 역사 탐험대',
    description: '지역 역사를 조사하고 디지털 스토리텔링으로 제작한 학생 작품',
    creatorName: '김민재 외 4명', creatorEmail: 'minji.k@seoulhs.kr', institution: '서울고등학교',
    submittedDate: '2026-06-20', grade: '고등학생', envType: 'mixed', groupType: 'team',
    category: 'A-05', price: 0, status: 'human_review',
    studioProjectId: 'student_cr_001', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca004', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca004', guideUrl: 'https://drive.google.com/mock/guide-ca004',
    aiReview: { date: '2026-06-23', passed: true, issues: [] },
  },
  {
    id: 'ca005', code: 'CA-2026-008', title: '생태 감수성 교육 패키지',
    description: '국립생태원 협력 생태 교육 콘텐츠 (실외 관찰 활동 연계)',
    creatorName: '국립생태원 교육팀', creatorEmail: 'edu@nie.re.kr', institution: '국립생태원',
    submittedDate: '2026-05-10', grade: '중학생', envType: 'outdoor', groupType: 'class',
    category: 'B-08', price: 15000, status: 'final_approval',
    studioProjectId: 'institution_cr_001', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca005', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca005', guideUrl: 'https://drive.google.com/mock/guide-ca005',
    aiReview: { date: '2026-05-15', passed: true, issues: [] },
    humanReview: {
      reviewer: '이검수', date: '2026-05-22', total: 88,
      scores: [
        { key: 'edu', score: 19, feedback: '2022 개정 교육과정 성취기준과 정확히 연계됨.' },
        { key: 'quality', score: 18, feedback: '기획서·가이드 모두 완성도 높음. 사진 자료 보강 권장.' },
        { key: 'safety', score: 20, feedback: '전문기관 자료 활용, 저작권·개인정보 문제 없음.' },
        { key: 'usability', score: 16, feedback: '실외 활동 준비물 목록을 가이드 앞부분으로 이동 권장.' },
        { key: 'market', score: 15, feedback: '단가 대비 활동 시간이 길어 학교 수요 검증 필요.' },
      ],
    },
  },
  {
    id: 'ca006', code: 'CA-2026-007', title: '환경 지킴이 캠페인',
    description: '학급 단위 환경 실천 캠페인 운영 콘텐츠',
    creatorName: '이수진', creatorEmail: 'suji@eco.edu',
    submittedDate: '2026-06-10', grade: '전학년', envType: 'mixed', groupType: 'class',
    category: 'B-08', price: 3000, status: 'revision',
    studioProjectId: 'eco_campaign_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca006', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca006', guideUrl: 'https://drive.google.com/mock/guide-ca006',
    aiReview: { date: '2026-06-12', passed: true, issues: [] },
    humanReview: {
      reviewer: '김검수', date: '2026-06-14', total: 62,
      scores: [
        { key: 'edu', score: 10, feedback: '교육과정 성취기준 연계가 명시되지 않음.' },
        { key: 'quality', score: 12, feedback: '가이드 문서에 차시별 운영 흐름 없음.' },
        { key: 'safety', score: 18, feedback: '문제 없음.' },
        { key: 'usability', score: 12, feedback: '교사 사전 준비 부담이 큼. 준비물 간소화 필요.' },
        { key: 'market', score: 10, feedback: '유사 무료 콘텐츠 다수. 차별점 보강 필요.' },
      ],
    },
  },
  {
    id: 'ca007', code: 'CA-2026-006', title: '전래동화 스토리 게임',
    description: '전래동화를 재해석한 스토리텔링 미션 콘텐츠',
    creatorName: '한소영', creatorEmail: 'soyoung@story.edu', institution: '대전초등학교',
    submittedDate: '2026-05-28', grade: '초등 저학년', envType: 'indoor', groupType: 'solo',
    category: 'C-02', price: 4000, status: 'approved',
    studioProjectId: 'folktale_story_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca007', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca007', guideUrl: 'https://drive.google.com/mock/guide-ca007',
    aiReview: { date: '2026-05-30', passed: true, issues: [] },
    humanReview: {
      reviewer: '최선임', date: '2026-06-05', total: 91,
      scores: [
        { key: 'edu', score: 18, feedback: '국어과 문학 영역 연계 우수.' },
        { key: 'quality', score: 19, feedback: '기획·가이드 완성도 높음.' },
        { key: 'safety', score: 20, feedback: '문제 없음.' },
        { key: 'usability', score: 18, feedback: '운영 흐름 명확.' },
        { key: 'market', score: 16, feedback: '저학년 담임 수요 예상.' },
      ],
    },
  },
  {
    id: 'ca008', code: 'CA-2026-005', title: '학교폭력 예방 시나리오 게임',
    description: '역할극 기반 학교폭력 예방 교육 콘텐츠',
    creatorName: '오정민', creatorEmail: 'jmoh@school.edu', institution: '인천중학교',
    submittedDate: '2026-05-20', grade: '중학생', envType: 'indoor', groupType: 'team',
    category: 'B-03', price: 6000, status: 'approved',
    studioProjectId: 'anti_bullying_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca008', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca008', guideUrl: 'https://drive.google.com/mock/guide-ca008',
    aiReview: { date: '2026-05-22', passed: true, issues: [] },
    humanReview: {
      reviewer: '이검수', date: '2026-05-27', total: 85,
      scores: [
        { key: 'edu', score: 17, feedback: '도덕과 연계 적절.' },
        { key: 'quality', score: 17, feedback: '시나리오 완성도 양호.' },
        { key: 'safety', score: 19, feedback: '민감 주제 처리 적절.' },
        { key: 'usability', score: 17, feedback: '운영 용이.' },
        { key: 'market', score: 15, feedback: '학폭예방 의무교육 수요 있음.' },
      ],
    },
  },
  {
    id: 'ca009', code: 'CA-2026-004', title: '급식실 미스터리',
    description: '학교 공간을 활용한 추리 게임 (동선 설계 미흡)',
    creatorName: '장우혁', creatorEmail: 'whjang@teach.kr', institution: '광주초등학교',
    submittedDate: '2026-05-02', grade: '초등 고학년', envType: 'mixed', groupType: 'team',
    category: 'D-01', price: 5000, status: 'rejected',
    rejectedReason: '학교 안전 규정과 충돌하는 동선 설계(급식실 조리 구역 진입). 안전성 기준 미달로 반려.',
    studioProjectId: 'cafeteria_mystery_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca009', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca009', guideUrl: 'https://drive.google.com/mock/guide-ca009',
    aiReview: { date: '2026-05-04', passed: true, issues: [] },
    humanReview: {
      reviewer: '김검수', date: '2026-05-09', total: 58,
      scores: [
        { key: 'edu', score: 12, feedback: '교육 목표 불명확.' },
        { key: 'quality', score: 13, feedback: '가이드 미완성.' },
        { key: 'safety', score: 8, feedback: '조리 구역 진입 동선 — 안전 규정 위반.' },
        { key: 'usability', score: 13, feedback: '공간 섭외 부담 큼.' },
        { key: 'market', score: 12, feedback: '—' },
      ],
    },
  },
  {
    id: 'ca010', code: 'CA-2026-013', title: '민주시민 모의투표 체험',
    description: '학급 자치 활동과 연계한 민주주의 이해 콘텐츠',
    creatorName: '서지혜', creatorEmail: 'jhseo@civic.edu', institution: '서울중학교',
    submittedDate: '2026-07-03', grade: '중학생', envType: 'indoor', groupType: 'class',
    category: 'B-09', price: 4500, status: 'ai_review',
    studioProjectId: 'civic_vote_01', planPptUrl: 'https://drive.google.com/mock/plan-ppt-ca010', planDocUrl: 'https://drive.google.com/mock/plan-doc-ca010', guideUrl: 'https://drive.google.com/mock/guide-ca010',
    mockAiIssues: [],
  },
];

// ── 브랜드 자산 ──
export const brandAssets: BrandAsset[] = [
  { id: 'ba001', name: '리얼월드 스쿨 로고 패키지', category: 'logo', fileType: 'ZIP', sizeKB: 24800, uploader: '디자인팀', uploadedAt: '2026-05-12', version: 'v3.1', description: '가로형·세로형·심볼 / AI·SVG·PNG 포함' },
  { id: 'ba002', name: '로고 사용 가이드라인', category: 'guide', fileType: 'PDF', sizeKB: 8400, uploader: '디자인팀', uploadedAt: '2026-05-12', version: 'v3.1', description: '최소 크기·여백·금지 사례' },
  { id: 'ba003', name: '브랜드 전용 폰트 (본고딕 커스텀)', category: 'font', fileType: 'TTF', sizeKB: 12600, uploader: '디자인팀', uploadedAt: '2026-03-02', version: 'v1.0', description: '본문·제목용 2종' },
  { id: 'ba004', name: '브랜드 컬러 가이드', category: 'guide', fileType: 'PDF', sizeKB: 3200, uploader: '디자인팀', uploadedAt: '2026-04-18', version: 'v2.0', description: '메인·서브 컬러 팔레트 및 사용 비율' },
  { id: 'ba005', name: '보고서 템플릿', category: 'template', fileType: 'PPTX', sizeKB: 5800, uploader: '경영지원팀', uploadedAt: '2026-06-01', version: 'v2.3', description: '내부·외부 보고용 슬라이드 마스터' },
  { id: 'ba006', name: '공문·제안서 템플릿', category: 'template', fileType: 'DOCX', sizeKB: 1400, uploader: '경영지원팀', uploadedAt: '2026-06-01', version: 'v1.4', description: '학교·교육청 발송용 서식' },
  { id: 'ba007', name: '사업소개서 (학교 영업용)', category: 'template', fileType: 'PDF', sizeKB: 15200, uploader: '영업팀', uploadedAt: '2026-06-20', version: 'v4.0', description: '2026 하반기 버전' },
  { id: 'ba008', name: '명함 템플릿', category: 'template', fileType: 'AI', sizeKB: 2100, uploader: '디자인팀', uploadedAt: '2026-02-10', version: 'v1.2' },
];

// ── 지식 자산 ──
export const knowledgePosts: KnowledgePost[] = [
  { id: 'kp001', title: '리얼월드 스쿨 서비스 구조 한장 정리', body: '스튜디오(개발) → 스쿨(판매·이용) → 어드민(운영) 3개 서비스의 역할과 데이터 흐름을 정리했습니다. 신규 입사자 온보딩 자료로 활용하세요.', category: 'company', author: '김운영', createdAt: '2026-06-30', likes: 12, likedByMe: false, bookmarkedByMe: true },
  { id: 'kp002', title: '학교 견적 문의 대응 스크립트 (2026 개정)', body: '교육청 예산 집행 시기(3월·9월)에 맞춘 견적 안내 순서와 자주 나오는 질문 답변입니다. 나라장터 등록 여부 질문이 가장 많습니다.', category: 'product', author: '박영업', createdAt: '2026-06-25', likes: 9, likedByMe: true, bookmarkedByMe: false },
  { id: 'kp003', title: '크리에이터 정산 세무 처리 기준', body: '개인(교사) 크리에이터는 기타소득 8.8% 원천징수, 사업자는 세금계산서 수취로 처리합니다. 연 300만원 초과 개인은 종합소득 안내 필요.', category: 'ops', author: '최재무', createdAt: '2026-06-18', likes: 15, likedByMe: false, bookmarkedByMe: true },
  { id: 'kp004', title: '홈페이지 FAQ 상위 10개 및 답변 링크', body: '최근 3개월 CS 인입 기준 상위 질문: 학생 접속 방법, 결제 영수증 발급, 학급 코드 재발급 등. FAQ 페이지 개편 시 이 순서를 반영해 주세요.', category: 'faq', author: '이CS', createdAt: '2026-06-10', likes: 7, likedByMe: false, bookmarkedByMe: false },
  { id: 'kp005', title: '교사 커뮤니티 홍보 채널 성과 정리 (상반기)', body: '인디스쿨·교사 인스타그램·블로그 체험단 3개 채널 중 인디스쿨 전환율이 가장 높았습니다. 하반기 예산 배분 참고용 데이터 포함.', category: 'marketing', author: '정마케팅', createdAt: '2026-07-02', likes: 11, likedByMe: true, bookmarkedByMe: false },
  { id: 'kp006', title: '개인정보 처리 방침 개정 이력 (학생 데이터)', body: '2026년 5월 개정: 학생 계정은 학급 단위 가명 처리로 전환. 학부모 동의서 양식 링크와 보관 기준을 정리했습니다.', category: 'ops', author: '최재무', createdAt: '2026-05-20', likes: 6, likedByMe: false, bookmarkedByMe: false },
];

export const roadmap: RoadmapItem[] = [
  { id: 'rm001', title: '기후위기 탈출 프로젝트', company: '레드포인트', stage: 'developing', pm: '박PM', planStart: '2026-06-01', devComplete: '2026-09-30', priority: 'high', progress: 45, targetQ: '2026 Q3' },
  { id: 'rm002', title: '미래도시 설계사', company: '레드포인트', stage: 'planning', pm: '박PM', planStart: '2026-07-01', devComplete: '2026-11-30', priority: 'medium', progress: 10, targetQ: '2026 Q4' },
  { id: 'rm003', title: '수학 로직 게임 vol.2', company: '유니크굿컴퍼니', stage: 'developing', pm: '이PM', planStart: '2026-05-15', devComplete: '2026-08-31', priority: 'high', progress: 70, targetQ: '2026 Q3' },
  { id: 'rm004', title: '한국사 탐정단 시즌2', company: '유니크굿컴퍼니', stage: 'review_1', pm: '이PM', planStart: '2026-03-01', devComplete: '2026-07-31', priority: 'high', progress: 85, targetQ: '2026 Q3' },
  { id: 'rm005', title: '성교육 안전지킴이', company: '유니크굿컴퍼니', stage: 'planning', pm: '김PM', planStart: '2026-08-01', devComplete: '2026-12-31', priority: 'medium', progress: 5, targetQ: '2026 Q4' },
  { id: 'rm008', title: '생태 감수성 교육 패키지', company: '국립생태원', stage: 'final_approval', pm: '최PM', planStart: '2026-02-01', devComplete: '2026-07-15', priority: 'high', progress: 95, targetQ: '2026 Q3' },
];

export const creators: Creator[] = [
  { id: 'cr001', name: '이준혁', type: 'creator_teacher', institution: '서울초등학교', email: 'junhyuk@edu.kr', joinedDate: '2025-09-01', status: 'active', contentCount: 2, totalRevenue: 18804000, pendingSettlement: 1240000, lastActiveDate: '2026-07-04' },
  { id: 'cr002', name: '김희율', type: 'creator_teacher', institution: '대전중학교', email: 'heeyul@edu.kr', joinedDate: '2025-10-12', status: 'active', contentCount: 1, totalRevenue: 37290000, pendingSettlement: 2810000, lastActiveDate: '2026-07-05' },
  { id: 'cr003', name: '박영수', type: 'creator_teacher', institution: '서울초등학교', email: 'park@edu.kr', joinedDate: '2026-05-20', status: 'pending', contentCount: 1, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-06-15' },
  { id: 'cr004', name: '김민재 외 4명', type: 'creator_student', institution: '서울고등학교', email: 'minji.k@seoulhs.kr', joinedDate: '2026-06-01', status: 'pending', contentCount: 1, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-06-20' },
  { id: 'cr005', name: '국립생태원 교육팀', type: 'creator_institution', institution: '국립생태원', email: 'edu@nie.re.kr', joinedDate: '2026-01-15', status: 'active', contentCount: 1, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-07-02' },
  { id: 'cr006', name: '에듀AI 콘텐츠팀', type: 'creator_partners', institution: '(주)에듀AI', email: 'content@eduai.kr', joinedDate: '2026-04-08', status: 'active', contentCount: 1, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-06-28' },
  { id: 'cr007', name: '최민서', type: 'creator_teacher', institution: '부산중학교', email: 'minseo@busan.edu', joinedDate: '2026-06-25', status: 'pending', contentCount: 1, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-07-01' },
  { id: 'cr008', name: '이수진', type: 'creator_teacher', email: 'suji@eco.edu', joinedDate: '2026-05-30', status: 'inactive', contentCount: 0, totalRevenue: 0, pendingSettlement: 0, lastActiveDate: '2026-06-10' },
];

export const members: Member[] = [
  { id: 'm001', name: '김선희', type: 'teacher', school: '서울광남초등학교', email: 'sunhee@sen.go.kr', plan: 'teacher_pro', status: 'active', joinedDate: '2025-11-03', lastActiveDate: '2026-07-05', totalSpent: 186000 },
  { id: 'm002', name: '박정우', type: 'teacher', school: '분당중학교', email: 'jwpark@goe.go.kr', plan: 'school', status: 'active', joinedDate: '2025-08-21', lastActiveDate: '2026-07-04', totalSpent: 452000 },
  { id: 'm003', name: '이하은', type: 'teacher', school: '대구수성초등학교', email: 'haeun@dge.go.kr', plan: 'free', status: 'active', joinedDate: '2026-03-15', lastActiveDate: '2026-06-30', totalSpent: 12000 },
  { id: 'm004', name: '서울광남초등학교', type: 'institution', email: 'admin@gwangnam.es.kr', plan: 'enterprise', status: 'active', joinedDate: '2025-09-01', lastActiveDate: '2026-07-03', totalSpent: 3200000 },
  { id: 'm005', name: '정민석', type: 'teacher', school: '인천연수고등학교', email: 'msjung@ice.go.kr', plan: 'teacher_pro', status: 'dormant', joinedDate: '2025-07-11', lastActiveDate: '2026-04-02', totalSpent: 98000 },
  { id: 'm006', name: '한지민', type: 'teacher', school: '광주서석초등학교', email: 'jmhan@gen.go.kr', plan: 'free', status: 'active', joinedDate: '2026-05-28', lastActiveDate: '2026-07-06', totalSpent: 0 },
  { id: 'm007', name: '분당중학교', type: 'institution', email: 'office@bundang.ms.kr', plan: 'school', status: 'active', joinedDate: '2026-01-20', lastActiveDate: '2026-07-01', totalSpent: 1850000 },
  { id: 'm008', name: '오세훈', type: 'teacher', school: '부산해운대초등학교', email: 'shoh@pen.go.kr', plan: 'teacher_pro', status: 'active', joinedDate: '2026-02-14', lastActiveDate: '2026-07-05', totalSpent: 234000 },
];

export const orders: Order[] = [
  { id: 'o001', orderNo: 'ORD-20260706-001', buyerName: '김선희', buyerSchool: '서울광남초등학교', itemTitle: '암호학개론', channel: 'content', amount: 150000, status: 'paid', orderedAt: '2026-07-06 09:12' },
  { id: 'o002', orderNo: 'ORD-20260705-018', buyerName: '박정우', buyerSchool: '분당중학교', itemTitle: '학교로 찾아가는 역사 탐험대 (체험)', channel: 'experience', amount: 315000, status: 'paid', orderedAt: '2026-07-05 16:44' },
  { id: 'o003', orderNo: 'ORD-20260705-011', buyerName: '서울광남초등학교', itemTitle: '로봇 코딩 스타터 키트 ×12', channel: 'kit', amount: 660000, status: 'paid', orderedAt: '2026-07-05 11:02' },
  { id: 'o004', orderNo: 'ORD-20260704-032', buyerName: '오세훈', buyerSchool: '부산해운대초등학교', itemTitle: '티처 프로 연간 구독', channel: 'subscription', amount: 238800, status: 'paid', orderedAt: '2026-07-04 20:18' },
  { id: 'o005', orderNo: 'ORD-20260704-027', buyerName: '이하은', buyerSchool: '대구수성초등학교', itemTitle: '트레저 넘버스', channel: 'content', amount: 20000, status: 'pending', orderedAt: '2026-07-04 15:37' },
  { id: 'o006', orderNo: 'ORD-20260703-009', buyerName: '분당중학교', itemTitle: '기후 위기 대응 워크숍 (체험)', channel: 'experience', amount: 280000, status: 'paid', orderedAt: '2026-07-03 10:25' },
  { id: 'o007', orderNo: 'ORD-20260702-041', buyerName: '한지민', buyerSchool: '광주서석초등학교', itemTitle: '울면 안 돼?', channel: 'content', amount: 3000, status: 'refunded', orderedAt: '2026-07-02 13:50' },
];

export const settlements: Settlement[] = [
  { id: 's001', targetName: '이준혁', targetType: 'creator', period: '2026년 6월', grossAmount: 1550000, fee: 310000, netAmount: 1240000, status: 'pending' },
  { id: 's002', targetName: '김희율', targetType: 'creator', period: '2026년 6월', grossAmount: 3512500, fee: 702500, netAmount: 2810000, status: 'pending' },
  { id: 's003', targetName: '김강사 (체험)', targetType: 'experience', period: '2026년 6월', grossAmount: 4230000, fee: 846000, netAmount: 3384000, status: 'pending' },
  { id: 's004', targetName: '(주)에듀AI', targetType: 'partner', period: '2026년 5월', grossAmount: 1200000, fee: 240000, netAmount: 960000, status: 'paid' },
  { id: 's005', targetName: '이준혁', targetType: 'creator', period: '2026년 5월', grossAmount: 1890000, fee: 378000, netAmount: 1512000, status: 'paid' },
  { id: 's006', targetName: '이강사 (체험)', targetType: 'experience', period: '2026년 6월', grossAmount: 980000, fee: 196000, netAmount: 784000, status: 'disputed' },
];

export const bookings: Booking[] = [
  { id: 'b001', programTitle: '학교로 찾아가는 역사 탐험대', schoolName: '분당중학교', date: '2026-07-14', participants: 32, amount: 315000, status: 'pending' },
  { id: 'b002', programTitle: '찾아가는 기후 위기 대응 워크숍', schoolName: '서울광남초등학교', date: '2026-07-17', participants: 28, amount: 280000, status: 'pending' },
  { id: 'b003', programTitle: '학교로 찾아가는 역사 탐험대', schoolName: '인천연수고등학교', date: '2026-07-21', participants: 35, amount: 350000, status: 'confirmed' },
  { id: 'b004', programTitle: '생태 감수성 현장 체험', schoolName: '대구수성초등학교', date: '2026-07-09', participants: 24, amount: 360000, status: 'confirmed' },
  { id: 'b005', programTitle: '찾아가는 기후 위기 대응 워크숍', schoolName: '부산해운대초등학교', date: '2026-06-26', participants: 30, amount: 300000, status: 'done' },
  { id: 'b006', programTitle: '학교로 찾아가는 역사 탐험대', schoolName: '광주서석초등학교', date: '2026-07-11', participants: 27, amount: 270000, status: 'pending' },
];

export const revenueByMonth: MonthRevenue[] = [
  { month: '2월', content: 1820, experience: 2480, kit: 940, subscription: 610 },
  { month: '3월', content: 2040, experience: 3120, kit: 1150, subscription: 700 },
  { month: '4월', content: 1480, experience: 1890, kit: 820, subscription: 740 },
  { month: '5월', content: 1960, experience: 2740, kit: 1280, subscription: 810 },
  { month: '6월', content: 2280, experience: 3560, kit: 1420, subscription: 890 },
  { month: '7월', content: 890, experience: 1210, kit: 660, subscription: 930 },
];

export const activity: ActivityItem[] = [
  { id: 'a1', icon: '🛒', message: '서울광남초 김선희 선생님이 「암호학개론」 학급 라이선스를 구매했습니다', time: '10분 전', link: '/sales' },
  { id: 'a2', icon: '📝', message: '최민서 선생님(부산중)이 「수학 퍼즐 마스터」 검수를 신청했습니다', time: '1시간 전', link: '/content-assets?status=ai_review' },
  { id: 'a3', icon: '✅', message: '「생태 감수성 교육 패키지」 2차 검수 통과 — 최종 승인 대기', time: '3시간 전', link: '/content-assets?status=final_approval' },
  { id: 'a4', icon: '📅', message: '분당중학교가 「역사 탐험대」 체험을 예약했습니다 (7/14, 32명)', time: '5시간 전', link: '/experience?status=pending' },
  { id: 'a5', icon: '👥', message: '한지민 선생님(광주서석초)이 신규 가입했습니다', time: '어제', link: '/members' },
  { id: 'a6', icon: '💰', message: '6월 크리에이터 정산 2건이 확정 대기 중입니다', time: '어제', link: '/settlements?status=pending' },
  { id: 'a7', icon: '⚠️', message: '이강사 체험 정산에 이의가 제기되었습니다', time: '2일 전', link: '/settlements?status=disputed' },
];

// ── 체험서비스 프로그램 (v1 데이터 기반) ──
export const experiencePrograms: ExperienceProgram[] = [
  { id: 'exp001', code: 'EDU-001', title: '학교로 찾아가는 역사 탐험대', type: 'EDU', location: '교실 방문', region: '서울/경기', minParticipants: 15, maxParticipants: 35, duration: '90분', pricePerStudent: 9000, grade: '초등 전학년', instructor: '김강사', status: 'active', bookingCount: 47, rating: 4.8, description: '조선시대 왕의 하루를 체험하는 교실 방문형 역사 체험 프로그램' },
  { id: 'exp002', code: 'EDU-002', title: '찾아가는 기후 위기 대응 워크숍', type: 'EDU', location: '교실 방문', region: '전국', minParticipants: 20, maxParticipants: 40, duration: '60분', pricePerStudent: 7000, grade: '중학생', instructor: '이강사', status: 'active', bookingCount: 32, rating: 4.6, description: '기후 위기의 원인과 해결책을 직접 체험하는 교실 방문 환경교육' },
  { id: 'exp003', code: 'THEME-001', title: '미스터리 사이언스 랩', type: 'THEME', location: '테마 공간', region: '서울', minParticipants: 10, maxParticipants: 25, duration: '120분', pricePerStudent: 15000, grade: '초등 고학년', instructor: '박강사', status: 'active', bookingCount: 28, rating: 4.9, description: '실험실 탈출 컨셉의 과학 원리 테마 체험' },
  { id: 'exp004', code: 'PARK-001', title: '생태공원 자연 탐사대', type: 'PARK', location: '현장(공원)', region: '서울/경기', minParticipants: 20, maxParticipants: 50, duration: '150분', pricePerStudent: 12000, grade: '초등 전학년', instructor: '최강사', status: 'active', bookingCount: 19, rating: 4.7, description: '생태공원에서 진행하는 현장형 자연 관찰 프로그램' },
  { id: 'exp005', code: 'EDU-003', title: '찾아가는 진로 탐험 워크숍', type: 'EDU', location: '교실 방문', region: '전국', minParticipants: 15, maxParticipants: 30, duration: '90분', pricePerStudent: 8000, grade: '중·고등학생', instructor: '정강사', status: 'preparing', bookingCount: 0, rating: 0, description: '미래 직업 세계를 탐색하는 교실 방문형 진로교육' },
];

// ── 요금제 ──
export const plans: PlanProduct[] = [
  { id: 'pl001', code: 'PLAN-FREE', name: '무료', target: 'teacher', priceMonthly: 0, priceYearly: 0, subscribers: 194, status: 'active', features: ['무료 콘텐츠 이용', '학급 1개'] },
  { id: 'pl002', code: 'PLAN-TPRO-M', name: '티처 프로 (월간)', target: 'teacher', priceMonthly: 19900, priceYearly: 0, subscribers: 812, status: 'active', features: ['전체 콘텐츠 이용', '학급 3개', '학습 리포트'] },
  { id: 'pl003', code: 'PLAN-TPRO-Y', name: '티처 프로 (연간)', target: 'teacher', priceMonthly: 0, priceYearly: 199000, subscribers: 829, status: 'active', features: ['전체 콘텐츠 이용', '학급 3개', '학습 리포트', '2개월 할인'] },
  { id: 'pl004', code: 'PLAN-SCH-B', name: '스쿨 베이직', target: 'school', priceMonthly: 99000, priceYearly: 990000, subscribers: 421, status: 'active', features: ['교사 10명', '학급 무제한', '관리자 대시보드'] },
  { id: 'pl005', code: 'PLAN-SCH-P', name: '스쿨 프리미엄', target: 'school', priceMonthly: 199000, priceYearly: 1990000, subscribers: 173, status: 'active', features: ['교사 무제한', '학급 무제한', '전담 매니저', '체험 할인'] },
  { id: 'pl006', code: 'PLAN-ENT', name: '엔터프라이즈', target: 'institution', priceMonthly: 0, priceYearly: 0, subscribers: 594, status: 'active', features: ['교육청·재단 맞춤 계약', 'SSO 연동', '전용 콘텐츠'] },
  { id: 'pl007', code: 'PLAN-STU', name: '학생 무료', target: 'student', priceMonthly: 0, priceYearly: 0, subscribers: 218, status: 'hidden', features: ['교사 배포 콘텐츠 참여'] },
];

// ── 교구키트 ──
export const kits: KitProduct[] = [
  { id: 'kit001', code: 'KIT-001', name: '나만의 태양계 키트', price: 32000, stock: 124, sold: 456, status: 'selling', supplier: '한국교구산업', linkedContent: '나만의 태양계 키트' },
  { id: 'kit002', code: 'KIT-002', name: '로봇 코딩 스타터 키트', price: 55000, stock: 48, sold: 678, status: 'selling', supplier: '로보에듀텍', linkedContent: '로봇 코딩 스타터 키트' },
  { id: 'kit003', code: 'KIT-003', name: '영어 파닉스 카드 게임', price: 18000, stock: 210, sold: 234, status: 'selling', supplier: '한국교구산업' },
  { id: 'kit004', code: 'KIT-004', name: '암호 해독 미션 카드팩', price: 24000, stock: 0, sold: 312, status: 'soldout', supplier: '한국교구산업', linkedContent: '암호학개론' },
  { id: 'kit005', code: 'KIT-005', name: '조선왕조 역사 보드게임', price: 45000, stock: 67, sold: 189, status: 'selling', supplier: '플레이히스토리', linkedContent: '세자저하가 사라졌다!' },
  { id: 'kit006', code: 'KIT-006', name: '기후행동 실험 키트', price: 38000, stock: 0, sold: 0, status: 'preparing', supplier: '에코사이언스', linkedContent: '기후위기 탈출 프로젝트' },
  { id: 'kit007', code: 'KIT-007', name: '수학 퍼즐 브릭 세트', price: 29000, stock: 95, sold: 145, status: 'selling', supplier: '로보에듀텍', linkedContent: '트레저 넘버스' },
  { id: 'kit008', code: 'KIT-008', name: '감정 표현 카드 100', price: 15000, stock: 180, sold: 98, status: 'selling', supplier: '한국교구산업' },
];

// ── 파트너/거래처 ──
export const partners: Partner[] = [
  { id: 'pt001', name: '한국교구산업', type: 'supplier', contact: '김재무 팀장', email: 'jaemu@kedutool.co.kr', phone: '02-1234-5678', contractStart: '2025-03-01', contractEnd: '2027-02-28', status: 'active', note: '교구 제조 — 결제조건 월말 정산' },
  { id: 'pt002', name: '로보에듀텍', type: 'supplier', contact: '박기술 이사', email: 'tech@roboedu.kr', phone: '031-987-6543', contractStart: '2025-06-15', contractEnd: '2026-06-14', status: 'expiring', note: '로봇 키트 공급 — 재계약 협의 중' },
  { id: 'pt003', name: '(주)에듀AI', type: 'content', contact: '이콘텐 매니저', email: 'content@eduai.kr', contractStart: '2026-04-01', contractEnd: '2027-03-31', status: 'active', note: 'AI 교육 콘텐츠 공동 개발 (수익 셰어 20%)' },
  { id: 'pt004', name: '국립생태원', type: 'content', contact: '교육팀', email: 'edu@nie.re.kr', contractStart: '2026-01-15', contractEnd: '2026-12-31', status: 'active', note: '기관 연계 콘텐츠 협력 (MOU)' },
  { id: 'pt005', name: '스쿨로지스', type: 'logistics', contact: '정물류 과장', email: 'ops@schoollogis.kr', phone: '02-555-0192', contractStart: '2025-01-01', contractEnd: '2026-12-31', status: 'active', note: '교구 배송 전담 (학교 직배송)' },
  { id: 'pt006', name: '플레이히스토리', type: 'supplier', contact: '한대표', email: 'ceo@playhistory.kr', contractStart: '2024-09-01', contractEnd: '2026-05-31', status: 'ended', note: '보드게임 제조 — 계약 종료, 재고 소진 중' },
  { id: 'pt007', name: '체험나라 운영단', type: 'experience', contact: '오운영 팀장', email: 'op@expland.kr', phone: '02-777-3311', contractStart: '2026-02-01', contractEnd: '2027-01-31', status: 'active', note: '테마형 체험 공간 운영 위탁' },
];
