# ADR-002: 최종 시각 시스템 확정 — design-preview/index3.html

작성 2026-07-31 · ADR-001의 후속 결정. 서브에이전트에 위임하지 않고 메인 스레드가 사용자와 직접 확정.

선행 문서: `docs/design-decisions/ADR-001-design-direction.md`, `design-preview/index.html`(원본), `design-preview/index2.html`(mandate C 엄격 반영), `design-preview/index3.html`(채택본)

## 배경

ADR-001은 mandate C(시점 독립·레퍼런스형)를 정보 구조·안전장치의 뼈대로 채택했다. 이를 그대로 구현한 `index2.html`(문서형: 2단 마진노트, monospace 인용, radius 없음)을 사용자가 검토한 결과 "전체적인 스타일은 index.html이 더 추구하는 방향"이라는 피드백을 받았다.

이에 따라 `index.html`의 시각 언어(네이비/틸 팔레트, 그라데이션 히어로, 카드·그림자, 상황별 카드 라우터, 3단 저니)를 베이스로 유지하면서, ADR-001의 안전장치만 얹은 `index3.html`을 만들어 비교했고, 사용자가 이를 **최종 디자인으로 확정**했다.

## 결정

**`design-preview/index3.html`을 이 서비스의 확정된 시각 시스템으로 삼는다.** 실제 애플리케이션(`src/`)에 이 디자인을 순차 적용한다.

## ADR-001 대비 무엇이 바뀌었나

ADR-001이 채택한 것은 mandate C의 **문자 그대로의 색상·타이포·레이아웃 값**(예: 배경 `#EEF2F6`, 근거 마커 `#1E3A5F`, 2단 마진노트, monospace 인용)이 아니라 그 근저의 **안전장치 원칙**이었다는 것이 이번 결정으로 명확해졌다. index3.html은 다음을 분리해서 다룬다.

### 유지되는 것 (ADR-001의 타협 불가 원칙 — index3에도 그대로 적용)
- 판정 결론에 색으로 확신을 표현하지 않는다 (완전 무채색 — 사용자가 명시적으로 확정한 선택)
- 결론과 같은 시야에 면책·최종판정주체 문구를 둔다
- 근거 조항은 실제 원문 링크로 연결한다
- 미검증 도구(지역보험료 계산·임의계속가입 비교)는 어디에서도 클릭 가능한 링크로 두지 않는다
- 가이드가 정보구조의 일부로 실제로 연결된다
- 대비·터치 타겟 등 접근성 최소 기준(본문 4.5:1, UI 요소 3:1, 터치 타겟 44px, 보조텍스트 14px 이상)

### 바뀐 것 (mandate C의 문자 그대로의 스타일 → index.html 스타일로 대체)
- 팔레트: 무채색·저채도(`#171717`/`#3F3F46`/`#1E3A5F`) → 네이비·틸(`#17324d`/`#087e8b`) 브랜드 팔레트
- 레이아웃: 2단 마진노트·표·각주 중심 문서형 → 카드·그라데이션 히어로 중심 제품형
- 타이포: monospace 인용, tabular 계산식 강조 → 시스템 산세리프 통일
- 홈 구조: "조항 색인" → 마케팅적 헤드라인 + 상황별 진입 카드 + 가이드 카드 그리드 (`03-rebuttal-c.md`의 가이드 중심 정보구조는 유지하되 카드형 표현으로)

두 층위를 분리한 이유: 법적 리스크 비평이 실제로 문제 삼은 것은 "색이 화려하다/차분하다"가 아니라 "판정 결론을 색으로 확신시키는가", "면책이 결론과 같은 시야에 있는가"였다. 이 판단 기준은 팔레트나 카드 디자인과 독립적이므로, 인덱스2의 팔레트를 포기해도 ADR-001의 실질적 근거는 훼손되지 않는다.

## 실제 애플리케이션 반영 범위 (1차)

