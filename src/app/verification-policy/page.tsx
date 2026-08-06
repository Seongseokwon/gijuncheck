import { createPageMetadata } from '@/lib/metadata';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';
import { BASIS } from '@/lib/constants/2026';
import { DEPENDENT_SOURCES } from '@/lib/dependent/sources';
import { breadcrumbJsonLd, ldJson, SITE_ENTITY_IDS } from '@/lib/structured-data';
import {
  summarizeVerificationCases,
  VERIFICATION_CASE_GROUPS,
  VERIFICATION_TIERS,
  type VerificationTierMeta,
} from '@/lib/verification/cases';

export const metadata = createPageMetadata({
  // '검증 원칙 | 기준체크' 는 12자라 검색 결과에서 무엇을 다루는 문서인지 드러나지 않는다.
  title: '검증 원칙 — 기준 출처와 자체 재현 테스트 범위',
  description: '기준체크가 건강보험 정보를 확인하고, 테스트하며, 공개 범위를 결정하는 방법을 안내합니다.',
  path: ROUTES.verificationPolicy.path,
});

const SOURCES = [DEPENDENT_SOURCES.support.law, DEPENDENT_SOURCES.support.nhis] as const;

const POLICY_URL = new URL(ROUTES.verificationPolicy.path, SITE.url).toString();
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': `${POLICY_URL}#about`,
      url: POLICY_URL,
      name: '검증 원칙',
      description: metadata.description,
      dateModified: ROUTES.verificationPolicy.lastModified,
      isPartOf: { '@id': SITE_ENTITY_IDS.website },
      about: { '@id': SITE_ENTITY_IDS.author },
      mainEntity: { '@id': SITE_ENTITY_IDS.author },
      // 저자 엔티티를 정의하는 문서가 정작 자기 저자를 선언하지 않은 상태였다.
      author: { '@id': SITE_ENTITY_IDS.author },
      publisher: { '@id': SITE_ENTITY_IDS.organization },
      inLanguage: 'ko',
    },
    // 이 사이트에서 운영자를 가장 상세히 설명하는 지점이다.
    // `authorJsonLd()` 가 만드는 노드와 같은 `@id` 라 하나로 병합되며,
    // 아래 필드는 모두 이 페이지 「운영자」 절에 실제로 표시되는 내용이다.
    {
      '@type': 'Person',
      '@id': SITE_ENTITY_IDS.author,
      name: SITE.authorName,
      url: `${POLICY_URL}#operator`,
      description: SITE.operator.description,
      knowsAbout: [...SITE.knowsAbout],
      worksFor: { '@id': SITE_ENTITY_IDS.organization },
    },
    breadcrumbJsonLd([
      { name: SITE.name, path: ROUTES.home.path },
      { name: '검증 원칙', path: ROUTES.verificationPolicy.path },
    ]),
  ],
};

const DEPENDENT_RULE_COVERAGE = [
  {
    label: '부양요건',
    basis: BASIS.SUPPORT,
    coverage:
      '배우자·직계존속·자녀·형제자매의 관계, 동거, 혼인, 형제자매 연령·장애 분기',
    source: DEPENDENT_SOURCES.support,
  },
  {
    label: '소득요건',
    basis: BASIS.INCOME,
    coverage:
      '대상자·배우자의 합산소득 2,000만원, 사업자등록 여부별 사업소득 500만원 예외, 장애인 등 특례, 금융소득 문턱',
    source: DEPENDENT_SOURCES.income,
  },
  {
    label: '재산요건',
    basis: BASIS.PROPERTY,
    coverage: '재산세 과세표준 5.4억원·9억원 구간과 형제자매 1.8억원 기준',
    source: DEPENDENT_SOURCES.property,
  },
] as const;

const CASE_SUMMARY = summarizeVerificationCases();

