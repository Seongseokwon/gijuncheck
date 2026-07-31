import { GUIDE_KEYS, ROUTES, TOOL_KEYS } from '@/lib/routes';

/**
 * 홈 레이아웃 — design-preview/index3.html 기준 (docs/design-decisions/ADR-002).
 *
 * index3.html은 1120px 폭의 2단 히어로를 쓰지만, 이 앱의 <main>은
 * layout.tsx 에서 max-w-3xl(768px)로 전 페이지 공통 고정돼 있다.
 * 폭을 이 페이지만 넓히면 헤더·본문 폭이 어긋나므로, 대신 단일 컬럼으로
 * 압축해 옮겼다. 상황별 카드·가이드 그리드는 좁은 폭에서도 그대로 유지된다.
 */

const DESCRIPTIONS: Record<(typeof TOOL_KEYS)[number], string> = {
  dependent:
    '관계·소득·재산 3단 판정. 탈락하면 어느 요건에서 왜 걸리는지 근거 조항까지 보여줍니다.',
  regionalPremium:
    '2026년 요율 7.19% 반영. 피부양자에서 탈락하면 실제로 얼마를 내는지 계산합니다.',
  voluntaryContinuation:
    '퇴직 후 지역가입자와 임의계속가입 중 어느 쪽이 유리한지 금액으로 비교합니다.',
};

const SCENARIOS = [
  {
    mark: '퇴',
    title: '퇴직을 앞두고 있어요',
    desc: '지금은 피부양자 가능 여부와 적용 근거를 먼저 확인합니다.',
  },
  {
    mark: '사',
    title: '사업자등록을 고민해요',
    desc: '사업소득이 발생하면 자격이 어떻게 바뀌는지 확인합니다.',
  },
  {
    mark: '부',
    title: '부모님을 올리고 싶어요',
    desc: '관계·소득·재산 기준을 순서대로 판정합니다.',
  },
  {
    mark: '연',
    title: '연금 수령을 시작해요',
    desc: '공적연금이 피부양자 소득기준에 미치는 영향을 봅니다.',
  },
] as const;

/** 가이드 카드에 붙는 근거 조항 태그. design-preview/index3.html과 동일한 매핑 */
const GUIDE_TAG: Partial<Record<(typeof GUIDE_KEYS)[number], string>> = {
  guidePropertyTaxBase: '시행령 제41조',
  guideBusinessRegistration: '별표1의2 제2호',
  guideLosingEligibility: '시행규칙 별표1',
  guideVoluntaryContinuation: '국민건강보험법',
  guidePensionImpact: '별표1의2 제1호',
  guideNovemberReassessment: '국민건강보험법',
};

export default function Home() {
  return (
    <div className="space-y-16">
      {/* ---------- 히어로 ---------- */}
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-100 bg-white/70 px-3 py-1 text-xs font-bold text-accent-700">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-700" aria-hidden />
          2026년 기준 · 참고용 모의 확인
        </span>

        <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl">
          피부양자 자격,
          <br />
          혼자 판단하기 어렵다면
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
          관계·소득·재산 정보를 입력하면 자격 가능성과 탈락 사유를 단계별
          근거와 함께 알려드립니다.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={ROUTES.dependent.path}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-900 px-5 font-bold text-white shadow-sm hover:bg-brand-800"
          >
            피부양자 자격 확인하기
            <span aria-hidden>→</span>
          </a>
          <a
            href="#scope"
            className="inline-flex min-h-[48px] items-center rounded-xl border border-slate-500 bg-white px-5 font-bold text-brand-900 hover:border-brand-800"
          >
            어떻게 판정하나요?
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
          {['약 3분', '회원가입 없음', '입력 정보 저장 안 함', '판정 근거 표시'].map(
            (t) => (
              <span key={t}>
                <span className="mr-1.5 font-black text-accent-700" aria-hidden>
                  ✓
                </span>
                {t}
              </span>
            ),
          )}
        </div>
      </section>

      {/* ---------- 상황별 시작 ---------- */}
      <section>
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-accent-700">
          상황별 시작
        </h2>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-950">
          지금 어떤 상황인가요?
        </p>
        <p className="mt-2 text-base text-slate-600">
          도구 이름을 몰라도 괜찮습니다. 현재 상황을 고르면 확인해야 할
          순서부터 안내합니다.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <a
              key={s.title}
              href={ROUTES.dependent.path}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-700 hover:shadow-md"
            >
              <span
                className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-lg font-black text-brand-900"
                aria-hidden
              >
                {s.mark}
              </span>
              <p className="text-base font-bold tracking-tight text-brand-950">
                {s.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {s.desc}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- 제공 범위 ---------- */}
      <section id="scope">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-accent-700">
          제공 범위
        </h2>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-950">
          지금 확인할 수 있는 도구
        </p>
        <p className="mt-2 text-base text-slate-600">
          검증이 끝난 범위만 이용할 수 있습니다. 준비 중인 도구는 결과를
          제공하지 않습니다.
        </p>

        <ol className="mt-6 space-y-3">
          {TOOL_KEYS.map((key, i) => {
            const t = ROUTES[key];
            return (
              <li key={t.path}>
                {t.ready ? (
                  <a
                    href={t.path}
                    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent-700"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-900 text-xs font-bold text-white"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        이용 가능
                      </span>
                      <p className="mt-1.5 font-bold text-brand-950">
                        {t.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {DESCRIPTIONS[key]}
                      </p>
                    </span>
                  </a>
                ) : (
                  <div className="flex items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        준비 중
                      </span>
                      <p className="mt-1.5 font-bold text-slate-600">
                        {t.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {DESCRIPTIONS[key]}
                      </p>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------- 가이드 ---------- */}
      {/* 도구 → 해설 동선. 도구만 있는 사이트는 체류시간이 짧아 RPM 이 낮다 */}
      <section>
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-accent-700">
          근거가 되는 가이드
        </h2>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-950">
          판정에 쓰이는 기준을 먼저 읽어보세요
        </p>
        <p className="mt-2 text-base text-slate-600">
          도구가 어떤 조항과 기준으로 판정하는지 설명합니다. 판정 결과
          화면에서도 관련 가이드로 다시 연결됩니다.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {GUIDE_KEYS.filter((k) => ROUTES[k].ready).map((k) => (
            <a
              key={k}
              href={ROUTES[k].path}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-700 hover:shadow-md"
            >
              {GUIDE_TAG[k] && (
                <span className="mb-3 inline-flex rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-accent-700">
                  {GUIDE_TAG[k]}
                </span>
              )}
              <p className="block text-base font-bold tracking-tight text-brand-950">
                {ROUTES[k].label}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
