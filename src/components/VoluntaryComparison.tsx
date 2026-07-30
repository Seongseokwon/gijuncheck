'use client';

/**
 * 지역가입자 vs 임의계속가입 비교
 *
 * 이 도구의 핵심은 금액 두 개를 나란히 놓고 유리한 쪽을 명확히 말해주는 것.
 * 그리고 "90일 이내 신고" 안내 — 이 한 줄이 실제로 돈을 아껴준다.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Field,
  MoneyInput,
  NumberInput,
  ReferenceOnlyNotice,
  ResultRow,
  SubmitButton,
  won,
} from './ui';
import { compareAfterRetirement } from '@/lib/premium/regional';
import type { Income } from '@/lib/dependent/types';
import {
  DISCLAIMER,
  VOLUNTARY_CONTINUATION,
} from '@/lib/constants/2026';

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

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = Number(q.get('property'));
    if (Number.isFinite(p) && p > 0) setProperty(p);
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

  return (
    <div className="space-y-8">
      <Card title="퇴직 후 상황">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="퇴직 전 12개월 보수월액 평균" hint="세전 월급 평균">
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
            />
          </Field>
          <Field
            label="재산금액 합계"
            hint="재산세 과세표준 기준"
          >
            <MoneyInput
              value={property}
              onChange={setProperty}
              step={1_000_000}
            />
          </Field>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            퇴직 후 연간 소득{' '}
            <span className="font-normal text-slate-400">
              (근로·연금은 50% 반영)
            </span>
          </h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Field label="연금소득 (50%)">
              <MoneyInput
                value={income.pension}
                onChange={(v) => set('pension', v)}
              />
            </Field>
            <Field label="사업소득 (100%)">
              <MoneyInput
                value={income.business}
                onChange={(v) => set('business', v)}
              />
            </Field>
            <Field label="금융소득 (100%)">
              <MoneyInput
                value={income.financial}
                onChange={(v) => set('financial', v)}
              />
            </Field>
          </div>
        </div>

        <SubmitButton onClick={() => setSubmitted(true)}>
          어느 쪽이 유리한지 비교하기
        </SubmitButton>
      </Card>

      {submitted && (
        <>
          {recommendation === 'notEligible' ? (
            <section className="rounded-lg border border-rose-200 bg-rose-50 p-5">
              <p className="text-base font-bold text-slate-900">
                임의계속가입을 신청할 수 없습니다
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {result.notes[0]}
              </p>
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
                <ResultRow
                  label="지역가입자 보험료"
                  value={won(regional.total)}
                  strong
                />
              </div>
            </section>
          ) : (
            <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-5">
              <p className="text-lg font-bold text-slate-900">
                {voluntaryWins ? '임의계속가입' : '지역가입자'}가 월{' '}
                {won(Math.abs(result.monthlySaving))} 유리합니다
              </p>

              <ReferenceOnlyNotice crossChecked={regional.crossChecked} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={
                    'rounded-md border p-4 ' +
                    (voluntaryWins
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-emerald-300 bg-emerald-50')
                  }
                >
                  <p className="text-sm font-semibold text-slate-700">
                    지역가입자
                  </p>
                  <p
                    className={
                      'mt-1 ' +
                      (voluntaryWins
                        ? 'text-lg text-slate-500'
                        : 'text-2xl font-bold text-slate-900')
                    }
                  >
                    {won(regional.total)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    소득 {won(regional.incomePortion)} + 재산{' '}
                    {won(regional.propertyPortion)}
                    {regional.propertyGrade &&
                      ` (${regional.propertyGrade}등급)`}
                  </p>
                </div>

                <div
                  className={
                    'rounded-md border p-4 ' +
                    (voluntaryWins
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50')
                  }
                >
                  <p className="text-sm font-semibold text-slate-700">
                    임의계속가입
                  </p>
                  <p
                    className={
                      'mt-1 ' +
                      (voluntaryWins
                        ? 'text-2xl font-bold text-slate-900'
                        : 'text-lg text-slate-500')
                    }
                  >
                    {won(voluntary!.total)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    재산 미반영 · 보수월액의 절반 부담
                  </p>
                </div>
              </div>

              {voluntaryWins && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-slate-800">
                    최대 {result.maxMonths}개월 유지하면 총{' '}
                    <strong className="font-bold">
                      {won(result.totalSaving)}
                    </strong>{' '}
                    절약됩니다.
                  </p>
                </div>
              )}

              <div className="rounded-md border border-slate-900 bg-slate-900 px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  퇴직 후 {result.applyDeadlineDays}일 이내에 신고하세요
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  기한 내 신고하면 퇴사일로 소급 인정됩니다. 놓치면 그 기간의
                  지역보험료를 그대로 내야 합니다.
                </p>
              </div>

              <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                {result.notes.slice(1).map((n) => (
                  <li key={n} className="text-xs leading-relaxed text-slate-500">
                    · {n}
                  </li>
                ))}
              </ul>

              <p className="text-xs leading-relaxed text-slate-500">
                {DISCLAIMER}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
