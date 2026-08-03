'use client';

/**
 * 지역가입자 보험료 계산
 *
 * 주의할 점 두 가지
 *  - 소득은 종류별 반영률이 다르므로(근로·연금 50%) 항목을 분리해서 입력받는다.
 *    합쳐서 받으면 연금 수령자 보험료가 2배로 나온다.
 *  - 재산은 과세표준과 임차주택 전월세를 분리해 입력받고 공단 공식 계산식으로 합산한다.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Field,
  FormCard,
  FormSection,
  MoneyInput,
  ReferenceOnlyNotice,
  ResultRow,
  SubmitButton,
  won,
} from './ui';
import {
  calculateRegionalPremium,
  incomeBaseForPremium,
} from '@/lib/premium/regional';
import type { Income } from '@/lib/dependent/types';
import { DISCLAIMER } from '@/lib/constants/2026';
import { rentEvaluationAmount } from '@/lib/constants/property-score-table';
import { ROUTES } from '@/lib/routes';
import { track } from '@/lib/analytics';

const FULL_FIELDS: Array<{ key: keyof Income; label: string; hint?: string }> = [
  { key: 'business', label: '사업소득' },
  {
    key: 'financial',
    label: '금융소득',
    hint: '이자 + 배당',
  },
  { key: 'other', label: '기타소득' },
];

const HALF_FIELDS: Array<{ key: keyof Income; label: string; hint?: string }> = [
  { key: 'wage', label: '근로소득' },
  { key: 'pension', label: '공적연금소득', hint: '개인연금 제외' },
];

const emptyIncome: Income = {
  business: 0,
  wage: 0,
  pension: 0,
  financial: 0,
  other: 0,
};

export default function RegionalPremiumCalc() {
  const [income, setIncome] = useState<Income>(emptyIncome);
  const [property, setProperty] = useState(0);
  const [rentEligible, setRentEligible] = useState(false);
  const [rentDeposit, setRentDeposit] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  /** 판정기에서 넘어왔는지. 퍼널이 작동하는지 보려고 이벤트에 담는다 */
  const [fromJudge, setFromJudge] = useState(false);

  // 판정기에서 넘어온 값이 있으면 채운다. 다시 타이핑하게 만들면 이탈한다.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = Number(q.get('property'));
    if (Number.isFinite(p) && p > 0) setProperty(p);

    // 판정기는 합산소득만 넘긴다. 종류를 알 수 없으므로 반영률이 높은 쪽에
    // 넣어 과소 계산을 피한다. 사용자가 직접 항목을 옮길 수 있다.
    const inc = Number(q.get('income'));
    if (Number.isFinite(inc) && inc > 0) {
      setIncome({ ...emptyIncome, business: inc });
      setSubmitted(true);
      setFromJudge(true);
    }
  }, []);

  const rentAmount = useMemo(
    () => (rentEligible ? rentEvaluationAmount(rentDeposit, monthlyRent) : 0),
    [rentEligible, rentDeposit, monthlyRent],
  );
  const propertyAmount = property + rentAmount;
  const base = useMemo(() => incomeBaseForPremium(income), [income]);
  const result = useMemo(
    () => calculateRegionalPremium(income, propertyAmount),
    [income, propertyAmount],
  );

  const set = (key: keyof Income, v: number) =>
    setIncome((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      <FormCard
        title="지역가입자 보험료 계산"
        description="소득과 재산을 입력하면 적용한 기준과 월 보험료 구성을 함께 보여드립니다."
      >
        <FormSection number="1" title="연간 소득을 입력해 주세요">
        <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">
          소득 종류에 따라 반영률이 다릅니다. 사업·금융·기타소득은 100%,
          <strong className="font-semibold text-slate-700">
            {' '}
            근로·연금소득은 50%
          </strong>
          만 반영됩니다. 금융소득은 사업·기타소득과 함께 100% 반영됩니다. 연
          1,000만원 문턱은 피부양자 자격 판정 기준이므로 지역보험료 계산에는 적용하지
          않습니다.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          {FULL_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (100%)`} hint={f.hint}>
              <MoneyInput
                value={income[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            </Field>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {HALF_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (50%)`} hint={f.hint}>
              <MoneyInput
                value={income[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            </Field>
          ))}
        </div>

        <div className="rounded-xl bg-canvas px-4 py-3 text-sm text-slate-600">
          합산소득 {won(base.annualRaw)} → 반영 후{' '}
          <strong className="font-semibold">{won(base.annualReflected)}</strong>{' '}
          → 소득월액 {won(base.monthly)}
        </div>
        </FormSection>

        <FormSection number="2" title="재산을 입력해 주세요">
        <Field
          label="재산세 과세표준 합계"
          hint="주택·건물·토지·선박·항공기 과세표준 합계"
        >
          <MoneyInput
            value={property}
            onChange={setProperty}
          />
        </Field>
        <p className="text-sm leading-6 text-slate-600">
          실거래가나 공시가격이 아니라 <strong>재산세 과세표준</strong>입니다.
          자동차는 2024년 2월부터 보험료에 반영되지 않습니다.
        </p>

        <label className="mt-5 flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={rentEligible}
            onChange={(event) => setRentEligible(event.target.checked)}
            className="h-5 w-5 accent-brand-900"
          />
          주택·건물을 소유하지 않고 임차 중입니다
        </label>

        {rentEligible && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="전세·월세 보증금">
              <MoneyInput value={rentDeposit} onChange={setRentDeposit} />
            </Field>
            <Field label="월세">
              <MoneyInput value={monthlyRent} onChange={setMonthlyRent} />
            </Field>
            <p className="sm:col-span-2 text-sm leading-6 text-slate-600">
              공단의 공식 계산식에 따라 전월세 평가금액을{' '}
              <strong className="font-semibold text-slate-700">
                (보증금 + 월세 × 40) × 30%
              </strong>{' '}
              으로 계산해 과세표준에 더합니다. 현재 평가금액은{' '}
              <strong className="font-semibold text-slate-700">{won(rentAmount)}</strong>
              입니다.
            </p>
          </div>
        )}

        </FormSection>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
        <SubmitButton
          onClick={() => {
            setSubmitted(true);
            track('premium_calculate', {
              has_property: propertyAmount > 0,
              limit_applied: result.limitApplied ?? 'none',
              from_judge: fromJudge,
            });
          }}
        >
          보험료 계산하기
        </SubmitButton>
        <p className="mt-3 text-center text-sm text-slate-600">입력값은 브라우저 안에서만 계산되며 저장되지 않습니다.</p>
        </div>
      </FormCard>

      {submitted && (
        <section
          role="status"
          aria-live="polite"
          className="space-y-5 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">월 보험료</h2>

          <ReferenceOnlyNotice crossChecked={result.crossChecked} />

          <div className="divide-y divide-slate-100">
            <ResultRow
              label="소득보험료"
              hint={`소득월액 × 7.19%`}
              value={won(result.incomePortion)}
            />
            <ResultRow
              label="재산보험료"
              hint={
                result.propertyScore === 0
                  ? '기본공제 후 0원 → 재산점수 0점'
                  : result.propertyGrade
                  ? `${result.propertyGrade}등급 ${result.propertyScore}점 × 211.5원`
                  : undefined
              }
              value={won(result.propertyPortion)}
            />
            <ResultRow label="건강보험료" value={won(result.health)} />
            <ResultRow
              label="장기요양보험료"
              hint="건강보험료 × 13.14%"
              value={won(result.longTermCare)}
            />
            <div className="pt-2">
              <ResultRow label="합계" value={won(result.total)} strong />
            </div>
          </div>

          {result.limitApplied === 'lower' && (
            <p className="text-sm leading-6 text-slate-600">
              소득보험료 계산값이 하한액보다 낮아 <strong>소득 하한액</strong>을
              적용한 뒤 재산보험료를 더했습니다. (하한 적용 전 합계{' '}
              {won(result.healthBeforeLimit)})
            </p>
          )}
          {result.limitApplied === 'upper' && (
            <p className="text-sm leading-6 text-slate-600">
              계산 결과가 상한액을 넘어 <strong>상한 보험료</strong>가
              적용되었습니다. (계산값 {won(result.healthBeforeLimit)})
            </p>
          )}

          {ROUTES.voluntaryContinuation.ready && (
            <a
              href={`${ROUTES.voluntaryContinuation.path}?property=${propertyAmount}`}
              className="block min-h-[48px] rounded-xl bg-brand-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-800"
            >
              임의계속가입이 더 싸지 않을까요 →
            </a>
          )}

          <div className="space-y-1 border-t border-slate-100 pt-3">
            {result.basis.map((b) => (
              <p key={b} className="text-sm text-slate-600">
                근거 · {b}
              </p>
            ))}
          </div>

          <p className="rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-slate-600">{DISCLAIMER}</p>
        </section>
      )}
    </div>
  );
}