/** 대조 등급 배지 색. 강도 차이가 눈으로 구분돼야 한다. */
const TIER_BADGE: Record<VerificationTierMeta['tone'], string> = {
  strong: 'bg-accent-100 text-accent-700',
  medium: 'bg-slate-200 text-slate-800',
  weak: 'bg-slate-100 text-slate-700',
  open: 'bg-amber-100 text-amber-900',
};

export default function VerificationPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }}
      />
      <article className="mx-auto min-w-0 max-w-4xl space-y-12 px-4 py-12 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-accent-700">기준체크의 운영 원칙</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
          검증 원칙
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          기준체크는 공식 판정기관이 아닙니다. 법령과 국민건강보험공단의 공개
          자료를 바탕으로 조건을 이해하기 쉽게 정리하고, 확인하지 못한 부분은
          기능을 열지 않거나 한계로 표시합니다.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="principles">
        <h2 id="principles" className="text-2xl font-bold tracking-tight text-brand-950">
          네 가지 검증 단계
        </h2>
        <ol className="overflow-hidden rounded-[22px] border border-slate-200 bg-white sm:grid sm:grid-cols-2">
          {[
            ['01', '공식 출처를 먼저 확인합니다', '법제처 법령 원문과 국민건강보험공단의 공개 안내를 우선합니다. 블로그나 요약 자료는 출발점이 될 수 있어도 최종 근거로 쓰지 않습니다.'],
            ['02', '경계값을 코드로 시험합니다', '금액이 기준 바로 아래·같음·바로 위일 때 결과가 바뀌는지 자동 테스트로 확인합니다.'],
            ['03', '공식 계산·심사 흐름과 대조합니다', '금액 계산 기능은 대표 사례를 공식 모의계산과 비교하고, 차이와 원인을 기록한 뒤에만 공개합니다.'],
            ['04', '검증 상태를 숨기지 않습니다', '대조가 끝나지 않은 도구는 검색·내부 링크·버튼에서 공개하지 않습니다. 확인할 수 없는 조건은 모의 결과의 한계로 남깁니다.'],
          ].map(([number, title, description], index) => (
            <li
              key={number}
              className={`p-6 ${index > 1 ? 'border-t border-slate-200' : ''} ${index % 2 === 1 ? 'sm:border-l' : ''}`}
            >
              <span className="grid h-[31px] w-[31px] place-items-center rounded-full bg-brand-900 text-[13px] font-bold text-white">
                {number}
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4" aria-labelledby="scope">
        <h2 id="scope" className="text-2xl font-bold tracking-tight text-brand-950">
          현재 공개 범위
        </h2>
        <div className="min-w-0 max-w-full overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
          <table className="w-full min-w-0 table-fixed border-collapse text-sm sm:min-w-[42rem]">
            <caption className="sr-only">기준체크 기능별 공개 범위와 확인 방식</caption>
            <thead className="border-b border-slate-200 bg-canvas text-left text-slate-700">
              <tr>
                <th scope="col" className="px-5 py-4 font-bold">기능</th>
                <th scope="col" className="px-5 py-4 font-bold">확인 방식</th>
                <th scope="col" className="px-5 py-4 font-bold">제공 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">피부양자 자격 판정</td>
                <td className="px-5 py-4 leading-6">법령 기준 매핑과 경계값 자동 테스트를 적용합니다. 개별 심사자료와 반영 시점은 공단 판단에 따릅니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">모의 판정 제공</span></td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">지역가입자 보험료 계산</td>
                <td className="px-5 py-4 leading-6">2026-08-05 공단 지역보험료 모의계산 대표 사례 13건을 재대조했습니다. 공단 화면의 ‘사업소득 등’은 사업·이자·배당·기타소득을 합산하므로 지역보험료에는 금융소득을 전액 반영합니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">검증된 참고 계산</span></td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">임의계속가입 비교</td>
                <td className="px-5 py-4 leading-6">법령·공단 안내의 자격·신청 기한·보험료 산식과 대표 사례를 대조한 참고 비교입니다. 실제 고지액은 공단 자료 반영 결과를 확인해야 합니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">검증된 참고 비교</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          각 기능을 어떤 값으로 확인했는지는{' '}
          <a href="#cases" className="text-accent-700 underline underline-offset-4 hover:text-accent-600">
            아래 대조 사례 기록
          </a>
          에서 사례 단위로 볼 수 있습니다.
        </p>
      </section>

      {/* id 는 섹션에 둔다. 제목에 두면 #cases 앵커와 테스트 범위가 h2 한 줄로 좁아진다.
          그룹 섹션(`${group.id}` / `${group.id}-title`)과 같은 규칙이다. */}
      <section id="cases" className="scroll-mt-24 space-y-5" aria-labelledby="cases-title">
        <h2 id="cases-title" className="text-2xl font-bold tracking-tight text-brand-950">
          대조 사례 기록
        </h2>
        <p className="max-w-3xl text-base leading-8 text-slate-600">
          위의 검증 단계를 실제로 어떤 값에 적용했는지 그대로 공개합니다. 아래 입력값은
          모두 기준을 넘나드는 합성 경계값이며, 이용자가 입력한 값이나 특정 개인의
          소득·재산 자료는 들어가지 않습니다.
        </p>

        <dl className="grid gap-px overflow-hidden rounded-[22px] border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {[
            ['공개 사례', `${CASE_SUMMARY.total}건`],
            ['근거와 일치', `${CASE_SUMMARY.matched}건`],
            ['근거와 불일치', `${CASE_SUMMARY.mismatched}건`],
            ['확인하지 못함', `${CASE_SUMMARY.unknown}건`],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-4">
              <dt className="text-sm font-bold text-slate-600">{label}</dt>
              <dd className="mt-1 text-2xl font-bold text-brand-950">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="rounded-[22px] border border-slate-200 bg-canvas p-6 sm:p-7">
          <h3 className="text-lg font-bold text-brand-950">대조 등급을 나눠 표시합니다</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            공단 모의계산기와 직접 비교한 것과, 법령 산식을 스스로 재현한 것은 근거의
            무게가 다릅니다. 이를 “검증 완료” 한 단어로 합치지 않습니다.
          </p>
          <dl className="mt-5 space-y-4">
            {Object.entries(VERIFICATION_TIERS).map(([key, tier]) => (
              <div key={key}>
                <dt>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${TIER_BADGE[tier.tone]}`}
                  >
                    {tier.label}
                  </span>
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-700">{tier.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        {VERIFICATION_CASE_GROUPS.map((group) => {
          const tier = VERIFICATION_TIERS[group.tier];

          return (
            <section
              key={group.id}
              id={group.id}
              className="scroll-mt-24 space-y-3"
              aria-labelledby={`${group.id}-title`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3
                  id={`${group.id}-title`}
                  className="text-xl font-bold tracking-tight text-brand-950"
                >
                  {group.title}
                </h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${TIER_BADGE[tier.tone]}`}
                >
                  {tier.label}
                </span>
                <span className="text-sm font-bold text-slate-600">{group.cases.length}건</span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">{group.summary}</p>
              <p className="text-sm leading-6">
                <span className="text-slate-600">대조 기준: </span>
                <a
                  href={group.source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-700 underline underline-offset-4 hover:text-accent-600"
                >
                  {group.source.label} ↗ <span className="sr-only">(새 창에서 열림)</span>
                </a>
              </p>

              <div className="min-w-0 max-w-full overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
                <table className="w-full min-w-0 border-collapse text-sm lg:min-w-[56rem]">
                  <caption className="sr-only">
                    {group.title} 대조 사례 {group.cases.length}건. 입력값, {group.expectedLabel},
                    기준체크 결과, 오차, 대조일 순서입니다.
                  </caption>
                  <thead className="border-b border-slate-200 bg-canvas text-left text-slate-700">
                    <tr>
                      <th scope="col" className="px-5 py-4 font-bold">사례</th>
                      <th scope="col" className="px-5 py-4 font-bold">입력값</th>
                      <th scope="col" className="px-5 py-4 font-bold">{group.expectedLabel}</th>
                      <th scope="col" className="px-5 py-4 font-bold">기준체크 결과</th>
                      <th scope="col" className="px-5 py-4 font-bold">오차</th>
                      <th scope="col" className="px-5 py-4 font-bold">대조일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {group.cases.map((item) => (
                      <tr key={item.id}>
                        <th
                          scope="row"
                          className="whitespace-nowrap px-5 py-4 text-left align-top font-bold text-brand-950"
                        >
                          {item.id}
                        </th>
                        <td className="px-5 py-4 align-top leading-6">
                          {item.input}
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {item.note}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top leading-6">{item.expected}</td>
                        <td className="px-5 py-4 align-top leading-6">{item.actual}</td>
                        <td
                          className={`px-5 py-4 align-top font-bold ${
                            item.result === 'match' ? 'text-slate-700' : 'text-amber-900'
                          }`}
                        >
                          {item.diff}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <time dateTime={item.checkedOn}>{item.checkedOn}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          2026년 8월 6일 대조에서 <strong>불일치가 한 건 나왔습니다.</strong> 주택을
          가진 사람의 전월세를 재산에 더해 계산했는데, 공단은 주택·건물이 있으면
          전월세를 반영하지 않았습니다. 조건을 바꿔가며 다섯 번 더 확인해 원인을 찾고
          계산 방식을 고쳤습니다. 그 과정이 위 표의 C24·C25입니다. 앞으로도 불일치가
          나오면 행을 지우지 않고 원인과 함께 남깁니다. 오류를 발견하시면{' '}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-accent-700 underline underline-offset-4"
          >
            {SITE.contactEmail}
          </a>
          으로 알려 주세요.
        </p>
      </section>

      <section className="space-y-4" aria-labelledby="dependent-sources">
        <h2 id="dependent-sources" className="text-2xl font-bold tracking-tight text-brand-950">
          피부양자 판정의 근거 매핑
        </h2>
        <div className="min-w-0 max-w-full overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
          <table className="w-full min-w-0 table-fixed border-collapse text-sm lg:min-w-[58rem]">
            <caption className="sr-only">피부양자 판정 단계별 근거 매핑</caption>
            <thead className="border-b border-slate-200 bg-canvas text-left text-slate-700">
              <tr>
                <th scope="col" className="px-5 py-4 font-bold">단계</th>
                <th scope="col" className="px-5 py-4 font-bold">코드에서 확인하는 핵심 분기·수치</th>
                <th scope="col" className="px-5 py-4 font-bold">근거 및 원문</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {DEPENDENT_RULE_COVERAGE.map((rule) => (
                <tr key={rule.label}>
                  <td className="px-5 py-4 align-top font-bold text-brand-950">{rule.label}</td>
                  <td className="px-5 py-4 align-top leading-6">{rule.coverage}</td>
                  <td className="px-5 py-4 align-top leading-6">
                    <p>{rule.basis}</p>
                    <p className="mt-2 space-x-3">
                      <a
                        href={rule.source.law.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-700 underline underline-offset-4 hover:text-accent-600"
                      >
                        법령 원문 ↗ <span className="sr-only">(새 창에서 열림)</span>
                      </a>
                      <a
                        href={rule.source.nhis.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-700 underline underline-offset-4 hover:text-accent-600"
                      >
                        공단 안내 ↗ <span className="sr-only">(새 창에서 열림)</span>
                      </a>
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          위 표는 코드가 적용하는 모델의 범위를 보여줍니다. 손자녀·외손자녀의 부모 부양능력
          요건은 현재 모델에 포함하지 않으며, 기혼 피부양자의 배우자 소득·재산 요건은
          배우자 자료를 별도로 입력해 함께 판정합니다. 이혼·사별과 공단이 관계 자료로 인정하는 예외처럼 개별
          사실관계가 필요한 항목은 최종 신고 전 공단에 확인해 주세요.
        </p>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-canvas p-6 sm:p-7" aria-labelledby="limits">
        <h2 id="limits" className="text-xl font-bold text-brand-950">결과를 이렇게 해석해 주세요</h2>
        <ul className="mt-4 space-y-3 text-base leading-7 text-slate-700">
          <li>입력한 정보가 실제 신고·소득·재산 자료와 다르면 결과도 달라질 수 있습니다.</li>
          <li>자료 반영 시점, 개별 사실관계, 공단의 최종 심사는 이 도구가 대신할 수 없습니다.</li>
          <li>결과가 중요한 신청·납부 결정으로 이어진다면 근거 링크와 국민건강보험공단 안내를 함께 확인해 주세요.</li>
        </ul>
      </section>

      {/*
        저자 엔티티(`Person`)의 근거가 되는 화면이다. `authorJsonLd()` 의 `url` 이
        이 절의 앵커를 가리키므로, 절을 옮기거나 지우면 구조화 데이터가 없는 곳을
        가리키게 된다. 실명·경력은 쓰지 않는다 — `SITE.operator` 주석 참조.
      */}
      <section className="rounded-[22px] border border-slate-200 bg-white p-6 sm:p-7" aria-labelledby="operator">
        <h2 id="operator" className="text-xl font-bold text-brand-950">누가 운영하고, 무엇을 보증하지 않는가</h2>
        <p className="mt-4 text-base leading-7 text-slate-700">{SITE.operator.description}</p>

        <h3 className="mt-6 text-base font-bold text-brand-950">기준을 확인하는 방식</h3>
        <ul className="mt-3 space-y-2 text-base leading-7 text-slate-700">
          {SITE.operator.approach.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-[2px] text-accent-700">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-base font-bold text-brand-950">하지 않는 것</h3>
        <p className="mt-3 text-base leading-7 text-slate-700">{SITE.operator.limits}</p>

        <dl className="mt-6 grid gap-3 border-t border-slate-200 pt-6 text-sm leading-6 sm:grid-cols-[140px_1fr]">
          <dt className="font-bold text-slate-900">운영 주체</dt>
          <dd>{SITE.operatorName}</dd>
          <dt className="font-bold text-slate-900">문의 채널</dt>
          <dd>
            <a href={`mailto:${SITE.contactEmail}`} className="text-accent-700 underline underline-offset-4">
              {SITE.contactEmail}
            </a>
            {' '}— 오류 신고·출처 정정 요청·개인정보 문의를 받습니다.
          </dd>
          <dt className="font-bold text-slate-900">공식 판단 여부</dt>
          <dd>기준체크는 민간 정보 서비스이며 국민건강보험공단의 공식 판정·처분을 대신하지 않습니다.</dd>
        </dl>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="sources">
        <h2 id="sources" className="text-xl font-bold text-brand-950">기본 출처</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6">
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
              >
                {source.label} ↗ <span className="sr-only">(새 창에서 열림)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
          기준 연도 {SITE.baseYear}년 · 최종 종합 검토{' '}
          <time dateTime={ROUTES.verificationPolicy.lastModified}>
            {ROUTES.verificationPolicy.lastModified}
          </time>{' '}
          · 세부 대조
          기록과 공개 범위의 변동은 이 페이지에 반영합니다.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={ROUTES.dependent.path}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-brand-900 px-6 text-base font-bold text-white shadow-sm transition hover:bg-brand-800"
        >
          피부양자 자격 확인하기 →
        </a>
        <a
          href={ROUTES.home.path}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-400 bg-white px-6 text-base font-bold text-brand-900 transition hover:bg-canvas"
        >
          홈으로 돌아가기
        </a>
      </div>
      </article>
    </>
  );
}
