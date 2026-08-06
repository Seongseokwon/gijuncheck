# 기준체크 SEO / GEO·AEO 진단 리포트

- **대상**: https://gijuncheck.kr
- **진단일**: 2026-08-06
- **진단 범위**: 색인 대상 11개 페이지 전수 (noindex 3개 별도 검토)
- **수집 방법**: 정적 빌드 산출물(`out/`) 전수 파싱 + 운영 URL 원시 HTML 대조 + Chrome 실측 성능
- **작업 브랜치**: `seo/audit-fixes`

---

## 1. 요약

| 영역 | 점수 | 가중치 |
|---|---:|---:|
| 기술 SEO | **97** | 40% |
| GEO / AEO | **80** | 35% |
| 콘텐츠 | **100** | 25% |
| **종합** | **92** | |

**총평.** 이 사이트는 기술 SEO 관점에서 고칠 것이 거의 없다. 전 페이지가 정적으로 발행되어 초기 HTML에 본문이 들어 있고, canonical은 11개 전부 자기참조이며, JSON-LD 파싱 오류가 0건이고, 고아 페이지도 없다. TTFB 270ms에 페이지당 전송량 11KB로 성능 여유도 크다. 흔한 실패 지점(JS 렌더링 의존, sitemap 누락, canonical 불일치, 중복 title)이 전부 비어 있다는 것은 설계 단계에서 이미 다뤄졌다는 뜻이다.

**따라서 이 리포트에는 P0(즉시 조치가 필요한 결함)이 없다.** 없는 문제를 만들어 적지 않았다.

남은 격차는 한 곳에 몰려 있다 — **GEO 80점**. 그리고 그 실체는 "AI 최적화 기법"이 아니라 **엔티티 신뢰 신호의 공백** 두 가지다.

1. **브랜드 엔티티를 외부에서 식별할 앵커가 없다.** Organization 스키마에 `sameAs`가 비어 있어, 검색·AI가 "기준체크"라는 이름을 실제 주체와 연결할 근거가 없다.
2. **사이트에서 가장 중요한 3개 페이지에 갱신·저자 신호가 없다.** 도구 페이지 3종(sitemap priority 0.9)은 화면에는 "최종 확인 2026-08-04"를 표시하면서, 구조화 데이터에는 `dateModified`도 `author`도 넣지 않았다. 매년 요율이 바뀌는 콘텐츠에서 이건 실질적 손해다.

이 두 가지가 GEO 점수의 대부분을 깎았고, 둘 다 이번에 코드로 반영했다.

**가장 큰 강점은 점수에 잡히지 않는 곳에 있다.** 콘텐츠가 commodity가 아니다. "공시가격이 아니라 재산세 과세표준", "공적연금은 자격 판정에서 전액·보험료 계산에서 50%" 같은 구분은 일반적인 요약 글에 없고, 이런 반직관적 구분이야말로 AI가 인용할 이유가 되는 지점이다. 여기에 law.go.kr·nhis.or.kr 1차 출처가 조항 단위로 링크되어 있고, 검증 원칙 페이지가 "확인하지 못한 범위"를 스스로 명시한다. GEO에서 실제로 작동하는 레버 세 가지(접근성·고유성·신뢰 신호) 중 앞의 둘은 이미 확보되어 있다.

---

## 2. 즉시 조치 — 이번에 반영한 것

P0 결함은 없으므로, 여기에는 **가장 레버가 큰 P1 항목** 중 이번 브랜치에서 코드로 반영한 5건을 적는다.

### 2-1. Organization `sameAs` 부재 → 엔티티 앵커 추가

**문제.** 전역 Organization 노드에 `sameAs`가 없었다. `name: "기준체크"`, `url`, `logo`만으로는 검색·AI가 이 이름을 실재하는 주체와 연결(엔티티 해소)할 수 없다.

**영향.** 브랜드명 질의에서 동명이의와 구분할 근거가 없다. GEO에서 브랜드 인용이 붙지 않는 가장 흔한 구조적 원인이다. 구조화 데이터는 AI 검색의 필수 조건은 아니지만, 엔티티 명확화에는 확실히 유효하다.

