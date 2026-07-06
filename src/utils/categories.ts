// ─────────────────────────────────────────────────────────────
// 리얼월드 스쿨 콘텐츠 카테고리 맵 (검수·분석 공용 기준)
// A. 교과 연계형 / B. 역량 중심형 / C. 창의·예술형 / D. 특수목적형
// ─────────────────────────────────────────────────────────────

export interface CategoryGroup {
  key: string;
  name: string;
  /** tailwind 색 계열 — 그룹 아이덴티티 */
  color: 'blue' | 'violet' | 'rose' | 'emerald';
  items: { code: string; label: string }[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'A', name: '교과 연계형', color: 'blue',
    items: [
      { code: 'A-01', label: '국어/언어 — 창의적 글쓰기·표현' },
      { code: 'A-02', label: '국어/언어 — 문학·독서 탐구' },
      { code: 'A-03', label: '수학 — 논리·패턴·암호 해독' },
      { code: 'A-04', label: '수학 — 연산·측정·탐구' },
      { code: 'A-05', label: '사회/역사 — 한국사·독립운동' },
      { code: 'A-06', label: '사회/역사 — 세계사·지리·문화' },
      { code: 'A-07', label: '과학 — 생명·환경·생태 탐구' },
      { code: 'A-08', label: '과학 — 물리·화학·STEM 융합' },
      { code: 'A-09', label: '정보/디지털 — 코딩·알고리즘' },
      { code: 'A-10', label: '정보/디지털 — 디지털 리터러시' },
      { code: 'A-11', label: '영어/외국어 — 영어 미션·어휘' },
      { code: 'A-12', label: '세계시민 — 다문화·국제이해' },
    ],
  },
  {
    key: 'B', name: '역량 중심형', color: 'violet',
    items: [
      { code: 'B-01', label: '정서·인성 — 감정 이해와 표현' },
      { code: 'B-02', label: '정서·인성 — 공감·배려·소통' },
      { code: 'B-03', label: '정서·인성 — 학교폭력 예방' },
      { code: 'B-04', label: '협력·소통 — 팀워크·협업' },
      { code: 'B-05', label: '협력·소통 — 리더십·책임감' },
      { code: 'B-06', label: '진로·경제 — 진로 탐색·설계' },
      { code: 'B-07', label: '진로·경제 — 경제·창업 이해' },
      { code: 'B-08', label: '생태·환경 — 기후위기·지속가능발전' },
      { code: 'B-09', label: '민주시민·인권 — 민주주의·인권' },
    ],
  },
  {
    key: 'C', name: '창의·예술형', color: 'rose',
    items: [
      { code: 'C-01', label: '예술·미술 — 예술 감상과 창의 표현' },
      { code: 'C-02', label: '문화·스토리텔링 — 신화·세계문화' },
    ],
  },
  {
    key: 'D', name: '특수목적형', color: 'emerald',
    items: [
      { code: 'D-01', label: '학급경영 — 학급공동체 형성·관계' },
      { code: 'D-02', label: '학교행사 — 명절·계기교육·특별프로그램' },
      { code: 'D-03', label: '보건·안전 — 건강증진·감염병 예방' },
    ],
  },
];

const codeToLabel = new Map(
  CATEGORY_GROUPS.flatMap(g => g.items.map(i => [i.code, i.label] as const))
);

export const categoryLabel = (code: string): string => codeToLabel.get(code) ?? code;

export const ALL_CATEGORY_OPTIONS = CATEGORY_GROUPS.flatMap(g =>
  g.items.map(i => ({ value: i.code, label: `${i.code} ${i.label}` }))
);
