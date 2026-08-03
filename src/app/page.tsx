import DependentJudge from '@/components/DependentJudge';
import TrackedLink from '@/components/TrackedLink';
import { GUIDE_KEYS, ROUTES, TOOL_KEYS } from '@/lib/routes';

const DESCRIPTIONS: Record<(typeof TOOL_KEYS)[number], string> = {
  dependent:
    '관계·소득·재산을 순서대로 확인하고, 어느 요건에서 왜 걸리는지 근거 조항까지 보여줍니다.',
  regionalPremium:
    '지역가입자 보험료 기준의 공단 대조가 끝난 뒤 계산 기능을 공개합니다.',
  voluntaryContinuation:
    '지역보험료 기준 검증이 끝난 뒤 임의계속가입 비교 기능을 공개합니다.',
};

const SCENARIOS = [
  ['퇴', '퇴직을 앞두고 있어요', '피부양자 가능 여부와 적용 근거를 먼저 확인합니다.'],
  ['사', '사업자등록을 고민해요', '사업소득이 자격에 어떤 영향을 주는지 확인합니다.'],
  ['부', '부모님을 올리고 싶어요', '관계·소득·재산 기준을 순서대로 확인합니다.'],
  ['연', '연금 수령을 시작해요', '공적연금이 소득기준에 미치는 영향을 확인합니다.'],
] as const;

const GUIDE_TAG: Partial<Record<(typeof GUIDE_KEYS)[number], string>> = {
  guidePropertyTaxBase: '시행령 제41조',
  guideBusinessRegistration: '별표1의2 제2호',
  guideLosingEligibility: '시행규칙 별표1',
  guideVoluntaryContinuation: '국민건강보험법',
  guidePensionImpact: '별표1의2 제1호',
  guideNovemberReassessment: '국민건강보험법',
};

const GUIDE_DESCRIPTION: Partial<Record<(typeof GUIDE_KEYS)[number], string>> = {
  guidePropertyTaxBase: '공시가격과 재산세 과세표준은 다릅니다. 판정에서 가장 많이 틀리는 지점입니다.',
  guideBusinessRegistration: '사업자등록 여부에 따라 사업소득 허용 기준이 완전히 달라집니다.',
  guideLosingEligibility: '자격을 상실하는 시점과 이후 지역보험료가 소급 부과되는 구조를 설명합니다.',
  guideVoluntaryContinuation: '재산이 많고 퇴직 전 보수가 낮을수록 유리해지는 이유를 숫자로 설명합니다.',
  guidePensionImpact: '공적연금은 합산되고 개인연금은 제외됩니다. 이 구분이 판정 결과를 바꿉니다.',
  guideNovemberReassessment: '매년 11월 자격을 일괄 재산정하는 절차와 대비 방법입니다.',
};

const shell = 'mx-auto w-full max-w-[1120px] px-4';

