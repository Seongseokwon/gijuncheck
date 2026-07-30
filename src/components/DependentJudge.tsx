'use client';

/**
 * 피부양자 자격 판정 폼
 *
 * 원칙
 *  - 입력은 한 화면. 위저드로 쪼개면 이탈한다.
 *  - 계산은 클라이언트 순수 함수. 서버 왕복 없음.
 *  - 결과에 근거 조항과 기준 연도를 항상 표시.
 */

import { useMemo, useState } from 'react';
import { emptyInput, judgeDependent, toManwon } from '@/lib/dependent/judge';
import {
  RELATION_LABEL,
  STEP_LABEL,
  type DependentInput,
  type Relation,
} from '@/lib/dependent/types';
import { DISCLAIMER } from '@/lib/constants/2026';

const INCOME_FIELDS: Array<{
  key: keyof DependentInput['income'];
  label: string;
  hint?: string;
}> = [
  { key: 'business', label: '사업소득' },
  { key: 'wage', label: '근로소득' },
  { key: 'pension', label: '공적연금소득', hint: '개인연금은 제외' },
  { key: 'financial', label: '금융소득', hint: '이자 + 배당' },
  { key: 'other', label: '기타소득' },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">{hint}</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm ' +
  'focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900';

export default function DependentJudge() {
  const [input, setInput] = useState<DependentInput>(emptyInput);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => judgeDependent(input), [input]);

  const set = <K extends keyof DependentInput>(
    key: K,
    value: DependentInput[K],
  ) => setInput((prev) => ({ ...prev, [key]: value }));

  const setIncome = (
    key: keyof DependentInput['income'],
    value: number,
  ) =>
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
      <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          대상자 정보
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="가입자와의 관계">
            <select
              className={inputCls}
              value={input.relation}
              onChange={(e) => set('relation', e.target.value as Relation)}
            >
              {(Object.keys(RELATION_LABEL) as Relation[]).map((r) => (
                <option key={r} value={r}>
                  {RELATION_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="동거 여부">
            <select
              className={inputCls}
              value={input.cohabiting ? 'y' : 'n'}
              onChange={(e) => set('cohabiting', e.target.value === 'y')}
            >
              <option value="y">동거</option>
              <option value="n">비동거</option>
            </select>
          </Field>

          {isSibling && (
            <Field label="만 나이" hint="형제자매만 판정에 사용">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={input.age}
                onChange={(e) => set('age', Number(e.target.value) || 0)}
              />
            </Field>
          )}

          <Field label="혼인 여부">
            <select
              className={inputCls}
              value={input.married ? 'y' : 'n'}
              onChange={(e) => set('married', e.target.value === 'y')}
            >
              <option value="n">미혼</option>
              <option value="y">기혼</option>
            </select>
          </Field>

          <Field label="장애인 · 국가유공상이자">
            <select
              className={inputCls}
              value={input.disabled ? 'y' : 'n'}
              onChange={(e) => set('disabled', e.target.value === 'y')}
            >
              <option value="n">해당 없음</option>
              <option value="y">해당</option>
            </select>
          </Field>

          {needsSiblingIncomeFlag && (
            <Field
              label="대상자와 동거하는 형제자매의 소득"
              hint="비동거 직계존속 판정에 사용"
            >
              <select
                className={inputCls}
                value={input.cohabitingSiblingHasIncome ? 'y' : 'n'}
                onChange={(e) =>
                  set('cohabitingSiblingHasIncome', e.target.value === 'y')
                }
              >
                <option value="n">없음 (또는 동거 형제자매 없음)</option>
                <option value="y">있음</option>
              </select>
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
                <input
                  type="number"
                  min={0}
                  step={10000}
                  className={inputCls}
                  value={input.income[f.key]}
                  onChange={(e) =>
                    setIncome(f.key, Number(e.target.value) || 0)
                  }
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
            <select
              className={inputCls}
              value={input.businessRegistered ? 'y' : 'n'}
              onChange={(e) =>
                set('businessRegistered', e.target.value === 'y')
              }
            >
              <option value="n">없음</option>
              <option value="y">있음</option>
            </select>
          </Field>

          <Field
            label="재산세 과세표준"
            hint="실거래가·공시가격 아님"
          >
            <input
              type="number"
              min={0}
              step={1000000}
              className={inputCls}
              value={input.propertyTaxBase}
              onChange={(e) =>
                set('propertyTaxBase', Number(e.target.value) || 0)
              }
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          자격 판정하기
        </button>
      </section>

      {/* ---------- 결과 ---------- */}
      {submitted && (
        <section
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
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {s.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">근거 · {s.basis}</p>
              </li>
            ))}
          </ol>

          {!result.eligible && (
            <a
              href="/건강보험/지역가입자-보험료계산/"
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