**수정.** `src/lib/site.ts`에 `sameAs` 배열을 두고 `structured-data.ts`가 비어 있지 않을 때만 내보내도록 했다. 실재하는 공개 URL만 넣는 원칙을 주석으로 남겼다 — 없는 프로필을 적으면 구조화 데이터가 사실과 어긋나 오히려 신뢰 신호를 깎는다.

```ts
// src/lib/site.ts
sameAs: ['https://github.com/Seongseokwon/gijuncheck'],
knowsAbout: ['국민건강보험 피부양자 자격', '건강보험 지역가입자 보험료', '임의계속가입'],

// src/lib/structured-data.ts — Organization 노드
...(SITE.sameAs.length > 0 ? { sameAs: [...SITE.sameAs] } : {}),
knowsAbout: [...SITE.knowsAbout],
```

**검증.** 빌드 후 `out/index.html`의 Organization 노드에 `sameAs`·`knowsAbout`가 포함되는지 확인. Rich Results Test로 파싱 오류 0건 확인.

**남은 작업(사용자).** 현재 앵커가 GitHub 저장소 1건뿐이다. 네이버 블로그·유튜브·링크드인 등 운영 채널이 생기면 이 배열에 추가할수록 엔티티 해소가 강해진다. **이것이 남은 GEO 격차 중 가장 큰 항목이다.**

### 2-2. 도구 페이지 3종에 `dateModified`·`author` 부재

**문제.** `dependent` / `regional-premium` / `voluntary-continuation` — sitemap priority 0.9인 핵심 페이지 3개의 `WebApplication` 노드에 `dateModified`, `author`, `publisher`, `isPartOf`가 모두 없었다. 화면에는 `<time dateTime="2026-08-04">`로 최종 확인일을 노출하면서 구조화 데이터에는 넣지 않는 불일치였다.

**영향.** 이 도구들은 매년 바뀌는 요율(건강보험료율 7.19%, 재산점수당 211.5원)과 기준 금액을 담는다. 갱신 신호가 없으면 기계 판독 쪽에서 이 페이지가 언제 기준 갱신되었는지 알 수 없고, 시의성이 중요한 질의에서 인용 우선순위가 떨어진다.

**수정.** `webApplicationJsonLd()`가 `dateModified`를 받도록 확장하고, 각 페이지가 `ROUTES[key].lastModified`(콘텐츠 실제 변경일, 배포일과 구분되어 관리되던 값)를 넘기게 했다. `author`는 공용 `authorJsonLd()`로 통일해 도구·가이드·검증 원칙이 같은 `@id`를 공유한다.

```ts
// src/lib/structured-data.ts
export function webApplicationJsonLd({ name, url, description, dateModified }) {
  const modified = dateModified ?? SITE.lastVerified;
  return {
    '@type': 'WebApplication',
    /* ... */
    publisher: { '@id': SITE_ENTITY_IDS.organization },
    author: authorJsonLd(),
    dateModified: toIsoDateTime(modified),
    inLanguage: 'ko',
    isPartOf: { '@id': SITE_ENTITY_IDS.website },
  };
}
```

```ts
// 각 도구 페이지
...webApplicationJsonLd({
  name: ROUTES.dependent.label,
  url: ROUTES.dependent.path,
  description: DESCRIPTION,
  dateModified: ROUTES.dependent.lastModified,   // ← 추가
}),
```

**검증.** 재수집 결과 `hasAuthor`·`hasDateModified`가 11/11 페이지 true.

**주의.** `dateModified`는 실제 기준을 갱신했을 때만 올려야 한다. 허위 갱신은 역효과다. 현재 구조는 `ROUTES`의 `lastModified`를 손으로 관리하므로 이 원칙이 지켜지고 있다 — 유지할 것.

### 2-3. meta description 160자 초과 3건

**문제.** 아래 3개 페이지가 검색 결과 스니펫 한도를 넘겼다. 공통 원인은 임의계속가입 신청기한 규정 원문(`APPLY_DEADLINE_RULE`, 약 50자)을 description에 그대로 넣은 것이다.

