'use client';

/**
 * 도구 페이지 공용 폼 UI
 *
 * 세 개 도구가 같은 입력 스타일을 쓰므로 여기로 모았다.
 * 스타일을 바꿀 일이 생기면 이 파일만 고친다.
 */

import type { ReactNode } from 'react';

// won() 을 이 파일에 정의하면 안 된다. 'use client' 모듈의 함수는
// 서버 컴포넌트에서 호출할 수 없어 빌드가 깨진다. @/lib/format 에서 가져온다.
export { won } from '@/lib/format';

export const inputCls =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm ' +
  'focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
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

/** 금액 입력. 스피너를 없애고 0 이하를 막는다 */
export function MoneyInput({
  value,
  onChange,
  step = 10_000,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

export function YesNo({
  value,
  onChange,
  yesLabel = '예',
  noLabel = '아니오',
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <select
      className={inputCls}
      value={value ? 'y' : 'n'}
      onChange={(e) => onChange(e.target.value === 'y')}
    >
      <option value="n">{noLabel}</option>
      <option value="y">{yesLabel}</option>
    </select>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      {title && (
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      )}
      {children}
    </section>
  );
}

export function SubmitButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

/**
 * 공단 대조 검증이 끝나지 않은 계산 결과에 붙이는 배지.
 * crossChecked 가 true 가 되면 렌더링되지 않는다.
 */
export function ReferenceOnlyNotice({ crossChecked }: { crossChecked: boolean }) {
  if (crossChecked) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      <strong className="font-semibold">참고용</strong> · 법령 기준으로 계산했으나
      국민건강보험공단 모의계산과의 대조 검증이 아직 완료되지 않았습니다. 실제
      고지 금액과 차이가 있을 수 있습니다.
    </p>
  );
}

/** 결과 금액 한 줄 */
export function ResultRow({
  label,
  value,
  strong,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-slate-600">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">{hint}</span>}
      </span>
      <span
        className={
          strong
            ? 'text-lg font-bold text-slate-900'
            : 'text-sm font-medium text-slate-900'
        }
      >
        {value}
      </span>
    </div>
  );
}