export default function Home() {
  return (
    <>
      <section className="overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(8,126,139,.11),transparent_30%),radial-gradient(circle_at_15%_75%,rgba(23,50,77,.07),transparent_28%),#f4f8fa] pb-[54px] pt-[58px] lg:pb-[74px] lg:pt-[84px]">
        <div className={`${shell} grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-[72px]`}>
          <div>
            <span className="inline-flex items-center gap-[7px] rounded-full border border-[#c4e6e4] bg-white/70 px-[11px] py-[7px] text-[13px] font-bold text-accent-700 shadow-sm">
              <span className="h-[7px] w-[7px] rounded-full bg-accent-700 shadow-[0_0_0_4px_rgba(8,126,139,.10)]" aria-hidden />
              2026년 기준 · 참고용 모의 확인
            </span>

            <h1 className="mt-5 text-[38px] font-bold leading-[1.16] tracking-[-0.055em] text-brand-950 sm:text-[50px] lg:text-[58px]">
              피부양자 자격,
              <br />
              <span className="lg:whitespace-nowrap">혼자 판단하기 어렵다면</span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[16px] leading-7 text-slate-600 sm:text-lg sm:leading-[1.75]">
              관계·소득·재산 정보를 입력하면 자격 가능성과 탈락 사유를
              단계별 근거와 함께 알려드립니다.
            </p>

            <div className="mt-[34px] flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="#judge"
                location="hero"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-900 px-7 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-lg"
              >
                피부양자 자격 확인하기
                <span aria-hidden>→</span>
              </TrackedLink>
              <a
                href="#journey"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-500 bg-white/80 px-7 font-bold text-brand-900 transition hover:bg-white"
              >
                어떻게 판정하나요?
              </a>
            </div>

            <div className="mt-6 grid max-w-xl grid-cols-2 gap-x-5 gap-y-3 text-[13px] font-semibold text-slate-500 sm:flex sm:flex-wrap">
              {['약 3분', '회원가입 없음', '입력값 저장 안 함', '판정 근거 표시'].map(
                (point) => (
                  <span key={point}>
                    <span className="mr-1.5 font-bold text-accent-700" aria-hidden>
                      ✓
                    </span>
                    {point}
                  </span>
                ),
              )}
            </div>
          </div>

          <aside
            className="relative rounded-[26px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_14px_38px_rgba(16,42,67,.09)]"
            aria-label="판정 과정 예시"
          >
            <p className="text-[12px] font-bold uppercase tracking-[.08em] text-slate-500">판정 결과 예시</p>
            <h2 className="mt-2 text-[21px] font-bold tracking-[-.025em] text-brand-950">
              어느 조건에서 결정됐는지 보여드려요
            </h2>

            <ol className="mt-5">
              {[
                ['1', '부양요건 확인', '관계와 동거 여부에 따라 자격 범위를 확인합니다.'],
                ['2', '소득요건 확인', '사업·근로·연금·금융소득을 기준에 맞게 합산합니다.'],
                ['3', '재산요건 확인', '재산세 과세표준과 소득 구간을 함께 판정합니다.'],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex items-start gap-[13px] border-t border-slate-100 py-[14px] first:border-t-0">
                  <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-[9px] bg-accent-100 text-[13px] font-bold text-accent-700">{number}</span>
                  <span>
                    <strong className="block text-sm font-bold text-brand-950">{title}</strong>
                    <span className="mt-0.5 block text-sm leading-6 text-slate-600">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="scenario-title">
        <div className={shell}>
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent-700">상황별 시작</p>
            <h2
              id="scenario-title"
              className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl"
            >
              지금 어떤 상황인가요?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              도구 이름을 몰라도 괜찮습니다. 현재 상황을 고르면 확인해야 할
              순서부터 안내합니다.
            </p>
          </div>

          <div className="mt-10 grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map(([mark, title, description]) => (
              <TrackedLink
                key={title}
                href="#judge"
                location="scenario"
                className="group min-h-[190px] rounded-[18px] border border-slate-200 bg-white p-[22px] shadow-sm transition hover:-translate-y-0.5 hover:border-accent-700 hover:shadow-[0_12px_28px_rgba(16,42,67,.08)]"
              >
                <span
                  className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-canvas text-[19px] font-bold text-brand-900 transition group-hover:bg-accent-100 group-hover:text-accent-700"
                  aria-hidden
                >
                  {mark}
                </span>
                <h3 className="mt-6 text-base font-bold tracking-[-.02em] text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-[1.55] text-slate-600">{description}</p>
              </TrackedLink>
            ))}
          </div>
        </div>
      </section>

      <section
        id="journey"
        className="scroll-mt-24 bg-canvas py-16 sm:py-20 lg:py-24"
        aria-labelledby="journey-title"
      >
        <div className={shell}>
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent-700">제공 범위</p>
            <h2
              id="journey-title"
              className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl"
            >
              지금 확인할 수 있는 도구
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              검증이 끝난 범위만 이용할 수 있습니다. 준비 중인 기능은 결과를
              제공하지 않습니다.
            </p>
          </div>

          <ol className="mt-12 overflow-hidden rounded-[22px] border border-slate-200 bg-white lg:grid lg:grid-cols-3">
            {TOOL_KEYS.map((key, index) => {
              const tool = ROUTES[key];
              const card = (
                <>
                  <span
                    className={`grid h-[31px] w-[31px] place-items-center rounded-full text-[13px] font-bold ${
                        tool.ready
                          ? 'bg-brand-900 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`mt-[18px] inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        tool.ready
                          ? 'bg-accent-100 text-accent-700'
                          : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tool.ready ? '이용 가능' : '공단 대조 미완료'}
                  </span>
                  <h3
                    className={`mt-3 text-lg font-bold ${
                      tool.ready ? 'text-brand-950' : 'text-slate-600'
                    }`}
                  >
                    {tool.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {DESCRIPTIONS[key]}
                  </p>
                </>
              );

              return (
                <li key={key} className="relative border-t border-slate-200 first:border-t-0 lg:border-l lg:border-t-0 lg:first:border-l-0">
                  {tool.ready ? (
                    <TrackedLink
                      href="#judge"
                      location="tool"
                      className="block min-h-[224px] p-7 transition hover:bg-slate-50"
                    >
                      {card}
                    </TrackedLink>
                  ) : (
                    <div
                      className="min-h-[224px] bg-[#fafafa] p-7"
                      aria-disabled="true"
                    >
                      {card}
                    </div>
                  )}
                  {index < TOOL_KEYS.length - 1 && (
                    <span className="absolute bottom-[-13px] right-6 z-10 grid h-[26px] w-[26px] place-items-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 lg:bottom-auto lg:right-[-13px] lg:top-[31px]" aria-hidden>
                      <span className="lg:hidden">↓</span><span className="hidden lg:inline">→</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="guides" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="guides-title">
        <div className={shell}>
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent-700">근거가 되는 가이드</p>
            <h2
              id="guides-title"
              className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl"
            >
              판정에 쓰이는 기준을 먼저 읽어보세요
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              판정 결과에서도 관련 가이드와 법령 근거로 다시 연결됩니다.
            </p>
          </div>

          <div className="mt-10 grid gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_KEYS.filter((key) => ROUTES[key].ready).map((key) => (
              <a
                key={key}
                href={ROUTES[key].path}
                className="group flex min-h-[194px] flex-col rounded-[18px] border border-slate-200 bg-white p-[22px] shadow-sm transition hover:-translate-y-0.5 hover:border-accent-700 hover:shadow-[0_12px_28px_rgba(16,42,67,.08)]"
              >
                <span className="self-start rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">
                  {GUIDE_TAG[key]}
                </span>
                <h3 className="mt-[14px] text-base font-bold tracking-[-.02em] text-brand-950">
                  {ROUTES[key].label}
                </h3>
                <span className="mt-2 text-sm leading-[1.55] text-slate-600">
                  {GUIDE_DESCRIPTION[key]}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        id="judge"
        className="scroll-mt-20 bg-canvas py-16 sm:py-20 lg:py-24"
        aria-labelledby="judge-title"
      >
        <div className={shell}>
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent-700">피부양자 판정</p>
            <h2
              id="judge-title"
              className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl"
            >
              내 조건으로 직접 확인해보세요
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              입력값은 브라우저 안에서만 계산되며 서버로 전송하거나 저장하지
              않습니다.
            </p>
          </div>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <DependentJudge />
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <p className="text-sm font-bold text-accent-700">판정 원칙</p>
              <h3 className="mt-3 text-xl font-bold text-brand-950">
                결과보다 근거까지
              </h3>
              <ul className="mt-6 space-y-5">
                {[
                  ['01', '입력값 요약', '판정에 사용한 소득과 재산 값을 다시 보여드립니다.'],
                  ['02', '단계별 설명', '부양·소득·재산 중 어느 기준을 적용했는지 설명합니다.'],
                  ['03', '법령 원문 연결', '결과 화면에서 적용 근거를 직접 확인할 수 있습니다.'],
                ].map(([number, title, description]) => (
                  <li key={number} className="flex gap-4">
                    <span className="text-sm font-bold text-accent-700">{number}</span>
                    <span>
                      <strong className="block text-sm text-brand-950">{title}</strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">
                모의 판정이며 법적 효력이 없습니다. 최종 자격은
                국민건강보험공단 심사에 따라 결정됩니다.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