| 페이지 | 기존 | 수정 후 |
|---|---:|---:|
| `/health-insurance/voluntary-continuation/` | 197자 | 약 110자 |
| `/health-insurance/guides/losing-eligibility/` | 173자 | 약 115자 |
| `/health-insurance/guides/when-voluntary-continuation-wins/` | 169자 | 약 130자 |

**영향.** 초과분이 잘려 문장이 중간에서 끊긴다. 클릭률에 직접 영향을 준다.

**수정.** 규정 원문은 본문에 그대로 두고, description에는 판단에 바로 쓰이는 숫자(18개월/12개월/36개월)만 남겼다. 상수 기반 보간은 유지했다.

**검증.** 재수집 결과 11/11 페이지가 50~160자 범위.

### 2-4. `/verification-policy/` title 12자

**문제.** `검증 원칙 | 기준체크` — 12자로, 검색 결과에서 무엇을 다루는 문서인지 드러나지 않았다.

**영향.** 이 페이지는 저자 엔티티(`#author`)의 정의 지점이자 사이트 전체 신뢰 신호의 근거다. 4,478단어로 사이트에서 가장 긴 문서이기도 하다. title이 약하면 이 자산이 검색에서 소비되지 않는다.

**수정.** `검증 원칙 — 기준 출처와 자체 재현 테스트 범위`(28자).

**검증.** 재수집 결과 11/11 페이지가 15~60자 범위.

### 2-5. `llms.txt` 부재 (선택 항목)

**먼저 사실관계.** Google Search는 `llms.txt`를 읽지 않는다. 순위에도 AI Overviews에도 영향이 없다. 이 파일이 P0이라고 말하는 자료가 많지만 근거가 없다.

**그럼에도 추가한 이유.** ChatGPT·Perplexity 계열 일부 도구가 참조하고, 사용자가 AI 검색 노출을 적극적으로 원한다고 밝혔으며, 작성 비용이 극히 낮다. **"있으면 소소한 플러스, 없어도 무방"** 수준으로만 이해할 것.

**수정.** `public/llms.txt` 신규 작성. 핵심 수치(2,000만원 / 1,000만원 / 500만원 / 5.4억·9억 / 7.19% / 211.5원)와 반직관적 구분(공시가격 ≠ 과세표준, 공적연금 전액 vs 50%)을 인용 가능한 단위로 정리하고, 모의 판정이라는 한계와 1차 출처를 명시했다.

**검증.** 배포 후 `https://gijuncheck.kr/llms.txt` 200 응답 확인.

---

## 3. 이번 스프린트 (P1) — 코드로 해결되지 않는 것

### 3-1. 저자 엔티티가 익명이다 (GEO 최대 잔여 격차)

`기준체크 운영자`라는 이름에는 `sameAs`가 없다. 검증 원칙 페이지가 방법론을 공개해 이를 상당 부분 상쇄하고 있지만, E-E-A-T에서 "누가 썼는가"는 여전히 비어 있다.

건강보험이라는 주제는 Google이 YMYL(돈·건강에 직접 영향을 주는 주제)로 분류하는 영역이다. 이 영역에서는 저자 신원이 다른 주제보다 무겁게 작동한다.

**선택지는 세 가지고, 각각 비용이 다르다.**

| 선택 | 얻는 것 | 잃는 것 |
|---|---|---|
| 실명 + 링크드인/GitHub `sameAs` | 가장 강한 신뢰 신호 | 개인 신원 노출 |
| 필명 유지 + 프로필 페이지 신설 (경력·검증 방식·연락처) | 중간. 일관된 저자 페이지만으로도 엔티티가 잡힌다 | 페이지 1개 작성 비용 |
| 현행 유지 | 없음 | GEO 80점대 고착 |

기술적 판단이 아니라 본인의 프라이버시 선택이므로 여기서 정하지 않는다. 다만 **두 번째 안이 비용 대비 효과가 가장 낫다** — 실명 없이도 `Person` 노드에 `description`·`knowsAbout`·전용 URL이 붙으면 엔티티로 인식된다. (`knowsAbout`은 이번에 이미 추가했다.)

### 3-2. 내부 링크가 얇은 가이드 3건

허브-스포크가 전반적으로 잘 짜여 있으나 편차가 있다.

