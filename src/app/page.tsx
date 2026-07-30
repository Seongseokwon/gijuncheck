import { GUIDE_KEYS, ROUTES, TOOL_KEYS } from '@/lib/routes';

const DESCRIPTIONS: Record<(typeof TOOL_KEYS)[number], string> = {
  dependent:
    '관계·소득·재산 3단 판정. 탈락하면 어느 요건에서 왜 걸리는지 근거 조항까지 보여줍니다.',
  regionalPremium:
    '2026년 요율 7.19% 반영. 피부양자에서 탈락하면 실제로 얼마를 내는지 계산합니다.',
  voluntaryContinuation:
    '퇴직 후 지역가입자와 임의계속가입 중 어느 쪽이 유리한지 금액으로 비교합니다.',
};

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold leading-snug">
          소득이 바뀔 때
          <br />
          내 사회보험은 어떻게 바뀌나
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          퇴직, 사업자등록, 연금 개시. 소득이 바뀌는 순간마다 건강보험 자격과
          보험료가 달라집니다. 계산만 해주는 도구는 많지만{' '}
          <strong className="font-semibold text-slate-900">
            자격이 되는지 판정
          </strong>
          해주는 곳은 없어서 만들었습니다.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500">도구</h2>
        <ul className="mt-3 space-y-3">
          {TOOL_KEYS.map((key) => {
            const t = ROUTES[key];
            return (
              <li key={t.path}>
                {t.ready ? (
                  <a
                    href={t.path}
                    className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-900"
                  >
                    <p className="font-semibold">{t.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {DESCRIPTIONS[key]}
                    </p>
                  </a>
                ) : (
                  <div className="block rounded-lg border border-dashed border-slate-200 bg-white/50 p-4">
                    <p className="font-semibold text-slate-400">
                      {t.label}
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                        준비 중
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {DESCRIPTIONS[key]}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 도구 → 해설 동선. 도구만 있는 사이트는 체류시간이 짧아 RPM 이 낮다 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500">가이드</h2>
        <ul className="mt-3 space-y-2">
          {GUIDE_KEYS.filter((k) => ROUTES[k].ready).map((k) => (
            <li key={k}>
              <a
                href={ROUTES[k].path}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-900"
              >
                {ROUTES[k].label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
