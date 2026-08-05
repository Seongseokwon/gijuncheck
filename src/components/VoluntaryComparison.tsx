'use client';

/**
 * 지역가입자 vs 임의계속가입 비교
 *
 * 이 도구의 핵심은 금액 두 개를 나란히 놓고 유리한 쪽을 명확히 말해주는 것.
 * 그리고 신청 기한 안내 — 이 한 줄이 실제로 돈을 아껴준다.
 *
 * 신청 기한은 "퇴직 후 90일"이 아니다. 2026년 기준 올바른 기한은
 * VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE 참조 — 고정 일수가 아니라
 * 최초 지역보험료 납부기한부터 2개월이므로 숫자로 카운트다운하지 않는다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Field,
  FormCard,
  FormSection,
  MoneyInput,
  NumberInput,
  ReferenceOnlyNotice,
  ResultRow,
  SubmitButton,
  won,
} from './ui';
import { josa } from '@/lib/format';
import { compareAfterRetirement } from '@/lib/premium/regional';
import type { Income } from '@/lib/dependent/types';
import {
  DISCLAIMER,
  VOLUNTARY_CONTINUATION,
} from '@/lib/constants/2026';
import { track } from '@/lib/analytics';
import { consumePremiumHandoff } from '@/lib/premium-handoff';

const emptyIncome: Income = {
  business: 0,
  wage: 0,
  pension: 0,
  financial: 0,
  other: 0,
};

export default function VoluntaryComparison() {
  const [income, setIncome] = useState<Income>(emptyIncome);
  const [property, setProperty] = useState(0);
  const [avgWage, setAvgWage] = useState(3_000_000);
  const [months, setMonths] = useState<number>(
    VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS,
  );
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(0);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!submissionId) return;
    const timer = window.setTimeout(() => {
      const heading = resultHeadingRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'start', behavior: 'auto' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [submissionId]);

  useEffect(() => {
    const handoff = consumePremiumHandoff();
    if (!handoff) return;

    setIncome(handoff.income);
    setProperty(handoff.propertyTaxBase);
  }, []);

  const result = useMemo(
    () =>
      compareAfterRetirement({
        income,
        propertyAmount: property,
        avgMonthlyWage: avgWage,
        insuredMonthsInLookback: months,
      }),
    [income, property, avgWage, months],
  );

  const set = (key: keyof Income, v: number) =>
    setIncome((prev) => ({ ...prev, [key]: v }));

  const { regional, voluntary, recommendation } = result;
  const voluntaryWins = recommendation === 'voluntary';
  const isTie = recommendation === 'tie';

  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      <FormCard
        title="퇴직 후 보험료 비교"
        description="퇴직 전 보수와 퇴직 후 소득·재산을 기준으로 두 선택지를 비교합니다."
      >
        <FormSection number="1" title="퇴직 전 상황을 입력해 주세요">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="퇴직 전 12개월 보수월액 평균 (원)" hint="세전 월급 평균">
            <MoneyInput value={avgWage} onChange={setAvgWage} />
          </Field>
          <Field
            label="퇴직 전 18개월 중 직장가입 개월수"
            hint="12개월 이상이어야 신청 가능"
          >
            <NumberInput
              value={months}
              onChange={(value) =>
                setMonths(
                  Math.min(
                    VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS,
                    Math.max(0, value),
                  ),
                )
              }
              min={0}
              max={VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}
              unit="개월"
            />
          </Field>
          <Field
            label="재산금액 합계 (원)"
            hint="재산세 과세표준 기준"
          >
            <MoneyInput
              value={property}
              onChange={setProperty}
              max={999_900_000_000}
            />
          </Field>
        </div>
        </FormSection>

        <FormSection number="2" title="퇴직 후 소득을 입력해 주세요">
          <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">
            보수 외 소득은 연 2,000만원 초과분만 추가 반영합니다. 근로·연금소득은
            50%, 사업·금융·기타소득은 100% 반영합니다.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="근로소득 (원, 50% 반영)">
              <MoneyInput
                value={income.wage}
                onChange={(v) => set('wage', v)}
              />
            </Field>
            <Field label="연금소득 (원, 50% 반영)">
              <MoneyInput
                value={income.pension}
                onChange={(v) => set('pension', v)}
              />
            </Field>
            <Field label="사업소득 (원, 100% 반영)">
              <MoneyInput
                value={income.business}
                onChange={(v) => set('business', v)}
              />
            </Field>
            <Field label="금융소득 (원, 100% 반영)">
              <MoneyInput
                value={income.financial}
                onChange={(v) => set('financial', v)}
              />
            </Field>
            <Field label="기타소득 (원, 100% 반영)" hint="과세자료 기준">
              <MoneyInput
                value={income.other}
                onChange={(v) => set('other', v)}
              />
            </Field>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            보수 외 소득은 공단이 국세청 자료로 확인하는 종합과세 대상 소득 기준과
            달라질 수 있습니다. 비과세·일부 분리과세 소득은 실제 부과에서 제외될 수
            있으므로 최종 금액은 공단 고지서를 확인하세요.
          </p>
        </FormSection>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
        <SubmitButton
          onClick={() => {
            setSubmitted(true);
            setSubmissionId((current) => current + 1);
            track('voluntary_compare', { recommendation });
          }}
        >
          어느 쪽이 유리한지 비교하기
        </SubmitButton>
        <p className="mt-3 text-center text-sm text-slate-600">입력값은 브라우저 안에서만 계산되며 서버로 전송되지 않습니다.</p>
        </div>
      </FormCard>

      {submitted && (
        // 버튼을 눌러 결과가 나타나므로 스크린리더에 변화를 알린다
        <div
          role="status"
          aria-live="off"
          data-testid="voluntary-result"
          aria-labelledby="voluntary-result-title"
        >
          {recommendation === 'notEligible' ? (
            <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2
                id="voluntary-result-title"
                ref={resultHeadingRef}
                tabIndex={-1}
                aria-live="polite"
                aria-atomic="true"
                className="scroll-mt-28 text-xl font-extrabold tracking-tight text-brand-950 outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
              >
                임의계속가입을 신청할 수 없습니다
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {result.notes.ineligibleReason}
              </p>
              <div className="mt-5 rounded-xl bg-canvas p-4">
                <ResultRow
                  label="지역가입자 보험료"
                  value={won(regional.total)}
                  strong
                />
              </div>
            </section>
          ) : (
            <section className="space-y-5 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2
                id="voluntary-result-title"
                ref={resultHeadingRef}
                tabIndex={-1}
                aria-live="polite"
                aria-atomic="true"
                className="scroll-mt-28 text-xl font-extrabold tracking-tight text-brand-950 outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
              >
                {isTie ? (
                  <>두 제도의 월 보험료가 {won(regional.total)}으로 같습니다</>
                ) : (
                  <>
                    {josa(voluntaryWins ? '임의계속가입' : '지역가입자', '가')} 월{' '}
                    {won(Math.abs(result.monthlySaving))} 유리합니다
                  </>
                )}
                {/* 비교 결과 강조 */}
              </h2>

              <ReferenceOnlyNotice crossChecked={voluntary?.crossChecked ?? false} />
              {voluntary?.assumption && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
                  {voluntary.assumption}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={
                    'rounded-xl border border-slate-200 bg-canvas p-5 '
                  }
                >
                  <p className="text-sm font-semibold text-slate-700">
                    지역가입자
                  </p>
                  <p
                    className={
                      'mt-1 ' +
                      (voluntaryWins
                        ? 'text-lg text-slate-600'
                        : 'text-2xl font-extrabold text-brand-950')
                    }
                  >
                    {won(regional.total)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    소득 {won(regional.incomePortion)} + 재산{' '}
                    {won(regional.propertyPortion)}
                    {regional.propertyGrade
                      ? ` (${regional.propertyGrade}등급)`
                      : null}
                  </p>
                </div>

                <div
                  className={
                    'rounded-xl border border-slate-200 bg-canvas p-5 '
                  }
                >
                  <p className="text-sm font-semibold text-slate-700">
                    임의계속가입
                  </p>
                  <p
                    className={
                      'mt-1 ' +
                      (voluntaryWins
                        ? 'text-2xl font-extrabold text-brand-950'
                        : 'text-lg text-slate-600')
                    }
                  >
                    {won(voluntary!.total)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    재산 미반영 · 보수월액보험료 50% 경감
                  </p>
                  {(voluntary!.nonWageIncomePortion ?? 0) > 0 && (
                    <p className="mt-1 text-sm text-slate-600">
                      보수 외 소득보험료 추가 {won(voluntary!.nonWageIncomePortion ?? 0)}
                    </p>
                  )}
                </div>
              </div>

              {voluntaryWins && (
                <div className="rounded-xl border border-slate-200 bg-canvas px-4 py-3">
                  <p className="text-sm text-slate-800">
                    최대 {result.maxMonths}개월 유지하면 총{' '}
                    <strong className="font-bold">
                      {won(result.totalSaving)}
                    </strong>{' '}
                    절약되는 것으로 추정됩니다.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {result.totalSavingAssumption}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-brand-900 bg-brand-900 px-5 py-4">
                <p className="text-sm font-semibold text-white">
                  {result.applyDeadlineRule} 신고하세요
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  기한 내 신고하면 퇴사일로 소급 인정됩니다. 놓치면 그 기간의
                  지역보험료를 그대로 내야 합니다. 첫 지역보험료 고지서를
                  받으면 그 납부기한부터 2개월을 세면 됩니다.
                </p>
              </div>

              <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                {result.notes.general.map((n) => (
                  <li key={n} className="text-sm leading-relaxed text-slate-600">
                    · {n}
                  </li>
                ))}
              </ul>

              <p className="rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-slate-600">
                {DISCLAIMER}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
