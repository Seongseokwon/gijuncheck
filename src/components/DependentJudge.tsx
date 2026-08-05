'use client';

/**
 * 피부양자 자격 판정 폼
 *
 * 원칙
 *  - 입력은 한 화면. 위저드로 쪼개면 이탈한다.
 *  - 계산은 클라이언트 순수 함수. 서버 왕복 없음.
 *  - 결과에 근거 조항과 기준 연도를 항상 표시.
 *  - 폼 UI 는 ./ui 의 공용 컴포넌트를 쓴다. 여기서 다시 정의하지 말 것.
 *    (중복 정의하면 금액 입력 개선 같은 변경이 이 도구에만 안 먹는다)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Field,
  FormCard,
  FormSection,
  InfoTooltip,
  MoneyInput,
  NumberInput,
  Select,
  SubmitButton,
  ZeroValueConfirmModal,
} from './ui';
import {
  emptyInput,
  emptySpouseDetails,
  judgeDependent,
  sumIncome,
  toEok,
  toManwon,
} from '@/lib/dependent/judge';
import { INCOME, PROPERTY } from '@/lib/constants/2026';
import {
  RELATION_LABEL,
  STEP_LABEL,
  type DependentInput,
  type JudgeStep,
  type MaritalStatus,
  type Relation,
  type SpouseDetails,
} from '@/lib/dependent/types';
import { ROUTES } from '@/lib/routes';
import { track } from '@/lib/analytics';
import { savePremiumHandoff } from '@/lib/premium-handoff';
import { DEPENDENT_SOURCES } from '@/lib/dependent/sources';
import { getConfidenceSummary, RELATION_GUIDANCE, STEP_GUIDANCE } from '@/lib/dependent/guidance';
import DependentEvidenceChecklist from './DependentEvidenceChecklist';

/**
 * 근거 조항 원문 링크.
 *
 * 단계별 링크는 법령 원문과 공단의 피부양자 안내를 함께 제공한다.
 * judge.ts 의 BASIS 문구와 링크를 분리해 조항명 변경이 URL 매핑을 깨뜨리지
 * 않도록 한다.
 */
const BASIS_SOURCE = DEPENDENT_SOURCES;

const INCOME_FIELDS: Array<{
  key: keyof DependentInput['income'];
  label: string;
  hint?: string;
  helpText?: string;
}> = [
  { key: 'business', label: '사업소득 (원)' },
  { key: 'wage', label: '근로소득 (원)' },
  { key: 'pension', label: '공적연금소득 (원)', hint: '개인연금은 제외' },
  {
    key: 'financial',
    label: '금융소득 (원)',
    hint: '이자 + 배당 · 1,000만원 이하면 합산 제외',
    helpText: '이자·배당 합계가 연 1,000만원 이하면 소득 합산에서 제외됩니다.',
  },
  { key: 'other', label: '기타소득 (원)' },
];

const SPOUSE_INCOME_FIELDS = INCOME_FIELDS.map((field) => ({
  ...field,
  label: `배우자 ${field.label}`,
}));

