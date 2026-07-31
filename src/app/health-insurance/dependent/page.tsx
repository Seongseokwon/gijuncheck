import type { Metadata } from 'next';
import DependentJudge from '@/components/DependentJudge';
import { INCOME, PROPERTY } from '@/lib/constants/2026';
import { toEok, toManwon } from '@/lib/dependent/judge';
import { GUIDE_KEYS, ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: '피부양자 자격판정 — 소득·재산·관계 3단 자동 판정',
  description:
    `2026년 기준 건강보험 피부양자 자격을 자동 판정합니다. 합산소득 ${toManwon(
      INCOME.TOTAL_LIMIT,
    )}, 재산세 과세표준 ${toEok(PROPERTY.SAFE_LIMIT)}·${toEok(
      PROPERTY.HARD_LIMIT,
    )} 구간, 사업자등록 여부, 관계별 부양요건까지 반영. 탈락 시 근거 조항을 함께 보여줍니다.`,
  alternates: { canonical: ROUTES.dependent.path },
};

/** 검색 결과에서 자리를 넓게 차지하도록 FAQ 구조화 데이터를 넣는다 */
const FAQ = [
  {
    q: '피부양자 소득 기준은 얼마인가요?',
    a: `연간 합산소득 ${toManwon(
      INCOME.TOTAL_LIMIT,
    )} 이하입니다. 사업·근로·공적연금·기타소득을 합산하며 1원만 초과해도 자격을 잃습니다. 금융소득(이자+배당)은 연 1,000만원 이하면 합산에서 제외되고, 초과하면 초과분이 아니라 전액이 합산됩니다.`,
  },
  {
    q: '사업자등록을 하면 피부양자에서 탈락하나요?',
    a: '사업자등록이 있는 경우 사업소득이 발생하면 금액과 무관하게 탈락합니다. 사업자등록이 없다면 사업소득 연 500만원까지는 유지됩니다.',
  },
  {
    q: '재산 기준은 공시가격인가요?',
    a: `실거래가나 공시가격이 아니라 재산세 과세표준입니다. 과세표준 ${toEok(
      PROPERTY.SAFE_LIMIT,
    )} 이하면 인정되고, ${toEok(PROPERTY.HARD_LIMIT)}을 초과하면 소득이 없어도 탈락합니다. 공시가격 10억이면 과세표준은 약 6억입니다.`,
  },
  {
    q: '형제자매도 피부양자로 등록할 수 있나요?',
    a: `만 30세 미만이거나 만 65세 이상, 또는 장애인인 경우로서 미혼이고 동거할 때만 인정됩니다. 재산 기준도 과세표준 ${toEok(
      PROPERTY.SIBLING_LIMIT,
    )} 이하로 일반보다 엄격합니다.`,
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: ROUTES.dependent.label,
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

/** 이 도구와 관련도가 높은 가이드 3개 */
const RELATED = GUIDE_KEYS.slice(0, 3).map((k) => ROUTES[k]);

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold">{ROUTES.dependent.label}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            부양요건 · 소득요건 · 재산요건을 순서대로 판정합니다. 탈락하면 어느
            단계에서 왜 걸리는지 근거 조항과 함께 보여줍니다.
          </p>
        </header>

        <DependentJudge />

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

        {/* 도구 → 해설 동선. RPM 방어용이므로 빼지 말 것 */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500">함께 읽기</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {RELATED.map((g) => (
              <li key={g.path}>
                {g.ready ? (
                  <a
                    href={g.path}
                    className="text-slate-600 underline hover:text-slate-900"
                  >
                    {g.label}
                  </a>
                ) : (
                  <span className="text-slate-500">{g.label} (준비 중)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