| 페이지 | 인바운드 내부 링크 | 단어 수 |
|---|---:|---:|
| `november-reassessment` | **2** | 1,838 |
| `before-business-registration` | **3** | 2,191 |
| `pension-impact` | **3** | 2,504 |
| (비교) `dependent` | 13 | 768 |

**주목할 점:** 링크가 가장 적은 3개가 본문이 가장 긴 3개다. 콘텐츠 가치와 링크 자산이 반대로 붙어 있다.

**조치.** 관련 도구 페이지의 "함께 읽기"와 가이드 본문에서 이 3개를 서술형 앵커로 상호 참조한다. 특히 `november-reassessment`는 매년 11월 검색 수요가 몰리는 시의성 페이지(`changeFrequency: weekly`)인데 인바운드가 2개뿐이다 — 우선순위가 가장 높다.

### 3-3. 트레일링 슬래시 중복 URL

`next.config.mjs`가 `trailingSlash: true`인데, `/health-insurance/dependent`(슬래시 없음)도 200으로 콘텐츠를 반환한다. canonical이 슬래시 버전을 정확히 가리키고 있어 실질 피해는 차단되어 있다.

**조치(선택).** Vercel에서 308 리다이렉트로 정규화하면 크롤 예산 낭비와 링크 자산 분산을 원천 차단할 수 있다. canonical이 이미 방어 중이므로 급하지 않다.

### 3-4. 키워드 카니발라이제이션 감시 대상 1건

`voluntary-continuation`(도구)과 `when-voluntary-continuation-wins`(가이드)가 같은 주제어를 노린다.

- 도구: `임의계속가입 비교 — 지역가입자보다 보험료가 저렴한지 확인` → 거래형 의도
- 가이드: `임의계속가입이 유리한 경우` → 정보형 의도

의도가 갈라져 있어 현재는 문제가 아니다. **다만 Search Console에서 두 페이지가 같은 질의에 번갈아 노출되기 시작하면** 그때 하나를 명확히 강등하거나 통합할 것. 지금 손대면 오히려 손해다.

---

## 4. 백로그 (P2)

| 항목 | 판단 |
|---|---|
| 홈페이지 FAQPage 스키마 | **적용하지 말 것.** 홈의 "자주 찾는 질문"은 다른 페이지 FAQ로 가는 **링크 목록**이지 답변 본문이 아니다. FAQPage를 붙이면 스키마와 화면이 불일치한다. 스코어링 스크립트가 기계적으로 잡은 오탐이다. |
| noindex 3종 중복 description | `contact`·`privacy`·`terms`가 `SITE.description`을 공유한다. 셋 다 `noindex, follow`이므로 검색 영향이 없다. 낮은 우선순위. |
| `verification-policy` `datePublished` 부재 | `dateModified`만 있다. AboutPage라 필수는 아니나 넣으면 일관성이 좋아진다. |
| robots.txt AI 크롤러 명시 | **불필요.** `User-Agent: * / Allow: /`로 이미 전면 허용 상태다. GPTBot·ClaudeBot·PerplexityBot을 개별 명시해도 기능적 효과가 없고 유지보수 대상만 늘어난다. 차단할 의도가 생겼을 때만 손댈 것. |
| WebSite `SearchAction` | **적용하지 말 것.** 사이트 내 검색 기능이 없다(`src/lib/search`가 비어 있음). 없는 기능을 스키마로 선언하면 사실과 어긋난다. 검색을 실제로 만들면 그때 추가. |

---

## 5. 영역별 상세

### 5-1. 기술 SEO — 97/100

전수 확인 결과 아래 항목이 **전부 통과**했다.

| 항목 | 결과 |
|---|---|
| robots.txt + Sitemap 선언 | ✅ 200, `Sitemap:` 지시자 존재 |
| sitemap.xml | ✅ 11 URL, 경로별 실제 `lastmod` (배포일 아님) |
| canonical 자기참조 | ✅ 11/11 |
| og:url ↔ canonical 일치 | ✅ 11/11 |
| H1 1개 | ✅ 11/11 |
| html lang | ✅ 11/11 `ko` |
| 이미지 alt·width·height | ✅ 누락 0건 |
| JSON-LD 파싱 오류 | ✅ 0건 |
| 초기 HTML 본문 존재 | ✅ 11/11 (JS 렌더링 의존 0) |
| HTTPS + HSTS preload | ✅ |
| 고아 페이지 | ✅ 0건 |
| 중복 title | ✅ 0건 |
| noindex 오적용 | ✅ 의도한 3개(`contact`/`privacy`/`terms`)에만 적용, sitemap에서도 정확히 제외 |

