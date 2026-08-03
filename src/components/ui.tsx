'use client';

/**
 * 도구 페이지 공용 폼 UI
 *
 * 세 개 도구가 같은 입력 스타일을 쓰므로 여기로 모았다.
 * 스타일을 바꿀 일이 생기면 이 파일만 고친다.
 */

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
 * 테두리를 border-slate-500 로 쓰는 이유 (border-slate-300 아님):
 * docs/design-debate/00-brief.md 의 대비 기준선 표가 border-slate-300 on white 를
 * 1.48:1(비텍스트 UI 기준 3:1 미달)로 이미 확인했다. slate-500 은 4.01:1 로 통과한다.
 * design-preview/index3.html 에서 같은 문제를 같은 방식으로 고쳤다(ADR-002).
 *
 * 색을 명시하는 이유:
 * 기기가 다크모드면 iOS Safari 가 폼 컨트롤 색을 자체 보정해
 * 비활성처럼 회색으로 보인다. globals.css 의 color-scheme 과 함께 막는다.
 */
export const inputCls =
  'min-h-12 w-full rounded-[10px] border border-slate-500 bg-white px-3.5 py-2.5 ' +
  'text-base text-slate-900 placeholder:text-slate-500 ' +
  'transition focus:border-accent-700 focus:outline-none focus:ring-4 focus:ring-accent-100';

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold text-slate-700">
        {label}
        {/*
          text-slate-600 인 이유: slate-400(2.56:1)·slate-500(4.01:1, 14px 미만에서
          4.5:1 기준 미달)는 본문 대비 기준을 통과하지 못한다. slate-600(5.85:1)부터
          통과한다 — 00-brief.md 대비표 및 index3.html(ADR-002)과 동일한 결론.
        */}
        {hint && <InfoTooltip>{hint}</InfoTooltip>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/**
 * 입력 흐름을 끊지 않는 짧은 도움말.
 *
 * 마우스에서는 올려보기, 키보드에서는 Tab으로 포커스해 읽을 수 있다. 모바일에서는
 * 아이콘을 탭하면 포커스가 남아 내용을 확인한다. `aria-label`에 본문을 함께 넣어
 * 툴팁을 열지 않아도 스크린리더가 설명을 전달한다.
 */
export function InfoTooltip({ children }: { children: ReactNode }) {
  const text = typeof children === 'string' ? children : '입력 도움말';

  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={`도움말: ${text}`}
      className="group relative inline-flex h-[18px] w-[18px] shrink-0 cursor-help items-center justify-center rounded-full border border-slate-400 text-[11px] font-bold leading-none text-slate-600 outline-none transition hover:border-accent-700 hover:text-accent-700 focus:border-accent-700 focus:text-accent-700 focus:ring-4 focus:ring-accent-100"
    >
      <span aria-hidden>i</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-[10px] bg-brand-950 px-3 py-2 text-left text-xs font-normal leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {children}
      </span>
    </span>
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
        <p className="mt-1.5 text-right text-sm text-slate-600">
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
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      {title && <h2 className="border-b border-slate-200 px-7 py-6 text-xl font-bold tracking-tight text-brand-950">{title}</h2>}
      <div className="space-y-6 p-7">{children}</div>
    </section>
  );
}

/** index3의 단계형 입력 영역. 판정 도구와 계산기에서 같은 리듬을 쓴다. */
export function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-slate-200 px-5 py-7 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5 sm:px-7">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-900 text-sm font-bold text-white sm:h-11 sm:w-11">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="mt-1 text-lg font-bold tracking-tight text-brand-950">{title}</h3>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-6 sm:px-7">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-brand-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1.5 text-xs font-bold text-accent-700">약 3분</span>
      </header>
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
      className="min-h-[54px] w-full rounded-xl bg-brand-900 px-5 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(23,50,77,.14)] transition hover:bg-brand-800"
    >
      {children}
    </button>
  );
}

/**
 * 0원 입력 누락 여부를 제출 직전에 확인하는 모달.
 * 0원은 유효한 입력일 수 있으므로 오류로 막지 않고, 사용자가 확인한 뒤 진행하게 한다.
 */
export function ZeroValueConfirmModal({
  fields,
  onCancel,
  onConfirm,
}: {
  fields: string[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-testid="zero-value-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
      >
        <h2 id={titleId} className="text-xl font-extrabold tracking-tight text-brand-950">
          0원 입력 항목을 확인해 주세요
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-700">
          다음 항목이 0원으로 입력되어 있습니다. 실제로 소득이나 재산이 없는 경우에는
          그대로 진행해도 됩니다. 입력을 빠뜨린 항목이라면 수정해 주세요.
        </p>

        <ul className="mt-4 space-y-2 rounded-xl bg-canvas p-4 text-sm font-semibold text-slate-800">
          {fields.map((field) => (
            <li key={field} className="flex gap-2">
              <span aria-hidden>·</span>
              <span>{field} · 0원</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="min-h-[48px] rounded-xl border border-slate-400 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            입력 수정하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[48px] rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-white hover:bg-brand-800"
          >
            확인하고 판정하기
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/**
 * 공단 대조 검증이 끝나지 않은 계산 결과에 붙이는 배지.
 * crossChecked 가 true 가 되면 렌더링되지 않는다.
 */
export function ReferenceOnlyNotice({ crossChecked }: { crossChecked: boolean }) {
  if (crossChecked) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
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
      <span className="min-w-0 flex-1 text-sm text-slate-600">
        {label}
        {hint && <span className="ml-1 text-sm text-slate-600">{hint}</span>}
      </span>
      <span
        className={
          strong
            ? 'shrink-0 whitespace-nowrap text-lg font-bold text-slate-900'
            : 'shrink-0 whitespace-nowrap text-sm font-medium text-slate-900'
        }
      >
        {value}
      </span>
    </div>
  );
}