export default function DependentJudge() {
  const [input, setInput] = useState<DependentInput>(emptyInput);
  const [submitted, setSubmitted] = useState(false);
  const [showZeroValueConfirm, setShowZeroValueConfirm] = useState(false);
  const [submissionId, setSubmissionId] = useState(0);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const judgeStarted = useRef(false);

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

  const result = useMemo(() => judgeDependent(input), [input]);

  const recordJudgeStart = () => {
    if (judgeStarted.current) return;

    judgeStarted.current = true;
    track('judge_start', { entry: 'dependent_judge' });
  };

  const set = <K extends keyof DependentInput>(
    key: K,
    value: DependentInput[K],
  ) => {
    recordJudgeStart();
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const setIncome = (key: keyof DependentInput['income'], value: number) => {
    recordJudgeStart();
    setInput((prev) => ({
      ...prev,
      income: { ...prev.income, [key]: value },
    }));
  };

  const setSpouse = <K extends keyof SpouseDetails>(
    key: K,
    value: SpouseDetails[K],
  ) => {
    recordJudgeStart();
    setInput((prev) => ({
      ...prev,
      spouse: { ...(prev.spouse ?? emptySpouseDetails()), [key]: value },
    }));
  };

  const setSpouseIncome = (key: keyof SpouseDetails['income'], value: number) => {
    recordJudgeStart();
    setInput((prev) => ({
      ...prev,
      spouse: {
        ...(prev.spouse ?? emptySpouseDetails()),
        income: {
          ...(prev.spouse?.income ?? emptySpouseDetails().income),
          [key]: value,
        },
      },
    }));
  };

  const maritalStatus: MaritalStatus =
    input.maritalStatus ?? (input.married ? 'married' : 'single');
  const needsSpouseDetails = maritalStatus === 'married' && input.relation !== 'spouse';
  const spouse = input.spouse ?? emptySpouseDetails();

  const isSibling = input.relation === 'sibling';
  const needsSiblingIncomeFlag =
    !input.cohabiting &&
    (input.relation === 'linealAscendant' ||
      input.relation === 'spouseAscendant');
  const relationGuidance = RELATION_GUIDANCE[input.relation];
  const confidence = getConfidenceSummary(input, result);
  const needsStepConfirmation = (step: JudgeStep) =>
    confidence.level === 'verify' &&
    ((step === 'income' &&
      (input.businessRegistered || result.totalIncome >= INCOME.TOTAL_LIMIT)) ||
      (step === 'property' && input.propertyTaxBase >= PROPERTY.SAFE_LIMIT));

  const zeroValueFields = [
    ...INCOME_FIELDS.filter((field) => input.income[field.key] === 0).map(
      (field) => field.label,
    ),
    ...(input.propertyTaxBase === 0 ? ['재산세 과세표준'] : []),
    ...(needsSpouseDetails
      ? [
          ...SPOUSE_INCOME_FIELDS.filter((field) => spouse.income[field.key] === 0).map(
            (field) => field.label,
          ),
          ...(spouse.propertyTaxBase === 0 ? ['배우자 재산세 과세표준'] : []),
        ]
      : []),
  ];
  const nothingEntered =
    INCOME_FIELDS.every((field) => input.income[field.key] === 0) &&
    input.propertyTaxBase === 0 &&
    (!needsSpouseDetails ||
      (SPOUSE_INCOME_FIELDS.every((field) => spouse.income[field.key] === 0) &&
        spouse.propertyTaxBase === 0));

  const completeJudge = () => {
    recordJudgeStart();
    setSubmitted(true);
    setSubmissionId((current) => current + 1);
    // 어느 요건에서 걸리는지가 다음 가이드 주제를 정해준다.
    // 금액은 분석 이벤트로 보내지 않는다 — 보험료 계산기 핸드오프는 같은 탭에만 임시 보관한다.
    track('judge_complete', {
      eligible: result.eligible,
      failed_at: result.failedAt,
      relation: input.relation,
      business_registered: input.businessRegistered,
    });
  };

  const requestJudge = () => {
    if (nothingEntered) {
      setShowZeroValueConfirm(true);
      return;
    }

    completeJudge();
  };

  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      {/* ---------- 입력 ---------- */}
      <FormCard
        title="피부양자 등록 전 기준 확인"
        description="관계·소득·재산 정보를 차례로 입력하면 등록 전에 확인할 기준과 근거를 함께 볼 수 있습니다."
      >
        <FormSection number="1" title="누구를 피부양자로 등록하나요?">
          <div className="grid gap-5 sm:grid-cols-2">
          <Field label="가입자와의 관계">
            <Select
              value={input.relation}
              onChange={(v) => set('relation', v as Relation)}
              options={(Object.keys(RELATION_LABEL) as Relation[]).map((r) => ({
                value: r,
                label: RELATION_LABEL[r],
              }))}
            />
          </Field>

          <Field label="동거 여부">
            <Select
              value={input.cohabiting ? 'y' : 'n'}
              onChange={(v) => set('cohabiting', v === 'y')}
              options={[
                { value: 'y', label: '동거' },
                { value: 'n', label: '비동거' },
              ]}
            />
          </Field>

          {isSibling && (
            <Field label="만 나이" hint="형제자매만 판정에 사용">
              <NumberInput
                value={input.age}
                onChange={(v) => set('age', v)}
                min={0}
                max={120}
              />
            </Field>
          )}

          <Field label="혼인 여부">
            <Select
              value={maritalStatus}
              onChange={(v) => {
                const status = v as MaritalStatus;
                recordJudgeStart();
                setInput((prev) => ({
                  ...prev,
                  maritalStatus: status,
                  married: status === 'married',
                }));
              }}
              options={[
                { value: 'single', label: '미혼' },
                { value: 'married', label: '기혼' },
                { value: 'divorcedOrWidowed', label: '이혼·사별 (공단 확인 필요)' },
              ]}
            />
          </Field>

          <Field label="장애인 · 국가유공상이자">
            <Select
              value={input.disabled ? 'y' : 'n'}
              onChange={(v) => set('disabled', v === 'y')}
              options={[
                { value: 'n', label: '해당 없음' },
                { value: 'y', label: '해당' },
              ]}
            />
          </Field>

          {needsSiblingIncomeFlag && (
            <Field
              label="대상자와 동거하는 형제자매의 소득"
              hint="비동거 직계존속 판정에 사용"
            >
              <Select
                value={input.cohabitingSiblingHasIncome ? 'y' : 'n'}
                onChange={(v) => set('cohabitingSiblingHasIncome', v === 'y')}
                options={[
                  { value: 'n', label: '없음 (또는 동거 형제자매 없음)' },
                  { value: 'y', label: '있음' },
                ]}
              />
            </Field>
          )}
          </div>

          <aside
            className="mt-5 rounded-xl border border-accent-200 bg-accent-50/60 p-4"
            aria-live="polite"
            aria-label={`${relationGuidance.title} 관계별로 먼저 확인할 기준`}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-950">
                  {relationGuidance.title} 관계별로 먼저 확인할 기준
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {relationGuidance.summary}
                </p>
              </div>
              <InfoTooltip placement="end">
                관계 요건을 먼저 확인하는 이유는 가족관계·동거·혼인 상태에 따라 다음 소득·재산
                단계로 넘어갈 수 있는 범위가 달라지기 때문입니다.
              </InfoTooltip>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
              {relationGuidance.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </aside>
        </FormSection>

        <FormSection number="2" title="연간 소득을 입력해 주세요">
          <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">
            사업·근로·공적연금·금융·기타소득을 입력합니다. 개인연금은 포함하지 않습니다.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INCOME_FIELDS.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                hint={f.hint}
                helpText={f.helpText}
              >
                <MoneyInput
                  value={input.income[f.key]}
                  onChange={(v) => setIncome(f.key, v)}
                />
              </Field>
            ))}
          </div>
          <p className="mt-5 flex items-center justify-between rounded-[11px] bg-canvas px-4 py-3 text-sm text-slate-600">
            <span>현재 합산소득</span>
            <strong className="text-base font-extrabold text-brand-950">{toManwon(result.totalIncome)}</strong>
          </p>
        </FormSection>

        {needsSpouseDetails && (
          <FormSection number="3" title="배우자의 소득·재산도 확인해 주세요">
            <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">
              기혼 피부양자는 대상자 본인뿐 아니라 배우자도 소득·재산 요건을 충족해야 합니다. 두 사람의
              소득을 단순히 한 사람의 소득으로 합산하는 것이 아니라, 각각의 기준을 확인합니다.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SPOUSE_INCOME_FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  hint={f.hint}
                  helpText={f.helpText}
                >
                  <MoneyInput
                    value={spouse.income[f.key]}
                    onChange={(v) => setSpouseIncome(f.key, v)}
                  />
                </Field>
              ))}
            </div>
            <p className="mt-5 flex items-center justify-between rounded-[11px] bg-canvas px-4 py-3 text-sm text-slate-600">
              <span>배우자 합산소득</span>
              <strong className="text-base font-extrabold text-brand-950">
                {toManwon(sumIncome(spouse.income))}
              </strong>
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="배우자 사업자등록">
                <Select
                  value={spouse.businessRegistered ? 'y' : 'n'}
                  onChange={(v) => setSpouse('businessRegistered', v === 'y')}
                  options={[
                    { value: 'n', label: '없음' },
                    { value: 'y', label: '있음' },
                  ]}
                />
              </Field>
              <Field label="배우자 장애인 · 국가유공상이자">
                <Select
                  value={spouse.disabled ? 'y' : 'n'}
                  onChange={(v) => setSpouse('disabled', v === 'y')}
                  options={[
                    { value: 'n', label: '해당 없음' },
                    { value: 'y', label: '해당' },
                  ]}
                />
              </Field>
              <Field
                label="배우자 재산세 과세표준 (원)"
                hint="실거래가·공시가격 아님"
                helpText="실거래가·공시가격이 아니라 지방세 재산세 과세표준을 입력합니다."
              >
                <MoneyInput
                  value={spouse.propertyTaxBase}
                  onChange={(v) => setSpouse('propertyTaxBase', v)}
                  max={999_900_000_000}
                />
              </Field>
            </div>
          </FormSection>
        )}

        <FormSection number={needsSpouseDetails ? '4' : '3'} title="사업자등록과 재산을 확인해 주세요">
          <div className="grid gap-5 sm:grid-cols-2">
          <Field label="사업자등록">
            <Select
              value={input.businessRegistered ? 'y' : 'n'}
              onChange={(v) => set('businessRegistered', v === 'y')}
              options={[
                { value: 'n', label: '없음' },
                { value: 'y', label: '있음' },
              ]}
            />
          </Field>

          <Field
            label="재산세 과세표준 (원)"
            hint="실거래가·공시가격 아님"
            helpText="실거래가·공시가격이 아니라 지방세 재산세 과세표준을 입력합니다."
          >
            <MoneyInput
              value={input.propertyTaxBase}
              onChange={(v) => set('propertyTaxBase', v)}
              max={999_900_000_000}
            />
          </Field>
          </div>
        </FormSection>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <SubmitButton
            onClick={requestJudge}
          >
            내 자격 판정하기
          </SubmitButton>
          <p className="mt-3 text-center text-sm text-slate-600">
            입력값은 브라우저 안에서만 계산되며 서버로 전송되지 않습니다.
          </p>
        </div>
      </FormCard>

      {showZeroValueConfirm && (
        <ZeroValueConfirmModal
          fields={zeroValueFields}
          onCancel={() => setShowZeroValueConfirm(false)}
          onConfirm={() => {
            setShowZeroValueConfirm(false);
            completeJudge();
          }}
        />
      )}

      {/*
        ---------- 결과 ----------
        완전 무채색 판정 (docs/design-decisions/ADR-001·ADR-002).
        인정/탈락을 emerald/rose 색으로 구분하지 않는다. 구분은 ✓/✕ 기호와
        텍스트로만 전달한다 — 법적 리스크 비평이 "색이 결론을 곁눈질만으로
        확신시킨다"고 지적한 지점을 없앤 것이다.
      */}
      {submitted && (
        <section
          role="status"
          aria-live="off"
          data-testid="dependent-result"
          aria-labelledby="dependent-result-title"
          className="w-full min-w-0 max-w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="min-w-0 border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-7">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2
              id="dependent-result-title"
              ref={resultHeadingRef}
              tabIndex={-1}
              aria-live="polite"
              aria-atomic="true"
              className="min-w-0 max-w-full scroll-mt-28 text-xl font-extrabold tracking-tight text-brand-950 outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
            >
              {result.eligible
                ? '피부양자 자격이 인정될 것으로 보입니다'
                : `${STEP_LABEL[result.failedAt!]}에서 탈락할 것으로 보입니다`}
            </h2>
            <span className="rounded-full border border-slate-400 bg-white px-3 py-1 text-xs font-bold text-slate-700">
              {confidence.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-700">{confidence.detail}</p>

          <p className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
            입력한 조건과 2026년 기준으로 계산한 참고 결과입니다.{' '}
            <strong className="font-semibold text-brand-950">
              최종 자격은 국민건강보험공단 심사에 따라 결정됩니다.
            </strong>
          </p>

          {/* 입력값 요약 — 결론과 같은 시야에 둔다 (ADR-001 결과 화면 순서 결정) */}
          <p className="mt-4 text-sm text-slate-600">
            확인에 사용한 입력 · 합산소득{' '}
            <strong className="font-semibold text-slate-900">
              {toManwon(result.totalIncome)}
            </strong>{' '}
            · 재산세 과세표준{' '}
            <strong className="font-semibold text-slate-900">
              {toEok(input.propertyTaxBase)}
            </strong>
          </p>

          <a
            href="#evidence-checklist-title"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm font-bold text-brand-900 underline underline-offset-4 hover:border-accent-700 hover:text-accent-700"
          >
            확인 자료·공단 문의 질문 보기 ↓
          </a>

          </div>
          <ol className="min-w-0 space-y-4 px-5 py-6 sm:px-7">
            {result.steps.map((s) => (
              <li
                key={s.step}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white"
                    aria-hidden
                  >
                    {s.passed ? '✓' : '✕'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {STEP_LABEL[s.step]}
                    <span className="sr-only">
                      {s.passed ? ' 통과' : ' 탈락'}
                      {needsStepConfirmation(s.step) ? ' 추가 확인 필요' : ''}
                    </span>
                  </span>
                  {needsStepConfirmation(s.step) && (
                    <span className="rounded-full border border-slate-400 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      추가 확인
                    </span>
                  )}
                  <InfoTooltip>{STEP_GUIDANCE[s.step].why}</InfoTooltip>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {s.message}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  다음 확인 · {STEP_GUIDANCE[s.step].next}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  근거 ·{' '}
                  <a
                    href={BASIS_SOURCE[s.step].law.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-700 underline underline-offset-2 hover:text-accent-600"
                  >
                    {s.basis}
                    <span aria-hidden> ↗</span>
                    <span className="sr-only"> (새 창에서 열림)</span>
                  </a>
                  <span aria-hidden> · </span>
                  <a
                    href={BASIS_SOURCE[s.step].nhis.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-700 underline underline-offset-2 hover:text-accent-600"
                  >
                    공단 안내
                    <span aria-hidden> ↗</span>
                    <span className="sr-only"> (새 창에서 열림)</span>
                  </a>
                </p>
              </li>
            ))}
          </ol>

          <DependentEvidenceChecklist input={input} result={result} />

          {/*
            탈락 시 "그래서 얼마 내나"로 이어지는 동선.
            입력값은 같은 브라우저 탭의 sessionStorage로만 임시 전달한다.
            보험료 페이지가 준비되기 전에는 링크를 노출하지 않는다.
          */}
          {!result.eligible && ROUTES.regionalPremium.ready && (
            <a
              href={ROUTES.regionalPremium.path}
              onClick={() =>
                savePremiumHandoff(
                  'dependent-judge',
                  input.income,
                  input.propertyTaxBase,
                )
              }
              className="mx-5 mb-6 block min-h-[48px] rounded-xl bg-brand-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-800 sm:mx-7"
            >
              그러면 보험료는 얼마인가요 →
            </a>
          )}

        </section>
      )}
    </div>
  );
}