감점 요인은 앞서 다룬 description 3건·title 1건뿐이며 모두 이번에 수정했다.

**설계상 특히 잘 되어 있는 부분** — `src/lib/routes.ts` 단일 레지스트리에서 경로·priority·`lastModified`·`ready`·`noindex`를 관리하고 sitemap이 이를 자동 반영한다. "페이지 추가하고 sitemap 등록을 잊는" 가장 흔한 사고가 구조적으로 차단되어 있다.

### 5-2. 성능

Chrome 실측 (`/health-insurance/dependent/`):

| 지표 | 실측 | 임계치 | 판정 |
|---|---:|---:|---|
| TTFB | 270ms | < 800ms | ✅ 여유 큼 |
| CLS | 0 | < 0.1 | ✅ |
| HTML 전송량 (gzip) | 11KB | — | ✅ |
| JS 전송량 | 6KB | — | ✅ |
| 리소스 수 | 14 | — | ✅ |
| DOMContentLoaded | 849ms | — | ✅ |

**측정 한계 — 이 부분은 그대로 읽을 것.** LCP·FCP는 탭이 백그라운드(`visibilityState: "hidden"`)여서 페인트 이벤트가 발생하지 않아 값을 얻지 못했다. **LCP가 좋다고 단정할 수 없다.** 다만 전송량 11KB·TTFB 270ms·렌더 블로킹 리소스 부재라는 조건에서 LCP가 2.5s를 넘길 구조적 이유는 보이지 않는다.

INP는 실사용자 지표라 랩 측정으로 잡히지 않는다. **두 지표 모두 Search Console과 PageSpeed Insights의 CrUX 필드 데이터로 확인할 것.**

제3자 스크립트는 GTM·GA 2개뿐이다. 다만 CSP에 AdSense 도메인이 이미 열려 있으므로, **광고를 붙이는 시점에 CLS와 INP를 반드시 재측정할 것.** 현재 CLS 0은 광고가 없는 상태의 값이다.

### 5-3. GEO / AEO — 80/100

| 항목 | 상태 |
|---|---|
| AI 크롤러 접근 | ✅ 전면 허용 (`*` / `Allow: /`) |
| Organization + WebSite 전역 스키마 | ✅ `@graph` + `@id` 참조로 정확히 구성 |
| 페이지 타입별 스키마 | ✅ Article / WebApplication / FAQPage / BreadcrumbList / AboutPage |
| `author` Person 엔티티 | ✅ (수정 후 11/11, 기존 6/11) |
| `dateModified` | ✅ (수정 후 11/11, 기존 7/11) |
| 갱신일 화면 노출 | ✅ `<time datetime>` 시맨틱 요소 사용 |
| 리드 답변 블록 | ✅ 11/11. H1 직후 완결형 답변 배치 |
| 시맨틱 랜드마크 | ✅ `<main>`·`<article>` |
| 외부 1차 출처 링크 | ✅ law.go.kr 7건, nhis.or.kr 15건 등 |
| Organization `sameAs` | ⚠️ 1건만 (이번 추가). 확충 필요 |
| `Person` `sameAs` | ❌ 없음 — 3-1 참조 |
| `llms.txt` | ✅ (이번 추가, 영향은 제한적) |

**리드 답변 블록 품질 평가.** 스크립트는 존재 여부만 세지만, 실제 문장을 읽어보면 품질이 높다. `pension-impact`가 대표적이다.

> "연금을 받기 시작하면 건강보험 자격이 바뀔 수 있습니다. 중요한 것은 자격 판정과 보험료 계산에서 연금을 보는 방식이 서로 다르다는 점입니다."

서론을 늘어놓지 않고 질문의 핵심 갈등을 즉시 제시한다. AI가 인용하기 좋은 형태다. 11개 페이지 모두 이 패턴을 지킨다.

