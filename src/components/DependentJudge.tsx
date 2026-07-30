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

import { useMemo, useState } from 'react';
import {
  Card,
  Field,
  MoneyInput,
  NumberInput,
  Select,
  SubmitButton,
} from './ui';
import { emptyInput, judgeDependent, toManwon } from '@/lib/dependent/judge';
import {
  RELATION_LABEL,
  STEP_LABEL,
  type DependentInput,
  type Relation,
} from '@/lib/dependent/types';
import { DISCLAIMER } from '@/lib/constants/2026';
import { ROUTES } from '@/lib/routes';

const INCOME_FIELDS: Array<{
  key: keyof DependentInput['income'];
  label: string;
  hint?: string;
}> = [
  { key: 'business', label: '사업소득' },
  { key: 'wage', label: '근로소득' },
  { key: 'pension', label: '공적연금소득', hint: '개인연금은 제외' },
  {
    key: 'financial',
    label: '금융소득',
    hint: '이자 + 배당 · 1,000만원 이하면 합산 제외',
  },
  { key: 'other', label: '기타소득' },
];

export default function DependentJudge() {
  const [input, setInput] = useState<DependentInput>(emptyInput);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => judgeDependent(input), [input]);

  const set = <K extends keyof DependentInput>(
    key: K,
    value: DependentInput[K],
  ) => setInput((prev) => ({ ...prev, [key]: value }));

  const setIncome = (key: keyof DependentInput['income'], value: number) =>
    setInput((prev) => ({
      ...prev,
      income: { ...prev.income, [key]: value },
    }));

  const isSibling = input.relation === 'sibling';
  const needsSiblingIncomeFlag =
    !input.cohabiting &&
    (input.relation === 'linealAscendant' ||
      input.relation === 'spouseAscendant');

  return (
    <div className="space-y-8">
      {/* ---------- 입력 ---------- */}
      <Card title="대상자 정보">
        <div className="grid gap-4 sm:grid-cols-2">
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
              value={input.married ? 'y' : 'n'}
              onChange={(v) => set('married', v === 'y')}
              options={[
                { value: 'n', label: '미혼' },
                { value: 'y', label: '기혼' },
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

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            연간 소득 <span className="font-normal text-slate-400">(원)</span>
          </h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCOME_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <MoneyInput
                  value={input.income[f.key]}
                  onChange={(v) => setIncome(f.key, v)}
                />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            합산소득 {toManwon(result.totalIncome)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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

          <Field label="재산세 과세표준" hint="실거래가·공시가격 아님">
            <MoneyInput
              value={input.propertyTaxBase}
              onChange={(v) => set('propertyTaxBase', v)}
            />
          </Field>
        </div>

        <SubmitButton onClick={() => setSubmitted(true)}>
          자격 판정하기
        </SubmitButton>
      </Card>

      {/* ---------- 결과 ---------- */}
      {submitted && (
        <section
          // 버튼을 눌러 결과가 나타나므로 스크린리더에 변화를 알린다
          role="status"
          aria-live="polite"
          className={
            'rounded-lg border p-5 ' +
            (result.eligible
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50')
          }
        >
          <p className="text-lg font-bold text-slate-900">
            {result.eligible
              ? '피부양자 자격이 인정될 것으로 보입니다'
              : `${STEP_LABEL[result.failedAt!]}에서 탈락합니다`}
          </p>

          <ol className="mt-4 space-y-3">
            {result.steps.map((s) => (
              <li
                key={s.step}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ' +
                      (s.passed ? 'bg-emerald-500' : 'bg-rose-500')
                    }
                    aria-hidden
                  >
                    {s.passed ? '✓' : '✕'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {STEP_LABEL[s.step]}
                    <span className="sr-only">
                      {s.passed ? ' 통과' : ' 탈락'}
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {s.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">근거 · {s.basis}</p>
              </li>
            ))}
          </ol>

          {/*
            탈락 시 "그래서 얼마 내나"로 이어지는 동선.
            입력값을 쿼리로 넘겨 다시 타이핑하지 않게 한다.
            보험료 페이지가 준비되기 전에는 링크를 노출하지 않는다.
          */}
          {!result.eligible && ROUTES.regionalPremium.ready && (
            <a
              href={`${ROUTES.regionalPremium.path}?income=${result.totalIncome}&property=${input.propertyTaxBase}`}
              className="mt-4 block rounded-md bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              그러면 보험료는 얼마인가요 →
            </a>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {DISCLAIMER}
          </p>
        </section>
      )}
    </div>
  );
}
