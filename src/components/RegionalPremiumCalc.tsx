'use client';

/**
 * 지역가입자 보험료 계산
 *
 * 주의할 점 두 가지
 *  - 소득은 종류별 반영률이 다르므로(근로·연금 50%) 항목을 분리해서 입력받는다.
 *    합쳐서 받으면 연금 수령자 보험료가 2배로 나온다.
 *  - 재산은 과세표준과 임차주택 전월세를 분리해 입력받고 공단 공식 계산식으로 합산한다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
  longTermCareRatio,
} from '@/lib/premium/regional';
import {
  EMPTY_PREMIUM_INCOME,
  type PremiumIncome,
} from '@/lib/premium/types';
import { DISCLAIMER, RATE, RURAL_REDUCTION } from '@/lib/constants/2026';
import { toPercent, wonExact } from '@/lib/format';
import {
  propertyAmountFor,
  rentEvaluationAmount,
} from '@/lib/constants/property-score-table';
import { ROUTES } from '@/lib/routes';
import { track } from '@/lib/analytics';
import {
  consumePremiumHandoff,
  savePremiumHandoff,
} from '@/lib/premium-handoff';

type IncomeField = {
  key: keyof PremiumIncome;
  label: string;
  hint?: string;
  helpText?: string;
};

const FULL_FIELDS: IncomeField[] = [
  { key: 'business', label: '사업소득' },
  {
    key: 'financial',
    label: '금융소득',
    hint: '이자 + 배당 · 지역보험료에 100% 반영',
  },
  { key: 'other', label: '기타소득' },
  {
    key: 'housingRental',
    label: '분리과세 주택임대소득',
    hint: '총수입이 아니라 소득금액',
    helpText:
      '총수입금액에서 필요경비와 기본공제를 뺀 소득금액을 입력하세요. 공단이 사업소득과 별도 칸으로 받지만 보험료에는 똑같이 100% 반영됩니다. 피부양자 자격에서는 규칙이 달라, 금액과 무관하게 주택임대소득이 있으면 피부양자가 될 수 없습니다.',
  },
];

const HALF_FIELDS: IncomeField[] = [
  { key: 'wage', label: '근로소득' },
  { key: 'pension', label: '공적연금소득', hint: '개인연금 제외' },
];

export default function RegionalPremiumCalc() {
  const [income, setIncome] = useState<PremiumIncome>(EMPTY_PREMIUM_INCOME);
  const [property, setProperty] = useState(0);
  const [rentEligible, setRentEligible] = useState(false);
  const [rentDeposit, setRentDeposit] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [ruralResident, setRuralResident] = useState(false);
  const [registeredFarmer, setRegisteredFarmer] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(0);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  /** 판정기에서 넘어왔는지. 퍼널이 작동하는지 보려고 이벤트에 담는다 */
  const [fromJudge, setFromJudge] = useState(false);

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

  // 판정기에서 넘어온 값이 있으면 같은 탭의 임시 핸드오프를 소비한다.
  useEffect(() => {
    const handoff = consumePremiumHandoff();
    if (handoff) {
      setIncome(handoff.income);
      setProperty(handoff.propertyTaxBase);
      setSubmitted(true);
      setFromJudge(handoff.source === 'dependent-judge');
    }
  }, []);

  // 화면에 "현재 평가금액"으로 보여주는 값. 반영 여부와는 별개다.
  const rentAmount = useMemo(
    () => (rentEligible ? rentEvaluationAmount(rentDeposit, monthlyRent) : 0),
    [rentEligible, rentDeposit, monthlyRent],
  );
  // 주택·건물 보유 시 전월세 미반영 규칙은 propertyAmountFor 가 갖는다.
  // 여기서 직접 더하지 말 것 — 그 규칙이 체크박스 라벨에만 있던 것이
  // 2026-08-06 공단 대조에서 드러난 문제였다.
  const propertyAmount = useMemo(
    () =>
      propertyAmountFor({
        taxBase: property,
        rentDeposit,
        monthlyRent,
        ownsHouseOrBuilding: !rentEligible,
      }),
    [property, rentDeposit, monthlyRent, rentEligible],
  );
  const base = useMemo(() => incomeBaseForPremium(income), [income]);
  const result = useMemo(
    () =>
      calculateRegionalPremium(income, propertyAmount, {
        ruralResident,
        registeredFarmer,
      }),
    [income, propertyAmount, ruralResident, registeredFarmer],
  );

  const set = (key: keyof PremiumIncome, v: number) =>
    setIncome((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      <FormCard
        title="지역가입자 보험료 계산"
        description="소득과 재산을 입력하면 적용한 기준과 월 보험료 구성을 함께 보여드립니다."
      >
        <FormSection number="1" title="연간 소득을 입력해 주세요">
        <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">
          소득 종류에 따라 반영률이 다릅니다. 사업·금융·기타소득과 분리과세
          주택임대소득은 100%,
          <strong className="font-semibold text-slate-700">
            {' '}
            근로·연금소득은 50%
          </strong>
          만 반영됩니다. 금융소득(이자·배당)은 입력한 금액을 전액 반영합니다.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FULL_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={`${f.label} (원, 100% 반영)`}
              hint={f.hint}
              helpText={f.helpText}
            >
              <MoneyInput
                value={income[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            </Field>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {HALF_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (원, 50% 반영)`} hint={f.hint}>
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
          label="재산세 과세표준 합계 (원)"
          hint="주택·건물·토지·선박·항공기 과세표준 합계"
        >
          <MoneyInput
            value={property}
            onChange={setProperty}
            max={999_900_000_000}
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
            <Field label="전세·월세 보증금 (원)">
              <MoneyInput value={rentDeposit} onChange={setRentDeposit} />
            </Field>
            <Field label="월세 (원)">
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

        <label className="mt-5 flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={ruralResident}
            onChange={(event) => setRuralResident(event.target.checked)}
            className="h-5 w-5 accent-brand-900"
          />
          군·도농복합시의 읍·면지역에 거주합니다
        </label>

        {ruralResident && (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              농어촌 지역 거주 세대는 보험료의{' '}
              <strong className="font-semibold text-slate-700">
                {RURAL_REDUCTION.RATE * 100}%
              </strong>
              가 경감됩니다. 주민등록 주소지 기준으로 공단이 일괄 적용하며 별도
              신청이 필요하지 않습니다.
            </p>

            {income.business > RURAL_REDUCTION.BUSINESS_INCOME_LIMIT && (
              <label className="mt-3 flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={registeredFarmer}
                  onChange={(event) => setRegisteredFarmer(event.target.checked)}
                  className="h-5 w-5 accent-brand-900"
                />
                세대에 농어업인으로 등록된 가입자가 있습니다
              </label>
            )}
          </>
        )}

        </FormSection>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
        <SubmitButton
          onClick={() => {
            setSubmitted(true);
            setSubmissionId((current) => current + 1);
            track('premium_calculate', {
              has_property: propertyAmount > 0,
              limit_applied: result.limitApplied ?? 'none',
              from_judge: fromJudge,
            });
          }}
        >
          보험료 계산하기
        </SubmitButton>
        <p className="mt-3 text-center text-sm text-slate-600">입력값은 브라우저 안에서만 계산되며 서버로 전송되지 않습니다.</p>
        </div>
      </FormCard>

      {submitted && (
        <section
          role="status"
          aria-live="off"
          data-testid="regional-result"
          aria-labelledby="regional-result-title"
          className="space-y-5 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <h2
            id="regional-result-title"
            ref={resultHeadingRef}
            tabIndex={-1}
            aria-live="polite"
            aria-atomic="true"
            className="scroll-mt-28 text-2xl font-extrabold tracking-tight text-brand-950 outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
          >
            월 보험료
          </h2>

          <ReferenceOnlyNotice crossChecked={result.crossChecked} />

          <div className="divide-y divide-slate-100">
            {/* 공단 화면과 같이 하한·상한을 적용한 값을 표시한다.
                원값을 쓰면 "0원 + 139,378원 = 159,530원"처럼 표에서 덧셈이 안 맞는다. */}
            <ResultRow
              label="소득보험료"
              hint={
                result.incomePortionApplied !== result.incomePortion
                  ? `소득월액 × ${toPercent(RATE.HEALTH)} = ${won(result.incomePortion)} → 하한·상한 적용`
                  : `소득월액 × ${toPercent(RATE.HEALTH)}`
              }
              value={won(result.incomePortionApplied)}
            />
            <ResultRow
              label="재산보험료"
              hint={
                result.propertyScore === 0
                  ? '기본공제 후 0원 → 재산점수 0점'
                  : result.propertyGrade
                  ? `${result.propertyGrade}등급 ${result.propertyScore}점 × ${wonExact(RATE.PROPERTY_POINT_VALUE)}`
                  : undefined
              }
              value={won(result.propertyPortion)}
            />
            <ResultRow label="건강보험료" value={won(result.health)} />
            {result.ruralReduction > 0 && (
              <ResultRow
                label={`농어촌 경감 (${RURAL_REDUCTION.RATE * 100}%)`}
                hint="건강보험료에서 차감합니다"
                value={`− ${won(result.ruralReduction)}`}
              />
            )}
            <ResultRow
              label="장기요양보험료"
              hint={
                result.ruralReduction > 0
                  ? `경감 후 건강보험료 × ${toPercent(longTermCareRatio())}`
                  : `건강보험료 × ${toPercent(longTermCareRatio())}`
              }
              value={won(result.longTermCare)}
            />
            <div className="pt-2">
              <ResultRow label="합계" value={won(result.total)} strong />
            </div>
          </div>

          {result.ruralReductionBlockedReason && (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-slate-700">
              {result.ruralReductionBlockedReason}
              <br />
              <span className="text-slate-600">
                공단 모의계산기는 이 조건을 확인하지 않고 경감을 적용합니다. 실제
                경감 여부는 국민건강보험공단에 확인해 주세요.
              </span>
            </p>
          )}

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
              href={ROUTES.voluntaryContinuation.path}
              onClick={() =>
                savePremiumHandoff('regional-premium', income, propertyAmount)
              }
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