- `tailwind.config.ts`: 브랜드 색상 토큰 추가
- `src/components/ui.tsx`: 공용 폼·카드·버튼 컴포넌트 재스타일 + 기존에 존재하던 대비 실패 버그 수정(`border-slate-300` 1.48:1, `text-slate-400` 2.56:1 — `00-brief.md`가 이미 지적한 값)
- `src/app/layout.tsx`: 헤더·푸터 브랜드 색상, "민간 서비스" 상시 고지 추가
- `src/app/page.tsx`: 히어로·상황별 카드·제공범위·가이드 그리드로 전면 재구성
- `src/components/DependentJudge.tsx`: 결과 화면 무채색 판정 처리(`emerald`/`rose` 색상 코딩 제거), 근거 조항 실제 링크화, 보조텍스트 크기 상향

## 이번 범위에서 다루지 않은 것 (알고 있는 채로 미룸)

- `RegionalPremiumCalc.tsx` / `VoluntaryComparison.tsx`의 승패 비교 색상 로직(emerald 강조)은 "판정 결론"이 아니라 "금액 비교"이므로 ADR-001의 무채색 원칙을 기계적으로 적용하지 않았다. 공용 컴포넌트(`ui.tsx`) 변경으로 상속되는 대비·팔레트 수정만 반영한다.

## 추가 반영 (2026-07-31, 같은 날 후속 커밋)

아래 두 항목은 처음에는 "이번 범위 밖"으로 미뤄뒀으나, 같은 세션에서 바로 처리했다.

- **`ROUTES.regionalPremium`/`ROUTES.voluntaryContinuation`을 `ready: false`로 전환했다.** `00-brief.md`의 선결 결정("공단 대조 완료 전까지 비공개")을 실제로 실행한 것이다. 두 페이지 파일 자체는 지우지 않았다(직접 URL로는 여전히 빌드·서빙됨) — 대신 (1) 사이트맵에서 제외, (2) 헤더 내비게이션·홈 카드·`DependentJudge`/`RegionalPremiumCalc`의 교차 링크가 기존 `ready` 조건부 렌더링으로 자동으로 숨겨짐, (3) 두 페이지에 `robots: { index: false, follow: true }`를 추가해 `privacy`/`terms`/`contact`와 동일한 패턴으로 검색 노출도 차단했다. `VERIFIED_AGAINST_NHIS`가 `true`가 되면 이 플래그들을 되돌린다.
- **"퇴직 후 90일 이내 신고" 오류를 전체 수정했다.** `VOLUNTARY_CONTINUATION.APPLY_DEADLINE_DAYS`(고정 일수 상수) 자체가 잘못된 모델이었다 — 실제 규정은 "지역가입자가 된 후 최초로 고지받은 지역보험료 납부기한으로부터 2개월 이내"로, 퇴직일로부터 셀 수 있는 고정 일수가 아니다. 상수를 `APPLY_DEADLINE_RULE`(문구)로 교체하고, `regional.ts`의 `ComparisonResult.applyDeadlineDays: number` → `applyDeadlineRule: string`으로 타입을 바꿨다. 이 값을 쓰던 6개 파일(`VoluntaryComparison.tsx`, `voluntary-continuation/page.tsx`, `guides/losing-eligibility/page.tsx`, `guides/when-voluntary-continuation-wins/page.tsx`, `regional.test.ts`)의 문구를 전부 교정했다. `losing-eligibility` 가이드의 비교표는 "자격 취득"이라는 모호한 라벨이 실제로는 "임의계속가입 신청"을 가리키는 것으로 확인해 라벨도 함께 정정했다.
- `npm run typecheck` / `npm test`(114/114) / `npm run build`(19페이지 정적 export) 전부 통과 확인.

## 이 결정을 뒤집어야 하는 조건

ADR-001과 동일. 추가로: index3.html의 네이비/틸 팔레트가 실제 Tailwind 렌더링에서 `contrast.py` 재검증을 통과하지 못하는 조합이 발견되면 해당 조합만 교체한다(전체 팔레트 재검토 아님).
