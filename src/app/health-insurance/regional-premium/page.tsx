import RegionalPremiumCalc from '@/components/RegionalPremiumCalc';
import { PREMIUM_LIMIT, RATE } from '@/lib/constants/2026';
import { VERIFIED_AGAINST_NHIS } from '@/lib/constants/property-score-table';
import { createPageMetadata } from '@/lib/metadata';
import { GUIDE_KEYS, ROUTES } from '@/lib/routes';
import { breadcrumbJsonLd, ldJson } from '@/lib/structured-data';
import { toPercent, won } from '@/lib/format';
import TrustSignal from '@/components/TrustSignal';

const TITLE = '지역가입자 보험료 계산 — 2026년 요율 7.19% 반영';
const DESCRIPTION =
  '퇴직 후 지역가입자가 되면 월 보험료가 얼마인지 계산합니다. ' +
  '근로·연금소득 50% 반영, 재산 60등급표, 기본공제 1억원, 상한·하한까지 적용. ' +
  '임차보증금·월세 환산과 적용된 재산 등급·점수도 함께 보여줍니다.';

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.regionalPremium.path,
});

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
    breadcrumbJsonLd([
      { name: '기준체크', path: ROUTES.home.path },
      { name: ROUTES.regionalPremium.label, path: ROUTES.regionalPremium.path },
    ]),
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
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:py-16">
        <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold text-accent-700">건강보험 지역가입자</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl">{ROUTES.regionalPremium.label}</h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            건강보험료율 {toPercent(RATE.HEALTH)}, 장기요양보험료율{' '}
            {toPercent(RATE.LONG_TERM_CARE)}, 재산점수당 {RATE.PROPERTY_POINT_VALUE}원
            기준입니다. 소득 종류별 반영률과 재산 60등급, 상한·하한까지 적용해
            계산합니다.
          </p>
          <TrustSignal
            status={
              VERIFIED_AGAINST_NHIS
                ? '공단 모의계산 대표 사례 대조 완료'
                : '공단 재대조 전 참고 계산'
            }
            detail={
              VERIFIED_AGAINST_NHIS
                ? '국민건강보험공단 모의계산 대표 사례와 대조한 참고 계산입니다. 실제 고지액·개별 심사 결과를 대신하지 않습니다.'
                : '금융소득 기준을 수정했으며 기존 공단 대표 사례의 재대조 전입니다. 실제 고지액·개별 심사 결과를 대신하지 않습니다.'
            }
            tone={VERIFIED_AGAINST_NHIS ? 'verified' : 'reference'}
          />
        </header>

        <RegionalPremiumCalc />

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">자주 묻는 질문</h2>
          <dl className="mt-6 space-y-4">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <dt className="text-base font-extrabold text-brand-950">{q}</dt>
                <dd className="mt-3 text-base leading-7 text-slate-600">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-brand-950">함께 읽기</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {RELATED.map((r) => (
              <li key={r.path}>
                {r.ready ? (
                  <a
                    href={r.path}
                    className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
                  >
                    {r.label}
                  </a>
                ) : (
                  <span className="text-slate-500">{r.label} (준비 중)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
