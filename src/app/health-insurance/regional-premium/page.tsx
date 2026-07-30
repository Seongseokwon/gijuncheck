import type { Metadata } from 'next';
import RegionalPremiumCalc from '@/components/RegionalPremiumCalc';
import { PREMIUM_LIMIT, RATE } from '@/lib/constants/2026';
import { GUIDE_KEYS, ROUTES } from '@/lib/routes';
import { toPercent, won } from '@/lib/format';

export const metadata: Metadata = {
  title: '지역가입자 보험료 계산 — 2026년 요율 7.19% 반영',
  description:
    '퇴직 후 지역가입자가 되면 월 보험료가 얼마인지 계산합니다. ' +
    '근로·연금소득 50% 반영, 재산 60등급표, 기본공제 1억원, 상한·하한까지 적용. ' +
    '적용된 재산 등급과 점수도 함께 보여줍니다.',
  alternates: { canonical: ROUTES.regionalPremium.path },
};

const FAQ = [
  {
    q: '연금소득도 전액 보험료에 반영되나요?',
    a:
      '아닙니다. 근로소득과 연금소득은 50%만 반영됩니다. 이자·배당·사업·기타소득은 100% 반영됩니다. ' +
      '이 차이를 모르면 연금 수령자의 보험료를 2배로 잘못 계산하게 됩니다.',
  },
  {
    q: '자동차도 보험료에 포함되나요?',
    a: '2024년 2월부터 자동차에 대한 건강보험료 부과가 폐지되었습니다. 이제 소득과 재산만 반영됩니다.',
  },
  {
    q: '재산은 공시가격으로 계산하나요?',
    a:
      '재산세 과세표준으로 계산하고, 여기서 기본공제 1억원을 뺀 금액을 60등급표에 대입합니다. ' +
      '주택·건물을 소유하지 않은 경우에만 임차보증금과 월세가 재산으로 평가되며 그 평가금액의 30%가 반영됩니다.',
  },
  {
    q: '보험료에 상한과 하한이 있나요?',
    a: `있습니다. 2026년 지역가입자 건강보험료의 하한은 ${won(
      PREMIUM_LIMIT.LOWER,
    )}, 상한은 ${won(
      PREMIUM_LIMIT.UPPER,
    )}입니다. 소득과 재산이 없어도 하한액은 부과됩니다.`,
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: ROUTES.regionalPremium.label,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
};

const RELATED = [
  ROUTES.dependent,
  ROUTES[GUIDE_KEYS[0]],
  ROUTES[GUIDE_KEYS[3]],
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold">{ROUTES.regionalPremium.label}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            건강보험료율 {toPercent(RATE.HEALTH)}, 장기요양보험료율{' '}
            {toPercent(RATE.LONG_TERM_CARE)}, 재산점수당 {RATE.PROPERTY_POINT_VALUE}원
            기준입니다. 소득 종류별 반영률과 재산 60등급, 상한·하한까지 적용해
            계산합니다.
          </p>
        </header>

        <RegionalPremiumCalc />

        <section>
          <h2 className="text-lg font-bold">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <dt className="text-sm font-semibold">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-500">함께 읽기</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {RELATED.map((r) => (
              <li key={r.path}>
                {r.ready ? (
                  <a
                    href={r.path}
                    className="text-slate-600 underline hover:text-slate-900"
                  >
                    {r.label}
                  </a>
                ) : (
                  <span className="text-slate-400">{r.label} (준비 중)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