### 5-4. 콘텐츠 — 100/100

| 항목 | 결과 |
|---|---|
| 얇은 콘텐츠(300단어 미만) | ✅ 0건 |
| 내부 링크 3개 이상 | ✅ 11/11 (최소 18개) |
| 일반 앵커("여기", "더보기") | ✅ 0건 — 전부 서술형 |
| OG 태그 완비 | ✅ 11/11, 페이지별 전용 1200×630 이미지 |
| 외부 링크 `rel` | ✅ `noopener noreferrer` |

**정량 점수 밖의 평가 — 고유성.** GEO에서 실제로 작동하는 레버 중 가장 중요한 것이 "1차 경험·데이터·전문가 관점이 있는가"다. 이 사이트는 commodity 콘텐츠가 아니다. 근거:

- **반직관적 구분을 정면으로 다룬다.** 공시가격 ≠ 재산세 과세표준(대부분의 요약 글이 혼동), 공적연금의 자격 판정 100% vs 보험료 계산 50% 반영, 금융소득 1,000만원 초과 시 초과분이 아닌 전액 합산 — 이런 지점이 인용 가치를 만든다.
- **법령을 코드로 재현하고 그 범위를 공개한다.** "공개 기준 8건 자체 재현"이라는 검증 뱃지와 172개 자동 테스트는 1차 작업의 증거다.
- **한계를 스스로 명시한다.** "공단 로그인 심사 결과나 개인별 최종 처리를 대조한 것은 아닙니다" — 신뢰 신호로 작동한다.
- **공공기관 오인 방지 고지가 상시 노출된다.** YMYL 주제에서 중요한 방어이자 신뢰 신호다.

단어 수가 적은 페이지(`dependent` 768, `regional-premium` 681)는 계산기라는 성격상 정상이다. 억지로 늘릴 필요 없다.

---

## 6. 키워드 · 검색 의도 매핑

| 페이지 | 주 타깃 | 의도 | 유형 적합성 |
|---|---|---|---|
| `/` | 건강보험 피부양자 자격 확인 | 탐색형 | ✅ 허브 |
| `/health-insurance/dependent/` | 피부양자 자격 조건 / 소득 기준 | 거래형(도구) | ✅ 계산기 |
| `/health-insurance/regional-premium/` | 지역가입자 건강보험료 계산 | 거래형(도구) | ✅ 계산기 |
| `/health-insurance/voluntary-continuation/` | 임의계속가입 보험료 비교 | 거래형(도구) | ⚠️ 3-4 감시 |
| `guides/property-tax-base/` | 재산세 과세표준 확인 방법 | 정보형 | ✅ 해설 |
| `guides/before-business-registration/` | 사업자등록 피부양자 탈락 | 정보형 | ✅ 해설 |
| `guides/pension-impact/` | 국민연금 피부양자 자격 | 정보형 | ✅ 해설 |
| `guides/losing-eligibility/` | 피부양자 자격상실 소급 | 정보형 | ✅ 해설 |
| `guides/november-reassessment/` | 11월 건강보험료 인상 | 정보형·시의성 | ✅ 해설 (링크 보강 필요) |
| `guides/when-voluntary-continuation-wins/` | 임의계속가입 유리한 경우 | 정보형 | ⚠️ 3-4 감시 |
| `/verification-policy/` | (브랜드·신뢰) | 신뢰 신호 | ✅ 저자 엔티티 정의 |

의도-유형 불일치는 없다. 도구/해설 이원 구조가 검색 의도와 정확히 맞물려 있다.

---

## 7. 90일 로드맵

### 0–2주 — 배포와 확인

1. `seo/audit-fixes` 브랜치 머지·배포
2. 배포 후 `llms.txt` 200 응답, 도구 페이지 `dateModified` 반영 확인
3. Rich Results Test로 도구 페이지 3종·가이드 1종 재검증
4. Search Console에서 sitemap 재제출 + 수정 페이지 색인 요청

### 2–6주 — 엔티티 신뢰 신호 확충 (남은 격차의 대부분)

