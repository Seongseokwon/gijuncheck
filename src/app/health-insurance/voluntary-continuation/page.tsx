import VoluntaryComparison from '@/components/VoluntaryComparison';
import { VOLUNTARY_CONTINUATION } from '@/lib/constants/2026';
import { createPageMetadata } from '@/lib/metadata';
import { GUIDE_KEYS, ROUTES } from '@/lib/routes';
import TrustSignal from '@/components/TrustSignal';

const TITLE = '임의계속가입 비교 — 지역가입자보다 보험료가 저렴한지 확인';
const DESCRIPTION =
  '퇴직 후 지역가입자와 임의계속가입 중 어느 쪽이 유리한지 월 금액으로 비교합니다. ' +
  '임의계속가입은 재산이 보험료에 반영되지 않아 재산이 많고 퇴직 전 보수가 낮았을수록 유리합니다. 보수 외 소득은 별도 보험료가 추가될 수 있습니다. ' +
  `최대 36개월, ${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신고 시 소급 인정.`;

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.voluntaryContinuation.path,
});

const FAQ = [
  {
    q: '임의계속가입은 누가 신청할 수 있나요?',
    a: `퇴직 전 ${VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 동안 직장가입자 자격을 통산 ${VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상 유지했다면 신청할 수 있습니다. 최대 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월까지 직장가입자 자격을 유지합니다.`,
  },
  {
    q: '언제까지 신청해야 하나요?',
    a: `${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신고하면 퇴사일로 소급 인정됩니다. "퇴직 후 90일"로 알려진 경우가 많은데 현재 기준과 다른 안내입니다. 실제로는 퇴직일이 아니라 지역가입자로 전환된 뒤 공단이 보내는 첫 지역보험료 고지서의 납부기한이 기준입니다. 이 기한을 놓치면 그 기간의 지역보험료를 그대로 내야 하므로, 첫 고지서를 받으면 가장 먼저 확인해야 할 항목입니다.`,
  },
  {
    q: '임의계속가입이 유리한 경우는 언제인가요?',
    a:
      '재산이 많고 퇴직 전 보수가 낮았던 경우입니다. 임의계속가입 보수월액보험료에는 재산이 반영되지 않기 때문입니다. 다만 보수 외 소득이 연 2,000만원을 초과하면 추가 보험료가 생길 수 있습니다. ' +
      '반대로 재산이 거의 없고 퇴직 전 급여가 높았다면 지역가입자가 더 쌀 수 있습니다.',
  },
  {
    q: '임의계속가입자도 피부양자를 등재할 수 있나요?',
    a: '가능합니다. 직장가입자 자격이 유지되므로 배우자·부모 등을 피부양자로 등재할 수 있습니다. 지역가입자는 피부양자 제도가 없습니다.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: ROUTES.voluntaryContinuation.label,
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
  ROUTES.regionalPremium,
  ROUTES.dependent,
  ROUTES[GUIDE_KEYS[3]],
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:py-16">
        <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold text-accent-700">퇴직 후 건강보험</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl">
            {ROUTES.voluntaryContinuation.label}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            퇴직하면 자동으로 지역가입자가 되지만, 신청하면 최대{' '}
            {VOLUNTARY_CONTINUATION.MAX_MONTHS}개월간 직장가입자 자격을 유지할 수
            있습니다. 재산이 보험료에 반영되지 않아 더 싼 경우가 많은데, 모르고
            넘어가는 사람이 많습니다.
          </p>
          <TrustSignal
            tone="reference"
            status="법령·공단 산식 기반 참고 비교"
            detail="현행 법령·공단 안내·보험료 산식을 반영한 비교입니다. 개인별 공단 고지액을 그대로 복제한 계산은 아닙니다."
          />
        </header>

        <VoluntaryComparison />

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
