'use client';

/**
 * 도구 페이지 공용 폼 UI
 *
 * 세 개 도구가 같은 입력 스타일을 쓰므로 여기로 모았다.
 * 스타일을 바꿀 일이 생기면 이 파일만 고친다.
 */

import type { ReactNode } from 'react';
import { toKoreanAmount } from '@/lib/format';

// won() 을 이 파일에 정의하면 안 된다. 'use client' 모듈의 함수는
// 서버 컴포넌트에서 호출할 수 없어 빌드가 깨진다. @/lib/format 에서 가져온다.
export { won } from '@/lib/format';

/**
 * 폼 컨트롤 공통 클래스
 *
 * `text-base sm:text-sm` 인 이유:
 * iOS 는 폼 글자가 16px 미만이면 포커스할 때 화면을 자동 확대한다.
 * 금액을 계속 입력하는 도구라 확대가 반복되면 매우 거슬린다.
 * 모바일에서는 16px(text-base), 넓은 화면에서만 14px(text-sm) 로 되돌린다.
 *
 * 색을 명시하는 이유:
 * 기기가 다크모드면 iOS Safari 가 폼 컨트롤 색을 자체 보정해
 * 비활성처럼 회색으로 보인다. globals.css 의 color-scheme 과 함께 막는다.
 */
export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 ' +
  'text-base text-slate-900 placeholder:text-slate-400 sm:text-sm ' +
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

/**
 * 금액 입력
 *
 * type="number" 를 쓰지 않는다. 이유가 세 가지다.
 *  1. 콤마가 표시되지 않아 "30000000" 의 0 개수를 눈으로 세야 한다.
 *     3천만원·5억을 계속 넣는 도구에서 이건 오입력을 만든다.
 *  2. 마우스 휠·방향키로 값이 바뀌는 사고가 난다.
 *  3. iOS 에서 소수점 키패드가 뜬다.
 *
 * 대신 text + inputMode="numeric" 으로 숫자 키패드를 띄우고
 * 표시값에는 콤마를 넣는다. 입력 아래에는 한글 단위로 되읽어준다.
 * ("30,000,000" 아래에 "3,000만원")
 */
export function MoneyInput({
  value,
  onChange,
  /** 한글 단위 보조 표시. 금액이 큰 입력에서는 켜두는 게 좋다 */
  showReading = true,
}: {
  value: number;
  onChange: (v: number) => void;
  showReading?: boolean;
}) {
  return (
    <>
      <input
        type="text"
        // 모바일 숫자 키패드. type=number 없이도 숫자 입력이 편해진다
        inputMode="numeric"
        autoComplete="off"
        className={`${inputCls} text-right tabular-nums`}
        value={value === 0 ? '' : value.toLocaleString('ko-KR')}
        placeholder="0"
        onChange={(e) => {
          // 숫자만 남긴다. 콤마·원·공백을 붙여넣어도 받아준다
          const digits = e.target.value.replace(/[^0-9]/g, '');
          if (digits === '') return onChange(0);
          // 자릿수 폭주 방지 (조 단위 이상은 입력 오류로 본다)
          if (digits.length > 15) return;
          onChange(Number(digits));
        }}
      />
      {showReading && value > 0 && (
        <p className="mt-1 text-right text-xs text-slate-500">
          {toKoreanAmount(value)}
        </p>
      )}
    </>
  );
}

/**
 * 개수·나이 같은 작은 정수 입력.
 * 금액에는 쓰지 말 것 — MoneyInput 을 쓴다.
 */
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
  const clamp = (n: number) =>
    Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n));

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={`${inputCls} tabular-nums`}
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, '');
        onChange(digits === '' ? min : clamp(Number(digits)));
      }}
    />
  );
}

/**
 * 셀렉트.
 * 각 도구가 select 를 직접 쓰면 스타일이 갈라지므로 여기로 모았다.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <select
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