5. **저자 정책 결정** (3-1) — 실명 공개 / 프로필 페이지 신설 / 현행 유지 중 택일
6. `SITE.sameAs`에 운영 채널 추가 — 항목이 늘수록 엔티티 해소가 강해진다
7. `november-reassessment` 인바운드 링크 보강 (2 → 5개 이상). **11월 수요기 전에 끝낼 것**
8. `before-business-registration`·`pension-impact` 상호 참조 추가

### 6–12주 — 측정 기반 확장

9. Search Console 질의 데이터로 카니발라이제이션 실측 확인 (3-4)
10. CrUX 필드 데이터에서 LCP·INP 확인 — 랩 측정으로 못 잡은 두 지표
11. 광고 도입 시 CLS·INP 재측정
12. 신규 가이드는 **검색 수요가 확인된 질의**에 한해 추가. 양산은 `scaled content abuse` 정책 대상이다

---

## 8. 측정 계획

### 추적 지표

| 지표 | 출처 | 주기 |
|---|---|---|
| 노출·클릭·평균 게재순위 | Search Console | 주 1회 |
| **생성형 AI 실적 보고서** | Search Console | 월 1회 |
| 색인 페이지 수 vs sitemap URL 수(11) | Search Console | 월 1회 |
| LCP / INP / CLS 필드값 | CrUX / PageSpeed Insights | 월 1회 |
| 구조화 데이터 오류 | Search Console 확장 보고서 | 월 1회 |

### AI 인용 모니터링 (GEO 측정법)

자동 순위 추적 도구가 제시하는 "AI 가시성 점수"는 추정치다. **가장 신뢰할 만한 방법은 직접 질의해서 기록하는 것이다.**

ChatGPT·Perplexity·Google AI Mode에 아래 질의를 넣고 gijuncheck.kr 인용 여부를 월 1회 기록한다.

- 피부양자 소득 기준 2000만원 초과하면 어떻게 되나요
- 재산세 과세표준과 공시가격 차이
- 국민연금 받으면 피부양자 탈락하나요
- 임의계속가입 지역가입자 어느 쪽이 유리한가요
- 사업자등록하면 건강보험료 얼마나 나오나요

기록 항목: 인용 여부 / 인용된 페이지 / 인용된 문장 / 경쟁 인용원.

### 판단 기준

- **인용이 붙기 시작하면** → 그 페이지의 서술 패턴을 다른 페이지에 확산
- **경쟁 사이트만 인용되면** → 해당 질의에 대한 리드 답변 블록을 그 질의 문장에 맞춰 재작성
- **3개월간 변화가 없으면** → 엔티티 신호(3-1) 부족이 원인일 가능성이 높다

---

## 부록 — 하지 않은 것과 그 이유

리포트에 담지 않은 흔한 권고들이다. Google 공식 문서(`developers.google.com/search/docs/fundamentals/ai-optimization-guide`) 기준으로 근거가 없거나 역효과다.

| 흔한 권고 | 하지 않은 이유 |
|---|---|
| llms.txt를 최우선 과제로 | Google Search는 읽지 않는다. 순위·AI Overviews에 영향 없음. 낮은 우선순위로만 반영 |
| AI 전용 문장 리라이팅 | 불필요. 검색엔진이 동의어·의도를 이해한다 |
| 롱테일 키워드 총망라 | 무의미. 위와 같은 이유 |
| 콘텐츠 청킹 | 불필요. 한 페이지 내 여러 주제를 이해한다 |
| 외부 사이트 브랜드 멘션 인위적 확보 | 스팸 정책 대상. 역효과 |
| 키워드 변형 페이지 양산 | `scaled content abuse` 정책 위반 |
| 홈에 FAQPage 스키마 추가 | 화면 내용(링크 목록)과 불일치 |
| WebSite SearchAction 추가 | 사이트 내 검색 기능이 없다 |

**"AI 검색 순위 보장" 같은 표현은 이 리포트에 없다.** 실제 레버는 세 가지뿐이다 — 접근성(크롤·인덱싱·렌더링), 고유성(1차 경험·데이터), 신뢰 신호(저자·갱신일·출처·브랜드 엔티티). 이 사이트는 앞의 둘을 이미 확보했고, 세 번째의 절반이 남아 있다.
